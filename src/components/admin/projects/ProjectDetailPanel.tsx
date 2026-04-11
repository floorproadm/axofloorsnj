import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectKPIBar } from "./ProjectKPIBar";
import { useJobCost } from "@/hooks/useJobCosts";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useMaterialCosts } from "@/hooks/useMaterialCosts";
import { useLaborEntries } from "@/hooks/useLaborEntries";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, User, Ruler, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
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
  const { data: jobCost } = useJobCost(project?.id);
  const { data: measurements } = useMeasurements(project?.id);
  const { data: materials } = useMaterialCosts(project?.id);
  const { data: labor } = useLaborEntries(project?.id);
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

  if (!project) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4 space-y-3">
          <SheetHeader className="p-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {project.address || "No address"}
            </SheetTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" /> {project.customer_name}
              <span className="mx-1">·</span>
              <Badge variant="outline" className="text-[10px]">{project.project_type}</Badge>
            </p>
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
            {(measurements ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No measurements yet</p>
            ) : (
              (measurements ?? []).map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{m.total_sqft} sqft</p>
                    <p className="text-xs text-muted-foreground">
                      {m.measurement_date ? format(new Date(m.measurement_date), "MMM d, yyyy") : "No date"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="costs" className="mt-3 space-y-3">
            {/* Materials */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Materials</p>
              {(materials ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No materials</p>
              ) : (
                (materials ?? []).map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm">{m.description}</p>
                      <p className="text-[10px] text-muted-foreground">{m.supplier ?? "No supplier"}</p>
                    </div>
                    <span className="text-sm font-mono font-semibold">{fmt(m.amount)}</span>
                  </div>
                ))
              )}
            </div>
            {/* Labor */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Labor</p>
              {(labor ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No labor entries</p>
              ) : (
                (labor ?? []).map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm">{l.worker_name}</p>
                      <p className="text-[10px] text-muted-foreground">{l.days_worked}d × ${l.daily_rate}</p>
                    </div>
                    <span className="text-sm font-mono font-semibold">{fmt(l.total_cost)}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-3 space-y-2">
            {(invoices ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No invoices yet</p>
            ) : (
              (invoices ?? []).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {format(new Date(inv.due_date), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">{fmt(inv.total_amount ?? inv.amount)}</p>
                    <Badge variant="outline" className="text-[10px]">{inv.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
