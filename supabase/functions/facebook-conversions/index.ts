import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const AXO_ORG_ID = "a0000000-0000-0000-0000-000000000001";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { eventData, organization_id } = body || {};

    if (!eventData) {
      throw new Error('Event data is required');
    }

    const facebookAccessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    if (!facebookAccessToken) {
      throw new Error('Facebook access token not configured');
    }

    // Resolve tenant Pixel ID from company_settings. Skip silently if not configured.
    const orgId = organization_id || eventData.organization_id || AXO_ORG_ID;
    let pixelId: string | null = null;

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: settings } = await supabase
          .from('company_settings')
          .select('facebook_pixel_id')
          .eq('organization_id', orgId)
          .maybeSingle();
        pixelId = settings?.facebook_pixel_id || null;
      }
    } catch (e) {
      console.warn('facebook-conversions: settings lookup failed:', (e as Error).message);
    }

    if (!pixelId) {
      console.log(`facebook-conversions: no Pixel ID configured for org ${orgId}, skipping`);
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        reason: 'no_pixel_id_configured',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversionData = {
      data: [{
        event_name: eventData.event_name || 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: eventData.source_url || req.headers.get('referer'),
        user_data: {
          em: eventData.email ? [await hashData(eventData.email.toLowerCase())] : undefined,
          ph: eventData.phone ? [await hashData(eventData.phone.replace(/\D/g, ''))] : undefined,
          fn: eventData.first_name ? [await hashData(eventData.first_name.toLowerCase())] : undefined,
          ln: eventData.last_name ? [await hashData(eventData.last_name.toLowerCase())] : undefined,
          client_ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
          client_user_agent: req.headers.get('user-agent'),
          fbc: eventData.fbc,
          fbp: eventData.fbp,
        },
        custom_data: {
          currency: 'USD',
          value: eventData.value || 0,
          content_category: eventData.service || 'flooring',
          ...eventData.custom_data
        }
      }],
      test_event_code: eventData.test_event_code
    };

    const userData = Object.entries(conversionData.data[0].user_data).filter(([_, v]) => v !== undefined);
    conversionData.data[0].user_data = Object.fromEntries(userData) as any;

    console.log('Sending Facebook conversion data:', JSON.stringify(conversionData, null, 2));

    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${facebookAccessToken}`,
      },
      body: JSON.stringify(conversionData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Facebook API error:', responseData);
      throw new Error(`Facebook API error: ${JSON.stringify(responseData)}`);
    }

    console.log('Facebook conversion sent successfully:', responseData);

    return new Response(JSON.stringify({
      success: true,
      facebook_response: responseData,
      events_received: responseData.events_received
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in facebook-conversions function:', error);
    return new Response(JSON.stringify({
      error: (error as Error).message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
