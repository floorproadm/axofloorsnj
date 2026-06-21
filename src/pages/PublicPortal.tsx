import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Activity, Phone, MessageSquare, ExternalLink, CheckCircle2, Circle, Clock, AlertCircle, Inbox, Download, MessageSquareText, ThumbsUp, CalendarPlus, Camera, MapPin, Pencil, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ChangeRequestDialog } from "@/components/portal/ChangeRequestDialog";
import { RequestAppointmentDialog } from "@/components/portal/RequestAppointmentDialog";
import { PortalChat } from "@/components/portal/PortalChat";
import { BeforeAfterSlider } from "@/components/admin/projects/BeforeAfterSlider";

interface TimelinePhoto {
  id: string;
  photo_url: string;
  annotated_url: string | null;
  taken_at: string;
  location_label: string | null;
}
interface TimelineChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
}
interface TimelineBeforeAfter {
  id: string;
  title: string;
  before_url: string;
  after_url: string;
  completed_date: string | null;
}
interface TimelineProject {
  id: string;
  project_type: string | null;
  address: string | null;
  photos: TimelinePhoto[];
  checklist: TimelineChecklistItem[];
  before_after: TimelineBeforeAfter[];
}

interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  portal_token: string;
  organization_id: string;
}
interface Proposal {
  id: string;
  share_token: string | null;
  status: string;
  good_price: number | null;
  better_price: number | null;
  best_price: number | null;
  flat_price: number | null;
  use_tiers: boolean | null;
  selected_tier: string | null;
  valid_until: string | null;
  created_at: string;
  accepted_at: string | null;
  organization_id: string;
}
interface Project {
  id: string;
  customer_name: string;
  project_type: string;
  project_status: string;
  address: string | null;
  start_date: string | null;
  completion_date: string | null;
  next_action: string | null;
  next_action_date: string | null;
}
interface Invoice {
  id: string;
  invoice_number: string;
  share_token: string | null;
  status: string;
  amount: number;
  total_amount: number | null;
  due_date: string;
  paid_at: string | null;
  project_id: string;
}

interface TenantBrand {
  company_name: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string | null;
}
const DEFAULT_BRAND: TenantBrand = {
  company_name: "FloorPRO",
  phone: "",
  email: "",
  website: "",
  logo_url: null,
};

const formatMoney = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const proposalBadge = (p: Proposal) => {
  if (p.status === "accepted") return (
    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
      <CheckCircle2 className="w-3 h-3" /> Approved
    </Badge>
  );
  if (p.status === "rejected") return (
    <Badge variant="destructive" className="gap-1">
      <AlertCircle className="w-3 h-3" /> Declined
    </Badge>
  );
  if (p.valid_until && new Date(p.valid_until) < new Date()) {
    return (
      <Badge variant="outline" className="border-amber-400 text-amber-700 gap-1">
        <Clock className="w-3 h-3" /> Expired
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1">
      <Clock className="w-3 h-3" /> Awaiting Approval
    </Badge>
  );
};

const proposalAmount = (p: Proposal) => {
  if (!p.use_tiers && p.flat_price) return p.flat_price;
  if (p.selected_tier === "good") return p.good_price;
  if (p.selected_tier === "best") return p.best_price;
  return p.better_price ?? p.good_price ?? p.best_price ?? p.flat_price ?? null;
};

const STATUS_FLOW: { key: string; label: string }[] = [
  { key: "pending", label: "Approved" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

const statusIndex = (s: string) => {
  const map: Record<string, number> = {
    pending: 0,
    scheduled: 1,
    in_progress: 2,
    completed: 3,
  };
  return map[s] ?? 0;
};

export default function PublicPortal() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [changeReqProposal, setChangeReqProposal] = useState<Proposal | null>(null);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [timeline, setTimeline] = useState<TimelineProject[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [brand, setBrand] = useState<TenantBrand>(DEFAULT_BRAND);

  useEffect(() => {
    document.title = `Your ${brand.company_name} Portal — Proposals, Invoices & Project Updates`;
  }, [brand.company_name]);

  useEffect(() => {
    if (token === "demo") {
      // Demo mode — populate with realistic sample data
      setCustomer({
        id: "demo-customer",
        full_name: "Sarah Johnson",
        email: "sarah.j@example.com",
        phone: "+1 (201) 555-0147",
        portal_token: "demo",
        organization_id: "demo-org",
      });
      setProposals([
        {
          id: "demo-proposal-1",
          share_token: "demo-proposal-token-1",
          status: "accepted",
          good_price: 4200,
          better_price: 5800,
          best_price: 7400,
          flat_price: null,
          use_tiers: true,
          selected_tier: "better",
          valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          organization_id: "demo-org",
        },
        {
          id: "demo-proposal-2",
          share_token: "demo-proposal-token-2",
          status: "sent",
          good_price: 3500,
          better_price: 4800,
          best_price: 6200,
          flat_price: null,
          use_tiers: true,
          selected_tier: "best",
          valid_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          accepted_at: null,
          organization_id: "demo-org",
        },
      ]);
      setProjects([
        {
          id: "demo-project-1",
          customer_name: "Sarah Johnson",
          project_type: "hardwood_refinishing",
          project_status: "in_progress",
          address: "142 Maple Ave, Montclair, NJ 07042",
          start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completion_date: null,
          next_action: "Apply final coat of polyurethane",
          next_action_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
      setInvoices([
        {
          id: "demo-inv-1",
          invoice_number: "INV-2026-0042",
          share_token: "demo-inv-token-1",
          status: "paid",
          amount: 1740,
          total_amount: 1740,
          due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          paid_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          project_id: "demo-project-1",
        },
        {
          id: "demo-inv-2",
          invoice_number: "INV-2026-0043",
          share_token: "demo-inv-token-2",
          status: "sent",
          amount: 2320,
          total_amount: 2320,
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          paid_at: null,
          project_id: "demo-project-1",
        },
      ]);
      setTimeline([
        {
          id: "demo-project-1",
          project_type: "hardwood_refinishing",
          address: "142 Maple Ave, Montclair, NJ 07042",
          photos: [
            {
              id: "demo-ph-1",
              photo_url: "https://placehold.co/800x600/e2e8f0/1e293b?text=Day+1%3A+Sanding",
              annotated_url: null,
              taken_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              location_label: "Living room — sanding complete",
            },
            {
              id: "demo-ph-2",
              photo_url: "https://placehold.co/800x600/e2e8f0/1e293b?text=Day+2%3A+Staining",
              annotated_url: null,
              taken_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              location_label: "Stain applied — Dark Walnut",
            },
            {
              id: "demo-ph-3",
              photo_url: "https://placehold.co/800x600/e2e8f0/1e293b?text=Day+3%3A+Coat+1",
              annotated_url: null,
              taken_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              location_label: "First polyurethane coat",
            },
          ],
          checklist: [
            { id: "c1", title: "Move furniture & mask", completed: true, sort_order: 1 },
            { id: "c2", title: "Sand floors (80/100/120 grit)", completed: true, sort_order: 2 },
            { id: "c3", title: "Apply stain — Dark Walnut", completed: true, sort_order: 3 },
            { id: "c4", title: "Seal coat", completed: true, sort_order: 4 },
            { id: "c5", title: "First poly coat", completed: true, sort_order: 5 },
            { id: "c6", title: "Second poly coat", completed: false, sort_order: 6 },
            { id: "c7", title: "Final inspection", completed: false, sort_order: 7 },
            { id: "c8", title: "Move furniture back", completed: false, sort_order: 8 },
          ],
          before_after: [
            {
              id: "ba-1",
              title: "Living room hardwood",
              before_url: "https://placehold.co/800x600/e2e8f0/1e293b?text=Before%3A+Worn+Finish",
              after_url: "https://placehold.co/800x600/e2e8f0/1e293b?text=After%3A+Dark+Walnut",
              completed_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
      ]);
      setBrand({
        company_name: "FloorPRO",
        phone: "(201) 555-0199",
        email: "hello@floorpro.com",
        website: "https://floorpro.com",
        logo_url: null,
      });
      setLoading(false);
      setTimelineLoading(false);
      return;
    }
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setTimelineLoading(true);
      const [portalRes, tlRes] = await Promise.all([
        supabase.rpc("get_customer_portal", { p_token: token }),
        supabase.rpc("get_portal_timeline" as any, { p_token: token }),
      ]);

      if (cancelled) return;
      const { data, error } = portalRes;
      if (error || !data || !(data as any).customer) {
        setCustomer(null);
        setProposals([]);
        setProjects([]);
        setInvoices([]);
      } else {
        const payload = data as any;
        const cust = payload.customer as Customer;
        setCustomer(cust);
        setProposals((payload.proposals as Proposal[]) || []);
        setProjects((payload.projects as Project[]) || []);
        setInvoices((payload.invoices as Invoice[]) || []);

        // Fetch tenant branding from customer's organization (gated by plan)
        if (cust?.organization_id) {
          const [{ data: cs }, { data: planRes }] = await Promise.all([
            supabase
              .from("company_settings")
              .select("company_name, phone, email, website, logo_url")
              .eq("organization_id", cust.organization_id)
              .maybeSingle(),
            supabase.rpc("get_org_plan" as any, { p_org_id: cust.organization_id }),
          ]);
          const isPro = planRes === "pro" || planRes === "enterprise";
          if (cs && !cancelled) {
            const rawLogo = isPro ? ((cs as any).logo_url || null) : null;
            let resolvedLogo: string | null = null;
            if (rawLogo) {
              if (/^https?:\/\//i.test(rawLogo)) {
                resolvedLogo = rawLogo;
              } else {
                const { data: signed } = await supabase.storage
                  .from("media")
                  .createSignedUrl(rawLogo, 3600);
                resolvedLogo = signed?.signedUrl || null;
              }
            }
            if (!cancelled) {
              setBrand({
                company_name: isPro ? ((cs as any).company_name || "FloorPRO") : "FloorPRO",
                phone: isPro ? ((cs as any).phone || "") : "",
                email: isPro ? ((cs as any).email || "") : "",
                website: isPro ? ((cs as any).website || "") : "",
                logo_url: resolvedLogo,
              });
            }
          }
        }
      }

      const tlData = tlRes.data as any;
      setTimeline((tlData?.projects as TimelineProject[]) || []);
      setTimelineLoading(false);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);


  const firstName = useMemo(
    () => customer?.full_name?.split(" ")[0] || "there",
    [customer]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-[#0f1b3d] text-white">
          <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-md bg-white/10" />
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-16 bg-white/10" />
                <Skeleton className="h-3 w-24 bg-white/10" />
              </div>
            </div>
            <Skeleton className="h-3 w-28 bg-white/10" />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">
          <div className="mb-5 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-12 w-full rounded-md mb-4" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!customer) {
    // Token invalid — tenant cannot be determined. Show generic fallback.
    const hasContact = !!(brand.phone || brand.email);
    const contactParts: string[] = [];
    if (brand.phone) contactParts.push(brand.phone);
    if (brand.email) contactParts.push(brand.email);
    const contactStr = contactParts.join(" or ");
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Portal Link Invalid</h1>
          <p className="text-sm text-slate-600 mt-2">
            This link is invalid or has expired.{" "}
            {hasContact
              ? `Please contact ${brand.company_name} at ${contactStr} and we'll send you a fresh link.`
              : "Please contact the company that sent you this link."}
          </p>
          {brand.phone && (
            <Button asChild className="mt-5 bg-[#0f1b3d] hover:bg-[#0f1b3d]/90">
              <a href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`}>
                <Phone className="w-4 h-4 mr-2" /> Call {brand.phone}
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header navy/gold */}
      <header className="bg-[#0f1b3d] text-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-widest text-amber-300/90">
            {brand.company_name}
          </div>
          {brand.phone && (
            <a
              href={`tel:${brand.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-1.5 text-sm text-amber-300 hover:text-amber-200 whitespace-nowrap"
            >
              <Phone className="w-4 h-4" /> {brand.phone}
            </a>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 flex-1 w-full">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">
            {(() => {
              const h = new Date().getHours();
              const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
              return `${greeting}, ${firstName}`;
            })()}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Proposals, invoices and project updates — all in one place.
          </p>
        </div>


        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="grid grid-cols-5 w-full bg-white border h-auto p-1 sm:p-1.5">
            <TabsTrigger
              value="proposals"
              className="data-[state=active]:bg-[#0f1b3d] data-[state=active]:text-white px-1 py-1.5 sm:px-2 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1"
            >
              <FileText className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-sm leading-none">Proposals</span>
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:bg-[#0f1b3d] data-[state=active]:text-white px-1 py-1.5 sm:px-2 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1"
            >
              <Receipt className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-sm leading-none">Invoices</span>
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-[#0f1b3d] data-[state=active]:text-white px-1 py-1.5 sm:px-2 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1"
            >
              <Camera className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-sm leading-none">Timeline</span>
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-[#0f1b3d] data-[state=active]:text-white px-1 py-1.5 sm:px-2 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1"
            >
              <MessageSquare className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-sm leading-none">Messages</span>
            </TabsTrigger>
            <TabsTrigger
              value="status"
              className="data-[state=active]:bg-[#0f1b3d] data-[state=active]:text-white px-1 py-1.5 sm:px-2 sm:py-2 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1"
            >
              <Activity className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="text-[10px] sm:text-sm leading-none">Status</span>
            </TabsTrigger>
          </TabsList>


          {/* PROPOSALS */}
          <TabsContent value="proposals" className="space-y-3 mt-4">
            {proposals.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No proposals yet"
                description="Once we send your proposal, it will appear here for review and approval."
              />
            ) : (
              proposals.map((p) => {
                const amount = proposalAmount(p);
                const isAccepted = p.status === "accepted";
                const isExpired = !!p.valid_until && new Date(p.valid_until) < new Date() && !isAccepted;
                const isDeclined = p.status === "rejected";
                const canAct = !!p.share_token && !isAccepted && !isExpired && !isDeclined;
                return (
                  <div key={p.id} className="bg-white border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {proposalBadge(p)}
                          <span className="text-xs text-slate-500">
                            {format(new Date(p.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="text-base font-semibold text-slate-900 mt-1">
                          {formatMoney(amount)}
                        </div>
                        {p.valid_until && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Valid until {format(new Date(p.valid_until), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                      {p.share_token ? (
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/proposal/${p.share_token}`}>
                            View <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      ) : (
                        <Badge variant="outline">No link</Badge>
                      )}
                    </div>

                    {p.share_token && (
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                        <Button
                          asChild={canAct}
                          size="sm"
                          disabled={!canAct}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          {canAct ? (
                            <Link to={`/proposal/${p.share_token}`}>
                              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">Accept &amp; Sign</span>
                            </Link>
                          ) : (
                            <span>
                              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">{isAccepted ? "Signed" : "Accept"}</span>
                            </span>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isAccepted || isDeclined}
                          onClick={() => setChangeReqProposal(p)}
                          className="border-slate-300"
                        >
                          <MessageSquareText className="w-3.5 h-3.5 mr-1" />
                          <span className="text-xs">Changes</span>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="border-slate-300">
                          <a href={`/proposal/${p.share_token}?print=1`} target="_blank" rel="noopener noreferrer">
                            <Download className="w-3.5 h-3.5 mr-1" />
                            <span className="text-xs">PDF</span>
                          </a>
                        </Button>
                      </div>
                    )}

                    {/* Terms & Conditions + e-sign notice */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[1.5px] text-slate-500">
                        Terms &amp; Conditions
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        All work will be performed in a professional and workmanlike manner according to the specifications listed in this proposal. Any changes, additions, or deviations from the scope of work must be approved in writing and may result in additional charges.
                        {"\n\n"}
                        All materials are guaranteed to be as specified. If legal action is required to enforce this agreement, the prevailing party may recover reasonable attorney&rsquo;s fees and legal costs. The client has the right to cancel within three (3) business days without loss of deposit.
                      </p>
                      {isAccepted ? (
                        <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2.5 py-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Electronically signed
                            {p.accepted_at ? ` on ${format(new Date(p.accepted_at), "MMM d, yyyy 'at' h:mm a")}` : ""}
                          </span>
                        </div>
                      ) : canAct ? (
                        <p className="text-[11px] text-slate-500 italic">
                          Tap <strong>Accept &amp; Sign</strong> above to e-sign and confirm this proposal.
                        </p>
                      ) : null}
                    </div>

                  </div>
                );
              })
            )}
          </TabsContent>

          {/* INVOICES */}
          <TabsContent value="invoices" className="space-y-3 mt-4">
            {invoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoices yet"
                description="Invoices will appear here once your project is approved and scheduled."
              />
            ) : (
              invoices.map((inv) => {
                const isPaid = inv.status === "paid" || !!inv.paid_at;
                const amt = inv.total_amount ?? inv.amount;
                return (
                  <div key={inv.id} className="bg-white border rounded-lg p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPaid ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid
                          </Badge>
                        ) : new Date(inv.due_date) < new Date() ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="w-3 h-3" /> Past Due
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white gap-1">
                            <Clock className="w-3 h-3" /> Payment Due
                          </Badge>
                        )}
                        <span className="text-xs text-slate-500">#{inv.invoice_number}</span>
                      </div>
                      <div className="text-base font-semibold text-slate-900 mt-1">{formatMoney(amt)}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Due {format(new Date(inv.due_date), "MMM d, yyyy")}
                      </div>
                    </div>
                    {inv.share_token ? (
                      <Button asChild size="sm" variant={isPaid ? "outline" : "default"} className={!isPaid ? "bg-amber-500 hover:bg-amber-600 text-[#0f1b3d]" : ""}>
                        <Link to={`/invoice/${inv.share_token}`}>
                          {isPaid ? "View" : "View & Pay"} <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="space-y-6 mt-4">
            <TimelineTab loading={timelineLoading} projects={timeline} />
          </TabsContent>

          {/* MESSAGES */}
          <TabsContent value="messages" className="mt-4">
            {token && customer ? (
              <PortalChat token={token} customerName={customer.full_name} />
            ) : null}
          </TabsContent>

          {/* STATUS */}
          <TabsContent value="status" className="space-y-3 mt-4">

            {projects.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No active projects yet"
                description="Your project timeline will appear here as soon as work is scheduled."
              />
            ) : (
              projects.map((proj) => {
                const idx = statusIndex(proj.project_status);
                return (
                  <div key={proj.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 capitalize">
                          {proj.project_type?.replace(/_/g, " ")}
                        </div>
                        {proj.address && (
                          <div className="text-xs text-slate-500 mt-0.5">{proj.address}</div>
                        )}
                      </div>
                      {proj.start_date && (
                        <div className="text-[11px] text-slate-500 whitespace-nowrap">
                          Start {format(new Date(proj.start_date), "MMM d")}
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center justify-between gap-1 mt-3">
                      {STATUS_FLOW.map((s, i) => {
                        const done = i <= idx;
                        return (
                          <div key={s.key} className="flex-1 flex flex-col items-center">
                            <div className="flex items-center w-full">
                              <div className={`flex-1 h-0.5 ${i === 0 ? "opacity-0" : done ? "bg-[#0f1b3d]" : "bg-slate-200"}`} />
                              {done ? (
                                <CheckCircle2 className="w-5 h-5 text-[#0f1b3d] shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                              )}
                              <div className={`flex-1 h-0.5 ${i === STATUS_FLOW.length - 1 ? "opacity-0" : i < idx ? "bg-[#0f1b3d]" : "bg-slate-200"}`} />
                            </div>
                            <div className={`text-[10px] mt-1 text-center ${done ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                              {s.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {proj.next_action && proj.project_status !== "completed" && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                        <strong>Next:</strong> {proj.next_action}
                        {proj.next_action_date && (
                          <span className="ml-1 text-amber-700">
                            · {format(new Date(proj.next_action_date), "MMM d")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>

        </Tabs>

        {/* Request Appointment CTA */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Need an appointment?</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Request a visit and we'll confirm within 24 hours.
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setAppointmentOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-[#0f1b3d] shrink-0"
            >
              <CalendarPlus className="w-3.5 h-3.5 mr-1.5" /> Request
            </Button>
          </div>
        </div>

        {/* Help footer */}
        <div className="mt-3 bg-white border rounded-lg p-4 flex items-center justify-between">
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
      </main>

      <p className="text-center text-[11px] text-slate-400 py-6">
        {[brand.company_name, brand.phone, brand.email].filter(Boolean).join(" · ")}
      </p>

      {changeReqProposal && customer && token && (
        <ChangeRequestDialog
          open={!!changeReqProposal}
          onOpenChange={(v) => !v && setChangeReqProposal(null)}
          proposalId={changeReqProposal.id}
          portalToken={token}
        />
      )}

      {customer && (
        <RequestAppointmentDialog
          open={appointmentOpen}
          onOpenChange={setAppointmentOpen}
          customerId={customer.id}
          organizationId={customer.organization_id}
        />
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
}: {
  icon?: typeof Inbox;
  title: string;
  description?: string;
}) {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-lg p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {description && (
        <div className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{description}</div>
      )}
    </div>
  );
}

function TimelineTab({ loading, projects }: { loading: boolean; projects: TimelineProject[] }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border rounded-lg p-3 space-y-2">
            <Skeleton className="h-48 w-full rounded-md" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    );
  }

  const allEmpty =
    projects.length === 0 ||
    projects.every(
      (p) => p.photos.length === 0 && p.checklist.length === 0 && p.before_after.length === 0,
    );

  if (allEmpty) {
    return (
      <EmptyState
        icon={Camera}
        title="No timeline yet"
        description="Seu projeto ainda não tem fotos registradas. Assim que o trabalho começar, você acompanha tudo aqui."
      />
    );
  }

  const multi = projects.length > 1;

  return (
    <div className="space-y-8">
      {projects.map((proj) => {
        const isEmpty =
          proj.photos.length === 0 && proj.checklist.length === 0 && proj.before_after.length === 0;
        if (isEmpty) return null;
        const done = proj.checklist.filter((c) => c.completed).length;
        const total = proj.checklist.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <section key={proj.id} className="space-y-4">
            {multi && (
              <div className="border-b border-slate-200 pb-2">
                <div className="text-sm font-semibold text-slate-900 capitalize">
                  {proj.project_type?.replace(/_/g, " ") || "Project"}
                </div>
                {proj.address && <div className="text-xs text-slate-500">{proj.address}</div>}
              </div>
            )}

            {/* Checklist progress */}
            {total > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-900">Job progress</div>
                  <div className="text-xs text-slate-500 tabular-nums">
                    {done} of {total} · <span className="text-[#0f1b3d] font-semibold">{pct}%</span>
                  </div>
                </div>
                <Progress value={pct} className="h-2 bg-slate-100" />
              </div>
            )}

            {/* Before & After */}
            {proj.before_after.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#0f1b3d]" />
                  <div className="text-sm font-semibold text-slate-900">Before &amp; After</div>
                </div>
                {proj.before_after.map((ba) => (
                  <div key={ba.id} className="bg-white border rounded-lg p-3 space-y-2">
                    <BeforeAfterSlider beforeUrl={ba.before_url} afterUrl={ba.after_url} />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{ba.title}</span>
                      {ba.completed_date && (
                        <span className="text-slate-500">
                          {format(new Date(ba.completed_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Photo feed */}
            {proj.photos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#0f1b3d]" />
                  <div className="text-sm font-semibold text-slate-900">
                    Job photos
                    <span className="text-slate-400 font-normal ml-1">· {proj.photos.length}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {proj.photos.map((ph) => {
                    const src = ph.annotated_url || ph.photo_url;
                    return (
                      <div key={ph.id} className="bg-white border rounded-lg overflow-hidden">
                        <div className="relative bg-slate-100">
                          <img
                            src={src}
                            alt={ph.location_label || "Job photo"}
                            loading="lazy"
                            className="w-full max-h-[520px] object-contain bg-slate-900"
                          />
                          {ph.annotated_url && (
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-amber-400 text-[#0f1b3d]">
                              <Pencil className="w-3 h-3" /> Annotated
                            </span>
                          )}
                        </div>
                        <div className="p-3 flex items-center justify-between gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {ph.location_label || "Location unavailable"}
                            </span>
                          </div>
                          <span className="text-slate-500 tabular-nums whitespace-nowrap">
                            {format(new Date(ph.taken_at), "MMM d, yyyy · h:mm a")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

