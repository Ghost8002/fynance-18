import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse form data
    const formData = await req.formData();
    const grantType = formData.get('grant_type');
    const username = formData.get('username');
    const password = formData.get('password');

    console.log('OAuth token request received', { grantType, username });

    // Validate grant type
    if (grantType !== 'password') {
      return new Response(
        JSON.stringify({ 
          error: 'unsupported_grant_type',
          error_description: 'Only password grant type is supported'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required fields
    if (!username || !password) {
      return new Response(
        JSON.stringify({ 
          error: 'invalid_request',
          error_description: 'Missing username or password'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username as string,
      password: password as string,
    });

    if (error || !data.session) {
      console.error('Authentication failed:', error?.message);
      return new Response(
        JSON.stringify({ 
          error: 'invalid_grant',
          error_description: 'Invalid username or password'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Authentication successful for user:', data.user.id);

    // Return OAuth 2.0 compliant response
    return new Response(
      JSON.stringify({
        access_token: data.session.access_token,
        token_type: 'Bearer',
        expires_in: data.session.expires_in || 3600,
        refresh_token: data.session.refresh_token,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in oauth-token function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'server_error',
        error_description: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
