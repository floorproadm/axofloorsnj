import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Handshake, Users, TrendingUp, Zap, DollarSign, Bell, Search,
  Plus, MapPin, Phone, MessageSquare, Eye, X, Copy, Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  budget: number;
  status: string;
  days: number;
}

const INITIAL_LEADS: Lead[] = [
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
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<Lead | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", city: "", budget: "" });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (activeStage && l.status !== activeStage) return false;
      if (term && !`${l.name} ${l.phone} ${l.city}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [leads, activeStage, search]);

  const total = leads.length;
  const converted = leads.filter((l) => l.status === "won").length;
  const conv = total ? ((converted / total) * 100).toFixed(0) : "0";
  const pipelineValue = leads.filter((l) => !["won", "lost"].includes(l.status))
    .reduce((s, l) => s + (l.budget * 0.07), 0);
  const earned = leads.filter((l) => l.status === "won")
    .reduce((s, l) => s + (l.budget * 0.07), 0);

  const stageCounts: Record<string, number> = {};
  for (const l of leads) stageCounts[l.status] = (stageCounts[l.status] || 0) + 1;

  const handleAdd = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone required");
      return;
    }
    const newLead: Lead = {
      id: String(Date.now()),
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim() || "—",
      budget: Number(form.budget) || 0,
      status: "new",
      days: 0,
    };
    setLeads((prev) => [newLead, ...prev]);
    setForm({ name: "", phone: "", city: "", budget: "" });
    setAddOpen(false);
    toast.success(`Referral added: ${newLead.name}`);
  };

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
          <button
            onClick={() => toast.info("3 new notifications (sample)")}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted"
          >
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
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Filter by stage</p>
            {activeStage && (
              <button onClick={() => setActiveStage(null)} className="text-[11px] text-primary font-semibold flex items-center gap-1">
                Clear <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(STAGE_LABEL).map(([k, label]) => {
              const active = activeStage === k;
              return (
                <button
                  key={k}
                  onClick={() => setActiveStage(active ? null : k)}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    active ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${STAGE_COLOR[k]}`} />
                  {label} · {stageCounts[k] || 0}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Your Referrals · {filtered.length}
          </p>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> New referral
          </Button>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No referrals match this filter.
          </Card>
        ) : (
          <Card className="divide-y overflow-hidden">
            {filtered.map((l) => (
              <button
                key={l.id}
                onClick={() => setDetail(l)}
                className="w-full text-left p-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
              >
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
              </button>
            ))}
          </Card>
        )}
      </main>

      {/* New referral sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>New Referral</SheetTitle>
            <SheetDescription>Submit a homeowner you'd like to refer.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Full name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></div>
            <div><Label className="text-xs">Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" /></div>
            <div><Label className="text-xs">City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Montclair, NJ" /></div>
            <div><Label className="text-xs">Estimated budget</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="5000" /></div>
            <Button className="w-full mt-2" onClick={handleAdd}>Submit referral</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail sheet */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <SheetHeader className="text-left mb-4">
                <SheetTitle>{detail.name}</SheetTitle>
                <SheetDescription>
                  <Badge variant="outline" className="mt-1">{STAGE_LABEL[detail.status]}</Badge>
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-3 text-sm">
                <Row label="Phone" value={detail.phone} />
                <Row label="Location" value={detail.city} />
                <Row label="Budget" value={`$${detail.budget.toLocaleString()}`} />
                <Row label="Commission (7%)" value={`$${(detail.budget * 0.07).toFixed(0)}`} />
                <Row label="Created" value={`${detail.days} day${detail.days === 1 ? "" : "s"} ago`} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Button variant="outline" onClick={() => toast.info("Call (sample)")}><Phone className="w-4 h-4 mr-1" /> Call</Button>
                <Button variant="outline" onClick={() => toast.info("Message sent (sample)")}><MessageSquare className="w-4 h-4 mr-1" /> Message</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
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
      SAMPLE PREVIEW — Interactive demo with mock data
      <Link to="/admin/settings?section=demo_portals" className="underline ml-2">Back to settings</Link>
    </div>
  );
}
