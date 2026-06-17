import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Scale, CheckCircle2, AlertCircle } from "lucide-react";
import { projectDisplayName } from "@/utils/projectDisplayName";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const METHODS = [
  { value: "check", label: "Check" },
  { value: "ach", label: "ACH" },
  { value: "zelle", label: "Zelle" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
];

interface ReconRow {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  project_id: string | null;
  total_amount: number;
  paid_amount: number;
  gap: number;
}

export function InvoiceReconciliation({ onOpenInvoice }: { onOpenInvoice?: (invoiceId: string) => void } = {}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [target, setTarget] = useState<ReconRow | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState("check");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["invoice-reconciliation"],
    queryFn: async () => {
      const { data: invoices, error: e1 } = await supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, project_id, projects(customer_name)")
        .eq("organization_id", AXO_ORG_ID)
        .eq("status", "paid");
      if (e1) throw e1;
      const ids = (invoices ?? []).map((i: any) => i.id);
      let paymentsByInvoice: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: pays, error: e2 } = await supabase
          .from("payments")
          .select("invoice_id, amount")
          .eq("organization_id", AXO_ORG_ID)
          .eq("status", "confirmed")
          .in("invoice_id", ids);
        if (e2) throw e2;
        (pays ?? []).forEach((p: any) => {
          if (!p.invoice_id) return;
          paymentsByInvoice[p.invoice_id] = (paymentsByInvoice[p.invoice_id] || 0) + Number(p.amount);
        });
      }
      const rows: ReconRow[] = (invoices ?? []).map((i: any) => {
        const total = Number(i.total_amount || 0);
        const paid = paymentsByInvoice[i.id] || 0;
        return {
          invoice_id: i.id,
          invoice_number: i.invoice_number,
          customer_name: i.projects?.customer_name || "—",
          project_id: i.project_id,
          total_amount: total,
          paid_amount: paid,
          gap: Math.max(0, total - paid),
        };
      });
      return rows.sort((a, b) => b.gap - a.gap);
    },
  });

  const summary = useMemo(() => {
    const rows = data ?? [];
    const billed = rows.reduce((s, r) => s + r.total_amount, 0);
    const received = rows.reduce((s, r) => s + r.paid_amount, 0);
    const toRecon = rows.reduce((s, r) => s + r.gap, 0);
    return { billed, received, toRecon };
  }, [data]);

  const openDialog = (row: ReconRow) => {
    setTarget(row);
    setAmount(row.gap.toFixed(2));
    setDate(new Date().toISOString().split("T")[0]);
    setMethod("check");
    setNotes("");
  };

  const handleSave = async () => {
    if (!target) return;
    const value = Number(amount);
    if (!value || value <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("payments").insert({
      organization_id: AXO_ORG_ID,
      invoice_id: target.invoice_id,
      project_id: target.project_id,
      category: "invoice_payment",
      amount: value,
      payment_date: date,
      payment_method: method,
      status: "confirmed",
      description: `Payment for ${target.invoice_number}`,
      notes: notes || null,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Payment recorded", description: `${fmt(value)} reconciled to ${target.invoice_number}` });
    setTarget(null);
    qc.invalidateQueries({ queryKey: ["invoice-reconciliation"] });
    qc.invalidateQueries({ queryKey: ["payments"] });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <Scale className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Invoice Reconciliation
        </h3>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Total Billed:</span>{" "}
            <span className="font-bold">{fmt(summary.billed)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Received (confirmed):</span>{" "}
            <span className="font-bold text-green-600">{fmt(summary.received)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">To Reconcile:</span>{" "}
            <span className={`font-bold ${summary.toRecon > 0 ? "text-amber-600" : "text-green-600"}`}>
              {fmt(summary.toRecon)}
            </span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No paid invoices to reconcile.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {data!.map((row) => {
            const reconciled = row.gap === 0;
            return (
              <Card
                key={row.invoice_id}
                role={onOpenInvoice ? "button" : undefined}
                tabIndex={onOpenInvoice ? 0 : undefined}
                onClick={() => onOpenInvoice?.(row.invoice_id)}
                onKeyDown={(e) => {
                  if (onOpenInvoice && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onOpenInvoice(row.invoice_id);
                  }
                }}
                className={onOpenInvoice ? "cursor-pointer transition-colors hover:bg-muted/40" : undefined}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${reconciled ? "bg-green-100 dark:bg-green-900/20" : "bg-amber-100 dark:bg-amber-900/20"}`}>
                    {reconciled ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{row.invoice_number}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.customer_name} · Billed {fmt(row.total_amount)} · Received {fmt(row.paid_amount)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    {reconciled ? (
                      <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">
                        Reconciled
                      </Badge>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Gap</p>
                          <p className="font-bold text-sm text-amber-600">{fmt(row.gap)}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openDialog(row); }}>
                          Record
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment · {target?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {target?.customer_name} · Outstanding gap: <span className="font-bold text-amber-600">{target ? fmt(target.gap) : ""}</span>
            </div>
            <div>
              <Label>Amount Received</Label>
              <Input type="number" step="0.01" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
