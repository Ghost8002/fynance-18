import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type PluggyWebhookEvent = {
  type: string;
  itemId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secret = Deno.env.get('PLUGGY_WEBHOOK_SECRET')
    // Optional: validate header signature if using webhook secret with Pluggy
    // For now, only basic presence check
    if (!secret) {
      console.warn('PLUGGY_WEBHOOK_SECRET not set. Skipping signature validation.')
    }

    const event = await req.json() as PluggyWebhookEvent

    // Minimal handling: on item sync finished or transactions updated, return 200
    // Client app can trigger pluggy-sync via UI or a queued job if desired.

    switch (event.type) {
      case 'ITEM_SYNCHRONIZATION_FINISHED':
      case 'TRANSACTIONS_UPDATED':
        // Acknowledge; optionally, you could enqueue a call to pluggy-sync here.
        break;
      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
})


