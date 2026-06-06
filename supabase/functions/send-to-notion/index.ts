import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
const NOTION_DATABASE_ID_ENV = Deno.env.get('NOTION_DATABASE_ID');
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/notion/v1';
const AXO_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  name: string;
  email: string;
  phone: string;
  source: string;
  services?: string[];
  notes?: string;
  budget?: number;
  room_size?: string;
  city?: string;
  zip_code?: string;
  message?: string;
  priority?: string;
  status?: string;
  organization_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const leadData: LeadData = await req.json();
    console.log('send-to-notion received:', { name: leadData.name, source: leadData.source });

    // Resolve per-tenant Notion database ID, fall back to env var.
    const orgId = leadData.organization_id || AXO_ORG_ID;
    let notionDatabaseId: string | null = null;

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: settings } = await supabase
          .from('company_settings')
          .select('notion_database_id')
          .eq('organization_id', orgId)
          .maybeSingle();
        notionDatabaseId = settings?.notion_database_id || null;
      }
    } catch (e) {
      console.warn('send-to-notion: settings lookup failed:', (e as Error).message);
    }

    if (!notionDatabaseId) {
      notionDatabaseId = NOTION_DATABASE_ID_ENV || null;
    }

    // Skip silently when Notion isn't configured for this tenant.
    if (!LOVABLE_API_KEY || !NOTION_API_KEY || !notionDatabaseId) {
      console.log(`send-to-notion: skipping (org=${orgId}) — Notion not configured`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'notion_not_configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const properties: Record<string, any> = {
      "Name": { title: [{ text: { content: leadData.name } }] },
      "Email": { email: leadData.email },
      "Phone": { phone_number: leadData.phone },
      "Source": { select: { name: leadData.source } },
      "Services": {
        multi_select: (leadData.services || []).map((s) => ({ name: s })),
      },
      "Created At": { date: { start: new Date().toISOString() } },
    };

    if (leadData.budget) properties["Budget"] = { number: leadData.budget };
    if (leadData.room_size) properties["Room Size"] = { rich_text: [{ text: { content: leadData.room_size } }] };
    if (leadData.city) properties["City"] = { rich_text: [{ text: { content: leadData.city } }] };
    if (leadData.zip_code) properties["Zip Code"] = { rich_text: [{ text: { content: leadData.zip_code } }] };
    if (leadData.priority) properties["Priority"] = { select: { name: leadData.priority } };
    if (leadData.status) properties["Status"] = { select: { name: leadData.status } };

    const notesContent: string[] = [];
    if (leadData.message) notesContent.push(`Message: ${leadData.message}`);
    if (leadData.notes) notesContent.push(leadData.notes);
    if (notesContent.length > 0) {
      properties["Notes"] = { rich_text: [{ text: { content: notesContent.join('\n\n') } }] };
    }

    const notionPayload = {
      parent: { database_id: notionDatabaseId },
      properties,
    };

    const notionResponse = await fetch(`${GATEWAY_URL}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': NOTION_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notionPayload),
    });

    const responseText = await notionResponse.text();
    if (!notionResponse.ok) {
      console.error('Notion gateway error:', notionResponse.status, responseText.slice(0, 500));
      throw new Error(`Notion API error: ${notionResponse.status} - ${responseText.slice(0, 300)}`);
    }

    const notionData = JSON.parse(responseText);
    console.log('Lead sent to Notion successfully:', notionData.id);

    return new Response(
      JSON.stringify({ success: true, notionPageId: notionData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in send-to-notion function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
