import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput, useFieldValidation } from "@/utils/validation";

export interface LeadData {
  name: string;
  email: string;
  source: string;
  category?: string;
  downloadTitle?: string;
}

export const useLeadCapture = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { validateField } = useFieldValidation();

  const captureLead = async (leadData: LeadData) => {
    setIsLoading(true);

    try {
      // Validate inputs
      const nameError = validateField(leadData.name, ['required', 'name']);
      const emailError = validateField(leadData.email, ['required', 'email']);

      if (nameError || emailError) {
        throw new Error('Invalid form data');
      }

      // Save lead to database
      const dbData = {
        name: sanitizeInput(leadData.name),
        email: sanitizeInput(leadData.email),
        phone: "000-000-0000", // Placeholder since we don't collect phone for lead magnets
        lead_source: leadData.source,
        status: 'new',
        priority: 'high',
        services: leadData.category ? [leadData.category] : ['lead_magnet'],
        notes: leadData.downloadTitle ? `Downloaded: ${leadData.downloadTitle}` : 'Lead magnet download'
      };

      const { data: savedLead, error: saveError } = await supabase
        .from('leads')
        .insert([dbData])
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save lead: ${saveError.message}`);
      }

      // Send follow-up email
      try {
        await supabase.functions.invoke('send-follow-up', {
          body: {
            name: leadData.name,
            email: leadData.email,
            source: leadData.source,
            leadType: 'lead_magnet',
            downloadTitle: leadData.downloadTitle
          }
        });
      } catch (emailError) {
        console.warn('Failed to send follow-up email:', emailError);
        // Don't fail the whole process for email errors
      }

      // Send admin notification
      try {
        await supabase.functions.invoke('send-notifications', {
          body: {
            leadData: dbData,
            adminEmail: 'axofloorsnj@gmail.com',
            adminPhone: '+17323518653'
          }
        });
      } catch (notificationError) {
        console.warn('Failed to send admin notification:', notificationError);
      }

      // Send to Notion
      try {
        await supabase.functions.invoke('send-to-notion', {
          body: {
            name: leadData.name,
            email: leadData.email,
            phone: dbData.phone,
            source: leadData.source,
            services: leadData.category ? [leadData.category] : ['lead_magnet'],
            notes: leadData.downloadTitle ? `Downloaded: ${leadData.downloadTitle}` : 'Lead magnet download'
          }
        });
        console.log('Lead sent to Notion successfully');
      } catch (notionError) {
        console.warn('Failed to send to Notion:', notionError);
        // Don't fail the whole process for Notion errors
      }

      toast({
        title: "Success! 🎉",
        description: "Your download should start automatically. Check your email for more resources!"
      });

      return { success: true, lead: savedLead };

    } catch (error) {
      console.error('Lead capture error:', error);
      
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive"
      });

      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDownload = (downloadUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.click();
  };

  return {
    captureLead,
    triggerDownload,
    isLoading
  };
};