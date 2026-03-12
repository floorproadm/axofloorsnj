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
  customer_name: z.string().trim().max(200, "Máximo 200 caracteres").optional().default(""),
  customer_phone: z.string().trim().max(30, "Máximo 30 caracteres").optional().default(""),
  project_types: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  referred_by_partner_id: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasPartner = data.referred_by_partner_id && data.referred_by_partner_id !== "" && data.referred_by_partner_id !== "none";
  if (!hasPartner) {
    if (!data.customer_name || data.customer_name.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nome é obrigatório sem parceiro", path: ["customer_name"] });
    }
    if (!data.customer_phone || data.customer_phone.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Telefone é obrigatório sem parceiro", path: ["customer_phone"] });
    }
  }
});

type NewJobFormValues = z.infer<typeof newJobSchema>;

const PROJECT_TYPES = [
  "Sanding & Finish",
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

const NONE_PARTNER = "none";

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
      project_types: [],
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
          customer_name: values.customer_name || "TBD (via parceiro)",
          customer_email: "",
          customer_phone: values.customer_phone || "",
          project_type: values.project_types.join(", "),
          address: values.address || null,
          referred_by_partner_id: (values.referred_by_partner_id && values.referred_by_partner_id !== NONE_PARTNER) ? values.referred_by_partner_id : null,
          organization_id: AXO_ORG_ID,
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

            {(() => {
              const partnerId = form.watch("referred_by_partner_id");
              const hasPartner = partnerId && partnerId !== "" && partnerId !== NONE_PARTNER;
              return (
                <>
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Customer name {hasPartner && <span className="text-xs text-muted-foreground font-normal">(opcional via parceiro)</span>}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={hasPartner ? "Pode adicionar depois" : "Full name"} {...field} />
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
                        <FormLabel>
                          Customer phone {hasPartner && <span className="text-xs text-muted-foreground font-normal">(opcional via parceiro)</span>}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder={hasPartner ? "Pode adicionar depois" : "(000) 000-0000"} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              );
            })()}

            <FormField
              control={form.control}
              name="project_types"
              render={() => (
                <FormItem>
                  <FormLabel>Serviços</FormLabel>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {PROJECT_TYPES.map((t) => (
                      <FormField
                        key={t}
                        control={form.control}
                        name="project_types"
                        render={({ field }) => (
                          <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input
                              type="checkbox"
                              className="accent-primary h-4 w-4 rounded"
                              checked={field.value?.includes(t)}
                              onChange={(e) => {
                                const current = field.value ?? [];
                                field.onChange(
                                  e.target.checked
                                    ? [...current, t]
                                    : current.filter((v: string) => v !== t)
                                );
                              }}
                            />
                            {t}
                          </label>
                        )}
                      />
                    ))}
                  </div>
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
