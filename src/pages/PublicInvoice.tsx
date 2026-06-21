import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, FileText, CheckCircle, Clock, AlertTriangle, XCircle, Phone, MessageSquare } from "lucide-react";

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
  const [property, setProperty] = useState<any>(null);
  const [brand, setBrand] = useState<{ company_name: string; phone: string; email: string; website: string; logo_url: string | null }>({
    company_name: "FloorPRO",
    phone: "",
    email: "",
    website: "",
    logo_url: null,
  });
  const [logoSignedUrl, setLogoSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: bundle, error: bundleErr } = await supabase.rpc(
          "public_get_invoice_bundle" as any,
          { p_token: token },
        );
        if (bundleErr) throw bundleErr;
        if (!bundle) { setError("Invoice not found"); setLoading(false); return; }
        const b: any = bundle;
        const inv = b.invoice;
        setInvoice(inv);
        setItems(b.items || []);
        setPhases(b.schedule || []);
        setProperty(b.property || null);

        if (inv && !inv.viewed_at) {
          await supabase.rpc("public_mark_invoice_viewed" as any, { p_token: token });
        }

        // Plan-gated branding
        const orgId = inv?.organization_id;
        const { data: planRes } = orgId
          ? await supabase.rpc("get_org_plan" as any, { p_org_id: orgId })
          : { data: null };
        const isPro = planRes === "pro" || planRes === "enterprise";
        if (isPro && b.company) {
          const cs = b.company as any;
          setBrand({
            company_name: cs.company_name || "FloorPRO",
            phone: cs.phone || "",
            email: cs.email || "",
            website: cs.website || "",
            logo_url: cs.logo_url || null,
          });
          if (cs.logo_url) {
            const { data: signed } = await supabase.storage.from("media").createSignedUrl(cs.logo_url, 3600);
            if (signed?.signedUrl) setLogoSignedUrl(signed.signedUrl);
          }
        }
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
    <div className="min-h-screen bg-slate-50 py-4 px-3 sm:py-6 sm:px-4">
      <div className="max-w-[760px] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f172a] text-white px-4 py-4 sm:px-8 sm:py-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
            <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight truncate">
              {brand.company_name}
            </h1>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-sm sm:text-base font-bold">{invoice.invoice_number}</p>
            <div className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
              <StatusIcon className="w-3 h-3" />
              {sc.label}
            </div>
          </div>
        </div>

        {/* Bill-to strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 py-4 sm:px-8 sm:py-5 bg-slate-50 border-b border-slate-200">
          <div>
            <p className="text-[9px] uppercase tracking-[1.5px] text-slate-400 mb-0.5">Bill To</p>
            <p className="text-sm font-semibold text-slate-800">{invoice.projects?.customer_name || "—"}</p>
            {(property?.unit_identifier || property?.resident_name) && (
              <p className="text-xs text-slate-600 mt-0.5">
                {property?.unit_identifier}
                {property?.unit_identifier && property?.resident_name ? " · " : ""}
                {property?.resident_name}
              </p>
            )}
            {invoice.customers?.email && <p className="text-xs text-slate-500 mt-0.5">{invoice.customers.email}</p>}
            {invoice.customers?.phone && <p className="text-xs text-slate-500">{invoice.customers.phone}</p>}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[1.5px] text-slate-400 mb-0.5">Project</p>
            <p className="text-sm font-semibold text-slate-800">{invoice.projects?.project_type || "—"}</p>
            {(() => {
              const propAddr = property
                ? [property.address_line1, property.city, property.state, property.zip].filter(Boolean).join(", ")
                : "";
              const addr = propAddr || invoice.projects?.address;
              return addr ? <p className="text-xs text-slate-500 mt-0.5">{addr}</p> : null;
            })()}
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[1.5px] text-slate-400 mb-0.5">Invoice Date</p>
            <p className="text-sm font-semibold text-slate-800">{format(new Date(invoice.created_at), "MMMM d, yyyy")}</p>
            <p className="text-[9px] uppercase tracking-[1.5px] text-slate-400 mb-0.5 mt-2">Due Date</p>
            <p className="text-sm font-semibold text-slate-800">{format(new Date(invoice.due_date), "MMMM d, yyyy")}</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 sm:px-8 sm:py-6 space-y-4 sm:space-y-6">
          {/* Items table */}
          <div className="overflow-x-auto -mx-4 px-4 sm:-mx-0 sm:px-0">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
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
                    <td className="py-2.5 pr-2">{item.description}</td>
                    {hasDetail && <td className="py-2.5 text-[10px] sm:text-xs text-slate-500 italic pr-2">{item.detail || ""}</td>}
                    <td className="py-2.5 text-right">{item.quantity}</td>
                    <td className="py-2.5 text-right">{fmt(Number(item.unit_price))}</td>
                    <td className="py-2.5 text-right font-semibold">{fmt(Number(item.quantity) * Number(item.unit_price))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="w-full sm:w-64 sm:ml-auto bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200 space-y-1">
            <div className="flex justify-between text-xs sm:text-sm text-slate-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {taxAmount > 0 && <div className="flex justify-between text-xs sm:text-sm text-slate-600"><span>Tax</span><span>{fmt(taxAmount)}</span></div>}
            {discountAmount > 0 && <div className="flex justify-between text-xs sm:text-sm text-slate-600"><span>Discount</span><span>-{fmt(discountAmount)}</span></div>}
            <div className="flex justify-between text-base sm:text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-300">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
            {depositAmount > 0 && (
              <>
                <div className="flex justify-between text-xs sm:text-sm text-green-600"><span>Deposit Paid</span><span>-{fmt(depositAmount)}</span></div>
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900"><span>Balance Due</span><span>{fmt(balanceDue)}</span></div>
              </>
            )}
          </div>

          {/* Payment Schedule */}
          {phases.length > 0 && (
            <div>
              <h4 className="text-[10px] uppercase tracking-[1px] text-slate-500 mb-2 font-semibold">Payment Schedule</h4>
              <div className={`grid gap-3 grid-cols-1 ${phases.length === 2 ? 'sm:grid-cols-2' : phases.length === 3 ? 'sm:grid-cols-3' : phases.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : ''}`}>
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
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-3.5 text-sm sm:text-base text-amber-800">
              <strong>Notes:</strong> {invoice.notes}
            </div>
          )}

          {/* Contact */}
          {(brand.phone || brand.email) && (
            <div className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Need help?</div>
                <div className="text-xs text-slate-500 mt-0.5">We typically reply within an hour.</div>
              </div>
              <div className="flex gap-2">
                {brand.phone && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`}>
                      <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
                    </a>
                  </Button>
                )}
                {brand.phone && (
                  <Button asChild size="sm" className="bg-[#0f1b3d] hover:bg-[#0f1b3d]/90">
                    <a href={`sms:${brand.phone.replace(/[^\d+]/g, "")}`}>
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Text
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-4 sm:py-5 border-t border-slate-200 text-[10px] text-slate-400 space-y-0.5 px-4">
          <p className="break-words">{[brand.company_name, brand.phone, brand.website].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}
