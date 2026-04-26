import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectKPIBar } from "./ProjectKPIBar";
import { FullMeasurementDialog } from "./FullMeasurementDialog";
import { FullCostsDialog } from "./FullCostsDialog";
import { NewInvoiceDialog } from "@/components/admin/payments/NewInvoiceDialog";
import { useJobCost } from "@/hooks/useJobCosts";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useMaterialCosts } from "@/hooks/useMaterialCosts";
import { useLaborEntries } from "@/hooks/useLaborEntries";
import { useProjectActivity, useProjectOpenTasks } from "@/hooks/useProjectActivity";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, User, Ruler, DollarSign, FileText, Pencil, Trash2, ExternalLink, Plus, LayoutDashboard, Users, MessageSquare, CheckSquare, ImageIcon, Receipt, ArrowRight, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { HubProject } from "@/hooks/useProjectsHub";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_production", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paid", label: "Paid" },
];

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
}

interface Props {
  project: HubProject | null;
  open: boolean;
  onClose: () => void;
}

export function ProjectDetailPanel({ project, open, onClose }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [measurementOpen, setMeasurementOpen] = useState(false);
  const [costsOpen, setCostsOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: jobCost } = useJobCost(project?.id);
  const { data: measurements } = useMeasurements(project?.id);
  const { data: materials } = useMaterialCosts(project?.id);
  const { data: labor } = useLaborEntries(project?.id);
  const { data: activity } = useProjectActivity(project?.id);
  const { data: openTasks } = useProjectOpenTasks(project?.id);
  const { data: invoices } = useQuery({
    queryKey: ['project-invoices', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, amount, total_amount, due_date')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!project?.id,
  });

  const totalCosts = (materials ?? []).reduce((s, m) => s + m.amount, 0) + (labor ?? []).reduce((s, l) => s + l.total_cost, 0);
  const revenue = jobCost?.estimated_revenue ?? project?.job_costs?.estimated_revenue ?? 0;

  async function handleStatusChange(status: string) {
    if (!project) return;
    await supabase.from("projects").update({ project_status: status }).eq("id", project.id);
    qc.invalidateQueries({ queryKey: ["hub-projects"] });
  }

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    setDeleting(false);
    if (error) {
      toast.error("Could not delete project", { description: error.message });
      return;
    }
    toast.success("Project deleted");
    setConfirmDelete(false);
    qc.invalidateQueries({ queryKey: ["hub-projects"] });
    onClose();
  }

  if (!project) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
          <SheetHeader className="p-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{project.address || "No address"}</span>
                </SheetTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <User className="h-3 w-3" /> {project.customer_name}
                  <span className="mx-1">·</span>
                  <Badge variant="outline" className="text-[10px]">{project.project_type}</Badge>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Open full project"
                  onClick={() => {
                    navigate(`/admin/jobs/${project.id}`);
                    onClose();
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Edit project"
                  onClick={() => {
                    navigate(`/admin/jobs/${project.id}?edit=1`);
                    onClose();
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Delete project"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <Select defaultValue={project.project_status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ProjectKPIBar estimatedRevenue={revenue} totalCost={totalCosts} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="measurements" className="p-4">
          <TabsList className="w-full">
            <TabsTrigger value="measurements" className="flex-1 text-xs gap-1">
              <Ruler className="h-3 w-3" /> Measurements
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex-1 text-xs gap-1">
              <DollarSign className="h-3 w-3" /> Costs
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex-1 text-xs gap-1">
              <FileText className="h-3 w-3" /> Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="measurements" className="mt-3 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1"
              onClick={() => setMeasurementOpen(true)}
            >
              <Plus className="h-3 w-3" /> New full measurement
            </Button>
            {(measurements ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No measurements yet</p>
            ) : (
              (measurements ?? []).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    navigate(`/admin/measurements?id=${m.id}`);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition text-left"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {m.total_sqft > 0 && `${m.total_sqft} sqft`}
                      {m.total_sqft > 0 && m.total_linear_ft > 0 && " · "}
                      {m.total_linear_ft > 0 && `${m.total_linear_ft} lf`}
                      {m.total_sqft === 0 && m.total_linear_ft === 0 && "Measurement"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.measurement_date ? format(new Date(m.measurement_date), "MMM d, yyyy") : "No date"}
                      {m.service_type && ` · ${m.service_type}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                </button>
              ))
            )}
          </TabsContent>

          <TabsContent value="costs" className="mt-3 space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1"
              onClick={() => setCostsOpen(true)}
            >
              <Plus className="h-3 w-3" /> Manage costs (materials, labor, margin)
            </Button>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Materials</p>
              {(materials ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No materials</p>
              ) : (
                (materials ?? []).slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm">{m.description}</p>
                      <p className="text-[10px] text-muted-foreground">{m.supplier ?? "No supplier"}</p>
                    </div>
                    <span className="text-sm font-bold">{fmt(m.amount)}</span>
                  </div>
                ))
              )}
              {(materials?.length ?? 0) > 5 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">+{(materials?.length ?? 0) - 5} more</p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Labor</p>
              {(labor ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-1">No labor entries</p>
              ) : (
                (labor ?? []).slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm">{l.worker_name}</p>
                      <p className="text-[10px] text-muted-foreground">{l.days_worked}d × ${l.daily_rate}</p>
                    </div>
                    <span className="text-sm font-bold">{fmt(l.total_cost)}</span>
                  </div>
                ))
              )}
              {(labor?.length ?? 0) > 5 && (
                <p className="text-[10px] text-muted-foreground text-center pt-1">+{(labor?.length ?? 0) - 5} more</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-3 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1"
              onClick={() => setInvoiceOpen(true)}
            >
              <Plus className="h-3 w-3" /> New full invoice
            </Button>
            {(invoices ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No invoices yet</p>
            ) : (
              (invoices ?? []).map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => {
                    navigate(`/admin/payments?invoice=${inv.id}`);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition text-left"
                >
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {format(new Date(inv.due_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{fmt(inv.total_amount ?? inv.amount)}</p>
                    <Badge variant="outline" className="text-[10px]">{inv.status}</Badge>
                  </div>
                </button>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{project.address || project.customer_name}</strong> will be permanently removed.
              Linked costs, measurements, invoices and chat history may also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FullMeasurementDialog
        open={measurementOpen}
        onOpenChange={setMeasurementOpen}
        projectId={project.id}
      />
      <FullCostsDialog
        open={costsOpen}
        onOpenChange={setCostsOpen}
        projectId={project.id}
      />
      <NewInvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        defaultProjectId={project.id}
      />
    </Sheet>
  );
}
