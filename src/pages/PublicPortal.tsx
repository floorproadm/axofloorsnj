import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Activity, Phone, MessageSquare, ExternalLink, CheckCircle2, Circle, Clock, AlertCircle, Inbox, Download, MessageSquareText, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangeRequestDialog } from "@/components/portal/ChangeRequestDialog";

interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  portal_token: string;
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

const COMPANY_PHONE = "(732) 351-8653";
const COMPANY_PHONE_TEL = "+17323518653";

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

  useEffect(() => {
    document.title = "Your AXO Portal — Proposals, Invoices & Project Updates";
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: cust } = await supabase
        .from("customers")
        .select("id, full_name, email, phone, portal_token")
        .eq("portal_token", token)
        .maybeSingle();

      if (cancelled) return;
      if (!cust) {
        setCustomer(null);
        setLoading(false);
        return;
      }
      setCustomer(cust as Customer);

      const [{ data: props }, { data: projs }] = await Promise.all([
        supabase
          .from("proposals")
          .select("id, share_token, status, good_price, better_price, best_price, flat_price, use_tiers, selected_tier, valid_until, created_at, accepted_at, organization_id")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("projects")
          .select("id, customer_name, project_type, project_status, address, start_date, completion_date, next_action, next_action_date")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      setProposals((props as Proposal[]) || []);
      setProjects((projs as Project[]) || []);

      const projectIds = (projs || []).map((p: any) => p.id);
      if (projectIds.length > 0) {
        const { data: invs } = await supabase
          .from("invoices")
          .select("id, invoice_number, share_token, status, amount, total_amount, due_date, paid_at, project_id")
          .in("project_id", projectIds)
          .order("due_date", { ascending: false });
        if (!cancelled) setInvoices((invs as Invoice[]) || []);
      } else {
        setInvoices([]);
      }
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Portal Link Invalid</h1>
          <p className="text-sm text-slate-600 mt-2">
            This link is invalid or has expired. Please contact us and we'll send you a fresh link.
          </p>
          <Button asChild className="mt-5 bg-[#0f1b3d] hover:bg-[#0f1b3d]/90">
            <a href={`tel:${COMPANY_PHONE_TEL}`}>
              <Phone className="w-4 h-4 mr-2" /> Call {COMPANY_PHONE}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header navy/gold */}
      <header className="bg-[#0f1b3d] text-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-400 text-[#0f1b3d] flex items-center justify-center font-black text-sm">
              AXO
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-amber-300/90">AXO Floors</div>
              <div className="text-sm font-semibold">Hi, {firstName}</div>
            </div>
          </div>
          <a
            href={`tel:${COMPANY_PHONE_TEL}`}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200"
          >
            <Phone className="w-3.5 h-3.5" /> {COMPANY_PHONE}
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">Your AXO Portal</h1>
          <p className="text-sm text-slate-600 mt-1">
            Proposals, invoices and project updates — all in one place.
          </p>
        </div>

        <Tabs defaultValue="proposals" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-white border h-auto p-1">
            <TabsTrigger value="proposals" className="data-[state=active]:bg-[#0f1b3d] data-[state=active]:text-white">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs sm:text-sm">Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-[#0f1b3d] data-[state=active]:text-white">
              <Receipt className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs sm:text-sm">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="data-[state=active]:bg-[#0f1b3d] data-[state=active]:text-white">
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              <span className="text-xs sm:text-sm">Status</span>
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
                              <span className="text-xs">Accept</span>
                            </Link>
                          ) : (
                            <span>
                              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
                              <span className="text-xs">{isAccepted ? "Accepted" : "Accept"}</span>
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

        {/* Help footer */}
        <div className="mt-8 bg-white border rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Need help?</div>
            <div className="text-xs text-slate-500 mt-0.5">We typically reply within an hour.</div>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${COMPANY_PHONE_TEL}`}>
                <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
              </a>
            </Button>
            <Button asChild size="sm" className="bg-[#0f1b3d] hover:bg-[#0f1b3d]/90">
              <a href={`sms:${COMPANY_PHONE_TEL}`}>
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Text
              </a>
            </Button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          AXO Floors · Tri-State Hardwood Specialists
        </p>
      </main>

      {changeReqProposal && customer && (
        <ChangeRequestDialog
          open={!!changeReqProposal}
          onOpenChange={(v) => !v && setChangeReqProposal(null)}
          proposalId={changeReqProposal.id}
          customerId={customer.id}
          organizationId={changeReqProposal.organization_id}
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
