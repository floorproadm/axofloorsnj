import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Handshake, DollarSign, TrendingUp, Users, Search, X, Trophy, CheckCircle2 } from "lucide-react";
import { NewReferralSheet } from "@/components/partner/NewReferralSheet";
import { PartnerStageBar, PARTNER_LEAD_STAGES } from "@/components/partner/PartnerStageBar";
import { PartnerLeadCard } from "@/components/partner/PartnerLeadCard";
import { PartnerProfileTab } from "@/components/partner/PartnerProfileTab";
import { PartnerBottomNav, type PartnerView } from "@/components/partner/PartnerBottomNav";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  city: string | null;
  budget: number | null;
  created_at: string;
  converted_to_project_id: string | null;
}

interface PartnerInfo {
  id: string;
  company_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  partner_type: string;
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
  const [authEmail, setAuthEmail] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
        .select("id, company_name, contact_name, email, phone, partner_type, service_zone, total_referrals, total_converted")
        .eq("id", partnerId)
        .maybeSingle(),
      supabase
        .from("leads")
        .select("id, name, phone, email, status, city, budget, created_at, converted_to_project_id")
        .eq("referred_by_partner_id", partnerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("company_settings")
        .select("referral_commission_percent")
        .eq("organization_id", (pu as any).organization_id)
        .maybeSingle(),
    ]);

    if (p) setPartner(p as any);
    if (ls) setLeads(ls as any);
    if (cs) setCommissionPercent(Number((cs as any).referral_commission_percent) || 7);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Filtered + grouped leads
  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (activeStage && l.status !== activeStage) return false;
      if (term) {
        const hay = `${l.name} ${l.phone} ${l.city || ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [leads, activeStage, search]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none">Welcome,</p>
              <p className="text-sm font-semibold leading-tight">
                {partner?.contact_name || partner?.company_name}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <Tabs defaultValue="pipeline" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-4 mt-0">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-2">
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
              <Card className="p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Earned</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">${estimatedCommissions.toFixed(0)}</p>
              </Card>
            </div>

            <Card className="p-3 bg-primary/5 border-primary/20">
              <p className="text-xs text-muted-foreground">
                Commission rate:{" "}
                <span className="font-semibold text-foreground">{commissionPercent}%</span> on completed projects
              </p>
            </Card>

            {/* Stage filter bar */}
            {leads.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Filter by stage
                </p>
                <PartnerStageBar counts={stageCounts} active={activeStage} onSelect={setActiveStage} />
              </div>
            )}

            {/* Search */}
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

            {/* Leads list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeStage
                    ? `${PARTNER_LEAD_STAGES.find((s) => s.key === activeStage)?.label || ""} (${filteredLeads.length})`
                    : `Your Referrals (${filteredLeads.length})`}
                </h2>
                {(activeStage || search) && (
                  <button
                    onClick={() => {
                      setActiveStage(null);
                      setSearch("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Clear filters
                  </button>
                )}
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
                          return <PartnerLeadCard key={lead.id} lead={lead} commission={commission} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            {partner && (
              <PartnerProfileTab
                partner={partner}
                email={authEmail}
                onUpdated={loadData}
                onLogout={handleLogout}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <NewReferralSheet open={sheetOpen} onOpenChange={setSheetOpen} onCreated={loadData} />
    </div>
  );
}
