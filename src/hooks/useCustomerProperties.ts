import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { toast } from "sonner";

export interface CustomerProperty {
  id: string;
  organization_id: string;
  customer_id: string;
  unit_identifier: string;
  resident_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CustomerPropertyInput = Omit<
  CustomerProperty,
  "id" | "organization_id" | "customer_id" | "created_at" | "updated_at"
>;

export function useCustomerProperties(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ["customer_properties", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_properties")
        .select("*")
        .eq("customer_id", customerId!)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as CustomerProperty[];
    },
  });
}

export function useCreateCustomerProperty(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CustomerPropertyInput> & { unit_identifier: string }) => {
      // If marking primary, unset others first
      if (input.is_primary) {
        await supabase
          .from("customer_properties")
          .update({ is_primary: false })
          .eq("customer_id", customerId);
      }
      const { data, error } = await supabase
        .from("customer_properties")
        .insert({
          organization_id: AXO_ORG_ID,
          customer_id: customerId,
          unit_identifier: input.unit_identifier,
          resident_name: input.resident_name ?? null,
          address_line1: input.address_line1 ?? null,
          address_line2: input.address_line2 ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          zip: input.zip ?? null,
          is_primary: input.is_primary ?? false,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomerProperty;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer_properties", customerId] });
      toast.success("Propriedade adicionada");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao adicionar"),
  });
}

export function useUpdateCustomerProperty(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CustomerPropertyInput> }) => {
      if (patch.is_primary) {
        await supabase
          .from("customer_properties")
          .update({ is_primary: false })
          .eq("customer_id", customerId)
          .neq("id", id);
      }
      const { error } = await supabase
        .from("customer_properties")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer_properties", customerId] });
      toast.success("Propriedade atualizada");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar"),
  });
}

export function useDeleteCustomerProperty(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_properties")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer_properties", customerId] });
      toast.success("Propriedade removida");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover"),
  });
}
