import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Trash2, Star, Loader2, X, Save } from "lucide-react";
import {
  useCustomerProperties,
  useCreateCustomerProperty,
  useUpdateCustomerProperty,
  useDeleteCustomerProperty,
  type CustomerProperty,
} from "@/hooks/useCustomerProperties";

interface Props {
  customerId: string;
}

const emptyForm = {
  unit_identifier: "",
  resident_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  is_primary: false,
  notes: "",
};

type FormState = typeof emptyForm;

function PropertyForm({
  initial,
  onCancel,
  onSubmit,
  saving,
  submitLabel = "Salvar",
}: {
  initial?: Partial<FormState>;
  onCancel: () => void;
  onSubmit: (f: FormState) => void;
  saving: boolean;
  submitLabel?: string;
}) {
  const [f, setF] = useState<FormState>({ ...emptyForm, ...(initial || {}) });
  const upd = (k: keyof FormState, v: any) => setF((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-2.5 rounded-md border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Unidade *</Label>
          <Input
            placeholder="Apt 101, Bloco A — Unit 3B"
            value={f.unit_identifier}
            onChange={(e) => upd("unit_identifier", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Morador (opcional)</Label>
          <Input
            placeholder="Nome do residente"
            value={f.resident_name}
            onChange={(e) => upd("resident_name", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Endereço</Label>
          <Input
            placeholder="Rua, número"
            value={f.address_line1}
            onChange={(e) => upd("address_line1", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Complemento</Label>
          <Input
            placeholder="Andar, referência"
            value={f.address_line2}
            onChange={(e) => upd("address_line2", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cidade</Label>
          <Input
            value={f.city}
            onChange={(e) => upd("city", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Estado</Label>
            <Input
              value={f.state}
              onChange={(e) => upd("state", e.target.value)}
              className="h-8 text-sm"
              maxLength={4}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ZIP</Label>
            <Input
              value={f.zip}
              onChange={(e) => upd("zip", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Notas</Label>
          <Input
            value={f.notes}
            onChange={(e) => upd("notes", e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <label className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={f.is_primary}
            onChange={(e) => upd("is_primary", e.target.checked)}
          />
          Marcar como propriedade principal
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          <X className="w-3.5 h-3.5 mr-1" /> Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            if (!f.unit_identifier.trim()) return;
            onSubmit({ ...f, unit_identifier: f.unit_identifier.trim() });
          }}
          disabled={saving || !f.unit_identifier.trim()}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-1" />
          )}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function PropertyRow({
  p,
  customerId,
}: {
  p: CustomerProperty;
  customerId: string;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateCustomerProperty(customerId);
  const del = useDeleteCustomerProperty(customerId);

  if (editing) {
    return (
      <PropertyForm
        initial={{
          unit_identifier: p.unit_identifier,
          resident_name: p.resident_name || "",
          address_line1: p.address_line1 || "",
          address_line2: p.address_line2 || "",
          city: p.city || "",
          state: p.state || "",
          zip: p.zip || "",
          is_primary: p.is_primary,
          notes: p.notes || "",
        }}
        saving={update.isPending}
        onCancel={() => setEditing(false)}
        submitLabel="Atualizar"
        onSubmit={(patch) =>
          update.mutate(
            { id: p.id, patch },
            { onSuccess: () => setEditing(false) }
          )
        }
      />
    );
  }

  const addressLine = [p.address_line1, p.city, p.state, p.zip].filter(Boolean).join(", ");

  return (
    <Card className="p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{p.unit_identifier}</span>
            {p.is_primary && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
                <Star className="w-2.5 h-2.5" /> Principal
              </Badge>
            )}
          </div>
          {p.resident_name && (
            <div className="text-xs text-muted-foreground mt-0.5">
              Morador: {p.resident_name}
            </div>
          )}
          {addressLine && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">{addressLine}</div>
          )}
          {p.notes && (
            <div className="text-xs text-muted-foreground/80 mt-1 italic line-clamp-2">
              {p.notes}
            </div>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => setEditing(true)}
          >
            Editar
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => {
              if (confirm(`Remover propriedade "${p.unit_identifier}"?`)) del.mutate(p.id);
            }}
            disabled={del.isPending}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function CustomerPropertiesSection({ customerId }: Props) {
  const { data: properties = [], isLoading } = useCustomerProperties(customerId);
  const create = useCreateCustomerProperty(customerId);
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Propriedades ({properties.length})
        </h3>
        {!adding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => setAdding(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
          </Button>
        )}
      </div>

      {adding && (
        <div className="mb-2">
          <PropertyForm
            saving={create.isPending}
            onCancel={() => setAdding(false)}
            onSubmit={(f) =>
              create.mutate(f, {
                onSuccess: () => setAdding(false),
              })
            }
            submitLabel="Adicionar"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : properties.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma propriedade cadastrada. Útil para clientes com múltiplas unidades (condomínios, edifícios).
        </p>
      ) : (
        <div className="space-y-1.5">
          {properties.map((p) => (
            <PropertyRow key={p.id} p={p} customerId={customerId} />
          ))}
        </div>
      )}
    </section>
  );
}
