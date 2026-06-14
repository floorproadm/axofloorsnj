import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput, useFieldValidation } from "@/utils/validation";
import { AXO_ORG_ID } from "@/lib/constants";

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
        phone: "000-000-0000",
        lead_source: leadData.source,
        status: 'cold_lead',
        priority: 'high',
        services: leadData.category ? [leadData.category] : ['lead_magnet'],
        notes: leadData.downloadTitle ? `Downloaded: ${leadData.downloadTitle}` : 'Lead magnet download',
        organization_id: AXO_ORG_ID,
      };

      const { data: savedLead, error: saveError } = await supabase
        .from('leads')
        .insert([dbData])
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save lead: ${saveError.message}`);
      }

      // NOTE: Admin notification (email) and Notion sync are handled server-side
      // by the `notify_new_lead_email` DB trigger after this INSERT. Direct invocations
      // from the browser were removed because those edge functions were publicly callable
      // and could be abused to spam customers, admins, and the Notion CRM. If the
      // automated server-side flow needs to be extended, do it in a DB trigger or a
      // trusted server-side function rather than from anonymous client code.

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