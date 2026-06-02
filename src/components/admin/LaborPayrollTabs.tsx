import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Loader2, CheckCircle2, ChevronDown, ChevronRight, Download, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  `$${(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type LaborRow = {
  id: string;
  project_id: string;
  worker_name: string | null;
  pay_mode: string | null;
  daily_rate: number | null;
  days_worked: number | null;
  sqft_rate: number | null;
  sqft_worked: number | null;
  total_cost: number | null;
  work_date: string;
  status: string | null;
  is_paid: boolean | null;
  crew_member_id: string | null;
  payroll_period_id: string | null;
  notes: string | null;
  projects?: { customer_name: string | null } | null;
  profiles?: { full_name: string | null } | null;
};

function useLaborByStatus(status: "pending" | "approved") {
  return useQuery({
    queryKey: ["labor-payroll-tab", status],
    queryFn: async () => {
      let q = supabase
        .from("labor_entries")
        .select("*, projects(customer_name), profiles:crew_member_id(full_name)")
        .order("work_date", { ascending: false })
        .limit(500);
      if (status === "pending") q = q.eq("status", "pending");
      if (status === "approved")
        q = q.eq("status", "approved").is("payroll_period_id", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LaborRow[];
    },
  });
}

function groupByTech(rows: LaborRow[]) {
  const map = new Map<string, { name: string; rows: LaborRow[]; total: number }>();
  for (const r of rows) {
    const key = r.crew_member_id || r.worker_name || "unknown";
    const name = r.profiles?.full_name || r.worker_name || "Unknown";
    if (!map.has(key)) map.set(key, { name, rows: [], total: 0 });
    const g = map.get(key)!;
    g.rows.push(r);
    g.total += Number(r.total_cost || 0);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

/* ---------------- Pending Approval ---------------- */
export function PendingApprovalTab() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useLaborByStatus("pending");

  const approve = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("labor_entries")
        .update({ status: "approved" } as any)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Approved");
      qc.invalidateQueries({ queryKey: ["labor-payroll-tab"] });
      qc.invalidateQueries({ queryKey: ["labor-entries"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to approve"),
  });

  const groups = useMemo(() => groupByTech(data), [data]);
  const totalPending = data.reduce((s, r) => s + Number(r.total_cost || 0), 0);

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  if (!data.length)
    return (
      <Card className="border-border/50">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No pending labor entries
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {data.length} entries · {fmt(totalPending)} total
        </p>
      </div>
      {groups.map((g) => (
        <Card key={g.name} className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {g.rows.length} entries · {fmt(g.total)}
                </p>
              </div>
              <Button
                size="sm"
                disabled={approve.isPending}
                onClick={() => approve.mutate(g.rows.map((r) => r.id))}
              >
                Approve all ({g.rows.length})
              </Button>
            </div>
            <Separator />
            <div className="space-y-1.5">
              {g.rows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      <span className="text-muted-foreground">
                        {format(new Date(r.work_date), "MMM d")} ·
                      </span>{" "}
                      {r.projects?.customer_name ?? "—"}{" "}
                      <span className="text-muted-foreground">
                        ({r.pay_mode === "sqft"
                          ? `${r.sqft_worked} sqft @ ${fmt(Number(r.sqft_rate || 0))}`
                          : `${r.days_worked} d @ ${fmt(Number(r.daily_rate || 0))}`})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{fmt(Number(r.total_cost || 0))}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-emerald-500 hover:text-emerald-600"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate([r.id])}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Approved / Ready to Pay ---------------- */
export function ReadyToPayTab() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useLaborByStatus("approved");
  const [confirmGroup, setConfirmGroup] =
    useState<{ name: string; rows: LaborRow[]; total: number } | null>(null);

  const confirmPayroll = useMutation({
    mutationFn: async (group: { name: string; rows: LaborRow[]; total: number }) => {
      const dates = group.rows.map((r) => r.work_date).sort();
      const period_start = dates[0];
      const period_end = dates[dates.length - 1];
      const { data: period, error: pErr } = await supabase
        .from("payroll_periods")
        .insert({
          organization_id: AXO_ORG_ID,
          period_start,
          period_end,
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          total_paid: group.total,
        } as any)
        .select()
        .single();
      if (pErr) throw pErr;
      const { error: uErr } = await supabase
        .from("labor_entries")
        .update({
          status: "paid",
          payroll_period_id: (period as any).id,
        } as any)
        .in("id", group.rows.map((r) => r.id));
      if (uErr) throw uErr;
    },
    onSuccess: () => {
      toast.success("Payroll confirmed");
      setConfirmGroup(null);
      qc.invalidateQueries({ queryKey: ["labor-payroll-tab"] });
      qc.invalidateQueries({ queryKey: ["payroll-history"] });
      qc.invalidateQueries({ queryKey: ["labor-entries"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });

  const groups = useMemo(() => groupByTech(data), [data]);
  const grandTotal = data.reduce((s, r) => s + Number(r.total_cost || 0), 0);

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  if (!data.length)
    return (
      <Card className="border-border/50">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No approved entries ready to pay
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {data.length} entries · {fmt(grandTotal)} ready to pay
      </p>
      {groups.map((g) => (
        <Card key={g.name} className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {g.rows.length} entries · {fmt(g.total)}
                </p>
              </div>
              <Button size="sm" onClick={() => setConfirmGroup(g)}>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Confirm payroll
              </Button>
            </div>
            <Separator />
            <div className="space-y-1.5">
              {g.rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-1">
                  <p className="truncate">
                    <span className="text-muted-foreground">
                      {format(new Date(r.work_date), "MMM d")} ·
                    </span>{" "}
                    {r.projects?.customer_name ?? "—"}
                  </p>
                  <span className="font-semibold">{fmt(Number(r.total_cost || 0))}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!confirmGroup} onOpenChange={(o) => !o && setConfirmGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm payroll?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark {confirmGroup?.rows.length} entries for{" "}
              <strong>{confirmGroup?.name}</strong> as <strong>paid</strong> and lock them
              into a new payroll period of {fmt(confirmGroup?.total || 0)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmGroup && confirmPayroll.mutate(confirmGroup)}
            >
              {confirmPayroll.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm payroll"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------- History ---------------- */
export function PayrollHistoryTab() {
  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["payroll-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_periods")
        .select("*")
        .eq("status", "confirmed")
        .order("confirmed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [openId, setOpenId] = useState<string | null>(null);

  const { data: entries = [] } = useQuery({
    queryKey: ["payroll-entries", openId],
    queryFn: async () => {
      if (!openId) return [] as LaborRow[];
      const { data, error } = await supabase
        .from("labor_entries")
        .select("*, projects(customer_name), profiles:crew_member_id(full_name)")
        .eq("payroll_period_id", openId)
        .order("work_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LaborRow[];
    },
    enabled: !!openId,
  });

  const exportCsv = (rows: LaborRow[], periodLabel: string) => {
    const headers = ["work_date", "technician", "project", "pay_mode", "quantity", "rate", "total"];
    const lines = rows.map((r) =>
      [
        r.work_date,
        r.profiles?.full_name || r.worker_name || "",
        r.projects?.customer_name || "",
        r.pay_mode || "",
        r.pay_mode === "sqft" ? r.sqft_worked : r.days_worked,
        r.pay_mode === "sqft" ? r.sqft_rate : r.daily_rate,
        r.total_cost,
      ]
        .map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${periodLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );

  if (!periods.length)
    return (
      <Card className="border-border/50">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No confirmed payroll periods yet
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-3">
      {periods.map((p: any) => {
        const isOpen = openId === p.id;
        const label = `${p.period_start}_${p.period_end}`;
        return (
          <Card key={p.id} className="border-border/50">
            <CardContent className="p-4 space-y-2">
              <button
                className="w-full flex items-center justify-between text-left"
                onClick={() => setOpenId(isOpen ? null : p.id)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {format(new Date(p.period_start), "MMM d")} –{" "}
                      {format(new Date(p.period_end), "MMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Confirmed{" "}
                      {p.confirmed_at &&
                        format(new Date(p.confirmed_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{fmt(Number(p.total_paid || 0))}</span>
                  <Badge variant="outline" className="text-[10px]">
                    confirmed
                  </Badge>
                </div>
              </button>

              {isOpen && (
                <div className="pt-3 border-t border-border/40 space-y-2">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportCsv(entries, label)}
                      disabled={!entries.length}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export CSV
                    </Button>
                  </div>
                  {entries.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <p className="truncate">
                        <span className="text-muted-foreground">
                          {format(new Date(r.work_date), "MMM d")} ·
                        </span>{" "}
                        {r.profiles?.full_name || r.worker_name} ·{" "}
                        <span className="text-muted-foreground">
                          {r.projects?.customer_name || "—"}
                        </span>
                      </p>
                      <span className="font-semibold">
                        {fmt(Number(r.total_cost || 0))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
