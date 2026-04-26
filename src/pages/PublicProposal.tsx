import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Loader2,
  FileText,
  CheckCircle2,
  Shield,
  Award,
  ScrollText,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { SignatureDialog } from "@/components/proposal/SignatureDialog";

const fmt = (v: number) =>
  `$${Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

type TierKey = "good" | "better" | "best";

const TIER_LABELS: Record<TierKey, { name: string; tag: string }> = {
  good: { name: "Essential", tag: "Solid foundation" },
  better: { name: "Recommended", tag: "Best value" },
  best: { name: "Premium", tag: "Top-tier finish" },
};

export default function PublicProposal() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const printMode = searchParams.get("print") === "1";
  const [proposal, setProposal] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [pickedTier, setPickedTier] = useState<TierKey | "flat" | null>(null);

  // White-label brand with safe fallbacks
  const brand = {
    name: company?.trade_name || company?.company_name || "AXO Floors",
    tagline: company?.tagline || "Professional Flooring · NJ",
    phone: company?.phone || "(732) 351-8653",
    email: company?.email || "info@axofloors.com",
    website: company?.website || "axofloorsnj.com",
    primary: company?.primary_color || "#d97706",
    secondary: company?.secondary_color || "#0f1b3d",
    logoUrl,
  };
  const phoneTel = brand.phone.replace(/\D/g, "");

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

        const [projRes, custRes, companyRes] = await Promise.all([
          supabase.from("projects").select("*").eq("id", prop.project_id).maybeSingle(),
          supabase.from("customers").select("*").eq("id", prop.customer_id).maybeSingle(),
          supabase.from("company_settings").select("*").limit(1).maybeSingle(),
        ]);
        setProject(projRes.data);
        setCustomer(custRes.data);
        setCompany(companyRes.data);
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
  const isExpired = useMemo(() => {
    if (!proposal?.valid_until) return false;
    return new Date(proposal.valid_until) < new Date() && !isAccepted;
  }, [proposal, isAccepted]);

  const tiers: Array<{ key: TierKey; price: number }> = useMemo(() => {
    if (!proposal || !proposal.use_tiers) return [];
    return [
      { key: "good", price: Number(proposal.good_price) },
      { key: "better", price: Number(proposal.better_price) },
      { key: "best", price: Number(proposal.best_price) },
    ];
  }, [proposal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm px-6">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-lg font-semibold text-slate-700">Proposal Not Found</p>
          <p className="text-sm text-slate-500 mt-1">
            This link may have expired or is invalid. Please contact us at{" "}
            <a href="tel:7323518653" className="text-primary font-medium">
              (732) 351-8653
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Branded Header */}
      <header className="bg-[#0f1b3d] text-white">
        <div className="max-w-3xl mx-auto px-5 py-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AXO Floors</h1>
            <p className="text-[11px] uppercase tracking-[2px] text-amber-400 mt-0.5">
              Professional Flooring · NJ
            </p>
          </div>
          <StatusBadge status={proposal.status} expired={isExpired} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        {/* Title */}
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Proposal</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            Your project quote
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Proposal #{proposal.proposal_number} · Valid through{" "}
            {format(new Date(proposal.valid_until), "MMM d, yyyy")}
          </p>
        </div>

        {/* Customer + project */}
        <Card className="p-5 space-y-3 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Prepared for</p>
              <p className="font-semibold text-slate-900">
                {customer?.full_name || "Client"}
              </p>
              {customer?.phone && (
                <p className="text-xs text-slate-500 mt-0.5">{customer.phone}</p>
              )}
            </div>
          </div>
          {(project?.address || customer?.address) && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Project address</p>
                <p className="text-sm text-slate-900">
                  {project?.address || customer?.address}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Optional client note */}
        {proposal.client_note && (
          <Card className="p-5 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <ScrollText className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs uppercase tracking-wider text-amber-800 font-semibold">
                  Note from AXO
                </p>
                <p className="text-sm text-slate-800 mt-1 leading-relaxed">
                  {proposal.client_note}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Pricing */}
        {proposal.use_tiers ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Choose your option
            </h3>
            {tiers.map((t, i) => (
              <TierCard
                key={t.key}
                tierKey={t.key}
                price={t.price}
                recommended={i === 1}
                disabled={isAccepted || isExpired}
                accepted={proposal.selected_tier === t.key}
                onSelect={() => handleSelectTier(t.key)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 bg-white border-2 border-[#0f1b3d]">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Project total
            </p>
            <p className="text-4xl font-bold text-slate-900 mt-1">
              {fmt(Number(proposal.flat_price))}
            </p>
            <Button
              size="lg"
              className="w-full mt-5 bg-amber-600 hover:bg-amber-700"
              disabled={isAccepted || isExpired}
              onClick={() => handleSelectTier("flat")}
            >
              {isAccepted ? "Approved" : "Approve & Sign — Lock In Your Project"}
            </Button>
          </Card>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-2">
          <TrustBadge
            icon={<Award className="w-4 h-4" />}
            title="DuraSeal"
            sub="Premium Materials"
          />
          <TrustBadge
            icon={<CheckCircle2 className="w-4 h-4" />}
            title="10+ Years"
            sub="Expert Craftsmen"
          />
          <TrustBadge
            icon={<Shield className="w-4 h-4" />}
            title="Fully Insured"
            sub="$2M Coverage"
          />
        </div>

        {/* Woody's Guarantee */}
        <Card className="p-5 bg-white">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Woody's Guarantee
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { n: "30", u: "Days", t: "Satisfaction" },
              { n: "10", u: "Years", t: "Structural" },
              { n: "5", u: "Years", t: "Finish" },
            ].map((g) => (
              <div key={g.t} className="bg-slate-50 rounded-lg py-3">
                <div className="text-2xl font-bold text-amber-600">{g.n}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                  {g.u}
                </div>
                <div className="text-[11px] text-slate-700 font-medium mt-1">
                  {g.t}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Help */}
        <Card className="p-5 bg-[#0f1b3d] text-white">
          <p className="text-amber-400 text-xs uppercase tracking-wider font-semibold">
            Questions?
          </p>
          <p className="text-sm mt-1 opacity-90">
            Call or text Eduardo — happy to walk you through any tier.
          </p>
          <a
            href="tel:7323518653"
            className="mt-3 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-[#0f1b3d] font-semibold rounded-md py-2.5"
          >
            <Phone className="w-4 h-4" />
            (732) 351-8653
          </a>
        </Card>

        {/* Status banners */}
        {isAccepted && (
          <Card className="p-4 bg-green-50 border-green-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 text-sm">
                Project confirmed.
              </p>
              <p className="text-xs text-green-800 mt-0.5">
                We'll text you within 24h to schedule kickoff.
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
                Call us to refresh pricing — we're happy to help.
              </p>
            </div>
          </Card>
        )}

        <p className="text-center text-[11px] text-slate-400 pt-4">
          AXO Floors · axofloorsnj.com
        </p>
      </main>

      {/* Sign dialog */}
      <SignatureDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        proposalId={proposal.id}
        organizationId={proposal.organization_id}
        defaultName={customer?.full_name || ""}
        selectedTier={pickedTier}
        onSigned={() => {
          // refresh
          window.location.reload();
        }}
      />
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
  return (
    <Badge className="bg-amber-400 text-[#0f1b3d] border-0 hover:bg-amber-400">
      Awaiting Approval
    </Badge>
  );
}

function TierCard({
  tierKey,
  price,
  recommended,
  disabled,
  accepted,
  onSelect,
}: {
  tierKey: TierKey;
  price: number;
  recommended?: boolean;
  disabled: boolean;
  accepted: boolean;
  onSelect: () => void;
}) {
  const meta = TIER_LABELS[tierKey];
  return (
    <Card
      className={`p-5 bg-white relative ${
        recommended ? "border-2 border-amber-500" : ""
      } ${accepted ? "border-2 border-green-500" : ""}`}
    >
      {recommended && !accepted && (
        <Badge className="absolute -top-2.5 right-4 bg-amber-500 text-white border-0 text-[10px] uppercase tracking-wider">
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
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {meta.tag}
          </p>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">{meta.name}</h4>
        </div>
        <p className="text-2xl font-bold text-slate-900">{fmt(price)}</p>
      </div>
      <Button
        className={`w-full mt-4 ${
          recommended
            ? "bg-amber-600 hover:bg-amber-700"
            : "bg-[#0f1b3d] hover:bg-[#1a2954]"
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

function TrustBadge({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-3 py-3 text-center">
      <div className="text-amber-600 flex justify-center mb-1">{icon}</div>
      <p className="text-xs font-semibold text-slate-900">{title}</p>
      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{sub}</p>
    </div>
  );
}
