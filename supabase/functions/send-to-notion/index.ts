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
  budget?: number;
  room_size?: string;
  city?: string;
  zip_code?: string;
  message?: string;
  priority?: string;
  status?: string;
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

    // Adicionar campos opcionais ao payload
    if (leadData.budget) {
      notionPayload.properties["Budget"] = {
        number: leadData.budget
      };
    }

    if (leadData.room_size) {
      notionPayload.properties["Room Size"] = {
        rich_text: [
          {
            text: {
              content: leadData.room_size
            }
          }
        ]
      };
    }

    if (leadData.city) {
      notionPayload.properties["City"] = {
        rich_text: [
          {
            text: {
              content: leadData.city
            }
          }
        ]
      };
    }

    if (leadData.zip_code) {
      notionPayload.properties["Zip Code"] = {
        rich_text: [
          {
            text: {
              content: leadData.zip_code
            }
          }
        ]
      };
    }

    if (leadData.priority) {
      notionPayload.properties["Priority"] = {
        select: {
          name: leadData.priority
        }
      };
    }

    if (leadData.status) {
      notionPayload.properties["Status"] = {
        select: {
          name: leadData.status
        }
      };
    }

    // Se houver notas ou mensagem, adicionar ao payload
    const notesContent = [];
    
    if (leadData.message) {
      notesContent.push(`Message: ${leadData.message}`);
    }
    
    if (leadData.notes) {
      notesContent.push(leadData.notes);
    }
    
    if (notesContent.length > 0) {
      notionPayload.properties["Notes"] = {
        rich_text: [
          {
            text: {
              content: notesContent.join('\n\n')
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
