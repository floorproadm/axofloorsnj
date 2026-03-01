import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MaterialRequest {
  id: string;
  project_id: string | null;
  item_name: string;
  quantity: number;
  unit: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export function useMaterialRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["material-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("material_requests")
        .select("*")
        .eq("requested_by", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as MaterialRequest[];
    },
    enabled: !!user?.id,
  });

  const createRequest = useMutation({
    mutationFn: async (req: {
      project_id: string | null;
      item_name: string;
      quantity: number;
      unit: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("material_requests").insert({
        ...req,
        requested_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["material-requests"] }),
  });

  return { ...query, createRequest };
}
