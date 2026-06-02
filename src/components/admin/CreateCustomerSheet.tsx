import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { toast } from "sonner";

interface CustomerFormData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip_code: string;
  notes: string;
}

interface CreateCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: { id: string; full_name: string | null; email: string | null; phone: string | null; address: string | null; city: string | null; zip_code: string | null; notes: string | null; created_at: string }) => void;
}

const initialForm: CustomerFormData = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip_code: "",
  notes: "",
};

export function CreateCustomerSheet({ open, onOpenChange, onCreated }: CreateCustomerSheetProps) {
  const [form, setForm] = useState<CustomerFormData>(initialForm);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      toast.error("Nome completo é obrigatório");
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          zip_code: form.zip_code.trim() || null,
          notes: form.notes.trim() || null,
          organization_id: AXO_ORG_ID,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-create matching primary property when address provided
      if (form.address.trim() || form.city.trim() || form.zip_code.trim()) {
        const { error: propErr } = await supabase
          .from("customer_properties")
          .insert({
            organization_id: AXO_ORG_ID,
            customer_id: (data as any).id,
            unit_identifier: "Primary",
            address_line1: form.address.trim() || null,
            city: form.city.trim() || null,
            zip: form.zip_code.trim() || null,
            is_primary: true,
          });
        if (propErr) {
          // Non-blocking — customer was created
          console.warn("Failed to create primary property:", propErr.message);
        }
      }

      toast.success("Cliente criado com sucesso");
      onCreated(data as any);
      setForm(initialForm);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[hsl(var(--gold-warm))]" />
            Novo Cliente
          </SheetTitle>
          <SheetDescription>
            Preencha os dados do cliente. Apenas o nome é obrigatório.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">
              Nome completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="Ex: João Silva"
              value={form.full_name}
              onChange={(e) => handleChange("full_name", e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="(XXX) XXX-XXXX"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              placeholder="Rua, número, complemento"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Cidade"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip_code">CEP / ZIP</Label>
              <Input
                id="zip_code"
                placeholder="XXXXX-XXX"
                value={form.zip_code}
                onChange={(e) => handleChange("zip_code", e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Notas internas sobre o cliente..."
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar cliente"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
