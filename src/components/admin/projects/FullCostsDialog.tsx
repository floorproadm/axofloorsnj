import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, DollarSign, Hammer, TrendingUp } from "lucide-react";
import { JobCostEditor } from "@/components/admin/JobCostEditor";
import {
  useMaterialCosts,
  useAddMaterialCost,
  useDeleteMaterialCost,
} from "@/hooks/useMaterialCosts";
import {
  useLaborEntries,
  useAddLaborEntry,
  useDeleteLaborEntry,
} from "@/hooks/useLaborEntries";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
}

export function FullCostsDialog({ open, onOpenChange, projectId }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Costs & Margin</DialogTitle>
          <DialogDescription>Itemize materials, labor and review the job margin.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="margin">
          <TabsList className="w-full">
            <TabsTrigger value="margin" className="flex-1 gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Margin</TabsTrigger>
            <TabsTrigger value="materials" className="flex-1 gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Materials</TabsTrigger>
            <TabsTrigger value="labor" className="flex-1 gap-1.5"><Hammer className="h-3.5 w-3.5" /> Labor</TabsTrigger>
          </TabsList>

          <TabsContent value="margin" className="mt-4">
            <JobCostEditor projectId={projectId} />
          </TabsContent>

          <TabsContent value="materials" className="mt-4">
            <MaterialsSection projectId={projectId} />
          </TabsContent>

          <TabsContent value="labor" className="mt-4">
            <LaborSection projectId={projectId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ============= MATERIALS ============= */

function MaterialsSection({ projectId }: { projectId: string }) {
  const { data: materials = [] } = useMaterialCosts(projectId);
  const add = useAddMaterialCost();
  const del = useDeleteMaterialCost();

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [amount, setAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState("");

  function reset() {
    setDescription(""); setSupplier(""); setAmount("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setReceiptUrl(""); setIsPaid(false); setNotes("");
  }

  async function handleSave() {
    if (!description || !amount) {
      toast.error("Description and amount are required");
      return;
    }
    await add.mutateAsync({
      project_id: projectId,
      description,
      supplier: supplier || undefined,
      amount: Number(amount),
      purchase_date: purchaseDate,
      receipt_url: receiptUrl || undefined,
      is_paid: isPaid,
      notes: notes || undefined,
    });
    reset();
    setShowForm(false);
  }

  const total = materials.reduce((s, m) => s + Number(m.amount), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{materials.length} entries · ${total.toFixed(0)} total</p>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add material</Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Description *</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bona Traffic HD - 1 gallon" />
            </div>
            <div>
              <Label className="text-xs">Supplier</Label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Home Depot" />
            </div>
            <div>
              <Label className="text-xs">Amount ($) *</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Purchase date</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Receipt URL</Label>
              <Input value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="col-span-2 flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Switch checked={isPaid} onCheckedChange={setIsPaid} />
                <Label className="text-xs">Paid</Label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={add.isPending}>
                  {add.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {materials.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-6">No materials yet</p>
        )}
        {materials.map((m) => (
          <div key={m.id} className="flex items-start justify-between gap-2 rounded-lg border p-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{m.description}</p>
                {m.is_paid && <Badge variant="outline" className="text-[10px] h-4">Paid</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {m.supplier ?? "No supplier"} · {format(new Date(m.purchase_date), "MMM d")}
                {m.receipt_url && <> · <a href={m.receipt_url} target="_blank" rel="noreferrer" className="underline">receipt</a></>}
              </p>
              {m.notes && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{m.notes}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm font-bold">${Number(m.amount).toFixed(0)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate({ id: m.id, projectId })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============= LABOR ============= */

function LaborSection({ projectId }: { projectId: string }) {
  const { data: entries = [] } = useLaborEntries(projectId);
  const add = useAddLaborEntry();
  const del = useDeleteLaborEntry();

  const [showForm, setShowForm] = useState(false);
  const [worker, setWorker] = useState("");
  const [role, setRole] = useState("helper");
  const [days, setDays] = useState("1");
  const [rate, setRate] = useState("");
  const [workDate, setWorkDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState("");

  function reset() {
    setWorker(""); setRole("helper"); setDays("1"); setRate("");
    setWorkDate(new Date().toISOString().split("T")[0]);
    setIsPaid(false); setNotes("");
  }

  async function handleSave() {
    if (!worker || !rate) {
      toast.error("Worker name and daily rate are required");
      return;
    }
    await add.mutateAsync({
      project_id: projectId,
      worker_name: worker,
      role,
      daily_rate: Number(rate),
      days_worked: Number(days) || 1,
      work_date: workDate,
      is_paid: isPaid,
      notes: notes || undefined,
    });
    reset();
    setShowForm(false);
  }

  const total = entries.reduce((s, e) => s + Number(e.total_cost ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{entries.length} entries · ${total.toFixed(0)} total</p>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add labor</Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Worker name *</Label>
              <Input value={worker} onChange={(e) => setWorker(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="installer">Installer</SelectItem>
                  <SelectItem value="finisher">Finisher</SelectItem>
                  <SelectItem value="helper">Helper</SelectItem>
                  <SelectItem value="subcontractor">Subcontractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Days worked</Label>
              <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Daily rate ($) *</Label>
              <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Work date</Label>
              <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={isPaid} onCheckedChange={setIsPaid} />
              <Label className="text-xs mb-2.5">Paid</Label>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="col-span-2 flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={add.isPending}>
                {add.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {entries.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-6">No labor entries yet</p>
        )}
        {entries.map((l) => (
          <div key={l.id} className="flex items-start justify-between gap-2 rounded-lg border p-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{l.worker_name}</p>
                <Badge variant="outline" className="text-[10px] h-4">{l.role}</Badge>
                {l.is_paid && <Badge variant="outline" className="text-[10px] h-4">Paid</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {Number(l.days_worked)}d × ${Number(l.daily_rate)} · {format(new Date(l.work_date), "MMM d")}
              </p>
              {l.notes && <p className="text-[11px] text-muted-foreground mt-0.5 italic">{l.notes}</p>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-sm font-bold">${Number(l.total_cost ?? 0).toFixed(0)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => del.mutate({ id: l.id, projectId })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
