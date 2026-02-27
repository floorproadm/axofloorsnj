import { useState } from "react";
import { format, subDays, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowUpRight,
  Loader2,
  Trash2,
  Pencil,
  X,
  MessageSquare,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  Partner,
  usePartnersData,
  PARTNER_TYPES,
  PARTNER_STATUSES,
  SERVICE_ZONES,
} from "@/hooks/admin/usePartnersData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  prospect: "bg-blue-500/10 text-blue-700 border-blue-200",
  inactive: "bg-amber-500/10 text-amber-700 border-amber-200",
  churned: "bg-red-500/10 text-red-700 border-red-200",
};

interface Props {
  partner: Partner;
  onClose?: () => void;
}

export function PartnerDetailPanel({ partner, onClose }: Props) {
  const { updatePartner, deletePartner } = usePartnersData();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Partial<Partner>>({});

  const initials = partner.contact_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Fetch referred leads
  const { data: referredLeads = [] } = useQuery({
    queryKey: ["partner-leads", partner.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, phone, status, created_at")
        .eq("referred_by_partner_id", partner.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
    onClose?.();
  };

  const isAtRisk =
    partner.status === "active" &&
    (!partner.last_contacted_at ||
      !isAfter(new Date(partner.last_contacted_at), subDays(new Date(), 30)));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground truncate">
                {partner.contact_name}
              </h2>
              {!editing && (
                <button
                  onClick={startEdit}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              {partner.company_name}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge
                variant="outline"
                className={statusColors[partner.status] || ""}
              >
                {PARTNER_STATUSES[partner.status] || partner.status}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {PARTNER_TYPES[partner.partner_type] || partner.partner_type}
              </Badge>
              {isAtRisk && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px]">
                  Em Risco
                </Badge>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-muted text-muted-foreground md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Contact links */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          {partner.phone && (
            <a
              href={`tel:${partner.phone}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {partner.phone}
            </a>
          )}
          {partner.email && (
            <a
              href={`mailto:${partner.email}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {partner.email}
            </a>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            {SERVICE_ZONES[partner.service_zone] || partner.service_zone}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-border/50">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{partner.total_referrals}</p>
          <p className="text-xs text-muted-foreground">Indicações</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{partner.total_converted}</p>
          <p className="text-xs text-muted-foreground">Convertidos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">
            {partner.total_referrals > 0
              ? Math.round((partner.total_converted / partner.total_referrals) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-muted-foreground">Conversão</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="geral" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 w-auto justify-start">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="indicacoes" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Indicações
            {referredLeads.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {referredLeads.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Geral Tab */}
          <TabsContent value="geral" className="px-4 pb-4 mt-0">
            {editing ? (
              <EditForm
                editValues={editValues}
                setEditValues={setEditValues}
                onSave={handleSave}
                onCancel={() => setEditing(false)}
                saving={saving}
              />
            ) : (
              <div className="space-y-4 pt-3">
                {/* Dates */}
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
                      <span className="font-medium">
                        {format(new Date(partner.next_action_date), "dd/MM/yyyy")}
                      </span>
                      {partner.next_action_note && (
                        <span className="text-muted-foreground">
                          — {partner.next_action_note}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="font-medium">
                      {format(new Date(partner.created_at), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={startEdit} variant="outline" className="flex-1">
                    <Pencil className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  <Button
                    onClick={handleLogContact}
                    disabled={saving}
                    variant="secondary"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-1" />
                    )}
                    Registrar Contato
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Indicações Tab */}
          <TabsContent value="indicacoes" className="px-4 pb-4 mt-0">
            <div className="pt-3 space-y-3">
              {referredLeads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma indicação registrada</p>
                </div>
              ) : (
                referredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px]">
                        {lead.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {format(new Date(lead.created_at), "dd/MM/yy")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Notas Tab */}
          <TabsContent value="notas" className="px-4 pb-4 mt-0">
            <div className="pt-3">
              <NotesEditor partner={partner} />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

/* ---------- Edit Form ---------- */
function EditForm({
  editValues,
  setEditValues,
  onSave,
  onCancel,
  saving,
}: {
  editValues: Partial<Partner>;
  setEditValues: React.Dispatch<React.SetStateAction<Partial<Partner>>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-3 pt-3">
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
        onChange={(e) =>
          setEditValues((p) => ({ ...p, next_action_date: e.target.value || null }))
        }
        placeholder="Próxima ação"
      />
      <Input
        value={editValues.next_action_note || ""}
        onChange={(e) => setEditValues((p) => ({ ...p, next_action_note: e.target.value }))}
        placeholder="Nota da próxima ação"
      />
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/* ---------- Notes Editor ---------- */
function NotesEditor({ partner }: { partner: Partner }) {
  const { updatePartner } = usePartnersData();
  const [notes, setNotes] = useState(partner.notes || "");
  const [saving, setSaving] = useState(false);
  const hasChanges = notes !== (partner.notes || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePartner.mutateAsync({ id: partner.id, notes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Adicionar notas sobre este parceiro..."
        rows={6}
        className="resize-none"
      />
      {hasChanges && (
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Notas"}
        </Button>
      )}
    </div>
  );
}
