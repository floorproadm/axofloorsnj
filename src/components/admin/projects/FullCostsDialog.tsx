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
  useMarkLaborPaid,
  type LaborEntry,
} from "@/hooks/useLaborEntries";
import { useCrewMembers } from "@/hooks/useCrewMembers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Users, CheckCircle2 } from "lucide-react";
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

export function MaterialsSection({ projectId }: { projectId: string }) {
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

/* ============= LABOR (Crew Relation) ============= */

interface CrewBucket {
  key: string;
  crewMemberId: string | null;
  name: string;
  role: string;
  avatarUrl?: string | null;
  entries: LaborEntry[];
  totalDays: number;
  totalCost: number;
  unpaidCost: number;
  paidCost: number;
  lastDate: string | null;
}

export function LaborSection({ projectId }: { projectId: string }) {
  const { data: entries = [] } = useLaborEntries(projectId);
  const { data: crew = [] } = useCrewMembers(true);
  const add = useAddLaborEntry();
  const del = useDeleteLaborEntry();
  const markPaid = useMarkLaborPaid();

  const [showForm, setShowForm] = useState(false);
  const [crewMemberId, setCrewMemberId] = useState<string>("");
  const [worker, setWorker] = useState("");
  const [role, setRole] = useState("helper");
  const [days, setDays] = useState("1");
  const [rate, setRate] = useState("");
  const [workDate, setWorkDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPaid, setIsPaid] = useState(false);
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function reset() {
    setCrewMemberId(""); setWorker(""); setRole("helper"); setDays("1"); setRate("");
    setWorkDate(new Date().toISOString().split("T")[0]);
    setIsPaid(false); setNotes("");
  }

  function selectCrewMember(id: string) {
    setCrewMemberId(id);
    const m = crew.find((c) => c.id === id);
    if (!m) return;
    setWorker(m.full_name);
    // Always autofill from profile, even if 0/empty (lets user see what's on file)
    setRate(m.daily_rate != null ? String(m.daily_rate) : "");
    setRole(m.role || "helper");
    const missing: string[] = [];
    if (!m.daily_rate) missing.push("daily rate");
    if (!m.role) missing.push("role");
    if (missing.length) {
      toast.info(`${m.full_name}'s profile has no ${missing.join(" or ")} on file — fill in manually or update the crew profile.`);
    }
  }

  async function handleSave() {
    if (!worker || !rate) {
      toast.error("Select a crew member and set a daily rate");
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
      crew_member_id: crewMemberId || null,
    });
    reset();
    setShowForm(false);
  }

  // Aggregate by crew member (or worker_name fallback)
  const buckets: CrewBucket[] = (() => {
    const map = new Map<string, CrewBucket>();
    for (const e of entries) {
      const key = e.crew_member_id || `name:${e.worker_name}`;
      const member = e.crew_member_id ? crew.find((c) => c.id === e.crew_member_id) : null;
      const existing = map.get(key) ?? {
        key,
        crewMemberId: e.crew_member_id,
        name: member?.full_name || e.worker_name,
        role: e.role,
        avatarUrl: member?.avatar_url,
        entries: [],
        totalDays: 0,
        totalCost: 0,
        unpaidCost: 0,
        paidCost: 0,
        lastDate: null,
      };
      existing.entries.push(e);
      existing.totalDays += Number(e.days_worked ?? 0);
      const cost = Number(e.total_cost ?? 0);
      existing.totalCost += cost;
      if (e.is_paid) existing.paidCost += cost;
      else existing.unpaidCost += cost;
      if (!existing.lastDate || e.work_date > existing.lastDate) existing.lastDate = e.work_date;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.totalCost - a.totalCost);
  })();

  const totalCost = entries.reduce((s, e) => s + Number(e.total_cost ?? 0), 0);
  const totalDays = entries.reduce((s, e) => s + Number(e.days_worked ?? 0), 0);
  const unpaidTotal = entries.filter((e) => !e.is_paid).reduce((s, e) => s + Number(e.total_cost ?? 0), 0);

  async function markBucketPaid(bucket: CrewBucket) {
    const ids = bucket.entries.filter((e) => !e.is_paid).map((e) => e.id);
    if (!ids.length) return;
    await markPaid.mutateAsync({ ids, paid: true });
    toast.success(`Marked ${ids.length} entries as paid`);
  }

  return (
    <div className="space-y-3">
      {/* Header summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Workers</p>
          <p className="text-lg font-bold tabular-nums">{buckets.length}</p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Days</p>
          <p className="text-lg font-bold tabular-nums">{totalDays.toFixed(0)}</p>
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total · Unpaid</p>
          <p className="text-lg font-bold tabular-nums">
            ${totalCost.toFixed(0)}
            {unpaidTotal > 0 && <span className="text-xs text-amber-500 ml-1">· ${unpaidTotal.toFixed(0)}</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {entries.length} entries across the crew
        </p>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Log day
          </Button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Crew member *</Label>
              <Select value={crewMemberId} onValueChange={selectCrewMember}>
                <SelectTrigger><SelectValue placeholder="Select crew member..." /></SelectTrigger>
                <SelectContent>
                  {crew.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name} {c.daily_rate ? `· $${c.daily_rate}/d` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!crewMemberId && (
                <Input
                  className="mt-2"
                  value={worker}
                  onChange={(e) => setWorker(e.target.value)}
                  placeholder="Or type a name (one-off subcontractor)"
                />
              )}
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

      {/* Per-worker aggregated cards */}
      <div className="space-y-1.5">
        {buckets.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-6">No labor logged yet</p>
        )}
        {buckets.map((b) => {
          const isOpen = !!expanded[b.key];
          return (
            <Collapsible
              key={b.key}
              open={isOpen}
              onOpenChange={(o) => setExpanded((s) => ({ ...s, [b.key]: o }))}
            >
              <div className="rounded-lg border bg-card">
                <CollapsibleTrigger className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/40 transition-colors text-left">
                  <Avatar className="h-9 w-9">
                    {b.avatarUrl && <AvatarImage src={b.avatarUrl} />}
                    <AvatarFallback className="text-xs">
                      {b.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <Badge variant="outline" className="text-[10px] h-4">{b.role}</Badge>
                      {!b.crewMemberId && (
                        <Badge variant="outline" className="text-[10px] h-4">Off-roster</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {b.totalDays.toFixed(0)}d · {b.entries.length} {b.entries.length === 1 ? "entry" : "entries"}
                      {b.lastDate && ` · last ${format(new Date(b.lastDate), "MMM d")}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums">${b.totalCost.toFixed(0)}</p>
                    {b.unpaidCost > 0 ? (
                      <p className="text-[11px] text-amber-500 tabular-nums">${b.unpaidCost.toFixed(0)} unpaid</p>
                    ) : (
                      <p className="text-[11px] text-emerald-500">Paid in full</p>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t px-2.5 py-2 space-y-1">
                    {b.unpaidCost > 0 && (
                      <div className="flex justify-end pb-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1.5"
                          onClick={() => markBucketPaid(b)}
                          disabled={markPaid.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark unpaid as paid
                        </Button>
                      </div>
                    )}
                    {b.entries.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] tabular-nums">
                            {format(new Date(l.work_date), "MMM d, yyyy")} · {Number(l.days_worked)}d × ${Number(l.daily_rate)}
                            {l.is_paid && <span className="ml-2 text-emerald-500">· paid</span>}
                          </p>
                          {l.notes && <p className="text-[11px] text-muted-foreground italic truncate">{l.notes}</p>}
                        </div>
                        <span className="text-xs font-semibold tabular-nums">${Number(l.total_cost ?? 0).toFixed(0)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => del.mutate({ id: l.id, projectId })}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
