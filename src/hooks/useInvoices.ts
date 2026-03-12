import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AXO_ORG_ID } from "@/lib/constants";

export interface Invoice {
  id: string;
  project_id: string;
  customer_id: string | null;
  invoice_number: string;
  status: string;
  amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  due_date: string;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects?: { customer_name: string; project_type: string; address: string | null };
  customers?: { full_name: string; email: string | null; phone: string | null } | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface CreateInvoiceInput {
  project_id: string;
  customer_id?: string | null;
  invoice_number: string;
  due_date: string;
  notes?: string;
  items: { description: string; quantity: number; unit_price: number }[];
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, projects(customer_name, project_type, address), customers(full_name, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Invoice[];
    },
  });
}

export function useInvoiceItems(invoiceId: string | null) {
  return useQuery({
    queryKey: ["invoice_items", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at");
      if (error) throw error;
      return data as unknown as InvoiceItem[];
    },
    enabled: !!invoiceId,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const totalAmount = input.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          project_id: input.project_id,
          customer_id: input.customer_id || null,
          invoice_number: input.invoice_number,
          due_date: input.due_date,
          notes: input.notes || null,
          amount: totalAmount,
          organization_id: AXO_ORG_ID,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(input.items.map((item) => ({
            invoice_id: (invoice as any).id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })));
        if (itemsError) throw itemsError;
      }

      return invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Fatura criada", description: "Nova fatura adicionada com sucesso." });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, payment_method }: { id: string; status: string; payment_method?: string }) => {
      const update: any = { status };
      if (status === "paid") {
        update.paid_at = new Date().toISOString();
        if (payment_method) update.payment_method = payment_method;
      }
      const { error } = await supabase.from("invoices").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Status atualizado" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Fatura removida" });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `INV-${year}-${seq}`;
}
