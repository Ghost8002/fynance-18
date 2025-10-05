import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type PluggyTransaction = {
  id: string;
  description?: string | null;
  merchant?: { name?: string | null } | null;
  counterpartyName?: string | null;
  amount: number; // negative expense, positive income (typical)
  date?: string | null; // posted date
  postingDate?: string | null;
  status?: string | null; // e.g., POSTED/PENDING
  accountId: string;
}

type SyncRequest = {
  itemId?: string; // optional: scope sync to one item
  accountProviderId?: string; // optional: specific provider_account_id
  days?: number; // fallback window
}

function resolveDescription(tx: PluggyTransaction): string {
  const parts = [
    tx.description,
    tx.merchant?.name,
    tx.counterpartyName,
  ].filter(Boolean) as string[]
  return parts.join(' - ') || 'Transação'
}

function resolvePostedDate(tx: PluggyTransaction): string {
  return (tx.postingDate || tx.date || new Date().toISOString().slice(0, 10)).slice(0, 10)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const pluggyClientId = Deno.env.get('PLUGGY_CLIENT_ID')
    const pluggyClientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET')

    if (!pluggyClientId || !pluggyClientSecret) {
      return new Response(JSON.stringify({ error: 'Missing Pluggy credentials' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    let payload: SyncRequest
    try {
      payload = await req.json()
    } catch {
      payload = {}
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // Discover accounts for this user to sync
    const { data: accounts, error: accErr } = await supabase
      .from('accounts')
      .select('id, provider, provider_account_id, last_sync_at')
      .eq('user_id', user.id)
      .eq('provider', 'pluggy')
    if (accErr) {
      return new Response(JSON.stringify({ error: accErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    const targetAccounts = (accounts || []).filter(acc => {
      if (payload.accountProviderId) return acc.provider_account_id === payload.accountProviderId
      return true
    })

    // Get Pluggy access token (client credentials)
    const authRes = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: pluggyClientId, clientSecret: pluggyClientSecret })
    })
    if (!authRes.ok) {
      const t = await authRes.text()
      return new Response(JSON.stringify({ error: 'Pluggy auth failed', details: t }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    const { accessToken } = await authRes.json() as { accessToken: string }

    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const acc of targetAccounts) {
      // Decide since date
      const since = acc.last_sync_at ? new Date(acc.last_sync_at) : new Date(Date.now() - (payload.days ?? 30) * 24 * 60 * 60 * 1000)
      const sinceStr = since.toISOString().slice(0, 10)

      // Fetch transactions from Pluggy for provider_account_id
      const url = new URL('https://api.pluggy.ai/transactions')
      url.searchParams.set('accountId', acc.provider_account_id)
      url.searchParams.set('from', sinceStr)
      url.searchParams.set('size', '200')

      let next: string | null = url.toString()
      while (next) {
        const resp = await fetch(next, { headers: { Authorization: `Bearer ${accessToken}` }})
        if (!resp.ok) {
          skipped++
          break
        }
        const page = await resp.json()
        const results: PluggyTransaction[] = page.results || page.items || []

        for (const tx of results) {
          const description = resolveDescription(tx)
          const date = resolvePostedDate(tx)
          const absAmount = Math.abs(tx.amount)
          const type = tx.amount < 0 ? 'expense' : 'income'

          // Upsert by (user_id, external_provider, external_id)
          const { data: existing, error: existErr } = await supabase
            .from('transactions')
            .select('id, amount, type, date, description')
            .eq('user_id', user.id)
            .eq('external_provider', 'pluggy')
            .eq('external_id', tx.id)
            .maybeSingle()

          if (existErr) {
            skipped++
            continue
          }

          const row = {
            user_id: user.id,
            account_id: acc.id,
            type,
            amount: absAmount,
            description,
            original_description: tx.description ?? null,
            date,
            external_provider: 'pluggy',
            external_id: tx.id,
          }

          if (existing) {
            const { error: upErr } = await supabase
              .from('transactions')
              .update(row)
              .eq('id', existing.id)
            if (upErr) { skipped++ } else { updated++ }
          } else {
            const { error: insErr } = await supabase
              .from('transactions')
              .insert(row)
            if (insErr) { skipped++ } else { inserted++ }
          }
        }

        next = page.nextPage ?? null
      }

      // Update last_sync_at for account
      await supabase
        .from('accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', acc.id)
    }

    return new Response(JSON.stringify({ inserted, updated, skipped }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})


