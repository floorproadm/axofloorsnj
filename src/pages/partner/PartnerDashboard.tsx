import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, LogOut, Handshake, DollarSign, TrendingUp, Users } from "lucide-react";
import { NewReferralSheet } from "@/components/partner/NewReferralSheet";

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
  total_referrals: number;
  total_converted: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  cold_lead: { label: "New", color: "bg-slate-500/10 text-slate-700 dark:text-slate-300" },
  warm_lead: { label: "Contacted", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  estimate_requested: { label: "Estimate Requested", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
  estimate_scheduled: { label: "Estimate Scheduled", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300" },
  in_draft: { label: "Drafting", color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
  proposal_sent: { label: "Proposal Sent", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  in_production: { label: "In Production", color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
  completed: { label: "Completed ✓", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  lost: { label: "Lost", color: "bg-red-500/10 text-red-700 dark:text-red-300" },
};

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [commissionPercent, setCommissionPercent] = useState(7);
  const [sheetOpen, setSheetOpen] = useState(false);

  const loadData = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      navigate("/partner/auth", { replace: true });
      return;
    }

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
      supabase.from("partners").select("id, company_name, contact_name, total_referrals, total_converted").eq("id", partnerId).maybeSingle(),
      supabase.from("leads").select("id, name, phone, email, status, city, budget, created_at, converted_to_project_id").eq("referred_by_partner_id", partnerId).order("created_at", { ascending: false }),
      supabase.from("company_settings").select("referral_commission_percent").eq("organization_id", (pu as any).organization_id).maybeSingle(),
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

  const convertedLeads = leads.filter((l) => l.status === "completed");
  const estimatedCommissions = convertedLeads.reduce((sum, l) => sum + ((l.budget || 0) * commissionPercent) / 100, 0);
  const conversionRate = leads.length > 0 ? ((convertedLeads.length / leads.length) * 100).toFixed(0) : "0";

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
              <p className="text-sm font-semibold leading-tight">{partner?.contact_name || partner?.company_name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
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
            Commission rate: <span className="font-semibold text-foreground">{commissionPercent}%</span> on completed projects
          </p>
        </Card>

        {/* Leads list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Referrals</h2>
            <Button size="sm" onClick={() => setSheetOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Lead
            </Button>
          </div>

          {leads.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No referrals yet. Send your first lead!</p>
              <Button onClick={() => setSheetOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Send Lead
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => {
                const status = STATUS_LABELS[lead.status] || { label: lead.status, color: "bg-muted" };
                const commission = lead.status === "completed" && lead.budget ? (lead.budget * commissionPercent) / 100 : 0;
                return (
                  <Card key={lead.id} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.phone}
                          {lead.city ? ` · ${lead.city}` : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className={`${status.color} text-[10px] whitespace-nowrap`}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                      {commission > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+${commission.toFixed(0)}</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <NewReferralSheet open={sheetOpen} onOpenChange={setSheetOpen} onCreated={loadData} />
    </div>
  );
}
