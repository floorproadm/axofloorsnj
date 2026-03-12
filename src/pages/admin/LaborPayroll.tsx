import { useState } from "react";
import { AXO_ORG_ID } from "@/lib/constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Plus, Hammer, DollarSign, Calendar, Users,
  CheckCircle2, Clock, Trash2, Loader2, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ROLES = [
  "Sanding & Refinishing", "Hardwood Installation", "Vinyl/LVP",
  "Laminate", "Tile", "Demolition", "Trim & Molding", "Other"
];

const EMPLOYMENT_TYPES = ["Head", "Full-Time Employee", "Daily Rate", "Subcontractor"];

interface PayrollEntry {
  id: string;
  collaborator_id: string | null;
  amount: number;
  category: string;
  payment_date: string;
  description: string | null;
  notes: string | null;
  status: string;
  payment_method: string | null;
  project_id: string | null;
  project?: { customer_name: string; project_type: string } | null;
}

interface NewPayrollForm {
  name: string;
  role: string;
  daily_rate: string;
  days_worked: string;
  service_date: string;
  project_id: string;
  notes: string;
  payment_method: string;
}

export default function LaborPayroll() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [filterRole, setFilterRole] = useState("all");
  const [form, setForm] = useState<NewPayrollForm>({
    name: "", role: "", daily_rate: "", days_worked: "1",
    service_date: format(new Date(), "yyyy-MM-dd"),
    project_id: "", notes: "", payment_method: "cash"
  });

  const baseDate = subMonths(new Date(), monthOffset);
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);
  const monthLabel = format(baseDate, "MMMM yyyy");

  // Fetch labor payments (category = "labor")
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["labor-payroll", monthOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, project:projects(customer_name, project_type)")
        .eq("category", "labor")
        .gte("payment_date", format(monthStart, "yyyy-MM-dd"))
        .lte("payment_date", format(monthEnd, "yyyy-MM-dd"))
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayrollEntry[];
    },
  });

  // Fetch projects for select
  const { data: projects = [] } = useQuery({
    queryKey: ["active-projects-payroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, project_type")
        .in("project_status", ["pending", "in_production"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalPaid = entries.filter(e => e.status === "confirmed").reduce((s, e) => s + e.amount, 0);
  const totalPending = entries.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const totalCost = entries.reduce((s, e) => s + e.amount, 0);

  const addMutation = useMutation({
    mutationFn: async () => {
      const dailyRate = parseFloat(form.daily_rate);
      const daysWorked = parseFloat(form.days_worked);
      const total = dailyRate * daysWorked;

      const { error } = await supabase.from("payments").insert({
        amount: total,
        category: "labor",
        description: `${form.name} – ${form.role} (${form.days_worked} days @ ${fmt(dailyRate)}/day)`,
        payment_date: form.service_date,
        project_id: form.project_id || null,
        notes: form.notes || null,
        payment_method: form.payment_method,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Labor entry added");
      qc.invalidateQueries({ queryKey: ["labor-payroll"] });
      setShowNew(false);
      setForm({ name: "", role: "", daily_rate: "", days_worked: "1", service_date: format(new Date(), "yyyy-MM-dd"), project_id: "", notes: "", payment_method: "cash" });
    },
    onError: () => toast.error("Failed to add entry"),
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").update({ status: "confirmed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Payment confirmed"); qc.invalidateQueries({ queryKey: ["labor-payroll"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Entry removed"); qc.invalidateQueries({ queryKey: ["labor-payroll"] }); },
  });

  const totalCost_calc = parseFloat(form.daily_rate || "0") * parseFloat(form.days_worked || "0");

  return (
    <AdminLayout title="Labor Payroll">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Labor Payroll</h1>
              <p className="text-xs text-muted-foreground">Track worker payments by job</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonthOffset(m => m + 1)}>‹</Button>
          <span className="text-sm font-medium min-w-[120px] text-center">{monthLabel}</span>
          <Button variant="outline" size="sm" disabled={monthOffset === 0} onClick={() => setMonthOffset(m => m - 1)}>›</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Labor", value: fmt(totalCost), color: "text-foreground", icon: DollarSign },
            { label: "Confirmed", value: fmt(totalPaid), color: "text-emerald-500", icon: CheckCircle2 },
            { label: "Pending", value: fmt(totalPending), color: "text-amber-500", icon: Clock },
          ].map((c) => (
            <Card key={c.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</span>
                  <c.icon className={cn("w-3.5 h-3.5", c.color)} />
                </div>
                <p className={cn("text-xl font-bold", c.color)}>{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Entries List */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Entries — {entries.length} records
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No labor payments this month
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        entry.status === "confirmed" ? "bg-emerald-500" : "bg-amber-500"
                      )} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{entry.description ?? "—"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{format(new Date(entry.payment_date), "MMM d")}</span>
                          {entry.project && (
                            <span className="text-xs text-muted-foreground">· {entry.project.customer_name}</span>
                          )}
                          {entry.payment_method && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">{entry.payment_method}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold">{fmt(entry.amount)}</span>
                      {entry.status === "pending" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => confirmMutation.mutate(entry.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMutation.mutate(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hammer className="w-4 h-4" /> New Labor Entry
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Worker Name *</Label>
                <Input placeholder="e.g. Carlos" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["cash", "check", "zelle", "wire"].map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Daily Rate ($) *</Label>
                <Input type="number" placeholder="250" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Days Worked *</Label>
                <Input type="number" min="0.5" step="0.5" value={form.days_worked} onChange={e => setForm(f => ({ ...f, days_worked: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Service Date</Label>
                <Input type="date" value={form.service_date} onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Project (optional)</Label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Link to job" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— None —</SelectItem>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.customer_name} · {p.project_type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Optional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            {/* Total preview */}
            {totalCost_calc > 0 && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total to pay</span>
                <span className="text-lg font-bold text-primary">{fmt(totalCost_calc)}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!form.name || !form.role || !form.daily_rate || addMutation.isPending}
                onClick={() => addMutation.mutate()}
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Entry"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
