import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Obtain a Connect Token for Pluggy Connect widget
    const resp = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: pluggyClientId, clientSecret: pluggyClientSecret })
    })
    if (!resp.ok) {
      const t = await resp.text()
      return new Response(JSON.stringify({ error: 'Failed to create connect token', details: t }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    const data = await resp.json() as { connectToken: string }

    return new Response(JSON.stringify({ connectToken: data.connectToken }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})


