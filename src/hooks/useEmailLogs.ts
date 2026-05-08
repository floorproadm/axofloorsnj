import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailLog {
  id: string;
  type: string;
  recipient: string;
  subject: string;
  body_preview: string | null;
  status: string;
  error_message: string | null;
  related_id: string | null;
  related_type: string | null;
  sent_at: string | null;
  created_at: string;
}

export function useEmailLogs(typeFilter?: string) {
  return useQuery({
    queryKey: ["email_logs", typeFilter],
    queryFn: async () => {
      let q = supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (typeFilter && typeFilter !== "all") {
        q = q.eq("type", typeFilter);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as EmailLog[];
    },
  });
}

export async function sendGmailEmail(template: string, data: Record<string, any>) {
  const { data: result, error } = await supabase.functions.invoke("gmail-send", {
    body: { template, data },
  });
  if (error) throw error;
  if (result?.error) throw new Error(result.error);
  return result;
}
