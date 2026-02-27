import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useJobCost, useMarginValidation } from "@/hooks/useJobCosts";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { JobCostEditor } from "@/components/admin/JobCostEditor";
import { JobMarginDisplay } from "@/components/admin/JobMarginDisplay";
import { ProposalGenerator } from "@/components/admin/ProposalGenerator";
import { JobProofUploader } from "@/components/admin/JobProofUploader";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  Hammer, CheckCircle, Clock, DollarSign, MapPin,
  AlertTriangle, Camera, FileText, Calculator, ChevronRight,
  Ban, Loader2, User, FolderOpen, Trash2, Phone, Mail,
  CalendarDays, TrendingUp, Eye, MessageSquare, Hash, Ruler,
  Send, ImagePlus, X, StickyNote, LayoutGrid, List, Users, ExternalLink,
  Wrench, BarChart3, Shield, Navigation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type ProjectStatus = "pending" | "in_production" | "completed";

interface ProjectWithRelations {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  project_type: string;
  project_status: string;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  square_footage: number | null;
  notes: string | null;
  start_date: string | null;
  completion_date: string | null;
  team_lead: string | null;
  team_members: string[] | null;
  work_schedule: string | null;
  created_at: string;
  updated_at: string;
  job_costs: {
    labor_cost: number;
    material_cost: number;
    additional_costs: number;
    total_cost: number | null;
    estimated_revenue: number;
    margin_percent: number | null;
    profit_amount: number | null;
  } | null;
  job_proof: {
    id: string;
    before_image_url: string | null;
    after_image_url: string | null;
  }[];
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactNode; headerBg: string }> = {
  pending: {
    label: "Pendente",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    icon: <Clock className="w-5 h-5" />,
    headerBg: "bg-gradient-to-r from-amber-600 to-amber-500",
  },
  in_production: {
    label: "Em Produção",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-300",
    icon: <Hammer className="w-5 h-5" />,
    headerBg: "bg-gradient-to-r from-blue-700 to-blue-500",
  },
  completed: {
    label: "Concluído",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    icon: <CheckCircle className="w-5 h-5" />,
    headerBg: "bg-gradient-to-r from-emerald-700 to-emerald-500",
  },
};

const ACTIVE_STATUSES: ProjectStatus[] = ["pending", "in_production", "completed"];

function useProjectsWithRelations(page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ["projects-with-relations", page, pageSize],
    queryFn: async (): Promise<{ items: ProjectWithRelations[]; totalCount: number }> => {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data: projects, error, count } = await supabase
        .from("projects")
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const projectIds = (projects || []).map((p) => p.id);

      const [costsRes, proofRes] = await Promise.all([
        supabase.from("job_costs").select("*").in("project_id", projectIds),
        supabase.from("job_proof").select("id, project_id, before_image_url, after_image_url").in("project_id", projectIds),
      ]);

      const costsMap = new Map<string, any>();
      (costsRes.data || []).forEach((c) => costsMap.set(c.project_id, c));

      const proofMap = new Map<string, any[]>();
      (proofRes.data || []).forEach((p) => {
        const arr = proofMap.get(p.project_id) || [];
        arr.push(p);
        proofMap.set(p.project_id, arr);
      });

      const items = (projects || []).map((p: any) => ({
        ...p,
        team_lead: p.team_lead || null,
        team_members: p.team_members || [],
        work_schedule: p.work_schedule || '8:00 AM - 5:00 PM',
        job_costs: costsMap.get(p.id) || null,
        job_proof: proofMap.get(p.id) || [],
      }));
      return { items, totalCount: count ?? items.length };
    },
  });
}

function getProjectIndicator(project: ProjectWithRelations, minMargin: number) {
  const costs = project.job_costs;
  if (!costs || (costs.total_cost === null && costs.labor_cost === 0 && costs.material_cost === 0)) {
    return { color: "bg-amber-500", label: "Sem custos", severity: "warning" as const };
  }
  if (costs.margin_percent !== null && costs.margin_percent < minMargin) {
    return { color: "bg-red-500", label: "Margem baixa", severity: "error" as const };
  }
  if (project.project_status === "in_production" || project.project_status === "completed") {
    const hasBefore = project.job_proof.some((p) => p.before_image_url);
    const hasAfter = project.job_proof.some((p) => p.after_image_url);
    if (!hasBefore || !hasAfter) {
      return { color: "bg-red-500", label: "Sem fotos", severity: "error" as const };
    }
  }
  return { color: "bg-emerald-500", label: "OK", severity: "ok" as const };
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "1 dia";
  if (diffDays < 30) return `${diffDays} dias`;
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "1 mês" : `${months} meses`;
}

export default function JobsManager() {
  const [jobPage, setJobPage] = useState(0);
  const PAGE_SIZE = 50;
  const { data, isLoading, refetch } = useProjectsWithRelations(jobPage, PAGE_SIZE);
  const projects = data?.items;
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const { marginMinPercent } = useCompanySettings();
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | ProjectStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  const filteredProjects = useMemo(() => {
    let list = projects || [];
    if (activeFilter !== "all") {
      list = list.filter((p) => p.project_status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.customer_name.toLowerCase().includes(q) ||
          p.project_type.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, activeFilter, searchQuery]);

  const projectsByStatus = useMemo(() => {
    const map: Record<ProjectStatus, ProjectWithRelations[]> = {
      pending: [],
      in_production: [],
      completed: [],
    };
    filteredProjects.forEach((p) => {
      const s = p.project_status as ProjectStatus;
      if (map[s]) map[s].push(p);
      else map.pending.push(p);
    });
    return map;
  }, [filteredProjects]);

  const totalValue = useMemo(() => {
    return filteredProjects.reduce((sum, p) => sum + (p.job_costs?.estimated_revenue || 0), 0);
  }, [filteredProjects]);

  const filterTabs: { key: "all" | ProjectStatus; label: string }[] = [
    { key: "all", label: "All Jobs" },
    { key: "in_production", label: "In Progress" },
    { key: "pending", label: "Scheduled" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <AdminLayout title="Jobs" breadcrumbs={[{ label: "Jobs" }]}>
      <div className="space-y-4 animate-fade-in">
        {/* Summary Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Hammer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{filteredProjects.length} Deals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{formatCurrency(totalValue)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("board")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === "board"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Board
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border bg-card shadow-sm"
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                activeFilter === tab.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Hammer className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum job encontrado.</p>
          </div>
        ) : viewMode === "board" ? (
          /* ═══════════ KANBAN BOARD VIEW ═══════════ */
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
            {ACTIVE_STATUSES.map((status) => {
              const conf = STATUS_CONFIG[status];
              const items = projectsByStatus[status];
              const colRevenue = items.reduce((s, p) => s + (p.job_costs?.estimated_revenue || 0), 0);
              const isHighlighted = activeFilter === "all" || activeFilter === status;

              return (
                <div
                  key={status}
                  className={cn(
                    "flex-shrink-0 w-[85vw] md:w-80 flex flex-col rounded-xl border border-border bg-card overflow-hidden snap-center transition-opacity",
                    !isHighlighted && "opacity-40"
                  )}
                >
                  {/* Column Header */}
                  <div className={cn("px-4 py-3 text-white flex items-center justify-between", conf.headerBg)}>
                    <div className="flex items-center gap-2">
                      {conf.icon}
                      <span className="font-semibold text-sm">{conf.label}</span>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>

                  {/* Column Cards */}
                  <ScrollArea className="flex-1 max-h-[65vh]">
                    <div className="p-2 space-y-2">
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                          Nenhum job
                        </div>
                      ) : (
                        items.map((project) => (
                          <KanbanCard
                            key={project.id}
                            project={project}
                            minMargin={marginMinPercent}
                            onClick={() => setSelectedProject(project)}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Column Footer */}
                  <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Total Revenue</span>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(colRevenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ═══════════ LIST VIEW (existing) ═══════════ */
          <div className="max-w-2xl mx-auto space-y-3">
            {filteredProjects.map((project) => {
              const statusConf = STATUS_CONFIG[project.project_status as ProjectStatus] || STATUS_CONFIG.pending;
              const revenue = project.job_costs?.estimated_revenue || 0;
              const location = [project.address, project.city].filter(Boolean).join(", ");
              const startDate = project.start_date
                ? new Date(project.start_date)
                : new Date(project.created_at);

              return (
                <Card
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="rounded-xl border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className={cn("w-1 flex-shrink-0", statusConf.headerBg)} />
                      <div className="flex-1 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-sm text-foreground leading-tight truncate">
                              {project.project_type}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{project.customer_name}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold border flex-shrink-0",
                              statusConf.bg, statusConf.text, statusConf.border
                            )}
                          >
                            {statusConf.label}
                          </Badge>
                        </div>
                        {location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            {location}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                          {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-border">
                          <span className="text-xs text-muted-foreground">
                            {project.square_footage ? `${project.square_footage.toLocaleString()} sqft` : "—"}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {revenue > 0 ? formatCurrency(revenue) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination (list mode) */}
        {viewMode === "list" && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 max-w-2xl mx-auto">
            <span className="text-xs text-muted-foreground">
              {totalCount} jobs total
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={jobPage === 0}
                onClick={() => setJobPage(p => Math.max(0, p - 1))}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                {jobPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={jobPage >= totalPages - 1}
                onClick={() => setJobPage(p => p + 1)}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Job Control Modal */}
      {selectedProject && (
        <JobControlModal
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          onRefresh={() => refetch()}
        />
      )}
    </AdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════
// KANBAN CARD — DripJobs-inspired card for board view
// ═══════════════════════════════════════════════════════════

function KanbanCard({
  project,
  minMargin,
  onClick,
}: {
  project: ProjectWithRelations;
  minMargin: number;
  onClick: () => void;
}) {
  const indicator = getProjectIndicator(project, minMargin);
  const costs = project.job_costs;
  const revenue = costs?.estimated_revenue || 0;
  const totalCost = costs?.total_cost || 0;

  const startDate = project.start_date ? new Date(project.start_date) : null;
  const endDate = project.completion_date ? new Date(project.completion_date) : null;
  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      onClick={onClick}
      className="bg-background rounded-lg border border-border p-3 space-y-2.5 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Project type + indicator */}
      <div className="flex items-start justify-between gap-1">
        <h4 className="text-sm font-bold text-foreground leading-tight truncate flex-1">
          {project.project_type}
        </h4>
        {indicator.severity !== "ok" && (
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1.5", indicator.color)} title={indicator.label} />
        )}
      </div>

      {/* Customer */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <User className="w-3 h-3 flex-shrink-0" />
        {project.customer_name}
      </p>

      {/* Financial preview */}
      {revenue > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatCurrency(totalCost)} of {formatCurrency(revenue)}
          </span>
          {costs?.margin_percent !== null && costs?.margin_percent !== undefined && (
            <Badge variant="outline" className={cn(
              "text-[10px] px-1.5 py-0 rounded-full font-semibold",
              costs.margin_percent < minMargin
                ? "border-destructive/50 text-destructive"
                : "border-emerald-300 text-emerald-700"
            )}>
              {costs.margin_percent.toFixed(0)}%
            </Badge>
          )}
        </div>
      )}

      {/* Dates */}
      {(startDate || endDate) && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CalendarDays className="w-3 h-3 flex-shrink-0" />
          {startDate ? fmtDate(startDate) : "—"} — {endDate ? fmtDate(endDate) : "—"}
        </p>
      )}

      {/* Team lead */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Users className="w-3 h-3 flex-shrink-0" />
        {project.team_lead || "No Crew Assigned"}
      </p>

      {/* Updated ago */}
      <p className="text-[10px] text-muted-foreground/60 text-right">
        Updated {timeAgo(project.updated_at)} ago
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// JOB CONTROL MODAL V2 — Dual-Mode Operacional/Executivo
// ═══════════════════════════════════════════════════════════

interface JobControlModalProps {
  project: ProjectWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

// ── Next Recommended Action logic ──
function getNextAction(
  project: ProjectWithRelations,
  hasCosts: boolean,
  marginOk: boolean,
  proofComplete: boolean,
  marginMinPercent: number,
  currentMargin: number
): { label: string; severity: "critical" | "warning" | "ok"; action: "costs" | "proof" | "team" | "none" } {
  if (!hasCosts) return { label: "Preencher custos do projeto", severity: "critical", action: "costs" };
  if (!marginOk) return { label: `Margem ${currentMargin.toFixed(0)}% abaixo de ${marginMinPercent}% — ajuste custos`, severity: "critical", action: "costs" };
  if (!project.team_lead) return { label: "Definir team lead", severity: "warning", action: "team" };
  if (!proofComplete) return { label: "Adicionar fotos before/after", severity: "warning", action: "proof" };
  const daysSinceUpdate = Math.floor((Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate > 4) return { label: `Job parado há ${daysSinceUpdate} dias`, severity: "warning", action: "none" };
  return { label: "Tudo em dia ✓", severity: "ok", action: "none" };
}

// ── Risk Score ──
function getRiskScore(
  project: ProjectWithRelations,
  hasCosts: boolean,
  marginOk: boolean,
  proofComplete: boolean
): { score: number; level: "healthy" | "attention" | "risk"; label: string; color: string } {
  let score = 0;
  if (!hasCosts) score++;
  if (!marginOk) score++;
  if (!project.team_lead) score++;
  if (!proofComplete) score++;
  const daysSinceUpdate = Math.floor((Date.now() - new Date(project.updated_at).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate > 3) score++;

  if (score <= 1) return { score, level: "healthy", label: "Saudável", color: "bg-emerald-100 text-emerald-700 border-emerald-300" };
  if (score <= 3) return { score, level: "attention", label: "Atenção", color: "bg-amber-100 text-amber-700 border-amber-300" };
  return { score, level: "risk", label: "Em risco", color: "bg-red-100 text-red-700 border-red-300" };
}

function JobControlModal({ project, isOpen, onClose, onRefresh }: JobControlModalProps) {
  const { data: jobCost, refetch: refetchCost } = useJobCost(project.id);
  const { marginMinPercent } = useCompanySettings();
  const validation = useMarginValidation(project.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showBlock, setShowBlock] = useState<"costs" | "proposal" | "proof" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [teamLead, setTeamLead] = useState(project.team_lead || '');
  const [teamMembers, setTeamMembers] = useState<string[]>(project.team_members || []);
  const [workSchedule, setWorkSchedule] = useState(project.work_schedule || '8:00 AM - 5:00 PM');
  const [newMember, setNewMember] = useState('');
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<"operational" | "executive">("operational");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsChangingStatus(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ project_status: newStatus })
        .eq('id', project.id);
      if (error) throw error;
      toast.success(`Status alterado para ${STATUS_CONFIG[newStatus as ProjectStatus]?.label || newStatus}`);
      onRefresh();
    } catch (err: any) {
      const msg = err?.message || 'Erro ao alterar status';
      if (msg.includes('JobProof')) {
        toast.error('Bloqueado: adicione fotos before/after antes de completar');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await supabase.from('project_comments').delete().eq('project_id', project.id);
      await supabase.from('job_proof').delete().eq('project_id', project.id);
      await supabase.from('job_costs').delete().eq('project_id', project.id);
      await supabase.from('project_documents').delete().eq('project_id', project.id);
      await supabase.from('proposals').delete().eq('project_id', project.id);
      const { error } = await supabase.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      toast.success(`Job "${project.customer_name}" deletado com sucesso`);
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao deletar job');
    } finally {
      setIsDeleting(false);
      setDeleteStep(0);
    }
  };

  const handleSaveTeam = async () => {
    setIsSavingTeam(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          team_lead: teamLead || null,
          team_members: teamMembers,
          work_schedule: workSchedule,
        } as any)
        .eq('id', project.id);
      if (error) throw error;
      toast.success('Time atualizado');
      setIsEditingTeam(false);
      onRefresh();
    } catch {
      toast.error('Erro ao salvar time');
    } finally {
      setIsSavingTeam(false);
    }
  };

  const addMember = () => {
    if (newMember.trim() && !teamMembers.includes(newMember.trim())) {
      setTeamMembers([...teamMembers, newMember.trim()]);
      setNewMember('');
    }
  };

  const removeMember = (name: string) => {
    setTeamMembers(teamMembers.filter(m => m !== name));
  };

  const currentMargin = jobCost?.margin_percent ?? 0;
  const marginOk = !!(jobCost && currentMargin >= marginMinPercent && (jobCost.estimated_revenue ?? 0) > 0);
  const hasCosts = !!(jobCost && (jobCost.labor_cost > 0 || jobCost.material_cost > 0));

  const hasBefore = project.job_proof.some((p) => p.before_image_url);
  const hasAfter = project.job_proof.some((p) => p.after_image_url);
  const proofComplete = hasBefore && hasAfter;
  const hasMeasurements = (project.square_footage ?? 0) > 0;
  const hasTeam = !!project.team_lead;

  const statusConfig = STATUS_CONFIG[project.project_status as ProjectStatus] || STATUS_CONFIG.pending;

  // Progress checklist
  const checklistItems = [
    { label: "Medições", ok: hasMeasurements },
    { label: "Custos", ok: hasCosts },
    { label: "Margem", ok: marginOk },
    { label: "Time", ok: hasTeam },
    { label: "Fotos", ok: proofComplete },
  ];
  const progressPercent = Math.round((checklistItems.filter(i => i.ok).length / checklistItems.length) * 100);

  // NRA
  const nra = getNextAction(project, hasCosts, marginOk, proofComplete, marginMinPercent, currentMargin);

  // Risk
  const risk = getRiskScore(project, hasCosts, marginOk, proofComplete);

  const handleCostSaved = () => {
    refetchCost();
    onRefresh();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const addressFull = [project.address, project.city, project.zip_code].filter(Boolean).join(", ");
  const mapsUrl = addressFull ? `https://maps.google.com/?q=${encodeURIComponent(addressFull)}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-16px)] sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        {/* ═══ HEADER ═══ */}
        <div className={cn("px-4 sm:px-6 py-4 text-white", statusConfig.headerBg)}>
          <DialogHeader className="pb-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Status Dropdown */}
                <Select
                  value={project.project_status}
                  onValueChange={handleStatusChange}
                  disabled={isChangingStatus}
                >
                  <SelectTrigger className="h-7 w-auto min-w-[120px] bg-white/20 border-white/30 text-white text-xs font-medium hover:bg-white/30 [&>svg]:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        <span className="flex items-center gap-2">
                          {STATUS_CONFIG[s].icon}
                          {STATUS_CONFIG[s].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-white/60 text-xs">•</span>
                <span className="text-white/80 text-xs truncate">Criado {timeAgo(project.created_at)} atrás</span>

                {/* Risk Badge */}
                <Badge className={cn("text-[10px] px-2 py-0.5 border font-semibold ml-auto", risk.color)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {risk.label}
                </Badge>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-white/15 rounded-md ml-3 flex-shrink-0">
                <button
                  onClick={() => setModalViewMode("operational")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    modalViewMode === "operational" ? "bg-white/30 text-white" : "text-white/60 hover:text-white"
                  )}
                  title="Operacional"
                >
                  <Wrench className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setModalViewMode("executive")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    modalViewMode === "executive" ? "bg-white/30 text-white" : "text-white/60 hover:text-white"
                  )}
                  title="Executivo"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-white truncate pr-8">
              {project.customer_name}
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-4 sm:p-6 space-y-4">

            {/* ═══ NRA — Next Recommended Action (sempre visível) ═══ */}
            <div className={cn(
              "rounded-xl border p-3 flex items-center gap-3",
              nra.severity === "critical" ? "bg-red-50 border-red-200" :
              nra.severity === "warning" ? "bg-amber-50 border-amber-200" :
              "bg-emerald-50 border-emerald-200"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                nra.severity === "critical" ? "bg-red-100" :
                nra.severity === "warning" ? "bg-amber-100" :
                "bg-emerald-100"
              )}>
                {nra.severity === "ok" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className={cn("w-4 h-4", nra.severity === "critical" ? "text-red-600" : "text-amber-600")} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Próxima Ação</p>
                <p className="text-sm font-semibold truncate">{nra.label}</p>
              </div>
              {nra.action !== "none" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 h-8 text-xs"
                  onClick={() => {
                    if (nra.action === "costs") setShowBlock("costs");
                    else if (nra.action === "proof") setShowBlock("proof");
                    else if (nra.action === "team") setIsEditingTeam(true);
                  }}
                >
                  Fazer
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>

            {/* ═══ PROGRESS CHECKLIST (sempre visível) ═══ */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Progresso do Job</h3>
                <span className="text-sm font-bold">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2.5 mb-3" />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {checklistItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    {item.ok ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className={cn("text-xs font-medium", item.ok ? "text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ CLIENT + ADDRESS (sempre visível) ═══ */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cliente</h3>
                <div className="flex gap-1.5">
                  <a
                    href={`tel:${project.customer_phone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Ligar
                  </a>
                  <a
                    href={`sms:${project.customer_phone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    SMS
                  </a>
                  {project.customer_email && (
                    <a
                      href={`mailto:${project.customer_email}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-semibold">{project.customer_name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{project.customer_phone}</span>
                </div>
                {project.customer_email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{project.customer_email}</span>
                  </div>
                )}
                {addressFull && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {addressFull}
                        <Navigation className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-sm">{addressFull}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ═══ TEAM SECTION (sempre visível) ═══ */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    if (isEditingTeam) {
                      handleSaveTeam();
                    } else {
                      setIsEditingTeam(true);
                    }
                  }}
                  disabled={isSavingTeam}
                >
                  {isSavingTeam ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  {isEditingTeam ? 'Salvar' : 'Editar'}
                </Button>
              </div>

              {isEditingTeam ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Team Lead</label>
                    <Input
                      value={teamLead}
                      onChange={(e) => setTeamLead(e.target.value)}
                      placeholder="Nome do líder..."
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Horário</label>
                    <Input
                      value={workSchedule}
                      onChange={(e) => setWorkSchedule(e.target.value)}
                      placeholder="8:00 AM - 5:00 PM"
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Membros</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                      {teamMembers.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs gap-1 pr-1">
                          {m}
                          <button onClick={() => removeMember(m)} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        value={newMember}
                        onChange={(e) => setNewMember(e.target.value)}
                        placeholder="Adicionar membro..."
                        className="text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
                      />
                      <Button size="sm" onClick={addMember} disabled={!newMember.trim()}>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Team Lead</span>
                    </div>
                    <span className="text-sm font-semibold">{teamLead || '—'}</span>
                  </div>
                  {teamMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {teamMembers.map((m) => (
                        <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{workSchedule}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ QUICK ACTIONS — Fotos always visible, full grid in executive ═══ */}
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Ações Rápidas</h3>
              <div className={cn("grid gap-2", modalViewMode === "executive" ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3")}>
                {/* Photos — always */}
                <Button
                  variant={showBlock === "proof" ? "default" : "outline"}
                  size="sm"
                  className="h-auto py-2.5 flex-col gap-1"
                  onClick={() => setShowBlock(showBlock === "proof" ? null : "proof")}
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[11px]">Fotos</span>
                  {proofComplete ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  )}
                </Button>

                {/* Costs — always */}
                <Button
                  variant={showBlock === "costs" ? "default" : "outline"}
                  size="sm"
                  className="h-auto py-2.5 flex-col gap-1"
                  onClick={() => setShowBlock(showBlock === "costs" ? null : "costs")}
                >
                  <Calculator className="w-4 h-4" />
                  <span className="text-[11px]">Custos</span>
                  {hasCosts ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  )}
                </Button>

                {/* Measurements — always */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto py-2.5 flex-col gap-1"
                  onClick={() => {
                    onClose();
                    navigate(`/admin/measurements?project=${project.id}`);
                  }}
                >
                  <Ruler className="w-4 h-4" />
                  <span className="text-[11px]">Medições</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </Button>

                {/* Executive-only actions */}
                {modalViewMode === "executive" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2.5 flex-col gap-1 cursor-default"
                      disabled
                    >
                      <DollarSign className="w-4 h-4" />
                      <span className="text-[11px]">Margem</span>
                      <span className={cn("text-[11px] font-bold", marginOk ? "text-emerald-600" : "text-red-600")}>
                        {currentMargin.toFixed(0)}%
                      </span>
                    </Button>

                    <Button
                      variant={showBlock === "proposal" ? "default" : "outline"}
                      size="sm"
                      className="h-auto py-2.5 flex-col gap-1"
                      onClick={() => setShowBlock(showBlock === "proposal" ? null : "proposal")}
                      disabled={!marginOk}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-[11px]">Proposta</span>
                      {!marginOk ? (
                        <Ban className="w-3 h-3 text-red-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-2.5 flex-col gap-1"
                      onClick={() => {
                        onClose();
                        navigate(`/admin/jobs/${project.id}/documents`);
                      }}
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span className="text-[11px]">Docs</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* ═══ Expandable Blocks ═══ */}
            {showBlock === "costs" && (
              <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 animate-fade-in">
                <h3 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Custos do Projeto
                </h3>
                <JobCostEditor projectId={project.id} onSaved={handleCostSaved} />
              </div>
            )}

            {showBlock === "proposal" && marginOk && (
              <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4 animate-fade-in">
                <h3 className="font-bold text-blue-800 text-sm mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Proposta 3-Tiers
                </h3>
                <ProposalGenerator projectId={project.id} onClose={() => setShowBlock(null)} />
              </div>
            )}

            {showBlock === "proof" && (
              <div className="rounded-xl border-2 border-violet-300 bg-violet-50 p-4 animate-fade-in">
                <h3 className="font-bold text-violet-700 text-sm mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Prova de Trabalho
                </h3>
                <JobProofUploader projectId={project.id} />
              </div>
            )}

            {/* ═══ EXECUTIVE-ONLY SECTIONS ═══ */}
            {modalViewMode === "executive" && (
              <>
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn(
                    "rounded-xl border-2 p-3.5",
                    marginOk ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"
                  )}>
                    <div className="flex items-center gap-2 mb-1.5">
                      {marginOk ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Margem</span>
                    </div>
                    <p className={cn("text-2xl font-bold", marginOk ? "text-emerald-700" : "text-red-700")}>
                      {currentMargin.toFixed(1)}%
                    </p>
                    <p className={cn("text-xs mt-0.5", marginOk ? "text-emerald-600" : "text-red-600")}>
                      {marginOk
                        ? `Lucro: ${formatCurrency(jobCost?.profit_amount ?? 0)}`
                        : `Mínimo: ${marginMinPercent}%`}
                    </p>
                  </div>

                  <div className="rounded-xl border-2 border-border p-3.5 bg-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Revenue</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(jobCost?.estimated_revenue ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Custo: {formatCurrency(jobCost?.total_cost ?? 0)}
                    </p>
                  </div>
                </div>

                {/* Project Details */}
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Detalhes do Projeto</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Área</p>
                      <p className="text-sm font-bold">{project.square_footage ? `${project.square_footage} sqft` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Tipo de Serviço</p>
                      <p className="text-sm font-bold">{project.project_type}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Início</p>
                      <p className="text-sm font-bold">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Est. Conclusão</p>
                      <p className="text-sm font-bold">{formatDate(project.completion_date)}</p>
                    </div>
                  </div>
                </div>

                {/* Notes & Comments Section */}
                <ProjectNotesSection projectId={project.id} initialNotes={project.notes} onRefresh={onRefresh} />
              </>
            )}

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t bg-muted/30 flex justify-between items-center">
          <AlertDialog onOpenChange={(open) => { if (!open) setDeleteStep(0); }}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Deletar Job
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {deleteStep === 0 ? `Deletar job "${project.customer_name}"?` : "⚠️ Confirmação final"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteStep === 0 ? (
                    <>
                      Esta ação removerá o job e todos os dados relacionados (custos, propostas, fotos, documentos).
                      <span className="block mt-2 font-semibold text-destructive">
                        Esta ação é irreversível.
                      </span>
                    </>
                  ) : (
                    <>
                      Você está prestes a deletar permanentemente o job de <strong>{project.customer_name}</strong> e todos os registros associados.
                      <span className="block mt-2 font-semibold text-destructive">
                        Tem certeza absoluta? Não será possível recuperar.
                      </span>
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                {deleteStep === 0 ? (
                  <Button
                    variant="destructive"
                    onClick={(e) => { e.preventDefault(); setDeleteStep(1); }}
                  >
                    Sim, quero deletar
                  </Button>
                ) : (
                  <AlertDialogAction
                    onClick={handleDeleteProject}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirmar exclusão permanente
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <span className="text-[10px] text-muted-foreground">
            Job criado em {new Date(project.created_at).toLocaleDateString('pt-BR')} • Apenas admins
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════
// PROJECT NOTES SECTION — Rich notes, photos & comments
// ═══════════════════════════════════════════════════════════

interface ProjectNotesSectionProps {
  projectId: string;
  initialNotes: string | null;
  onRefresh: () => void;
}

function ProjectNotesSection({ projectId, initialNotes, onRefresh }: ProjectNotesSectionProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(initialNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments
  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['project-comments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ notes })
        .eq('id', projectId);
      if (error) throw error;
      toast.success('Notas salvas');
      setIsEditingNotes(false);
      onRefresh();
    } catch {
      toast.error('Erro ao salvar notas');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCommentImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCommentImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() && !commentImage) return;
    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (commentImage) {
        const ext = commentImage.name.split('.').pop() || 'jpg';
        const path = `${projectId}/comments/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('project-documents')
          .upload(path, commentImage);
        if (upErr) throw upErr;

        const { data: urlData } = await supabase.storage
          .from('project-documents')
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        imageUrl = urlData?.signedUrl || null;
      }

      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          content: commentText.trim() || '📷 Foto adicionada',
          image_url: imageUrl,
          author_name: 'Admin',
        });
      if (error) throw error;

      setCommentText('');
      clearImage();
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
      toast.success('Comentário adicionado');
    } catch {
      toast.error('Erro ao enviar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', commentId);
    if (error) {
      toast.error('Erro ao remover');
    } else {
      queryClient.invalidateQueries({ queryKey: ['project-comments', projectId] });
    }
  };

  const formatCommentDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Project Notes */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <StickyNote className="w-3.5 h-3.5" />
            Notas do Projeto
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              if (isEditingNotes) {
                handleSaveNotes();
              } else {
                setIsEditingNotes(true);
              }
            }}
            disabled={isSavingNotes}
          >
            {isSavingNotes ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : null}
            {isEditingNotes ? 'Salvar' : 'Editar'}
          </Button>
        </div>
        {isEditingNotes ? (
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Garage Code: 86753&#10;There are dogs so be sure to close the gate...&#10;&#10;Informações importantes sobre o local, acesso, pets, etc."
            className="min-h-[100px] text-sm"
            autoFocus
          />
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap min-h-[40px]">
            {notes ? (
              notes
            ) : (
              <span className="text-muted-foreground italic">Clique em Editar para adicionar notas...</span>
            )}
          </div>
        )}
      </div>

      {/* Comments Timeline */}
      <div className="p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <MessageSquare className="w-3.5 h-3.5" />
          Comentários & Fotos
          {comments.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-1 px-1.5 py-0 h-4">
              {comments.length}
            </Badge>
          )}
        </h3>

        {/* Comment input */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar comentário..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                variant="outline"
                size="icon"
                className="flex-shrink-0 h-9 w-9"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                className="flex-shrink-0 h-9 w-9"
                disabled={isSubmitting || (!commentText.trim() && !commentImage)}
                onClick={handleSubmitComment}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            {/* Image preview */}
            {commentImagePreview && (
              <div className="relative inline-block">
                <img
                  src={commentImagePreview}
                  alt="Preview"
                  className="h-20 rounded-lg border object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full"
                  onClick={clearImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Comments list */}
        {loadingComments ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 italic">
            Nenhum comentário. Adicione notas, fotos do local ou observações.
          </p>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {comments.map((c: any) => (
              <div key={c.id} className="group flex gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold">{c.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatCommentDate(c.created_at)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteComment(c.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed">{c.content}</p>
                  {c.image_url && (
                    <a href={c.image_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                      <img
                        src={c.image_url}
                        alt="Anexo"
                        className="max-h-40 rounded-lg border object-cover hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
