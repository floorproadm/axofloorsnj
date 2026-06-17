import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Handshake, DollarSign, TrendingUp, Users, Search, X, Trophy, CheckCircle2, Bell, AlertCircle, Zap, Home, MessageCircle, Phone } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { NewReferralSheet } from "@/components/partner/NewReferralSheet";
import { PartnerStageBar, PARTNER_LEAD_STAGES } from "@/components/partner/PartnerStageBar";
import { PartnerLeadCard } from "@/components/partner/PartnerLeadCard";
import { PartnerProfileTab } from "@/components/partner/PartnerProfileTab";
import { PartnerBottomNav, type PartnerView } from "@/components/partner/PartnerBottomNav";
import { PartnerPipelineBoard } from "@/components/partner/PartnerPipelineBoard";
import { PartnerQuotesTab } from "@/components/partner/PartnerQuotesTab";
import { PartnerReferredProposals } from "@/components/partner/PartnerReferredProposals";
import { PartnerLeadDetailSheet } from "@/components/partner/PartnerLeadDetailSheet";
import { PartnerGalleryTab } from "@/components/partner/PartnerGalleryTab";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import QuizFlow from "@/components/quiz/QuizFlow";
import { resolveLogoUrl } from "@/hooks/useCompanySettings";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  city: string | null;
  budget: number | null;
  created_at: string;
  status_changed_at?: string | null;
  converted_to_project_id: string | null;
}

interface PartnerNotification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface PartnerInfo {
  id: string;
  company_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  partner_type: string;
  partner_program: "referral" | "trade";
  service_zone: string;
  total_referrals: number;
  total_converted: number;
}


export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [commissionPercent, setCommissionPercent] = useState(7);
  const [tenantBrand, setTenantBrand] = useState<{ company_name: string; phone: string; logo_url: string | null }>({
    company_name: "FloorPRO",
    phone: "",
    logo_url: null,
  });
  const [authEmail, setAuthEmail] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<PartnerView>("pipeline");
  const [pipelineMode, setPipelineMode] = useState<"list" | "board">(() => {
    if (typeof window === "undefined") return "list";
    return (localStorage.getItem("floorpro.partner.pipelineMode") as "list" | "board") || "list";
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [needsAttention, setNeedsAttention] = useState(false);

  const updatePipelineMode = (m: "list" | "board") => {
    setPipelineMode(m);
    try { localStorage.setItem("floorpro.partner.pipelineMode", m); } catch {}
  };

  const loadData = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      navigate("/partner/auth", { replace: true });
      return;
    }

    setAuthEmail(session.session.user.email || "");

    const { data: pu } = await supabase
      .from("partner_users" as any)
      .select("partner_id, organization_id")
      .eq("user_id", session.session.user.id)
      .maybeSingle();

    if (!pu) {
      await supabase.auth.signOut();
      navigate("/partner/auth", { replace: true });
      return;
    }

    const partnerId = (pu as any).partner_id;

    const [{ data: p }, { data: ls }, { data: cs }] = await Promise.all([
      supabase
        .from("partners")
        .select("id, company_name, contact_name, email, phone, partner_type, partner_program, service_zone, total_referrals, total_converted")
        .eq("id", partnerId)
        .maybeSingle(),
      supabase
        .from("leads")
        .select("id, name, phone, email, status, city, budget, created_at, status_changed_at, converted_to_project_id")
        .eq("referred_by_partner_id", partnerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("company_settings")
        .select("referral_commission_percent, company_name, phone, logo_url")
        .eq("organization_id", (pu as any).organization_id)
        .maybeSingle(),
    ]);

    if (p) {
      setPartner(p as any);
      // For trade partners, force initial view to "quotes" (their primary workflow)
      if ((p as any).partner_program === "trade") {
        setView((prev) => (prev === "earnings" || prev === "rewards" ? "quotes" : prev));
      }
    }
    if (ls) setLeads(ls as any);
    if (cs) {
      setCommissionPercent(Number((cs as any).referral_commission_percent) || 7);
      // Gate brand by org plan
      const { data: planRes } = await supabase.rpc("get_org_plan" as any, {
        p_org_id: (pu as any).organization_id,
      });
      const isPro = planRes === "pro" || planRes === "enterprise";
      const rawLogo = (cs as any).logo_url || null;
      const resolvedLogo = rawLogo ? await resolveLogoUrl(rawLogo) : null;
      setTenantBrand({
        company_name: isPro ? ((cs as any).company_name || "FloorPRO") : "FloorPRO",
        phone: isPro ? ((cs as any).phone || "") : "",
        logo_url: isPro ? resolvedLogo : null,
      });
    }

    // Load notifications for this partner user
    const { data: notifs } = await supabase
      .from("notifications")
      .select("id, title, body, link, read, created_at")
      .eq("user_id", session.session.user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (notifs) setNotifications(notifs as any);

    setLoading(false);
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unread.map((n) => n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };


  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tenantBrand.company_name) {
      document.title = `${tenantBrand.company_name} Partner Portal`;
    }
  }, [tenantBrand.company_name]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/partner/auth", { replace: true });
  };

  // Stage counts (memo)
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of leads) counts[l.status] = (counts[l.status] || 0) + 1;
    return counts;
  }, [leads]);

  // Stale detection: no status change in 7+ days, still active
  const STALE_MS = 7 * 24 * 60 * 60 * 1000;
  const isStale = (l: Lead) => {
    if (["completed", "lost"].includes(l.status)) return false;
    const ref = l.status_changed_at || l.created_at;
    return Date.now() - new Date(ref).getTime() > STALE_MS;
  };
  const staleCount = useMemo(() => leads.filter(isStale).length, [leads]);

  // Filtered + grouped leads
  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (activeStage && l.status !== activeStage) return false;
      if (needsAttention && !isStale(l)) return false;
      if (term) {
        const hay = `${l.name} ${l.phone} ${l.city || ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [leads, activeStage, search, needsAttention]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Lead[]> = {};
    for (const l of filteredLeads) {
      const d = new Date(l.created_at);
      const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      (groups[key] ||= []).push(l);
    }
    return groups;
  }, [filteredLeads]);

  const convertedLeads = leads.filter((l) => l.status === "completed");
  const estimatedCommissions = convertedLeads.reduce(
    (sum, l) => sum + ((l.budget || 0) * commissionPercent) / 100,
    0
  );
  const conversionRate =
    leads.length > 0 ? ((convertedLeads.length / leads.length) * 100).toFixed(0) : "0";

  // Active pipeline value (potential commission from non-terminal leads)
  const pipelineValue = leads
    .filter((l) => !["completed", "lost"].includes(l.status))
    .reduce((s, l) => s + ((l.budget || 0) * commissionPercent) / 100, 0);

  // Global pipeline progress (avg stage index of active leads / total active stages)
  const ACTIVE_STAGE_KEYS = PARTNER_LEAD_STAGES.filter(
    (s) => s.key !== "completed" && s.key !== "lost"
  ).map((s) => s.key);
  const activeLeadsForProgress = leads.filter((l) => ACTIVE_STAGE_KEYS.includes(l.status));
  const pipelineProgress =
    activeLeadsForProgress.length === 0
      ? 0
      : (activeLeadsForProgress.reduce(
          (s, l) => s + (ACTIVE_STAGE_KEYS.indexOf(l.status) + 1),
          0
        ) /
          activeLeadsForProgress.length /
          ACTIVE_STAGE_KEYS.length) *
        100;

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalRefs = leads.length;
  // Tier thresholds (Bronze < 5, Silver 5+, Gold 15+, Platinum 30+, Diamond 50+)
  const tier =
    totalRefs >= 50 ? { name: "Diamond", next: null, progress: 100 } :
    totalRefs >= 30 ? { name: "Platinum", next: 50, progress: ((totalRefs - 30) / 20) * 100 } :
    totalRefs >= 15 ? { name: "Gold", next: 30, progress: ((totalRefs - 15) / 15) * 100 } :
    totalRefs >= 5  ? { name: "Silver", next: 15, progress: ((totalRefs - 5) / 10) * 100 } :
                      { name: "Bronze", next: 5, progress: (totalRefs / 5) * 100 };

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-2 pb-1">
          {/* Tenant brand */}
          <div className="flex items-center gap-1.5 mb-1">
            {tenantBrand.logo_url ? (
              <img
                src={tenantBrand.logo_url}
                alt={`${tenantBrand.company_name} logo`}
                className="h-4 w-auto object-contain opacity-80"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <Handshake className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
              {tenantBrand.company_name}
            </span>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            {partner?.partner_type === "realtor" ? (
              <Home className="w-5 h-5 text-primary" />
            ) : (
              <Handshake className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground leading-none">Welcome,</p>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold leading-tight truncate">
                {partner?.contact_name || partner?.company_name}
              </p>
              {partner?.partner_type === "realtor" && (
                <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Realtor
                </span>
              )}
            </div>
          </div>
          {/* Notification bell */}
          <Popover open={notifOpen} onOpenChange={(o) => { setNotifOpen(o); if (o) markAllNotificationsRead(); }}>
            <PopoverTrigger asChild>
              <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-semibold">Notifications</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={cn("px-3 py-2.5 border-b last:border-0", !n.read && "bg-primary/5")}>
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
            {partner?.partner_program === "trade" ? "Trade" : tier.name}
          </span>
        </div>
      </header>


      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* PIPELINE VIEW */}
        {view === "pipeline" && (
          <>
            <div className={cn("grid gap-2", partner?.partner_program === "trade" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4")}>
              <Card className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                  <span>Total</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{leads.length}</p>
              </Card>
              <Card className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Conversion</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{conversionRate}%</p>
              </Card>
              {partner?.partner_program !== "trade" && (
                <>
                  <Card className="p-3 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Zap className="w-3 h-3" />
                      <span>Pipeline</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      ${pipelineValue.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">potential</p>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <DollarSign className="w-3 h-3" />
                      <span>Earned</span>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">${estimatedCommissions.toFixed(0)}</p>
                  </Card>
                </>
              )}
            </div>

            {/* Global pipeline progress */}
            {activeLeadsForProgress.length > 0 && (
              <Card className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Pipeline Progress
                  </p>
                  <p className="text-[11px] tabular-nums font-semibold">{pipelineProgress.toFixed(0)}%</p>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-emerald-500 transition-all"
                    style={{ width: `${pipelineProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {activeLeadsForProgress.length} active referral{activeLeadsForProgress.length > 1 ? "s" : ""} moving through the pipeline
                </p>
              </Card>
            )}


            {leads.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Filter by stage
                  </p>
                  {staleCount > 0 && (
                    <button
                      onClick={() => setNeedsAttention((v) => !v)}
                      className={cn(
                        "flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border transition-colors",
                        needsAttention
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                      )}
                    >
                      <AlertCircle className="w-3 h-3" />
                      Needs attention · {staleCount}
                    </button>
                  )}
                </div>
                <PartnerStageBar counts={stageCounts} active={activeStage} onSelect={setActiveStage} />
              </div>
            )}

            {leads.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-9"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2 gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  {activeStage
                    ? `${PARTNER_LEAD_STAGES.find((s) => s.key === activeStage)?.label || ""} (${filteredLeads.length})`
                    : `Your Referrals (${filteredLeads.length})`}
                </h2>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(activeStage || search || needsAttention) && (
                    <button
                      onClick={() => {
                        setActiveStage(null);
                        setSearch("");
                        setNeedsAttention(false);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Clear
                    </button>
                  )}
                  <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
                    <button
                      onClick={() => updatePipelineMode("list")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors",
                        pipelineMode === "list"
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      List
                    </button>
                    <button
                      onClick={() => updatePipelineMode("board")}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors",
                        pipelineMode === "board"
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Board
                    </button>
                  </div>
                </div>
              </div>

              {leads.length === 0 ? (
                <Card className="p-8 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No referrals yet. Send your first lead!</p>
                  <Button onClick={() => setSheetOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Send Lead
                  </Button>
                </Card>
              ) : filteredLeads.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No leads match this filter.</p>
                </Card>
              ) : pipelineMode === "board" ? (
                <PartnerPipelineBoard
                  leads={filteredLeads}
                  commissionPercent={commissionPercent}
                  onSelect={(l) => setSelectedLead(l)}
                />
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedByMonth).map(([month, items]) => (
                    <div key={month} className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
                        {month} · {items.length}
                      </p>
                      <div className="space-y-2">
                        {items.map((lead) => {
                          const commission =
                            lead.status === "completed" && lead.budget
                              ? (lead.budget * commissionPercent) / 100
                              : 0;
                          return (
                            <PartnerLeadCard
                              key={lead.id}
                              lead={lead}
                              commission={commission}
                              onClick={() => setSelectedLead(lead)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact tenant */}
            {tenantBrand.phone && (
              <Card className="p-3 border-primary/10 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-foreground leading-tight">
                      Contact {tenantBrand.company_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Quick questions about a referral?
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${tenantBrand.phone.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                    <a
                      href={`tel:${tenantBrand.phone.replace(/[^\d]/g, "")}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {/* EARNINGS VIEW */}
        {view === "earnings" && (
          <>
            <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Earned</p>
              <p className="text-4xl font-bold tabular-nums">${estimatedCommissions.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {commissionPercent}% commission on completed projects
              </p>
            </Card>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Completed ({convertedLeads.length})
              </h2>
              {convertedLeads.length === 0 ? (
                <Card className="p-6 text-center">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No completed projects yet.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {convertedLeads.map((lead) => {
                    const commission = ((lead.budget || 0) * commissionPercent) / 100;
                    return (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className="w-full text-left rounded-lg border bg-card text-card-foreground shadow-sm p-3 flex items-center justify-between hover:border-primary/40 hover:bg-muted/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{lead.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {lead.city || "—"} · ${(lead.budget || 0).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-primary tabular-nums">
                          +${commission.toFixed(0)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {partner && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Referred Proposals
                </h2>
                <PartnerReferredProposals
                  partnerId={partner.id}
                  commissionPercent={commissionPercent}
                />
              </div>
            )}
          </>
        )}

        {/* REWARDS VIEW */}
        {view === "rewards" && (
          <>
            <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Current Tier</p>
                  <p className="text-3xl font-bold">{tier.name}</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-primary" />
                </div>
              </div>
              {tier.next !== null ? (
                <>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, tier.progress)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {tier.next - totalRefs} more referrals to reach next tier
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground">Top tier reached. Keep going!</p>
              )}
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Card className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Referrals</p>
                <p className="text-3xl font-bold tabular-nums mt-1">{totalRefs}</p>
              </Card>
              <Card className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Conversion</p>
                <p className="text-3xl font-bold tabular-nums mt-1">{conversionRate}%</p>
              </Card>
            </div>

            <Card className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Tier Ladder
              </p>
              <div className="space-y-1.5 text-sm">
                {[
                  { name: "Bronze", at: 0 },
                  { name: "Silver", at: 5 },
                  { name: "Gold", at: 15 },
                  { name: "Platinum", at: 30 },
                  { name: "Diamond", at: 50 },
                ].map((t) => {
                  const reached = totalRefs >= t.at;
                  const current = t.name === tier.name;
                  return (
                    <div
                      key={t.name}
                      className={cn(
                        "flex items-center justify-between py-1.5 px-2 rounded",
                        current && "bg-primary/10"
                      )}
                    >
                      <span className={cn("font-medium", reached ? "text-foreground" : "text-muted-foreground")}>
                        {t.name}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {t.at}+ refs
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {/* QUOTES VIEW */}
        {view === "quotes" && partner && (
          <>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Cotações B2B
              </h2>
              <PartnerQuotesTab partnerId={partner.id} />
            </div>
          </>
        )}

        {/* GALLERY VIEW */}
        {view === "gallery" && (
          <PartnerGalleryTab
            partnerCode={partner?.id}
            partnerName={partner?.contact_name || partner?.company_name}
          />
        )}

        {/* PROFILE VIEW */}
        {view === "profile" && partner && (
          <PartnerProfileTab
            partner={partner}
            email={authEmail}
            liveReferrals={leads.length}
            liveConverted={convertedLeads.length}
            onUpdated={loadData}
            onLogout={handleLogout}
          />
        )}
      </main>

      <PartnerBottomNav
        active={view}
        onChange={setView}
        onNewReferral={() => setSheetOpen(true)}
        onFloorDiagnostic={() => setDiagnosticOpen(true)}
        program={partner?.partner_program || "referral"}
        companyName={tenantBrand.company_name}
        phoneNumber={tenantBrand.phone}
        whatsappNumber={tenantBrand.phone ? tenantBrand.phone.replace(/[^\d]/g, "") : ""}
      />

      <NewReferralSheet open={sheetOpen} onOpenChange={setSheetOpen} onCreated={loadData} />

      <Sheet open={diagnosticOpen} onOpenChange={setDiagnosticOpen}>
        <SheetContent side="bottom" className="h-[95vh] overflow-y-auto p-0">
          <SheetHeader className="px-4 pt-4 pb-2 pr-12 sticky top-0 bg-background z-0 border-b">
            <SheetTitle className="text-lg font-semibold">Floor Diagnostic</SheetTitle>
            <SheetDescription>
              Guided assessment — hand the device to your client or fill it together.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 sm:p-6 pb-12">
            <QuizFlow
              embedded
              partnerId={partner?.id}
              onComplete={() => {
                setDiagnosticOpen(false);
                loadData();
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <PartnerLeadDetailSheet
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(o) => !o && setSelectedLead(null)}
        commissionPercent={commissionPercent}
        partnerName={partner?.contact_name || partner?.company_name || "Partner"}
      />
    </div>
  );
}

