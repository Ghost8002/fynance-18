import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type PluggyAccount = {
  id: string;
  name?: string | null;
  type?: string | null; // e.g., CHECKING, SAVINGS, CREDIT, INVESTMENT
  number?: string | null;
  balance?: number | null;
  itemId?: string;
  institution?: { name?: string | null } | null;
}

function mapAccountType(t?: string | null): string {
  switch ((t || '').toUpperCase()) {
    case 'CHECKING': return 'checking'
    case 'SAVINGS': return 'savings'
    case 'INVESTMENT': return 'investment'
    case 'CREDIT': return 'other' // cartões tratados à parte no app
    default: return 'other'
  }
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    const pluggyClientId = Deno.env.get('PLUGGY_CLIENT_ID')
    const pluggyClientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET')
    if (!pluggyClientId || !pluggyClientSecret) {
      return new Response(JSON.stringify({ error: 'Missing Pluggy credentials' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }

    // Authenticate
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

    // Fetch accounts
    const accRes = await fetch('https://api.pluggy.ai/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!accRes.ok) {
      const t = await accRes.text()
      return new Response(JSON.stringify({ error: 'Failed to fetch accounts', details: t }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    const accData = await accRes.json()
    const accounts: PluggyAccount[] = accData.results || accData.items || []

    let created = 0
    let updated = 0
    let skipped = 0

    for (const a of accounts) {
      // Only handle non-credit accounts here (credit cards handled elsewhere)
      const typeMapped = mapAccountType(a.type)

      // Check if account already exists by provider_account_id
      const { data: existing, error: existErr } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'pluggy')
        .eq('provider_account_id', a.id)
        .maybeSingle()
      if (existErr) { skipped++; continue }

      const row = {
        user_id: user.id,
        name: a.name || 'Conta Pluggy',
        type: typeMapped,
        bank: a.institution?.name || null,
        balance: a.balance ?? 0,
        account_number: a.number || null,
        provider: 'pluggy' as string,
        provider_account_id: a.id,
        institution: a.institution?.name || null,
      }

      if (existing) {
        const { error: upErr } = await supabase.from('accounts').update(row).eq('id', existing.id)
        if (upErr) { skipped++ } else { updated++ }
      } else {
        const { error: insErr } = await supabase.from('accounts').insert(row)
        if (insErr) { skipped++ } else { created++ }
      }
    }

    return new Response(JSON.stringify({ created, updated, skipped }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})


