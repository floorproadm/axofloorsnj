import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowUpRight,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  Partner,
  usePartnersData,
  PARTNER_TYPES,
  PARTNER_STATUSES,
  SERVICE_ZONES,
} from "@/hooks/admin/usePartnersData";

interface Props {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  prospect: "bg-blue-500/10 text-blue-700 border-blue-200",
  inactive: "bg-amber-500/10 text-amber-700 border-amber-200",
  churned: "bg-red-500/10 text-red-700 border-red-200",
};

export function PartnerDetailModal({ partner, open, onOpenChange }: Props) {
  const { updatePartner, deletePartner } = usePartnersData();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Partial<Partner>>({});

  if (!partner) return null;

  const startEdit = () => {
    setEditValues({
      company_name: partner.company_name,
      contact_name: partner.contact_name,
      phone: partner.phone || "",
      email: partner.email || "",
      status: partner.status,
      partner_type: partner.partner_type,
      service_zone: partner.service_zone,
      next_action_date: partner.next_action_date,
      next_action_note: partner.next_action_note || "",
      notes: partner.notes || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePartner.mutateAsync({ id: partner.id, ...editValues });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleLogContact = async () => {
    setSaving(true);
    try {
      await updatePartner.mutateAsync({
        id: partner.id,
        last_contacted_at: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Remover este partner permanentemente?")) return;
    await deletePartner.mutateAsync(partner.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            {partner.company_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusColors[partner.status] || ""}>
              {PARTNER_STATUSES[partner.status] || partner.status}
            </Badge>
            <Badge variant="secondary">{PARTNER_TYPES[partner.partner_type] || partner.partner_type}</Badge>
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" />
              {SERVICE_ZONES[partner.service_zone] || partner.service_zone}
            </Badge>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" /> {partner.phone || "—"}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" /> {partner.email || "—"}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{partner.total_referrals}</p>
              <p className="text-xs text-muted-foreground">Indicações</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{partner.total_converted}</p>
              <p className="text-xs text-muted-foreground">Convertidos</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {partner.total_referrals > 0
                  ? Math.round((partner.total_converted / partner.total_referrals) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Conversão</p>
            </div>
          </div>

          <Separator />

          {/* Timeline / dates */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Último contato:</span>
              <span className="font-medium">
                {partner.last_contacted_at
                  ? format(new Date(partner.last_contacted_at), "dd/MM/yyyy")
                  : "Nunca"}
              </span>
            </div>
            {partner.next_action_date && (
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Próxima ação:</span>
                <span className="font-medium">{format(new Date(partner.next_action_date), "dd/MM/yyyy")}</span>
                {partner.next_action_note && (
                  <span className="text-muted-foreground">— {partner.next_action_note}</span>
                )}
              </div>
            )}
          </div>

          {/* Notes / Edit */}
          {editing ? (
            <div className="space-y-3">
              <Input
                value={editValues.company_name || ""}
                onChange={(e) => setEditValues((p) => ({ ...p, company_name: e.target.value }))}
                placeholder="Nome da empresa"
              />
              <Input
                value={editValues.contact_name || ""}
                onChange={(e) => setEditValues((p) => ({ ...p, contact_name: e.target.value }))}
                placeholder="Nome do contato"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={editValues.phone || ""}
                  onChange={(e) => setEditValues((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Telefone"
                />
                <Input
                  value={editValues.email || ""}
                  onChange={(e) => setEditValues((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Select
                  value={editValues.status}
                  onValueChange={(v) => setEditValues((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PARTNER_STATUSES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={editValues.partner_type}
                  onValueChange={(v) => setEditValues((p) => ({ ...p, partner_type: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PARTNER_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={editValues.service_zone}
                  onValueChange={(v) => setEditValues((p) => ({ ...p, service_zone: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Zona" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SERVICE_ZONES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="date"
                value={editValues.next_action_date || ""}
                onChange={(e) => setEditValues((p) => ({ ...p, next_action_date: e.target.value || null }))}
                placeholder="Próxima ação"
              />
              <Input
                value={editValues.next_action_note || ""}
                onChange={(e) => setEditValues((p) => ({ ...p, next_action_note: e.target.value }))}
                placeholder="Nota da próxima ação"
              />
              <Textarea
                value={editValues.notes || ""}
                onChange={(e) => setEditValues((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notas gerais"
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <>
              {partner.notes && (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{partner.notes}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={startEdit} variant="outline" className="flex-1">Editar</Button>
                <Button onClick={handleLogContact} disabled={saving} variant="secondary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar Contato"}
                </Button>
                <Button onClick={handleDelete} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
