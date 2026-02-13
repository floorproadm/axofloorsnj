import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
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
  Ban, Loader2, User, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<ProjectStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pendente",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-300",
    icon: <Clock className="w-5 h-5" />,
  },
  in_production: {
    label: "Em Produção",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-300",
    icon: <Hammer className="w-5 h-5" />,
  },
  completed: {
    label: "Concluído",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    icon: <CheckCircle className="w-5 h-5" />,
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

      // Fetch job_costs and job_proof for all projects
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
    return { color: "bg-amber-500", label: "Sem custos" };
  }
  if (costs.margin_percent !== null && costs.margin_percent < minMargin) {
    return { color: "bg-red-500", label: "Margem baixa" };
  }
  if (project.project_status === "in_production" || project.project_status === "completed") {
    const hasBefore = project.job_proof.some((p) => p.before_image_url);
    const hasAfter = project.job_proof.some((p) => p.after_image_url);
    if (!hasBefore || !hasAfter) {
      return { color: "bg-red-500", label: "Sem fotos" };
    }
  }
  return { color: "bg-emerald-500", label: "OK" };
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
                <Card key={status} className={cn("border-2", config.border)}>
                  <div className={cn("flex items-center justify-between px-4 py-3 border-b", config.bg)}>
                    <div className="flex items-center gap-2">
                      <span className={config.text}>{config.icon}</span>
                      <span className={cn("font-semibold", config.text)}>{config.label}</span>
                    </div>
                    <Badge variant="outline" className={cn("font-bold text-xs", config.text)}>
                      {statusProjects.length}
                    </Badge>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="p-2 space-y-2">
                      {statusProjects.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          Nenhum job
                        </div>
                      ) : (
                        statusProjects.map((project) => {
                          const indicator = getProjectIndicator(project, marginMinPercent);
                          return (
                            <div
                              key={project.id}
                              onClick={() => setSelectedProject(project)}
                              className={cn(
                                "p-3 rounded-lg border bg-card cursor-pointer transition-all",
                                "hover:shadow-md hover:border-primary/50",
                                indicator.color === "bg-red-500" && "ring-2 ring-red-300 bg-red-50/30"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-sm truncate">{project.customer_name}</p>
                                  {project.city && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3" />
                                      {project.city}
                                    </p>
                                  )}
                                </div>
                                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1", indicator.color)} title={indicator.label} />
                              </div>

                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {project.job_costs?.estimated_revenue ? (
                                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                    ${project.job_costs.estimated_revenue.toLocaleString()}
                                  </Badge>
                                ) : null}
                                {project.job_costs?.margin_percent !== null && project.job_costs?.margin_percent !== undefined ? (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      project.job_costs.margin_percent >= marginMinPercent
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                    )}
                                  >
                                    {project.job_costs.margin_percent.toFixed(1)}%
                                  </Badge>
                                ) : null}
                                <Badge variant="secondary" className="text-[10px]">
                                  {project.project_type}
                                </Badge>
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
// JOB CONTROL MODAL — 4 blocks: Costs, Margin, Proposal, Proof
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
        {/* Header */}
        <div className={cn("px-4 sm:px-6 py-4 border-b", statusConfig.bg)}>
          <DialogHeader className="pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold truncate pr-8">
                  {project.customer_name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge className={cn("px-2.5 py-0.5 text-xs font-semibold border", statusConfig.bg, statusConfig.text, statusConfig.border)}>
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">{project.project_type}</Badge>
                  {project.city && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {project.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-4 sm:p-6 space-y-4">
            {/* Block Navigator */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Button
                variant={showBlock === "costs" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2"
                onClick={() => setShowBlock(showBlock === "costs" ? null : "costs")}
              >
                <Calculator className="w-4 h-4" />
                <span className="truncate">Custos</span>
                {hasCosts ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 ml-auto flex-shrink-0" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                disabled
              >
                <DollarSign className="w-4 h-4" />
                <span className="truncate">Margem</span>
                {marginOk ? (
                  <span className="text-xs text-emerald-600 ml-auto">{currentMargin.toFixed(0)}%</span>
                ) : (
                  <span className="text-xs text-red-600 ml-auto">{currentMargin.toFixed(0)}%</span>
                )}
              </Button>

              <Button
                variant={showBlock === "proposal" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2"
                onClick={() => setShowBlock(showBlock === "proposal" ? null : "proposal")}
                disabled={!marginOk}
              >
                <FileText className="w-4 h-4" />
                <span className="truncate">Proposta</span>
                {!marginOk && <Ban className="w-3.5 h-3.5 text-red-400 ml-auto flex-shrink-0" />}
              </Button>

              <Button
                variant={showBlock === "proof" ? "default" : "outline"}
                size="sm"
                className="justify-start gap-2"
                onClick={() => setShowBlock(showBlock === "proof" ? null : "proof")}
              >
                <Camera className="w-4 h-4" />
                <span className="truncate">Fotos</span>
                {proofComplete ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-auto flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 ml-auto flex-shrink-0" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => {
                  onClose();
                  navigate(`/admin/jobs/${project.id}/documents`);
                }}
              >
                <FolderOpen className="w-4 h-4" />
                <span className="truncate">Docs</span>
              </Button>
            </div>

            {/* Margin Status Bar — Always visible */}
            <div
              className={cn(
                "p-3 rounded-lg border-2 flex items-center justify-between",
                marginOk ? "bg-emerald-50 border-emerald-400" : "bg-red-50 border-red-400"
              )}
            >
              <div className="flex items-center gap-2">
                {marginOk ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <p className={cn("text-sm font-bold", marginOk ? "text-emerald-700" : "text-red-700")}>
                    Margem: {currentMargin.toFixed(1)}%
                  </p>
                  <p className={cn("text-xs", marginOk ? "text-emerald-600" : "text-red-600")}>
                    {marginOk
                      ? `Lucro: $${(jobCost?.profit_amount ?? 0).toFixed(0)}`
                      : `Mínimo: ${marginMinPercent}% — Ajuste custos`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-sm font-bold">${(jobCost?.estimated_revenue ?? 0).toLocaleString()}</p>
              </div>
            </div>

            {/* BLOCK 1 — Custos */}
            {showBlock === "costs" && (
              <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-300">
                <h3 className="font-bold text-amber-800 text-base mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Custos do Projeto
                </h3>
                <JobCostEditor projectId={project.id} onSaved={handleCostSaved} />
              </div>
            )}

            {/* BLOCK 3 — Proposal (only if margin OK) */}
            {showBlock === "proposal" && marginOk && (
              <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-300">
                <h3 className="font-bold text-blue-800 text-base mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Proposta 3-Tiers
                </h3>
                <ProposalGenerator projectId={project.id} onClose={() => setShowBlock(null)} />
              </div>
            )}

            {/* BLOCK 4 — JobProof */}
            {showBlock === "proof" && (
              <div className="p-4 rounded-lg bg-violet-50 border-2 border-violet-300">
                <h3 className="font-bold text-violet-700 text-base mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Prova de Trabalho
                </h3>
                <JobProofUploader projectId={project.id} />
              </div>
            )}

            <Separator />

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" /> Cliente
                </p>
                <p className="font-medium text-sm">{project.customer_name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                <a href={`tel:${project.customer_phone}`} className="font-medium text-sm text-primary hover:underline">
                  {project.customer_phone}
                </a>
              </div>
              {project.address && (
                <div className="p-3 rounded-lg bg-muted/30 col-span-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> Endereço
                  </p>
                  <p className="font-medium text-sm">
                    {[project.address, project.city, project.zip_code].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
            </div>

            {project.notes && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{project.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
