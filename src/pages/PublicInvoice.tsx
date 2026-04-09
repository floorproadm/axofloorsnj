import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, FileText, CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

const ACCEPTED_METHODS = ["Check", "ACH / Wire", "Cash", "Zelle"];

const fmt = (v: number) =>
  `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusStyle: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  draft:     { label: "Draft",     bg: "bg-muted",        text: "text-muted-foreground", icon: FileText },
  sent:      { label: "Sent",      bg: "bg-blue-100",     text: "text-blue-700",         icon: Clock },
  paid:      { label: "Paid",      bg: "bg-green-100",    text: "text-green-700",        icon: CheckCircle },
  overdue:   { label: "Overdue",   bg: "bg-red-100",      text: "text-red-700",          icon: AlertTriangle },
  cancelled: { label: "Cancelled", bg: "bg-muted",        text: "text-muted-foreground", icon: XCircle },
};

export default function PublicInvoice() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: inv, error: invErr } = await supabase
          .from("invoices")
          .select("*, projects(customer_name, project_type, address), customers(full_name, email, phone)")
          .eq("share_token", token)
          .maybeSingle();
        if (invErr) throw invErr;
        if (!inv) { setError("Invoice not found"); setLoading(false); return; }
        setInvoice(inv);

        // Mark as viewed
        if (!inv.viewed_at) {
          await supabase.from("invoices").update({ viewed_at: new Date().toISOString() } as any).eq("share_token", token);
        }

        const [itemsRes, phasesRes] = await Promise.all([
          supabase.from("invoice_items").select("*").eq("invoice_id", inv.id).order("created_at"),
          supabase.from("invoice_payment_schedule").select("*").eq("invoice_id", inv.id).order("phase_order"),
        ]);
        setItems(itemsRes.data || []);
        setPhases(phasesRes.data || []);
      } catch (e: any) {
        setError(e.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-lg font-semibold text-slate-700">Invoice Not Found</p>
          <p className="text-sm text-slate-500 mt-1">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((s: number, i: any) => s + (Number(i.quantity) * Number(i.unit_price)), 0);
  const taxAmount = Number(invoice.tax_amount) || 0;
  const discountAmount = Number(invoice.discount_amount) || 0;
  const depositAmount = Number(invoice.deposit_amount) || 0;
  const total = Number(invoice.total_amount) || subtotal + taxAmount - discountAmount;
  const balanceDue = total - depositAmount;
  const hasDetail = items.some((i: any) => i.detail);
  const sc = statusStyle[invoice.status] || statusStyle.draft;
  const StatusIcon = sc.icon;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-[760px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-8 py-7 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              AXO <span className="text-amber-500">Floors</span> NJ
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[2px] mt-0.5">
              Hardwood · Refinishing · Installation
            </p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold">{invoice.invoice_number}</p>
            <div className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
              <StatusIcon className="w-3 h-3" />
              {sc.label}
            </div>
          </div>
        </div>

        {/* Bill-to strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-8 py-5 bg-slate-50 border-b border-slate-200">
          <div>
            <p className="text-[9px] uppercase tracking-[1.5px] text-slate-400 mb-0.5">Bill To</p>
            <p className="text-sm font-semibold text-slate-800">{invoice.projects?.customer_name || "—"}</p>
            {invoice.customers?.email && <p className="text-xs text-slate-500 mt-0.5">{invoice.customers.email}</p>}
            {invoice.customers?.phone && <p className="text-xs text-slate-500">{invoice.customers.phone}</p>}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[1.5px] text-slate-400 mb-0.5">Project</p>
            <p className="text-sm font-semibold text-slate-800">{invoice.projects?.project_type || "—"}</p>
            {invoice.projects?.address && <p className="text-xs text-slate-500 mt-0.5">{invoice.projects.address}</p>}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[1.5px] text-slate-400 mb-0.5">Invoice Date</p>
            <p className="text-sm font-semibold text-slate-800">{format(new Date(invoice.created_at), "MMMM d, yyyy")}</p>
            <p className="text-[9px] uppercase tracking-[1.5px] text-slate-400 mb-0.5 mt-2">Due Date</p>
            <p className="text-sm font-semibold text-slate-800">{format(new Date(invoice.due_date), "MMMM d, yyyy")}</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Items table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left text-[9px] uppercase tracking-[1px] text-slate-500 pb-2">Description</th>
                {hasDetail && <th className="text-left text-[9px] uppercase tracking-[1px] text-slate-500 pb-2">Detail</th>}
                <th className="text-right text-[9px] uppercase tracking-[1px] text-slate-500 pb-2 w-12">Qty</th>
                <th className="text-right text-[9px] uppercase tracking-[1px] text-slate-500 pb-2 w-20">Unit Price</th>
                <th className="text-right text-[9px] uppercase tracking-[1px] text-slate-500 pb-2 w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-2.5">{item.description}</td>
                  {hasDetail && <td className="py-2.5 text-xs text-slate-500 italic">{item.detail || ""}</td>}
                  <td className="py-2.5 text-right">{item.quantity}</td>
                  <td className="py-2.5 text-right">{fmt(Number(item.unit_price))}</td>
                  <td className="py-2.5 text-right font-semibold">{fmt(Number(item.quantity) * Number(item.unit_price))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto w-64 bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-1">
            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {taxAmount > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Tax</span><span>{fmt(taxAmount)}</span></div>}
            {discountAmount > 0 && <div className="flex justify-between text-sm text-slate-600"><span>Discount</span><span>-{fmt(discountAmount)}</span></div>}
            <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-300">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
            {depositAmount > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-600"><span>Deposit Paid</span><span>-{fmt(depositAmount)}</span></div>
                <div className="flex justify-between text-base font-extrabold text-slate-900"><span>Balance Due</span><span>{fmt(balanceDue)}</span></div>
              </>
            )}
          </div>

          {/* Payment Schedule */}
          {phases.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-[1px] text-slate-500 mb-2 font-semibold">Payment Schedule</h4>
              <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${phases.length}, 1fr)` }}>
                {phases.map((p: any) => (
                  <div key={p.id} className="border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase tracking-[1px] text-slate-500">{p.phase_label}</p>
                    <p className="text-xl font-extrabold text-slate-900 mt-1">{p.percentage}%</p>
                    <p className="text-xs text-slate-500">{fmt(total * p.percentage / 100)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{p.timing}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Methods */}
          <div>
            <h4 className="text-[10px] uppercase tracking-[1px] text-slate-500 mb-2 font-semibold">Accepted Payment Methods</h4>
            <div className="flex gap-2 flex-wrap">
              {ACCEPTED_METHODS.map(m => (
                <span key={m} className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">{m}</span>
              ))}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-sm text-amber-800">
              <strong>Notes:</strong> {invoice.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-5 border-t border-slate-200 text-[10px] text-slate-400 space-y-0.5">
          <p>AXO Floors NJ · (732) 351-8653 · axofloorsnj.com · NJ Licensed & Insured</p>
          <p>13A License # 13VH13302100</p>
        </div>
      </div>
    </div>
  );
}
