import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY');
const NOTION_DATABASE_ID = Deno.env.get('NOTION_DATABASE_ID');

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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const leadData: LeadData = await req.json();
    
    console.log('Sending lead to Notion:', { name: leadData.name, source: leadData.source });

    // Preparar dados para o Notion
    const notionPayload = {
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        "Name": {
          title: [
            {
              text: {
                content: leadData.name
              }
            }
          ]
        },
        "Email": {
          email: leadData.email
        },
        "Phone": {
          phone_number: leadData.phone
        },
        "Source": {
          select: {
            name: leadData.source
          }
        },
        "Services": {
          multi_select: (leadData.services || []).map(service => ({
            name: service
          }))
        },
        "Created At": {
          date: {
            start: new Date().toISOString()
          }
        }
      }
    };

    // Se houver notas, adicionar ao payload
    if (leadData.notes) {
      notionPayload.properties["Notes"] = {
        rich_text: [
          {
            text: {
              content: leadData.notes
            }
          }
        ]
      };
    }

    // Enviar para o Notion
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionPayload)
    });

    if (!notionResponse.ok) {
      const errorData = await notionResponse.text();
      console.error('Notion API error:', errorData);
      throw new Error(`Notion API error: ${notionResponse.status} - ${errorData}`);
    }

    const notionData = await notionResponse.json();
    console.log('Lead sent to Notion successfully:', notionData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notionPageId: notionData.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in send-to-notion function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
