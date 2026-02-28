import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";

const newJobSchema = z.object({
  address: z.string().trim().max(300, "Máximo 300 caracteres").optional(),
  customer_name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(200, "Máximo 200 caracteres"),
  customer_phone: z
    .string()
    .trim()
    .min(1, "Telefone é obrigatório")
    .max(30, "Máximo 30 caracteres"),
  project_type: z.string().min(1, "Selecione o tipo de projeto"),
  referred_by_partner_id: z.string().optional(),
});

type NewJobFormValues = z.infer<typeof newJobSchema>;

const PROJECT_TYPES = [
  "Sanding & Refinishing",
  "Refinishing Only",
  "New Installation",
  "Repair",
  "Staircase",
  "Baseboards",
  "Vinyl Plank",
  "Other",
];

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  partner_type: string;
}

interface NewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewJobDialog({ open, onOpenChange }: NewJobDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);

  const form = useForm<NewJobFormValues>({
    resolver: zodResolver(newJobSchema),
    defaultValues: {
      address: "",
      customer_name: "",
      customer_phone: "",
      project_type: "",
      referred_by_partner_id: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    supabase
      .from("partners")
      .select("id, company_name, contact_name, partner_type")
      .eq("status", "active")
      .order("company_name")
      .then(({ data }) => {
        if (data) setPartners(data);
      });
  }, [open]);

  const onSubmit = async (values: NewJobFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          customer_name: values.customer_name,
          customer_email: "",
          customer_phone: values.customer_phone,
          project_type: values.project_type,
          address: values.address || null,
          referred_by_partner_id: values.referred_by_partner_id || null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // If partner selected, increment their total_referrals
      if (values.referred_by_partner_id) {
        const partner = partners.find(p => p.id === values.referred_by_partner_id);
        if (partner) {
          await supabase
            .from("partners")
            .update({ 
              total_referrals: (partner as any).total_referrals + 1 || 1,
              last_contacted_at: new Date().toISOString()
            })
            .eq("id", values.referred_by_partner_id);
        }
      }

      toast({
        title: "Job criado!",
        description: `Projeto para ${values.customer_name} criado com sucesso.`,
      });

      form.reset();
      onOpenChange(false);
      navigate("/admin/jobs");
    } catch (err: any) {
      toast({
        title: "Erro ao criar job",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            New Job
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(000) 000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referred_by_partner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Parceiro (indicação)
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum parceiro" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum parceiro</SelectItem>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.company_name} — {p.contact_name}
                          <span className="ml-1 text-muted-foreground text-xs">({p.partner_type})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold h-12 text-base mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
