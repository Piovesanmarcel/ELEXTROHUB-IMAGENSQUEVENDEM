import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, keyId, provider } = await req.json();
    console.log(`[manage-api-keys] Action: ${action}, Provider: ${provider}, KeyId: ${keyId}`);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[manage-api-keys] Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle actions
    if (action === 'test') {
      if (!keyId || !provider) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing keyId or provider' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get encrypted key
      const { data: keyData, error: keyError } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted, user_id')
        .eq('id', keyId)
        .single();

      if (keyError || !keyData) {
        console.error('[manage-api-keys] Key not found:', keyError);
        return new Response(
          JSON.stringify({ success: false, error: 'Key not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify ownership
      if (keyData.user_id !== user.id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized access to key' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decrypt key (base64)
      let decryptedKey: string;
      try {
        decryptedKey = atob(keyData.api_key_encrypted);
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to decrypt key' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Test key based on provider
      let testSuccess = false;
      let testError = '';

      try {
        switch (provider) {
          case 'gemini':
            testSuccess = await testGeminiKey(decryptedKey);
            break;
          case 'openai':
            testSuccess = await testOpenAIKey(decryptedKey);
            break;
          case 'runware':
            testSuccess = await testRunwareKey(decryptedKey);
            break;
          case 'stability':
            testSuccess = await testStabilityKey(decryptedKey);
            break;
          case 'replicate':
            testSuccess = await testReplicateKey(decryptedKey);
            break;
          default:
            testError = `Unknown provider: ${provider}`;
        }
      } catch (e) {
        testError = e instanceof Error ? e.message : 'Test failed';
        console.error(`[manage-api-keys] Test error for ${provider}:`, testError);
      }

      if (testSuccess) {
        // Update last_used_at and reset exhausted status
        await supabase
          .from('user_api_keys')
          .update({ 
            last_used_at: new Date().toISOString(),
            is_exhausted: false,
            exhausted_at: null
          })
          .eq('id', keyId);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: testError || 'Key validation failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'get-decrypted') {
      if (!keyId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing keyId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: keyData, error: keyError } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted, user_id')
        .eq('id', keyId)
        .single();

      if (keyError || !keyData) {
        return new Response(
          JSON.stringify({ success: false, error: 'Key not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (keyData.user_id !== user.id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const decryptedKey = atob(keyData.api_key_encrypted);

      // Update last_used_at
      await supabase
        .from('user_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyId);

      return new Response(
        JSON.stringify({ success: true, apiKey: decryptedKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'mark-exhausted') {
      if (!keyId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing keyId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabase
        .from('user_api_keys')
        .update({
          is_exhausted: true,
          exhausted_at: new Date().toISOString()
        })
        .eq('id', keyId)
        .eq('user_id', user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[manage-api-keys] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Test functions for each provider
async function testGeminiKey(apiKey: string): Promise<boolean> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "OK" only' }] }]
      })
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    console.error('[testGeminiKey] Failed:', error);
    throw new Error(`Gemini API error: ${response.status}`);
  }
  
  return true;
}

async function testOpenAIKey(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  return true;
}

async function testRunwareKey(apiKey: string): Promise<boolean> {
  // Runware uses WebSocket, but we can test with a simple auth request
  const response = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ taskType: 'authentication', apiKey }])
  });
  
  if (!response.ok) {
    throw new Error(`Runware API error: ${response.status}`);
  }
  
  const data = await response.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].message || 'Runware auth failed');
  }
  
  return true;
}

async function testStabilityKey(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.stability.ai/v1/user/account', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  
  if (!response.ok) {
    throw new Error(`Stability API error: ${response.status}`);
  }
  
  return true;
}

async function testReplicateKey(apiKey: string): Promise<boolean> {
  const response = await fetch('https://api.replicate.com/v1/account', {
    headers: { 'Authorization': `Token ${apiKey}` }
  });
  
  if (!response.ok) {
    throw new Error(`Replicate API error: ${response.status}`);
  }
  
  return true;
}
