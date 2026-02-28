import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, isAfter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  Phone,
  Mail,
  Calendar,
  Cake,
  ArrowUpRight,
  Loader2,
  Trash2,
  Pencil,
  X,
  MessageSquare,
  Users,
  TrendingUp,
  BarChart3,
  Briefcase,
  Plus,
  UserPlus,
  Hammer,
} from "lucide-react";
import {
  Partner,
  usePartnersData,
  PARTNER_TYPES,
  PARTNER_STATUSES,
} from "@/hooks/admin/usePartnersData";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NewJobDialog } from "@/components/admin/NewJobDialog";
import { NewLeadDialog } from "@/components/admin/NewLeadDialog";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  prospect: "bg-blue-500/10 text-blue-700 border-blue-200",
  inactive: "bg-amber-500/10 text-amber-700 border-amber-200",
  churned: "bg-red-500/10 text-red-700 border-red-200",
};

const avatarColors: Record<string, string> = {
  builder: "bg-blue-500/15 text-blue-700",
  realtor: "bg-purple-500/15 text-purple-700",
  gc: "bg-orange-500/15 text-orange-700",
  designer: "bg-pink-500/15 text-pink-700",
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
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  const initials = partner.contact_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const { data: referredLeads = [] } = useQuery({
    queryKey: ["partner-leads", partner.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, phone, status, created_at, converted_to_project_id")
        .eq("referred_by_partner_id", partner.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const convertedProjectIds = referredLeads
    .map((l) => l.converted_to_project_id)
    .filter(Boolean) as string[];

  const { data: partnerProjects = [] } = useQuery({
    queryKey: ["partner-projects", partner.id, convertedProjectIds],
    queryFn: async () => {
      // Fetch projects linked via referred_by_partner_id (direct jobs)
      const { data: directProjects, error: err1 } = await supabase
        .from("projects")
        .select("id, customer_name, address, city, project_type, project_status, start_date, completion_date, estimated_cost, notes")
        .eq("referred_by_partner_id", partner.id)
        .order("start_date", { ascending: false });
      if (err1) throw err1;

      // Fetch projects linked via lead conversion
      let convertedProjects: typeof directProjects = [];
      if (convertedProjectIds.length > 0) {
        const { data, error: err2 } = await supabase
          .from("projects")
          .select("id, customer_name, address, city, project_type, project_status, start_date, completion_date, estimated_cost, notes")
          .in("id", convertedProjectIds)
          .order("start_date", { ascending: false });
        if (err2) throw err2;
        convertedProjects = data || [];
      }

      // Merge and deduplicate by id
      const merged = new Map<string, (typeof directProjects)[0]>();
      for (const p of [...(directProjects || []), ...convertedProjects]) {
        merged.set(p.id, p);
      }
      return Array.from(merged.values());
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
      next_action_date: partner.next_action_date,
      next_action_note: partner.next_action_note || "",
      notes: partner.notes || "",
      birthday: partner.birthday,
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

  const conversionRate =
    partner.total_referrals > 0
      ? Math.round((partner.total_converted / partner.total_referrals) * 100)
      : 0;

  return (
    <div className="flex flex-col h-full">
      {/* At Risk Banner */}
      {isAtRisk && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-200 text-amber-700 text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Partner em risco — sem contato há mais de 30 dias
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
              avatarColors[partner.partner_type] || "bg-muted text-muted-foreground"
            }`}
          >
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
              {partnerProjects.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  <Briefcase className="w-3 h-3 mr-0.5" />
                  {partnerProjects.length} Projeto{partnerProjects.length !== 1 ? "s" : ""}
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
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-border/50">
        {partner.phone ? (
          <a
            href={`tel:${partner.phone}`}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span className="text-xs font-medium">Ligar</span>
          </a>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 text-muted-foreground/50 cursor-not-allowed">
            <Phone className="w-5 h-5" />
            <span className="text-xs font-medium">Ligar</span>
          </div>
        )}
        {partner.phone ? (
          <a
            href={`sms:${partner.phone}`}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Mensagem</span>
          </a>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 text-muted-foreground/50 cursor-not-allowed">
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Mensagem</span>
          </div>
        )}
        {partner.email ? (
          <a
            href={`mailto:${partner.email}`}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors"
          >
            <Mail className="w-5 h-5" />
            <span className="text-xs font-medium">Email</span>
          </a>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 text-muted-foreground/50 cursor-not-allowed">
            <Mail className="w-5 h-5" />
            <span className="text-xs font-medium">Email</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 p-3 border-b border-border/50">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-blue-500/10 border border-blue-200/50">
          <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{partner.total_referrals}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Indicações</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-200/50">
          <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{partner.total_converted}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Convertidos</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-200/50">
          <BarChart3 className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Conversão</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="geral" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 pb-0 border-b border-border/40">
          <TabsList className="w-full h-auto bg-transparent p-0 gap-0 justify-start rounded-none">
            <TabsTrigger
              value="geral"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:font-semibold text-muted-foreground px-4 py-2.5 text-sm transition-colors hover:text-foreground"
            >
              Geral
            </TabsTrigger>
            <TabsTrigger
              value="projetos"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:font-semibold text-muted-foreground px-4 py-2.5 text-sm gap-1.5 transition-colors hover:text-foreground"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Projetos
              {partnerProjects.length > 0 && (
                <span className="ml-0.5 text-[10px] font-bold text-muted-foreground">
                  {partnerProjects.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="indicacoes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:font-semibold text-muted-foreground px-4 py-2.5 text-sm gap-1.5 transition-colors hover:text-foreground"
            >
              <Users className="w-3.5 h-3.5" />
              Indicações
              {referredLeads.length > 0 && (
                <span className="ml-0.5 text-[10px] font-bold text-muted-foreground">
                  {referredLeads.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="notas"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:font-semibold text-muted-foreground px-4 py-2.5 text-sm transition-colors hover:text-foreground"
            >
              Notas
            </TabsTrigger>
          </TabsList>
        </div>

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
                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="Último Contato"
                    value={
                      partner.last_contacted_at
                        ? format(new Date(partner.last_contacted_at), "dd/MM/yyyy")
                        : "Nunca"
                    }
                    alert={isAtRisk}
                  />
                  <InfoCard
                    icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    label="Próxima Ação"
                    value={
                      partner.next_action_date
                        ? format(new Date(partner.next_action_date), "dd/MM/yyyy")
                        : "—"
                    }
                    subtitle={partner.next_action_note || undefined}
                  />
                  <InfoCard
                    icon={<Building className="w-3.5 h-3.5" />}
                    label="Tipo"
                    value={PARTNER_TYPES[partner.partner_type] || partner.partner_type}
                  />
                  <InfoCard
                    icon={<Cake className="w-3.5 h-3.5" />}
                    label="Aniversário"
                    value={
                      partner.birthday
                        ? format(new Date(partner.birthday + "T12:00:00"), "dd/MM")
                        : "—"
                    }
                    alert={
                      partner.birthday
                        ? (() => {
                            const today = new Date();
                            const bday = new Date(today.getFullYear(), new Date(partner.birthday + "T12:00:00").getMonth(), new Date(partner.birthday + "T12:00:00").getDate());
                            const diff = Math.ceil((bday.getTime() - today.getTime()) / 86400000);
                            return diff >= 0 && diff <= 7;
                          })()
                        : false
                    }
                  />
                  <InfoCard
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="Criado em"
                    value={format(new Date(partner.created_at), "dd/MM/yyyy")}
                    className="col-span-2"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
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
              <Button
                onClick={() => setNewLeadOpen(true)}
                size="sm"
                className="w-full gap-2"
              >
                <UserPlus className="w-4 h-4" /> Nova Indicação
              </Button>
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

          {/* Projetos Tab */}
          <TabsContent value="projetos" className="px-4 pb-4 mt-0">
            <div className="pt-3 space-y-3">
              <Button
                onClick={() => setNewJobOpen(true)}
                size="sm"
                className="w-full gap-2"
              >
                <Hammer className="w-4 h-4" /> Novo Job
              </Button>
              <PartnerProjectsTab projects={partnerProjects} />
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

      <NewJobDialog open={newJobOpen} onOpenChange={setNewJobOpen} />
      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
    </div>
  );
}

/* ---------- Info Card ---------- */
function InfoCard({
  icon,
  label,
  value,
  subtitle,
  alert,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  alert?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-muted/30 rounded-lg p-3 border border-border/30 ${className || ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        {label}
      </div>
      <p className={`text-sm font-semibold ${alert ? "text-amber-600" : "text-foreground"}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  );
}

/* ---------- Partner Projects Tab ---------- */
type ProjectRow = {
  id: string;
  customer_name: string;
  address: string | null;
  city: string | null;
  project_type: string;
  project_status: string;
  start_date: string | null;
  completion_date: string | null;
  estimated_cost: number | null;
  notes: string | null;
};

const projectStatusColors: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-700 border-blue-200",
  in_progress: "bg-amber-500/10 text-amber-700 border-amber-200",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

function PartnerProjectsTab({ projects }: { projects: ProjectRow[] }) {
  const navigate = useNavigate();
  const activeProjects = projects.filter(
    (p) => p.project_status !== "completed" && p.project_status !== "cancelled"
  );
  const completedProjects = projects.filter(
    (p) => p.project_status === "completed"
  );
  const totalRevenue = projects.reduce(
    (sum, p) => sum + (p.estimated_cost || 0),
    0
  );

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground pt-3">
        <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhum projeto vinculado</p>
        <p className="text-xs mt-1">Projetos aparecem quando leads indicados são convertidos</p>
      </div>
    );
  }

  const renderProjectCard = (project: ProjectRow) => (
    <div
      key={project.id}
      onClick={() => navigate(`/admin/projects/${project.id}`)}
      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30 cursor-pointer hover:bg-muted/60 hover:border-primary/30 transition-colors group"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {project.address || project.customer_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {project.city && `${project.city} · `}
          {project.project_type}
          {project.start_date && ` · ${format(new Date(project.start_date), "dd/MM/yy")}`}
          {project.completion_date && ` – ${format(new Date(project.completion_date), "dd/MM/yy")}`}
        </p>
      </div>
      <div className="text-right flex-shrink-0 ml-3 flex items-center gap-2">
        <div>
          <Badge variant="outline" className={`text-[10px] ${projectStatusColors[project.project_status] || ""}`}>
            {project.project_status}
          </Badge>
          {project.estimated_cost != null && project.estimated_cost > 0 && (
            <p className="text-xs font-semibold text-foreground mt-1">
              ${project.estimated_cost.toLocaleString()}
            </p>
          )}
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );

  return (
    <div className="pt-3 space-y-4">
      {activeProjects.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Projetos Ativos
          </h4>
          {activeProjects.map(renderProjectCard)}
        </div>
      )}

      {completedProjects.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Projetos Concluídos
          </h4>
          {completedProjects.map(renderProjectCard)}
        </div>
      )}

      {/* Financial Summary Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Histórico Financeiro
        </h4>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs h-9">Projeto</TableHead>
                <TableHead className="text-xs h-9 hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="text-xs h-9 hidden sm:table-cell">Data</TableHead>
                <TableHead className="text-xs h-9 text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs py-2 font-medium">
                    {p.address || p.customer_name}
                    {p.city && <span className="text-muted-foreground ml-1">· {p.city}</span>}
                  </TableCell>
                  <TableCell className="text-xs py-2 hidden sm:table-cell text-muted-foreground">
                    {p.project_type}
                  </TableCell>
                  <TableCell className="text-xs py-2 hidden sm:table-cell text-muted-foreground">
                    {p.start_date ? format(new Date(p.start_date), "dd/MM/yy") : "—"}
                  </TableCell>
                  <TableCell className="text-xs py-2 text-right font-semibold">
                    {p.estimated_cost ? `$${p.estimated_cost.toLocaleString()}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-xs font-semibold">
                  Total Receita
                </TableCell>
                <TableCell className="text-xs text-right font-bold text-foreground">
                  ${totalRevenue.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
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
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Aniversário</label>
        <Input
          type="date"
          value={editValues.birthday || ""}
          onChange={(e) =>
            setEditValues((p) => ({ ...p, birthday: e.target.value || null }))
          }
        />
      </div>
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
