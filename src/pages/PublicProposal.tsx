import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Loader2,
  FileText,
  CheckCircle2,
  ScrollText,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { SignatureDialog } from "@/components/proposal/SignatureDialog";
import { DeclineDialog } from "@/components/proposal/DeclineDialog";

const fmt = (v: number) =>
  `$${Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Returns black or white based on background luminance for WCAG contrast. */
const readableText = (hex: string): string => {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0f172a" : "#ffffff";
};

type TierKey = "good" | "better" | "best";

const TIER_LABELS: Record<TierKey, { name: string; tag: string }> = {
  good: { name: "Good", tag: "Essential scope" },
  better: { name: "Better", tag: "Recommended" },
  best: { name: "Best", tag: "Premium finish" },
};

interface LineItem {
  description: string;
  category: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export default function PublicProposal() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const printMode = searchParams.get("print") === "1";
  const isAdminPreview = searchParams.get("preview") === "admin";

  const [proposal, setProposal] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [pickedTier, setPickedTier] = useState<TierKey | "flat" | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // White-label brand with safe fallbacks
  const brand = {
    name: company?.trade_name || company?.company_name || "AXO Floors",
    tagline: company?.tagline || "Professional Flooring · NJ",
    phone: company?.phone || "(732) 351-8653",
    email: company?.email || "info@axofloors.com",
    website: company?.website || "axofloorsnj.com",
    primary: company?.primary_color || "#d97706",
    secondary: company?.secondary_color || "#0B1426",
    logoUrl,
  };

  useEffect(() => {
    if (printMode && !loading && proposal) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [printMode, loading, proposal]);

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
          setError("Proposal not found");
          setLoading(false);
          return;
        }
        setProposal(prop);

        // Mark as viewed (first time only)
        if (!prop.viewed_at) {
          await supabase
            .from("proposals")
            .update({
              viewed_at: new Date().toISOString(),
              status: prop.status === "sent" ? "viewed" : prop.status,
            } as any)
            .eq("share_token", token);
        }

        const [projRes, custRes, propertyRes, companyRes, itemsRes] = await Promise.all([
          supabase.from("projects").select("*").eq("id", prop.project_id).maybeSingle(),
          prop.customer_id
            ? supabase.from("customers").select("*").eq("id", prop.customer_id).maybeSingle()
            : Promise.resolve({ data: null }),
          prop.property_id
            ? supabase.from("customer_properties").select("*").eq("id", prop.property_id).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from("company_settings").select("*").limit(1).maybeSingle(),
          supabase
            .from("proposal_line_items" as any)
            .select("description, category, quantity, unit_price, amount, display_order")
            .eq("proposal_id", prop.id)
            .order("display_order", { ascending: true }),
        ]);
        setProject(projRes.data);
        setCustomer(custRes.data);
        setProperty(propertyRes.data);
        setCompany(companyRes.data);
        setLineItems(((itemsRes.data as any[]) || []).map((r) => ({
          description: r.description || "",
          category: r.category || "other",
          quantity: Number(r.quantity) || 0,
          unit_price: Number(r.unit_price) || 0,
          amount: Number(r.amount) || 0,
        })));

        const logoPath = (companyRes.data as any)?.logo_url;
        if (logoPath) {
          const { data: signed } = await supabase.storage
            .from("media")
            .createSignedUrl(logoPath, 3600);
          if (signed?.signedUrl) setLogoUrl(signed.signedUrl);
        }
      } catch (e: any) {
        setError(e.message || "Failed to load proposal");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const isAccepted = proposal?.status === "accepted";
  const isRejected = proposal?.status === "rejected";
  const isExpired = useMemo(() => {
    if (!proposal?.valid_until) return false;
    return new Date(proposal.valid_until) < new Date() && !isAccepted && !isRejected;
  }, [proposal, isAccepted, isRejected]);
  const canAct = !isAccepted && !isRejected && !isExpired;

  const daysLeft = useMemo(() => {
    if (!proposal?.valid_until || isExpired) return null;
    const end = new Date(proposal.valid_until);
    const now = new Date();
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [proposal, isExpired]);

  const showUrgencyBanner =
    !isAdminPreview &&
    !isAccepted &&
    proposal?.status !== "expired" &&
    daysLeft !== null &&
    daysLeft <= 7 &&
    daysLeft >= 0;

  const displayName = customer?.full_name || project?.customer_name || "Client";
  const displayPhone = customer?.phone || project?.customer_phone || null;
  const displayEmail = customer?.email || project?.customer_email || null;
  // Property-aware address: when proposal is bound to a specific unit, prefer it.
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

  const tiers: Array<{ key: TierKey; price: number }> = useMemo(() => {
    if (!proposal || !proposal.use_tiers) return [];
    return [
      { key: "good", price: Number(proposal.good_price) },
      { key: "better", price: Number(proposal.better_price) },
      { key: "best", price: Number(proposal.best_price) },
    ];
  }, [proposal]);

  // Totals (Direct mode only — tiers show their own price)
  const subtotal = useMemo(() => {
    if (!proposal) return 0;
    if (lineItems.length > 0) {
      return lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
    }
    return Number(proposal.flat_price) || 0;
  }, [proposal, lineItems]);

  const taxRate = Number(proposal?.tax_rate) || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !proposal) {
    const phoneTel = brand.phone.replace(/\D/g, "");
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-sm px-6">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-lg font-semibold text-slate-700">Proposal Not Found</p>
          <p className="text-sm text-slate-500 mt-1">
            This link may have expired or is invalid. Please contact us at{" "}
            <a href={`tel:${phoneTel}`} className="text-amber-600 font-medium">
              {brand.phone}
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  const handleSelectTier = (tier: TierKey | "flat") => {
    setPickedTier(tier);
    setSignOpen(true);
  };

  const termsText: string =
    proposal.terms_text?.trim() ||
    proposal.payment_terms?.trim() ||
    "";

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Branded Header */}
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
              <p
                className="text-[10px] uppercase tracking-[2px] mt-0.5"
                style={{ color: brand.primary }}
              >
                {brand.tagline}
              </p>
            </div>
          </div>
          <StatusBadge status={proposal.status} expired={isExpired} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8 space-y-8">
        {/* Document Header — Invoice2go style */}
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[2px]"
            style={{ color: brand.primary }}
          >
            Proposal
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            {proposal.proposal_number}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
          {/* Bill To */}
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
              <p className="text-sm text-slate-600 mt-1 leading-snug">
                {displayAddress}
              </p>
            )}
          </div>

          {/* Document meta */}
          <div className="sm:text-right">
            <DocMeta label="Date" value={format(new Date(proposal.created_at), "MMM d, yyyy")} />
            <DocMeta
              label="Valid Until"
              value={format(new Date(proposal.valid_until), "MMM d, yyyy")}
            />
            {proposal.payment_terms && (
              <DocMeta label="Payment Terms" value={proposal.payment_terms} multiline />
            )}
          </div>
        </div>

        {/* Optional client note */}
        {proposal.client_note && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <ScrollText className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[2px] text-amber-800 font-semibold">
                  Note from {brand.name}
                </p>
                <p className="text-sm text-slate-800 mt-1 leading-relaxed whitespace-pre-line">
                  {proposal.client_note}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Pre-expiration urgency banner */}
        {showUrgencyBanner && daysLeft !== null && (
          <Card
            className={`p-4 flex items-start gap-3 ${
              daysLeft === 0
                ? "bg-red-50 border-red-200"
                : daysLeft <= 3
                ? "bg-orange-50 border-orange-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <Clock
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                daysLeft === 0
                  ? "text-red-600"
                  : daysLeft <= 3
                  ? "text-orange-600"
                  : "text-yellow-600"
              }`}
            />
            <div>
              <p
                className={`font-semibold text-sm ${
                  daysLeft === 0
                    ? "text-red-900"
                    : daysLeft <= 3
                    ? "text-orange-900"
                    : "text-yellow-900"
                }`}
              >
                {daysLeft === 0
                  ? "This proposal expires today"
                  : daysLeft <= 3
                  ? `Expires soon — only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left to approve`
                  : `This proposal is valid until ${format(new Date(proposal.valid_until), "MMM d, yyyy")} — ${daysLeft} days left`}
              </p>
            </div>
          </Card>
        )}

        {/* Pricing — Tiers or Line Items table */}
        {proposal.use_tiers ? (
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
              Choose your option
            </h3>
            {tiers.map((t, i) => (
              <TierCard
                key={t.key}
                tierKey={t.key}
                price={t.price}
                recommended={i === 1}
                disabled={!canAct}
                accepted={proposal.selected_tier === t.key}
                primaryColor={brand.primary}
                secondaryColor={brand.secondary}
                onSelect={() => handleSelectTier(t.key)}
              />
            ))}
          </div>
        ) : (
          <LineItemsTable
            items={lineItems}
            subtotal={subtotal}
            taxRate={taxRate}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            primaryColor={brand.primary}
          />
        )}

        {/* Approve / Decline actions */}
        {canAct && !proposal.use_tiers && (
          <div className="space-y-3 pt-2">
            <Button
              size="lg"
              className="w-full font-semibold hover:opacity-90 bg-green-600 text-white hover:bg-green-700"
              onClick={() => handleSelectTier("flat")}
            >
              Approve &amp; Sign
            </Button>
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setDeclineOpen(true)}
            >
              Decline Proposal
            </Button>
          </div>
        )}
        {canAct && proposal.use_tiers && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setDeclineOpen(true)}
            >
              Decline Proposal
            </Button>
          </div>
        )}

        {/* Terms */}
        {termsText && (
          <div className="pt-6 border-t border-slate-200">
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500 mb-2">
              Terms &amp; Conditions
            </p>
            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
              {termsText}
            </p>
          </div>
        )}

        {/* Status banners */}
        {isAccepted && (
          <Card className="p-4 bg-green-50 border-green-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 text-sm">
                Project confirmed.
              </p>
              <p className="text-xs text-green-800 mt-0.5">
                We'll reach out within 24h to schedule kickoff.
              </p>
            </div>
          </Card>
        )}
        {isExpired && (
          <Card className="p-4 bg-amber-50 border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">
                This proposal has expired.
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Contact us to refresh pricing.
              </p>
            </div>
          </Card>
        )}
        {isRejected && (
          <Card className="p-4 bg-slate-100 border-slate-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                Proposal declined.
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                Thank you for letting us know.
              </p>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="pt-8 text-center text-[11px] text-slate-400">
          <p className="font-medium text-slate-600">{brand.name}</p>
          {brand.website && <p className="mt-0.5">{brand.website}</p>}
        </div>
      </main>

      {/* Sign dialog */}
      <SignatureDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        proposalId={proposal.id}
        organizationId={proposal.organization_id}
        defaultName={displayName}
        selectedTier={pickedTier}
        proposalNumber={proposal.proposal_number}
        customerName={displayName}
        proposalToken={token}
      />

      {/* Decline dialog */}
      <DeclineDialog
        open={declineOpen}
        onOpenChange={setDeclineOpen}
        proposalId={proposal.id}
        shareToken={token!}
        onDeclined={() => {
          setTimeout(() => window.location.reload(), 1500);
        }}
      />
    </div>
  );
}

function DocMeta({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
        {label}
      </p>
      <p
        className={`text-sm text-slate-900 ${multiline ? "leading-snug" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status, expired }: { status: string; expired: boolean }) {
  if (expired) {
    return (
      <Badge className="bg-amber-500 text-white border-0 hover:bg-amber-500">
        Expired
      </Badge>
    );
  }
  if (status === "accepted") {
    return (
      <Badge className="bg-green-500 text-white border-0 hover:bg-green-500">
        Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-slate-500 text-white border-0 hover:bg-slate-500">
        Declined
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-400 text-[#0f1b3d] border-0 hover:bg-amber-400">
      Awaiting Approval
    </Badge>
  );
}

function LineItemsTable({
  items,
  subtotal,
  taxRate,
  taxAmount,
  grandTotal,
  primaryColor,
}: {
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  primaryColor: string;
}) {
  const hasItems = items.length > 0;

  return (
    <div className="overflow-hidden border border-slate-200 rounded-md">
      {hasItems && (
        <>
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_56px_96px_96px] gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[1.5px]"
            style={{ backgroundColor: primaryColor, color: readableText(primaryColor) }}
          >
            <div>Description</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Unit Price</div>
            <div className="text-right">Amount</div>
          </div>

          {/* Rows */}
          {items.map((li, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-[1fr_56px_96px_96px] gap-2 px-4 py-3 text-sm border-t border-slate-100 ${
                idx % 2 === 1 ? "bg-slate-50" : "bg-white"
              }`}
            >
              <div className="text-slate-900 leading-snug">{li.description || "Item"}</div>
              <div className="text-right text-slate-700 tabular-nums">
                {li.quantity}
              </div>
              <div className="text-right text-slate-700 tabular-nums">
                {`$${Number(li.unit_price || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
              <div className="text-right text-slate-900 font-medium tabular-nums">
                {`$${Number(li.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Totals */}
      <div className={`px-4 py-4 space-y-1.5 ${hasItems ? "border-t-2 border-slate-200 bg-white" : "bg-white"}`}>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Subtotal</span>
          <span className="text-slate-900 tabular-nums">
            {`$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Tax ({taxRate}%)</span>
            <span className="text-slate-900 tabular-nums">
              {`$${taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        )}
        <div className="pt-3 mt-2 border-t-2 border-slate-300 flex justify-between items-baseline">
          <span className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-500">
            Total
          </span>
          <span
            className="text-2xl font-bold tabular-nums text-slate-900"
          >
            {`$${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function TierCard({
  tierKey,
  price,
  recommended,
  disabled,
  accepted,
  primaryColor,
  secondaryColor,
  onSelect,
}: {
  tierKey: TierKey;
  price: number;
  recommended?: boolean;
  disabled: boolean;
  accepted: boolean;
  primaryColor: string;
  secondaryColor: string;
  onSelect: () => void;
}) {
  const meta = TIER_LABELS[tierKey];
  return (
    <Card
      className={`p-5 bg-white relative ${
        recommended ? "border-2" : ""
      } ${accepted ? "border-2 border-green-500" : ""}`}
      style={recommended && !accepted ? { borderColor: primaryColor } : {}}
    >
      {recommended && !accepted && (
        <Badge
          className="absolute -top-2.5 right-4 text-white border-0 text-[10px] uppercase tracking-wider hover:opacity-100"
          style={{ backgroundColor: primaryColor }}
        >
          Recommended
        </Badge>
      )}
      {accepted && (
        <Badge className="absolute -top-2.5 right-4 bg-green-600 text-white border-0 text-[10px] uppercase tracking-wider">
          Selected
        </Badge>
      )}
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[2px] text-slate-500">
            {meta.tag}
          </p>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">{meta.name}</h4>
        </div>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmt(price)}</p>
      </div>
      <Button
        className={`w-full mt-4 hover:opacity-90 ${
          recommended
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-slate-100 text-slate-900 hover:bg-slate-200"
        }`}
        disabled={disabled}
        onClick={onSelect}
      >
        {accepted
          ? "Selected"
          : disabled
          ? "Unavailable"
          : `Approve ${meta.name}`}
      </Button>
    </Card>
  );
}
