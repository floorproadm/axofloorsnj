import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle, Send, XCircle, Trash2, Edit3, Plus,
  Printer, Share2, Mail, Link2, Copy, Check, Loader2, X, Calendar
} from "lucide-react";
import { Invoice, InvoiceItem, InvoicePaymentPhase, useInvoiceItems, useInvoicePaymentSchedule, useUpdateInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  draft:     { label: "Draft",     variant: "secondary",    color: "text-muted-foreground" },
  sent:      { label: "Sent",      variant: "default",      color: "text-primary" },
  paid:      { label: "Paid",      variant: "outline",      color: "text-primary" },
  overdue:   { label: "Overdue",   variant: "destructive",  color: "text-destructive" },
  cancelled: { label: "Cancelled", variant: "secondary",    color: "text-muted-foreground" },
};

const ACCEPTED_METHODS = ["Check", "ACH / Wire", "Cash", "Zelle"];

const fmt = (v: number) => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Edit items inline ─────────────────────────────────────────────────────────
function EditItemsPanel({ invoice, items, onDone }: { invoice: Invoice; items: InvoiceItem[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [localItems, setLocalItems] = useState(items.map(i => ({ ...i })));
  const [saving, setSaving] = useState(false);

  const addRow = () => setLocalItems(prev => [...prev, { id: `new-${Date.now()}`, invoice_id: invoice.id, description: "", detail: null, quantity: 1, unit_price: 0, amount: 0, created_at: "" }]);
  const removeRow = (idx: number) => setLocalItems(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: string, value: any) => {
    setLocalItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const total = localItems.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: delErr } = await supabase.from("invoice_items").delete().eq("invoice_id", invoice.id);
      if (delErr) throw delErr;

      const validItems = localItems.filter(i => i.description && Number(i.unit_price) > 0);
      if (validItems.length > 0) {
        const { error: insErr } = await supabase.from("invoice_items").insert(
          validItems.map(i => ({
            invoice_id: invoice.id,
            description: i.description,
            detail: i.detail || null,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
          }))
        );
        if (insErr) throw insErr;
      }

      await supabase.from("invoices").update({ amount: total }).eq("id", invoice.id);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice_items", invoice.id] });
      toast.success("Invoice updated");
      onDone();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Edit Line Items</p>
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={addRow}>
          <Plus className="w-3.5 h-3.5" /> Add Item
        </Button>
      </div>
      <div className="space-y-2">
        {localItems.map((item, idx) => (
          <div key={item.id} className="space-y-1">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                {idx === 0 && <Label className="text-[10px] text-muted-foreground">Description</Label>}
                <Input className="h-8 text-xs" placeholder="Service..." value={item.description} onChange={e => updateRow(idx, "description", e.target.value)} />
              </div>
              <div className="w-14">
                {idx === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                <Input className="h-8 text-xs" type="number" min={1} value={item.quantity} onChange={e => updateRow(idx, "quantity", e.target.value)} />
              </div>
              <div className="w-20">
                {idx === 0 && <Label className="text-[10px] text-muted-foreground">Price</Label>}
                <Input className="h-8 text-xs" type="number" min={0} step={0.01} value={item.unit_price} onChange={e => updateRow(idx, "unit_price", e.target.value)} />
              </div>
              <div className="w-20 text-right pb-1">
                {idx === 0 && <Label className="text-[10px] text-muted-foreground">Total</Label>}
                <p className="text-xs font-medium h-8 flex items-center justify-end">{fmt(Number(item.quantity) * Number(item.unit_price))}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeRow(idx)} disabled={localItems.length === 1}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Input className="h-7 text-[11px]" placeholder="Detail / specs (optional)" value={item.detail || ""} onChange={e => updateRow(idx, "detail", e.target.value)} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-base font-bold">{fmt(total)}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onDone}>Cancel</Button>
        <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ── Public Link Modal ────────────────────────────────────────────────────────
function PublicLinkModal({ invoice, open, onClose }: { invoice: Invoice; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareToken = btoa(`inv-${invoice.id}`).replace(/=/g, "").slice(0, 16);
  const publicUrl = `${window.location.origin}/invoice/${shareToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleWhatsApp = () => {
    const text = `Hi! Please find your invoice ${invoice.invoice_number} here: ${publicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = `Invoice ${invoice.invoice_number} from AXO Floors NJ`;
    const body = `Hi,\n\nPlease find your invoice attached below:\n${publicUrl}\n\nTotal: ${fmt(Number(invoice.total_amount || 0))}\nDue: ${format(new Date(invoice.due_date), "MMMM d, yyyy")}\n\nThank you for your business!\nAXO Floors NJ`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Share Invoice
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Public Link</p>
            <p className="text-xs text-foreground font-mono break-all">{publicUrl}</p>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2 text-sm" onClick={handleWhatsApp}>💬 WhatsApp</Button>
            <Button variant="outline" className="gap-2 text-sm" onClick={handleEmail}><Mail className="w-4 h-4" /> Email</Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Anyone with this link can view the invoice</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Professional Print ───────────────────────────────────────────────────────
function printInvoice(invoice: Invoice, items: InvoiceItem[], phases: InvoicePaymentPhase[]) {
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0);
  const taxAmount = Number(invoice.tax_amount) || 0;
  const discountAmount = Number(invoice.discount_amount) || 0;
  const depositAmount = Number(invoice.deposit_amount) || 0;
  const total = Number(invoice.total_amount) || subtotal + taxAmount - discountAmount;
  const balanceDue = total - depositAmount;
  const hasDetail = items.some(i => i.detail);

  const html = `<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;max-width:760px;margin:0 auto}
.header{background:#0f172a;color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:center;border-radius:0 0 12px 12px}
.brand{font-size:24px;font-weight:800;letter-spacing:-0.5px}
.brand span{color:#d97706}
.tag{font-size:10px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px}
.inv-number{font-size:16px;font-weight:700;text-align:right}
.status-badge{display:inline-block;padding:3px 10px;border-radius:16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:4px}
.status-draft{background:#334155;color:#94a3b8}
.status-sent{background:#1e3a5f;color:#60a5fa}
.status-paid{background:#064e3b;color:#6ee7b7}
.status-overdue{background:#7f1d1d;color:#fca5a5}
.status-cancelled{background:#334155;color:#94a3b8}
.bill-strip{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;padding:20px 32px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
.bill-strip .label{font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:#94a3b8;margin-bottom:2px}
.bill-strip .value{font-size:13px;font-weight:600;color:#1e293b}
.content{padding:24px 32px}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
th{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#64748b;padding:8px 0;border-bottom:2px solid #e2e8f0;text-align:left}
th:nth-child(n+${hasDetail ? 3 : 2}){text-align:right}
td{padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
td:nth-child(n+${hasDetail ? 3 : 2}){text-align:right}
.detail-cell{font-size:11px;color:#64748b;font-style:italic}
.totals-box{margin-left:auto;width:260px;background:#f8fafc;border-radius:8px;padding:16px;border:1px solid #e2e8f0}
.totals-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#475569}
.totals-row.grand{border-top:2px solid #1e293b;padding-top:10px;margin-top:6px;font-weight:800;font-size:18px;color:#0f172a}
.totals-row.deposit{color:#059669}
.totals-row.balance{font-weight:800;font-size:16px;color:#0f172a}
.schedule{display:grid;grid-template-columns:repeat(${phases.length || 3},1fr);gap:12px;margin:20px 0}
.phase-card{border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}
.phase-card .phase-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b}
.phase-card .phase-pct{font-size:20px;font-weight:800;color:#0f172a;margin:4px 0}
.phase-card .phase-amount{font-size:12px;color:#64748b}
.phase-card .phase-timing{font-size:10px;color:#94a3b8;margin-top:4px}
.methods{display:flex;gap:8px;margin:16px 0;flex-wrap:wrap}
.method-pill{padding:4px 12px;border-radius:16px;font-size:11px;font-weight:600;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
.notes-box{margin:16px 0;padding:14px;background:#fffbeb;border-radius:8px;font-size:12px;color:#92400e;border:1px solid #fde68a}
.footer{text-align:center;padding:20px 32px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;margin-top:16px}
@media print{body{margin:0}@page{margin:12mm}}
</style></head><body>
<div class="header">
  <div><div class="brand">AXO <span>Floors</span> NJ</div><div class="tag">Hardwood · Refinishing · Installation</div></div>
  <div class="inv-number">${invoice.invoice_number}<br><span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></div>
</div>

<div class="bill-strip">
  <div><div class="label">Bill To</div><div class="value">${invoice.projects?.customer_name || "—"}</div>${invoice.customers?.email ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${invoice.customers.email}</div>` : ""}${invoice.customers?.phone ? `<div style="font-size:11px;color:#64748b">${invoice.customers.phone}</div>` : ""}</div>
  <div><div class="label">Project</div><div class="value">${invoice.projects?.project_type || "—"}</div>${invoice.projects?.address ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${invoice.projects.address}</div>` : ""}</div>
  <div><div class="label">Invoice Date</div><div class="value">${format(new Date(invoice.created_at), "MMMM d, yyyy")}</div><div class="label" style="margin-top:8px">Due Date</div><div class="value">${format(new Date(invoice.due_date), "MMMM d, yyyy")}</div></div>
</div>

<div class="content">
<table>
  <thead><tr><th>Description</th>${hasDetail ? "<th>Detail</th>" : ""}<th style='text-align:right;width:50px'>Qty</th><th style='text-align:right;width:80px'>Unit Price</th><th style='text-align:right;width:90px'>Total</th></tr></thead>
  <tbody>${items.map(i => `<tr><td>${i.description}</td>${hasDetail ? `<td class="detail-cell">${i.detail || ""}</td>` : ""}<td style='text-align:right'>${i.quantity}</td><td style='text-align:right'>${fmt(Number(i.unit_price))}</td><td style='text-align:right;font-weight:600'>${fmt(Number(i.quantity) * Number(i.unit_price))}</td></tr>`).join("")}</tbody>
</table>

<div class="totals-box">
  <div class="totals-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
  ${taxAmount > 0 ? `<div class="totals-row"><span>Tax</span><span>${fmt(taxAmount)}</span></div>` : ""}
  ${discountAmount > 0 ? `<div class="totals-row"><span>Discount</span><span>-${fmt(discountAmount)}</span></div>` : ""}
  <div class="totals-row grand"><span>Total</span><span>${fmt(total)}</span></div>
  ${depositAmount > 0 ? `<div class="totals-row deposit"><span>Deposit Paid</span><span>-${fmt(depositAmount)}</span></div><div class="totals-row balance"><span>Balance Due</span><span>${fmt(balanceDue)}</span></div>` : ""}
</div>

${phases.length > 0 ? `<h4 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:24px;margin-bottom:8px">Payment Schedule</h4><div class="schedule">${phases.map(p => `<div class="phase-card"><div class="phase-label">${p.phase_label}</div><div class="phase-pct">${p.percentage}%</div><div class="phase-amount">${fmt(total * p.percentage / 100)}</div><div class="phase-timing">${p.timing}</div></div>`).join("")}</div>` : ""}

<h4 style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-top:16px;margin-bottom:6px">Accepted Payment Methods</h4>
<div class="methods">${ACCEPTED_METHODS.map(m => `<span class="method-pill">${m}</span>`).join("")}</div>

${invoice.notes ? `<div class="notes-box"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}
</div>

<div class="footer">AXO Floors NJ · (732) 351-8653 · axofloorsnj.com · NJ Licensed & Insured<br>13A License # 13VH13302100</div>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }
}

// ── Main Sheet ────────────────────────────────────────────────────────────────
export function InvoiceDetailsSheet({ invoice, open, onOpenChange }: Props) {
  const { data: items = [] } = useInvoiceItems(invoice?.id ?? null);
  const { data: phases = [] } = useInvoicePaymentSchedule(invoice?.id ?? null);
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [editing, setEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  if (!invoice) return null;

  const sc = statusConfig[invoice.status] || statusConfig.draft;
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0);
  const taxAmount = Number(invoice.tax_amount) || 0;
  const discountAmount = Number(invoice.discount_amount) || 0;
  const depositAmount = Number(invoice.deposit_amount) || 0;
  const total = Number(invoice.total_amount) || subtotal + taxAmount - discountAmount;
  const balanceDue = total - depositAmount;
  const hasItems = items.length > 0;

  const handleMarkPaid = () => updateStatus.mutate({ id: invoice.id, status: "paid", payment_method: paymentMethod || undefined });
  const handleSend    = () => updateStatus.mutate({ id: invoice.id, status: "sent" });
  const handleCancel  = () => updateStatus.mutate({ id: invoice.id, status: "cancelled" });
  const handleDelete  = () => deleteInvoice.mutate(invoice.id, { onSuccess: () => onOpenChange(false) });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span>{invoice.invoice_number}</span>
              <Badge variant={sc.variant}>{sc.label}</Badge>
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-5">
            {/* Action buttons row */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 flex-1 text-xs" onClick={() => printInvoice(invoice, items, phases)}>
                <Printer className="w-3.5 h-3.5" /> Print / PDF
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 flex-1 text-xs" onClick={() => setShowShareModal(true)}>
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                <Button size="sm" variant="outline" className="gap-1.5 text-xs px-3" onClick={() => setEditing(e => !e)}>
                  <Edit3 className="w-3.5 h-3.5" /> {editing ? "Done" : "Edit"}
                </Button>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 text-sm p-4 rounded-xl bg-muted/30 border border-border/50">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Client</p>
                <p className="font-semibold mt-0.5">{invoice.projects?.customer_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Service</p>
                <p className="font-semibold mt-0.5">{invoice.projects?.project_type || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Due Date</p>
                <p className="font-semibold mt-0.5">{format(new Date(invoice.due_date), "MMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{depositAmount > 0 ? "Balance Due" : "Total"}</p>
                <p className="text-xl font-bold mt-0.5">{fmt(depositAmount > 0 ? balanceDue : total)}</p>
              </div>
              {invoice.customers?.email && (
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p>
                  <p className="font-medium mt-0.5 text-xs">{invoice.customers.email}</p>
                </div>
              )}
              {invoice.paid_at && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid on</p>
                  <p className="font-semibold mt-0.5 text-primary">{format(new Date(invoice.paid_at), "MMM dd, yyyy")}</p>
                </div>
              )}
              {invoice.payment_method && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Method</p>
                  <p className="font-semibold mt-0.5 capitalize">{invoice.payment_method.replace("_", " ")}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Items / Edit */}
            {editing ? (
              <EditItemsPanel invoice={invoice} items={items} onDone={() => setEditing(false)} />
            ) : (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Line Items</h4>
                {!hasItems ? (
                  <p className="text-sm text-muted-foreground py-2">No items</p>
                ) : (
                  <>
                    <div className="grid grid-cols-[1fr_40px_72px_72px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground pb-1 border-b border-border/50">
                      <span>Description</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Price</span>
                      <span className="text-right">Total</span>
                    </div>
                    <div className="divide-y divide-border/30">
                      {items.map(item => (
                        <div key={item.id} className="py-2.5">
                          <div className="grid grid-cols-[1fr_40px_72px_72px] gap-2 text-sm">
                            <span className="font-medium">{item.description}</span>
                            <span className="text-right text-muted-foreground">{item.quantity}</span>
                            <span className="text-right text-muted-foreground">{fmt(Number(item.unit_price))}</span>
                            <span className="text-right font-semibold">{fmt(Number(item.quantity) * Number(item.unit_price))}</span>
                          </div>
                          {item.detail && (
                            <p className="text-[11px] text-muted-foreground italic mt-0.5">{item.detail}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Totals */}
                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span><span>{fmt(subtotal)}</span>
                      </div>
                      {taxAmount > 0 && (
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Tax</span><span>{fmt(taxAmount)}</span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-accent-foreground">
                          <span>Discount</span><span>-{fmt(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold pt-1 border-t border-border/50">
                        <span>Total</span>
                        <span>{fmt(total)}</span>
                      </div>
                      {depositAmount > 0 && (
                        <>
                          <div className="flex justify-between text-sm text-primary">
                            <span>Deposit Paid</span><span>-{fmt(depositAmount)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>Balance Due</span><span>{fmt(balanceDue)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Payment Schedule */}
            {phases.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Payment Schedule
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {phases.map(phase => (
                      <div key={phase.id} className="border border-border/50 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{phase.phase_label}</p>
                        <p className="text-xl font-bold mt-1">{phase.percentage}%</p>
                        <p className="text-xs text-muted-foreground">{fmt(total * phase.percentage / 100)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{phase.timing}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Accepted Methods */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Accepted Payment Methods</h4>
              <div className="flex gap-2 flex-wrap">
                {ACCEPTED_METHODS.map(m => (
                  <span key={m} className="px-3 py-1 rounded-full text-xs font-medium bg-muted border border-border/50 text-muted-foreground">{m}</span>
                ))}
              </div>
            </div>

            {invoice.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Notes</h4>
                  <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</h4>

                {invoice.status === "draft" && (
                  <Button className="w-full gap-2" onClick={handleSend}>
                    <Send className="w-4 h-4" /> Mark as Sent
                  </Button>
                )}

                {(invoice.status === "sent" || invoice.status === "overdue") && (
                  <div className="space-y-2">
                    <Label className="text-xs">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="zelle">Zelle</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer (ACH/Wire)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="w-full gap-2" onClick={handleMarkPaid}>
                      <CheckCircle className="w-4 h-4" /> Mark as Paid
                    </Button>
                  </div>
                )}

                <Button className="w-full gap-2" variant="outline" onClick={handleCancel}>
                  <XCircle className="w-4 h-4" /> Cancel Invoice
                </Button>
              </div>
            )}

            {invoice.status === "draft" && (
              <Button className="w-full gap-2" variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> Delete Invoice
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <PublicLinkModal invoice={invoice} open={showShareModal} onClose={() => setShowShareModal(false)} />
    </>
  );
}
