import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Gift, Users, TrendingUp, DollarSign, Share2, Copy, MessageCircle,
  Mail, QrCode, Plus, Trophy, Search, Eye, Check, X, Phone, MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Ref {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  credit: number;
  date: string;
}
const INITIAL_REFS: Ref[] = [
  { id: "1", name: "Jennifer Lee", phone: "+1 (201) 555-0142", email: "jennifer.lee@email.com", address: "142 Maple Ave, Montclair, NJ 07042", status: "converted", credit: 200, date: "Jun 12, 2026" },
  { id: "2", name: "Robert Allen", phone: "+1 (201) 555-0198", email: "robert.allen@email.com", address: "38 Oak St, Bloomfield, NJ 07003", status: "contacted", credit: 0, date: "Jun 8, 2026" },
  { id: "3", name: "Maria Santos", phone: "+1 (201) 555-0175", email: "maria.santos@email.com", address: "55 Pine Rd, Clifton, NJ 07013", status: "converted", credit: 200, date: "May 30, 2026" },
  { id: "4", name: "Tom Bradley", phone: "+1 (201) 555-0133", email: "tom.bradley@email.com", address: "91 Cedar Ln, Wayne, NJ 07470", status: "pending", credit: 0, date: "May 22, 2026" },
  { id: "5", name: "Anna Wilson", phone: "+1 (201) 555-0167", email: "anna.wilson@email.com", address: "27 Birch Blvd, Hoboken, NJ 07030", status: "converted", credit: 200, date: "May 15, 2026" },
];

const STAGE: Record<string, { label: string; dot: string; chip: string }> = {
  pending: { label: "Pending", dot: "bg-muted-foreground/40", chip: "bg-muted text-muted-foreground" },
  contacted: { label: "Contacted", dot: "bg-blue-500", chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  converted: { label: "Converted", dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
};

const REFERRAL_URL = "https://www.axofloorsnj.com/referral-program?ref=SARAH-2026";

export default function SampleReferralPortal() {
  const [refs, setRefs] = useState<Ref[]>(INITIAL_REFS);
  const [search, setSearch] = useState("");
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [copied, setCopied] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRef, setSelectedRef] = useState<Ref | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return refs.filter((r) => {
      if (activeStage && r.status !== activeStage) return false;
      if (term && !r.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [refs, search, activeStage]);

  const total = refs.length;
  const converted = refs.filter((r) => r.status === "converted").length;
  const credits = refs.reduce((s, r) => s + r.credit, 0);
  const conv = total ? ((converted / total) * 100).toFixed(0) : "0";

  const stageCounts: Record<string, number> = {};
  for (const r of refs) stageCounts[r.status] = (stageCounts[r.status] || 0) + 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_URL);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone required");
      return;
    }
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setRefs((prev) => [{ id: String(Date.now()), name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), address: "", status: "pending", credit: 0, date: today }, ...prev]);
    setForm({ name: "", phone: "", email: "" });
    setAddOpen(false);
    toast.success("Referral added!");
  };

  const share = (kind: string) => {
    const text = `Check out AXO Floors! Use my referral link: ${REFERRAL_URL}`;
    if (kind === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    else if (kind === "sms") window.open(`sms:?body=${encodeURIComponent(text)}`);
    else if (kind === "email") window.open(`mailto:?subject=${encodeURIComponent("Check out AXO Floors!")}&body=${encodeURIComponent(text)}`);
    else toast.info("QR code ready (sample)");
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      <SampleBanner />

      <header className="bg-card border-b sticky top-10 z-10 px-4 py-3 flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground leading-none">Welcome,</p>
          <p className="text-sm font-semibold leading-tight truncate">Sarah</p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-primary/10 text-amber-600">
          <Trophy className="w-3 h-3 inline mr-1" /> Gold
        </span>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard icon={Users} label="Referrals" value={String(total)} />
          <StatCard icon={TrendingUp} label="Converted" value={String(converted)} />
          <StatCard icon={TrendingUp} label="Rate" value={`${conv}%`} />
          <StatCard icon={DollarSign} label="Credits" value={`$${credits}`} highlight />
        </div>

        <Card className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Tier Progress</p>
            <p className="text-[11px] tabular-nums font-semibold">{converted}/10 converted</p>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: `${(converted / 10) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{Math.max(10 - converted, 0)} more to unlock Diamond</p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            <Share2 className="w-3 h-3" />
            <span>Your Referral Link</span>
            <span className="ml-auto font-mono text-primary normal-case tracking-normal text-xs">SARAH-2026</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 text-xs font-mono truncate flex items-center">
              {REFERRAL_URL}
            </div>
            <Button size="icon" variant="outline" className="shrink-0" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => share("whatsapp")}>
              <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => share("sms")}>
              <Share2 className="w-3.5 h-3.5 mr-1" /> SMS
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => share("email")}>
              <Mail className="w-3.5 h-3.5 mr-1" /> Email
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => share("qr")}>
              <QrCode className="w-3.5 h-3.5 mr-1" /> QR
            </Button>
          </div>
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
            {Object.entries(STAGE).map(([k, meta]) => {
              const active = activeStage === k;
              return (
                <button
                  key={k}
                  onClick={() => setActiveStage(active ? null : k)}
                  className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                    active ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label} · {stageCounts[k] || 0}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search referrals by name..."
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
          <Button size="sm" className="h-8 text-xs" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add referral
          </Button>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No referrals match this filter.</Card>
        ) : (
          <Card className="divide-y overflow-hidden">
            {filtered.map((r) => {
              const meta = STAGE[r.status];
              return (
                <div
                  key={r.id}
                  className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => { setSelectedRef(r); setDetailOpen(true); }}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight truncate">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.date}</p>
                  </div>
                  {r.credit > 0 && (
                    <span className="text-xs font-bold text-emerald-600 tabular-nums">+${r.credit}</span>
                  )}
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${meta.chip}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </Card>
        )}
      </main>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Add a referral</SheetTitle>
            <SheetDescription>Submit a friend directly. We'll reach out and credit you on conversion.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <Button className="w-full mt-2" onClick={handleAdd}>Submit referral</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: any) {
  return (
    <Card className={`p-3 ${highlight ? "border-primary/20 bg-primary/5" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
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
