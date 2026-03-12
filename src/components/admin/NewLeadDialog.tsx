import { useState } from "react";
import { AXO_ORG_ID } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const newLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(200, "Máximo 200 caracteres"),
  phone: z
    .string()
    .trim()
    .min(1, "Telefone é obrigatório")
    .max(30, "Máximo 30 caracteres"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .max(255)
    .optional()
    .or(z.literal("")),
  lead_source: z.string().min(1, "Selecione a fonte"),
  message: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
});

type NewLeadFormValues = z.infer<typeof newLeadSchema>;

const LEAD_SOURCES = [
  "website",
  "phone",
  "referral",
  "google",
  "facebook",
  "instagram",
  "door_knock",
  "other",
];

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  phone: "Telefone",
  referral: "Indicação",
  google: "Google",
  facebook: "Facebook",
  instagram: "Instagram",
  door_knock: "Porta a porta",
  other: "Outro",
};

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referredByPartnerId?: string;
}

export function NewLeadDialog({ open, onOpenChange, referredByPartnerId }: NewLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      lead_source: referredByPartnerId ? "referral" : "",
      message: "",
    },
  });

  const onSubmit = async (values: NewLeadFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("leads").insert({
        name: values.name,
        phone: values.phone,
        email: values.email || null,
        lead_source: values.lead_source,
        message: values.message || null,
        organization_id: AXO_ORG_ID,
        ...(referredByPartnerId ? {
          referred_by_partner_id: referredByPartnerId,
          status: "warm_lead",
        } : {}),
      });

      if (error) throw error;

      toast({
        title: "Lead criado!",
        description: `${values.name} adicionado como novo lead.`,
      });

      form.reset();
      if (referredByPartnerId) {
        queryClient.invalidateQueries({ queryKey: ["partner-leads", referredByPartnerId] });
        queryClient.invalidateQueries({ queryKey: ["partners"] });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Erro ao criar lead",
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
            {referredByPartnerId ? "Nova Indicação" : "Novo Lead"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(000) 000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {referredByPartnerId ? (
              <div className="space-y-1.5">
                <FormLabel>Fonte</FormLabel>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground">
                  Indicação (parceiro)
                </div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="lead_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonte</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a fonte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {SOURCE_LABELS[s] || s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes sobre o lead..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold h-12 text-base mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Lead"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
