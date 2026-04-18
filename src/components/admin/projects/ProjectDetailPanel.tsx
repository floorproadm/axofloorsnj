import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, User, Ruler, DollarSign, FileText, Pencil, Trash2, ExternalLink, Plus } from "lucide-react";
import { format } from "date-fns";
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
            <InlineMeasurementForm projectId={project.id} />
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
                    <p className="text-sm font-medium">{m.total_sqft} sqft</p>
                    <p className="text-xs text-muted-foreground">
                      {m.measurement_date ? format(new Date(m.measurement_date), "MMM d, yyyy") : "No date"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                </button>
              ))
            )}
          </TabsContent>

          <TabsContent value="costs" className="mt-3 space-y-4">
            {/* Materials */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Materials</p>
              <InlineMaterialForm projectId={project.id} />
              {(materials ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No materials</p>
              ) : (
                (materials ?? []).map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm">{m.description}</p>
                      <p className="text-[10px] text-muted-foreground">{m.supplier ?? "No supplier"}</p>
                    </div>
                    <span className="text-sm font-bold">{fmt(m.amount)}</span>
                  </div>
                ))
              )}
            </div>
            {/* Labor */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Labor</p>
              <InlineLaborForm projectId={project.id} />
              {(labor ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No labor entries</p>
              ) : (
                (labor ?? []).map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm">{l.worker_name}</p>
                      <p className="text-[10px] text-muted-foreground">{l.days_worked}d × ${l.daily_rate}</p>
                    </div>
                    <span className="text-sm font-bold">{fmt(l.total_cost)}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-3 space-y-2">
            <InlineInvoiceForm projectId={project.id} customerId={(project as any).customer_id ?? null} />
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
    </Sheet>
  );
}

/* ============================================================
   Inline Mini-Forms
   ============================================================ */

function InlineMeasurementForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sqft, setSqft] = useState("");
  const create = useCreateMeasurement();

  async function handleSave() {
    const result = await create.mutateAsync({
      project_id: projectId,
      measurement_date: new Date(date).toISOString(),
      status: "scheduled",
    });
    // Optionally insert a single area if sqft provided
    if (sqft && Number(sqft) > 0) {
      await supabase.from("measurement_areas").insert({
        measurement_id: result.id,
        room_name: "Main area",
        area_sqft: Number(sqft),
      });
      await supabase.from("project_measurements")
        .update({ total_sqft: Number(sqft) })
        .eq("id", result.id);
    }
    setSqft("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs gap-1"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" /> Add measurement
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-2 space-y-2">
      <div className="flex gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs flex-1" />
        <Input
          type="number"
          placeholder="sqft"
          value={sqft}
          onChange={(e) => setSqft(e.target.value)}
          className="h-8 text-xs w-20"
        />
      </div>
      <div className="flex gap-1 justify-end">
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpen(false)}>
          <X className="h-3 w-3" />
        </Button>
        <Button size="sm" className="h-7 px-3 text-xs gap-1" onClick={handleSave} disabled={create.isPending}>
          <Check className="h-3 w-3" /> Save
        </Button>
      </div>
    </div>
  );
}

function InlineMaterialForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [amount, setAmount] = useState("");
  const add = useAddMaterialCost();

  async function handleSave() {
    if (!description || !amount) {
      toast.error("Description and amount required");
      return;
    }
    await add.mutateAsync({
      project_id: projectId,
      description,
      supplier: supplier || undefined,
      amount: Number(amount),
    });
    setDescription("");
    setSupplier("");
    setAmount("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs gap-1 mb-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" /> Add material
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-2 space-y-2 mb-2">
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <Input
          placeholder="Supplier"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="h-8 text-xs flex-1"
        />
        <Input
          type="number"
          placeholder="$"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-8 text-xs w-24"
        />
      </div>
      <div className="flex gap-1 justify-end">
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpen(false)}>
          <X className="h-3 w-3" />
        </Button>
        <Button size="sm" className="h-7 px-3 text-xs gap-1" onClick={handleSave} disabled={add.isPending}>
          <Check className="h-3 w-3" /> Save
        </Button>
      </div>
    </div>
  );
}

function InlineLaborForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [worker, setWorker] = useState("");
  const [days, setDays] = useState("1");
  const [rate, setRate] = useState("");
  const add = useAddLaborEntry();

  async function handleSave() {
    if (!worker || !rate) {
      toast.error("Worker and daily rate required");
      return;
    }
    await add.mutateAsync({
      project_id: projectId,
      worker_name: worker,
      daily_rate: Number(rate),
      days_worked: Number(days) || 1,
    });
    setWorker("");
    setDays("1");
    setRate("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs gap-1 mb-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" /> Add labor
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-2 space-y-2 mb-2">
      <Input
        placeholder="Worker name"
        value={worker}
        onChange={(e) => setWorker(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Days"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="h-8 text-xs w-20"
        />
        <Input
          type="number"
          placeholder="Daily rate $"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="h-8 text-xs flex-1"
        />
      </div>
      <div className="flex gap-1 justify-end">
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpen(false)}>
          <X className="h-3 w-3" />
        </Button>
        <Button size="sm" className="h-7 px-3 text-xs gap-1" onClick={handleSave} disabled={add.isPending}>
          <Check className="h-3 w-3" /> Save
        </Button>
      </div>
    </div>
  );
}

function InlineInvoiceForm({ projectId, customerId }: { projectId: string; customerId: string | null }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const create = useCreateInvoice();
  const qc = useQueryClient();

  async function handleSave() {
    if (!description || !amount) {
      toast.error("Description and amount required");
      return;
    }
    await create.mutateAsync({
      project_id: projectId,
      customer_id: customerId,
      invoice_number: generateInvoiceNumber(),
      due_date: dueDate,
      status: "draft",
      items: [{ description, quantity: 1, unit_price: Number(amount) }],
    });
    qc.invalidateQueries({ queryKey: ["project-invoices", projectId] });
    setDescription("");
    setAmount("");
    setOpen(false);
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs gap-1"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" /> New invoice
      </Button>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-2 space-y-2">
      <Input
        placeholder="Description (line item)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 text-xs flex-1" />
        <Input
          type="number"
          placeholder="$"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-8 text-xs w-24"
        />
      </div>
      <div className="flex gap-1 justify-end">
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setOpen(false)}>
          <X className="h-3 w-3" />
        </Button>
        <Button size="sm" className="h-7 px-3 text-xs gap-1" onClick={handleSave} disabled={create.isPending}>
          <Check className="h-3 w-3" /> Save
        </Button>
      </div>
    </div>
  );
}
