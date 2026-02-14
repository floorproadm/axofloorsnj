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
import {
  Hammer, CheckCircle, Clock, DollarSign, MapPin,
  AlertTriangle, Camera, FileText, Calculator, ChevronRight,
  Ban, Loader2, User, FolderOpen, Trash2, Phone, Mail,
  CalendarDays, TrendingUp, Eye, MessageSquare, Hash, Ruler,
  Send, ImagePlus, X, StickyNote
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

function useProjectsWithRelations() {
  return useQuery({
    queryKey: ["projects-with-relations"],
    queryFn: async (): Promise<ProjectWithRelations[]> => {
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

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

      return (projects || []).map((p) => ({
        ...p,
        job_costs: costsMap.get(p.id) || null,
        job_proof: proofMap.get(p.id) || [],
      }));
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
  const { data: projects, isLoading, refetch } = useProjectsWithRelations();
  const { marginMinPercent } = useCompanySettings();
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | null>(null);

  const grouped = useMemo(() => {
    const g: Record<ProjectStatus, ProjectWithRelations[]> = {
      pending: [],
      in_production: [],
      completed: [],
    };
    (projects || []).forEach((p) => {
      const status = p.project_status as ProjectStatus;
      if (g[status]) g[status].push(p);
    });
    return g;
  }, [projects]);

  const summaryStats = useMemo(() => {
    const all = projects || [];
    const active = all.filter((p) => p.project_status !== "completed");
    const totalRevenue = active.reduce((s, p) => s + (p.job_costs?.estimated_revenue || 0), 0);
    const lowMargin = active.filter((p) => {
      const m = p.job_costs?.margin_percent;
      return m !== null && m !== undefined && m < marginMinPercent;
    }).length;
    const noPhotos = all
      .filter((p) => p.project_status === "in_production")
      .filter((p) => {
        const hasBefore = p.job_proof.some((pr) => pr.before_image_url);
        const hasAfter = p.job_proof.some((pr) => pr.after_image_url);
        return !hasBefore || !hasAfter;
      }).length;

    return { total: active.length, totalRevenue, lowMargin, noPhotos };
  }, [projects, marginMinPercent]);

  return (
    <AdminLayout title="Pipeline Operacional" breadcrumbs={[{ label: "Jobs" }]}>
      <div className="space-y-4 animate-fade-in">
        {/* Summary Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border">
            <Hammer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold">{summaryStats.total}</span>
            <span className="text-xs text-muted-foreground">ativos</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">
              ${(summaryStats.totalRevenue / 1000).toFixed(summaryStats.totalRevenue >= 1000 ? 0 : 1)}k
            </span>
          </div>
          {summaryStats.lowMargin > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-700">{summaryStats.lowMargin}</span>
              <span className="text-xs text-red-600">margem baixa</span>
            </div>
          )}
          {summaryStats.noPhotos > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
              <Camera className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700">{summaryStats.noPhotos}</span>
              <span className="text-xs text-amber-600">sem fotos</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Kanban Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACTIVE_STATUSES.map((status) => {
              const config = STATUS_CONFIG[status];
              const statusProjects = grouped[status];

              return (
                <Card key={status} className={cn("border-2 overflow-hidden", config.border)}>
                  <div className={cn("flex items-center justify-between px-4 py-3 border-b", config.bg)}>
                    <div className="flex items-center gap-2">
                      <span className={config.text}>{config.icon}</span>
                      <span className={cn("font-semibold", config.text)}>{config.label}</span>
                    </div>
                    <Badge variant="outline" className={cn("font-bold text-xs", config.text)}>
                      {statusProjects.length}
                    </Badge>
                  </div>

                  <ScrollArea className="h-[420px]">
                    <div className="p-2 space-y-2">
                      {statusProjects.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          Nenhum job
                        </div>
                      ) : (
                        statusProjects.map((project) => {
                          const indicator = getProjectIndicator(project, marginMinPercent);
                          const revenue = project.job_costs?.estimated_revenue || 0;
                          const margin = project.job_costs?.margin_percent;
                          const hasBefore = project.job_proof.some((p) => p.before_image_url);
                          const hasAfter = project.job_proof.some((p) => p.after_image_url);

                          return (
                            <div
                              key={project.id}
                              onClick={() => setSelectedProject(project)}
                              className={cn(
                                "group p-3 rounded-lg border bg-card cursor-pointer transition-all duration-200",
                                "hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5",
                                indicator.severity === "error" && "ring-2 ring-red-200 border-red-300"
                              )}
                            >
                              {/* Top row: Name + indicator */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-sm truncate">{project.customer_name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                      {project.project_type}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {timeAgo(project.created_at)}
                                    </span>
                                  </div>
                                </div>
                                <div className={cn(
                                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0",
                                  indicator.severity === "ok" && "bg-emerald-100 text-emerald-700",
                                  indicator.severity === "warning" && "bg-amber-100 text-amber-700",
                                  indicator.severity === "error" && "bg-red-100 text-red-700",
                                )}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", indicator.color)} />
                                  {indicator.label}
                                </div>
                              </div>

                              {/* Location */}
                              {project.city && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  {[project.city, project.zip_code].filter(Boolean).join(", ")}
                                </p>
                              )}

                              {/* Financial row */}
                              <div className="flex items-center justify-between pt-2 border-t border-dashed">
                                <div className="flex items-center gap-2">
                                  {revenue > 0 ? (
                                    <span className="text-sm font-bold text-emerald-700">
                                      {formatCurrency(revenue)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">Sem valor</span>
                                  )}
                                  {margin !== null && margin !== undefined && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] px-1.5 py-0 h-4",
                                        margin >= marginMinPercent
                                          ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                          : "border-red-300 text-red-700 bg-red-50"
                                      )}
                                    >
                                      <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                      {margin.toFixed(0)}%
                                    </Badge>
                                  )}
                                </div>

                                {/* Quick status icons */}
                                <div className="flex items-center gap-1">
                                  <div className={cn(
                                    "w-5 h-5 rounded flex items-center justify-center",
                                    hasBefore && hasAfter ? "bg-emerald-100" : "bg-muted"
                                  )}>
                                    <Camera className={cn("w-3 h-3", hasBefore && hasAfter ? "text-emerald-600" : "text-muted-foreground")} />
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              );
            })}
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
// JOB CONTROL MODAL — Redesigned with sectioned layout
// ═══════════════════════════════════════════════════════════

interface JobControlModalProps {
  project: ProjectWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

function JobControlModal({ project, isOpen, onClose, onRefresh }: JobControlModalProps) {
  const { data: jobCost, refetch: refetchCost } = useJobCost(project.id);
  const { marginMinPercent } = useCompanySettings();
  const validation = useMarginValidation(project.id);
  const navigate = useNavigate();

  const [showBlock, setShowBlock] = useState<"costs" | "proposal" | "proof" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
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

  const currentMargin = jobCost?.margin_percent ?? 0;
  const marginOk = jobCost && currentMargin >= marginMinPercent && (jobCost.estimated_revenue ?? 0) > 0;
  const hasCosts = jobCost && (jobCost.labor_cost > 0 || jobCost.material_cost > 0);

  const hasBefore = project.job_proof.some((p) => p.before_image_url);
  const hasAfter = project.job_proof.some((p) => p.after_image_url);
  const proofComplete = hasBefore && hasAfter;

  const statusConfig = STATUS_CONFIG[project.project_status as ProjectStatus] || STATUS_CONFIG.pending;

  const handleCostSaved = () => {
    refetchCost();
    onRefresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-16px)] sm:max-w-2xl max-h-[90vh] overflow-hidden p-0">
        {/* Status Banner */}
        <div className={cn("px-4 sm:px-6 py-4 text-white", statusConfig.headerBg)}>
          <DialogHeader className="pb-0">
            <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
              {statusConfig.icon}
              <span className="font-medium">{statusConfig.label}</span>
              <span className="mx-1">•</span>
              <span>Criado {timeAgo(project.created_at)} atrás</span>
            </div>
            <DialogTitle className="text-xl font-bold text-white truncate pr-8">
              {project.customer_name}
            </DialogTitle>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-4 sm:p-6 space-y-5">

            {/* ── Customer Info Section ── */}
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Informações do Cliente</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Cliente</p>
                    <p className="text-sm font-semibold truncate">{project.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <a href={`tel:${project.customer_phone}`} className="text-sm font-semibold text-primary hover:underline">
                      {project.customer_phone}
                    </a>
                  </div>
                </div>
                {project.customer_email && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium truncate">{project.customer_email}</p>
                    </div>
                  </div>
                )}
                {project.address && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Endereço</p>
                      <p className="text-sm font-medium truncate">
                        {[project.address, project.city, project.zip_code].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Project meta tags */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Hash className="w-3 h-3" />
                  {project.project_type}
                </Badge>
                {project.square_footage && (
                  <Badge variant="outline" className="text-xs">
                    {project.square_footage} sqft
                  </Badge>
                )}
              </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
              </div>
            </div>

            {/* ── Financial Summary (Always Visible) ── */}
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

            {/* ── Expandable Blocks ── */}
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

            {/* ── Notes & Comments Section ── */}
            <ProjectNotesSection projectId={project.id} initialNotes={project.notes} onRefresh={onRefresh} />

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
