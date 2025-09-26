import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { eventData } = await req.json();
    
    if (!eventData) {
      throw new Error('Event data is required');
    }

    const facebookAccessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    const pixelId = '403151700983838';

    if (!facebookAccessToken) {
      throw new Error('Facebook access token not configured');
    }

    // Format the conversion data for Facebook's API
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
          fbc: eventData.fbc, // Facebook click ID
          fbp: eventData.fbp, // Facebook browser ID
        },
        custom_data: {
          currency: 'USD',
          value: eventData.value || 0,
          content_category: eventData.service || 'flooring',
          ...eventData.custom_data
        }
      }],
      test_event_code: eventData.test_event_code // For testing events
    };

    // Remove undefined fields
    const userData = Object.entries(conversionData.data[0].user_data).filter(([_, v]) => v !== undefined);
    conversionData.data[0].user_data = Object.fromEntries(userData) as any;

    console.log('Sending Facebook conversion data:', JSON.stringify(conversionData, null, 2));

    // Send to Facebook Conversions API
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

// Hash function for PII data as required by Facebook
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}