import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Loader2,
  FileText,
  CheckCircle2,
  Landmark,
  Smartphone,
  Mail as MailIcon,
  Info,
  Printer,
} from "lucide-react";

const fmt = (v: number) =>
  `$${Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type PaymentMethod = "check" | "zelle" | "stripe" | "other";

export default function PublicDepositInvoice() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [signature, setSignature] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const brand = {
    name: company?.company_name || "AXO FLOORS",
    legalName: company?.trade_name || company?.company_name || "AXO FLOORS LLC",
    tagline: company?.tagline || "Professional Flooring · NJ",
    phone: company?.phone || "(732) 351-8653",
    email: company?.email || "axofloorsnj@gmail.com",
    website: company?.website || "axofloorsnj.com",
    primary: company?.primary_color || "#d97706",
    secondary: "#0B1426",
    logoUrl,
    checkMailingAddress: company?.check_mailing_address || "",
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data: prop, error: propErr } = await supabase
          .from("proposals")
          .select("*")
          .eq("share_token", token)
          .maybeSingle();
        if (propErr) throw propErr;
        if (!prop) {
          setError("Invoice not found");
          setLoading(false);
          return;
        }
        setProposal(prop);

        const [projRes, custRes, propertyRes, companyRes, sigRes] = await Promise.all([
          supabase.from("projects").select("*").eq("id", prop.project_id).maybeSingle(),
          prop.customer_id
            ? supabase.from("customers").select("*").eq("id", prop.customer_id).maybeSingle()
            : Promise.resolve({ data: null }),
          prop.property_id
            ? supabase.from("customer_properties").select("*").eq("id", prop.property_id).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from("company_settings").select("*").limit(1).maybeSingle(),
          supabase
            .from("proposal_signatures" as any)
            .select("*")
            .eq("proposal_id", prop.id)
            .order("signed_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        setProject(projRes.data);
        setCustomer(custRes.data);
        setProperty(propertyRes.data);
        setCompany(companyRes.data);
        setSignature(sigRes.data);

        const logoPath = (companyRes.data as any)?.logo_url;
        if (logoPath) {
          const { data: signed } = await supabase.storage
            .from("media")
            .createSignedUrl(logoPath, 3600);
          if (signed?.signedUrl) setLogoUrl(signed.signedUrl);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const acceptedPrice = useMemo(() => {
    if (!proposal) return 0;
    const tier = proposal.selected_tier || signature?.selected_tier;
    if (proposal.use_tiers && tier && tier !== "flat") {
      if (tier === "good") return Number(proposal.good_price) || 0;
      if (tier === "better") return Number(proposal.better_price) || 0;
      if (tier === "best") return Number(proposal.best_price) || 0;
    }
    return Number(proposal.flat_price) || 0;
  }, [proposal, signature]);

  const depositPct = (company?.deposit_percentage ?? 50) / 100;
  const depositAmount = useMemo(() => acceptedPrice * depositPct, [acceptedPrice, depositPct]);
  const balanceAmount = useMemo(() => acceptedPrice - depositAmount, [acceptedPrice, depositAmount]);

  const paymentMethod = (signature?.payment_method || "check") as PaymentMethod;

  const displayName =
    signature?.signer_name || customer?.full_name || project?.customer_name || "Client";
  const displayEmail = customer?.email || project?.customer_email || signature?.signer_email || null;
  const displayPhone = customer?.phone || project?.customer_phone || null;
  const propertyAddress = property
    ? [property.address_line1, property.address_line2, property.city, property.state, property.zip]
        .filter(Boolean)
        .join(", ")
    : "";
  const displayAddress =
    propertyAddress ||
    project?.address ||
    customer?.address ||
    [project?.city, project?.zip_code].filter(Boolean).join(", ");
  const displayUnit = property?.unit_identifier || null;
  const displayResident = property?.resident_name || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-sm px-6">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-lg font-semibold text-slate-700">Invoice Not Found</p>
          <p className="text-sm text-slate-500 mt-1">
            This link may have expired. Contact us at{" "}
            <a href={`tel:${brand.phone.replace(/\D/g, "")}`} className="text-amber-600 font-medium">
              {brand.phone}
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const isAccepted = proposal.status === "accepted";
  const invoiceNumber = `INV-DEP-${proposal.id.split("-")[0].toUpperCase()}`;

  return (
    <div className="min-h-screen bg-white pb-16">
      <header style={{ backgroundColor: brand.secondary }} className="text-white">
        <div className="max-w-2xl mx-auto px-5 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {brand.logoUrl && (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-10 max-w-[120px] object-contain"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight truncate">{brand.name}</h1>
              <p className="text-[10px] uppercase tracking-[2px] mt-0.5 text-amber-500">
                Deposit Invoice
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors print:hidden"
              title="Print / Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <Badge className="bg-amber-500 text-white border-0 hover:bg-amber-500">
              PAYMENT DUE
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-8">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[2px]"
            style={{ color: brand.primary }}
          >
            Deposit Invoice
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">{invoiceNumber}</h2>
          <p className="text-sm text-slate-600 mt-2">
            Deposit for: <span className="font-semibold text-slate-900">{proposal?.headline || proposal?.title || "Project"}</span>
            {displayAddress && (
              <span className="block text-slate-500 mt-0.5">{displayAddress}</span>
            )}
          </p>
        </div>

        {isAccepted && (
          <Card className="p-4 bg-green-50 border-green-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-green-900">Proposal signed.</p>
              <p className="text-xs text-green-800 mt-0.5">
                Thank you, {displayName.split(" ")[0]}. Please remit the deposit below to lock
                your slot on the schedule.
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500 mb-2">
              Bill To
            </p>
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            {(displayUnit || displayResident) && (
              <p className="text-sm text-slate-700 mt-0.5">
                {displayUnit}
                {displayUnit && displayResident ? " · " : ""}
                {displayResident}
              </p>
            )}
            {displayEmail && (
              <p className="text-sm text-slate-600 mt-0.5">{displayEmail}</p>
            )}
            {displayPhone && (
              <p className="text-sm text-slate-600 mt-0.5">{displayPhone}</p>
            )}
            {displayAddress && (
              <p className="text-sm text-slate-600 mt-1 leading-snug">{displayAddress}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500 mb-2">
              From
            </p>
            <p className="text-sm font-semibold text-slate-900">{brand.legalName}</p>
            <p className="text-sm text-slate-600 mt-0.5">{brand.website}</p>
            <p className="text-sm text-slate-600 mt-0.5">{brand.email}</p>
            <p className="text-sm text-slate-600 mt-0.5">{brand.phone}</p>
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
                Issued
              </p>
              <p className="text-sm text-slate-900">
                {format(
                  signature?.signed_at ? new Date(signature.signed_at) : new Date(),
                  "MMM d, yyyy"
                )}
              </p>
            </div>
            {proposal?.accepted_at && (
              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
                  Accepted
                </p>
                <p className="text-sm text-slate-900">
                  {format(new Date(proposal.accepted_at), "MMM d, yyyy · h:mm a")}
                </p>
              </div>
            )}
          </div>
        </div>

        <Card className="overflow-hidden border-slate-200">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-600">Project total (signed)</td>
                <td className="px-4 py-3 text-right text-slate-900 tabular-nums">
                  {fmt(acceptedPrice)}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="px-4 py-3 text-slate-600">Balance due on completion</td>
                <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                  {fmt(balanceAmount)}
                </td>
              </tr>
              <tr style={{ backgroundColor: brand.secondary }} className="text-white">
                <td className="px-4 py-4 font-semibold">Deposit due now ({company?.deposit_percentage ?? 50}%)</td>
                <td
                  className="px-4 py-4 text-right text-xl font-bold tabular-nums"
                  style={{ color: brand.primary }}
                >
                  {fmt(depositAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500 mb-3">
            Payment Instructions
          </p>
          <PaymentInstructions
            method={paymentMethod}
            amount={depositAmount}
            brand={brand}
            invoiceNumber={invoiceNumber}
          />
        </div>

        <Card className="p-4 bg-slate-50 border-slate-200">
          <p className="text-xs text-slate-600 leading-relaxed">
            Once we confirm receipt of your deposit, your project moves to <strong>scheduled</strong>{" "}
            and we'll reach out within 24h to lock in your start date. Questions? Reply to{" "}
            <a href={`mailto:${brand.email}`} className="text-amber-600 font-medium">
              {brand.email}
            </a>{" "}
            or call{" "}
            <a href={`tel:${brand.phone.replace(/\D/g, "")}`} className="text-amber-600 font-medium">
              {brand.phone}
            </a>
            .
          </p>
        </Card>

        <footer className="pt-8 pb-6 border-t border-slate-200 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            {brand.logoUrl && (
              <img src={brand.logoUrl} alt={brand.name} className="h-6 object-contain opacity-70" />
            )}
            <span className="text-sm font-semibold text-slate-700">{brand.name}</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Thank you for trusting us with your project.<br />
            We look forward to delivering exceptional results.
          </p>
          <p className="text-[11px] text-slate-400">
            {brand.legalName} · {brand.website} · {brand.email}
          </p>
        </footer>
      </main>
    </div>
  );
}

function PaymentInstructions({
  method,
  amount,
  brand,
  invoiceNumber,
}: {
  method: PaymentMethod;
  amount: number;
  brand: { primary: string; secondary: string; email: string; phone: string; legalName: string; checkMailingAddress: string };
  invoiceNumber: string;
}) {
  if (method === "zelle") {
    return (
      <Card className="p-5 border-slate-200">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-3">
            <p className="text-sm font-semibold text-slate-900">Pay by Zelle</p>
            <InstructionRow label="Send via Zelle to" value={`${brand.phone} / ${brand.email}`} />
            <InstructionRow label="Recipient name" value={brand.legalName} />
            <InstructionRow label="Amount" value={`$${amount.toFixed(2)}`} />
            <InstructionRow label="Memo / Reference" value={invoiceNumber} />
            <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
              Open your bank's Zelle feature, send to the phone or email above, and include the reference
              so we can match your payment.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (method === "check") {
    return (
      <Card className="p-5 border-slate-200">
        <div className="flex items-start gap-3">
          <MailIcon className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-3">
            <p className="text-sm font-semibold text-slate-900">Pay by Check</p>
            <InstructionRow label="Make check payable to" value={brand.legalName} />
            <InstructionRow label="Amount" value={`$${amount.toFixed(2)}`} />
            <InstructionRow label="Memo" value={invoiceNumber} />
            {brand.checkMailingAddress ? (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Please mail your check to the address below. Include the memo reference so we can match your payment.
                </p>
                <p className="text-sm text-slate-900 font-medium leading-relaxed whitespace-pre-line">
                  {brand.checkMailingAddress}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                We'll coordinate pickup or provide a mailing address — reply to{" "}
                <a href={`mailto:${brand.email}`} className="text-amber-600 font-medium">
                  {brand.email}
                </a>{" "}
                or text{" "}
                <a
                  href={`tel:${brand.phone.replace(/\D/g, "")}`}
                  className="text-amber-600 font-medium"
                >
                  {brand.phone}
                </a>
                .
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (method === "stripe") {
    return (
      <Card className="p-5 border-slate-200">
        <div className="flex items-start gap-3">
          <Landmark className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-semibold text-slate-900">Pay by Card</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              We'll email you a secure card payment link for{" "}
              <strong>${amount.toFixed(2)}</strong> within 24 hours. No need to share card
              details by phone or email.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">We'll be in touch</p>
          <p className="text-xs text-blue-800 mt-1 leading-relaxed">
            We will contact you with payment instructions within 24h
          </p>
        </div>
      </div>
    </Card>
  );
}

function InstructionRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-[1.5px] text-slate-500 font-semibold">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-900 font-medium tabular-nums">{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={onCopy}
            className="text-[10px] uppercase tracking-[1px] font-semibold text-amber-600 hover:text-amber-700"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}
