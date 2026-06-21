import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Handshake, Users, TrendingUp, Zap, DollarSign, Bell, Search,
  Plus, MapPin, Phone, MessageSquare, Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

const LEADS = [
  { id: "1", name: "Sarah Johnson", phone: "(973) 555-0144", city: "Montclair, NJ", budget: 8500, status: "won", days: 2 },
  { id: "2", name: "Michael Chen", phone: "(908) 555-0117", city: "Summit, NJ", budget: 12000, status: "proposal_sent", days: 1 },
  { id: "3", name: "Emma Davis", phone: "(862) 555-0192", city: "West Orange, NJ", budget: 4500, status: "contacted", days: 4 },
  { id: "4", name: "David Park", phone: "(201) 555-0163", city: "Hoboken, NJ", budget: 18500, status: "appointment_scheduled", days: 0 },
  { id: "5", name: "Lisa Thompson", phone: "(973) 555-0188", city: "Bloomfield, NJ", budget: 6200, status: "new", days: 6 },
];

const STAGE_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  appointment_scheduled: "Appointment",
  proposal_sent: "Proposal Sent",
  won: "Converted",
};
const STAGE_COLOR: Record<string, string> = {
  new: "bg-muted-foreground/30",
  contacted: "bg-blue-500",
  appointment_scheduled: "bg-amber-500",
  proposal_sent: "bg-purple-500",
  won: "bg-emerald-500",
};

export default function SamplePartnerPortal() {
  const total = LEADS.length;
  const converted = LEADS.filter((l) => l.status === "won").length;
  const conv = ((converted / total) * 100).toFixed(0);
  const pipelineValue = LEADS.filter((l) => !["won", "lost"].includes(l.status))
    .reduce((s, l) => s + (l.budget * 0.07), 0);
  const earned = LEADS.filter((l) => l.status === "won")
    .reduce((s, l) => s + (l.budget * 0.07), 0);

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <SampleBanner />
      <header className="bg-card border-b sticky top-10 z-10">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Handshake className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight truncate">FloorPRO</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
              Partner Portal
            </p>
          </div>
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">3</span>
          </button>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-2.5 pt-1 flex items-center gap-2 border-t border-border/40">
          <p className="text-sm text-muted-foreground flex-1 truncate pt-2">
            Welcome, <span className="font-semibold text-foreground">Carla Mendes</span>
          </p>
          <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary mt-1.5">
            Gold
          </span>
          <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground mt-1.5">
            Realtor
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard icon={Users} label="Total" value={String(total)} />
          <StatCard icon={TrendingUp} label="Conversion" value={`${conv}%`} />
          <StatCard icon={Zap} label="Pipeline" value={`$${pipelineValue.toFixed(0)}`} sub="potential" highlight />
          <StatCard icon={DollarSign} label="Earned" value={`$${earned.toFixed(0)}`} />
        </div>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Tier Progress</p>
            <p className="text-[11px] tabular-nums font-semibold">18/30 converted</p>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: "60%" }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">12 more to unlock Platinum</p>
        </Card>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Filter by stage</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(STAGE_LABEL).map(([k, label]) => (
              <button key={k} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-card text-muted-foreground border-border">
                <span className={`w-1.5 h-1.5 rounded-full ${STAGE_COLOR[k]}`} />
                {label} · {LEADS.filter((l) => l.status === k).length}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search by name, phone, city..."
            className="w-full pl-9 h-10 rounded-md border border-input bg-background text-sm"
            readOnly
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Your Referrals · {LEADS.length}
          </p>
          <Button size="sm" className="h-8 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> New referral
          </Button>
        </div>

        <Card className="divide-y overflow-hidden">
          {LEADS.map((l) => (
            <div key={l.id} className="p-3 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STAGE_COLOR[l.status]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight truncate">{l.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.city}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold tabular-nums">${l.budget.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{l.days}d ago</p>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider shrink-0 hidden sm:inline-flex">
                {STAGE_LABEL[l.status]}
              </Badge>
            </div>
          ))}
        </Card>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Latest Updates</p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Sarah Johnson</strong> — Project completed. Commission ${(8500 * 0.07).toFixed(0)} ready.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong className="text-foreground">Michael Chen</strong> — Proposal sent for review.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, highlight }: any) {
  return (
    <Card className={`p-3 ${highlight ? "border-primary/20 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}

function SampleBanner() {
  return (
    <div className="bg-amber-500/95 text-white text-center text-[11px] font-semibold py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-20">
      <Eye className="w-3.5 h-3.5" />
      SAMPLE PREVIEW — Read-only demo with mock data
      <Link to="/admin/settings?section=demo_portals" className="underline ml-2">Back to settings</Link>
    </div>
  );
}
