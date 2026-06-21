import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Gift, Users, TrendingUp, DollarSign, Share2, Copy, MessageCircle,
  Mail, QrCode, Plus, Trophy, Search, Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

const REFS = [
  { name: "Jennifer Lee", status: "converted", credit: 200, date: "Jun 12, 2026" },
  { name: "Robert Allen", status: "contacted", credit: 0, date: "Jun 8, 2026" },
  { name: "Maria Santos", status: "converted", credit: 200, date: "May 30, 2026" },
  { name: "Tom Bradley", status: "pending", credit: 0, date: "May 22, 2026" },
  { name: "Anna Wilson", status: "converted", credit: 200, date: "May 15, 2026" },
];

const REWARDS = [
  { description: "Jennifer Lee — Project completed", amount: 200, type: "credit", date: "Jun 12, 2026" },
  { description: "Maria Santos — Project completed", amount: 200, type: "credit", date: "May 30, 2026" },
  { description: "Anna Wilson — Project completed", amount: 200, type: "credit", date: "May 15, 2026" },
];

const STAGE: Record<string, { label: string; dot: string; chip: string }> = {
  pending: { label: "Pending", dot: "bg-muted-foreground/40", chip: "bg-muted text-muted-foreground" },
  contacted: { label: "Contacted", dot: "bg-blue-500", chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  converted: { label: "Converted", dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
};

export default function SampleReferralPortal() {
  const total = REFS.length;
  const converted = REFS.filter((r) => r.status === "converted").length;
  const credits = REFS.reduce((s, r) => s + r.credit, 0);
  const conv = ((converted / total) * 100).toFixed(0);
  const referralUrl = "https://www.axofloorsnj.com/referral-program?ref=SARAH-2026";

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
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: `${(converted/10)*100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">{10 - converted} more to unlock Diamond</p>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            <Share2 className="w-3 h-3" />
            <span>Your Referral Link</span>
            <span className="ml-auto font-mono text-primary normal-case tracking-normal text-xs">SARAH-2026</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 text-xs font-mono truncate flex items-center">
              {referralUrl}
            </div>
            <Button size="icon" variant="outline" className="shrink-0">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <Button variant="outline" size="sm" className="h-9 text-xs">
              <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs">
              <Share2 className="w-3.5 h-3.5 mr-1" /> SMS
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs">
              <Mail className="w-3.5 h-3.5 mr-1" /> Email
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs">
              <QrCode className="w-3.5 h-3.5 mr-1" /> QR
            </Button>
          </div>
        </Card>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search referrals by name..."
            className="w-full pl-9 h-10 rounded-md border border-input bg-background text-sm"
            readOnly
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Your Referrals · {REFS.length}
          </p>
          <Button size="sm" className="h-8 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add referral
          </Button>
        </div>

        <Card className="divide-y overflow-hidden">
          {REFS.map((r, i) => {
            const meta = STAGE[r.status];
            return (
              <div key={i} className="p-3 flex items-center gap-3">
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

        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Credit History</p>
          <Card className="divide-y overflow-hidden">
            {REWARDS.map((rw, i) => (
              <div key={i} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight truncate">{rw.description}</p>
                  <p className="text-[11px] text-muted-foreground">{rw.date}</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-emerald-600">+${rw.amount}</span>
              </div>
            ))}
          </Card>
        </div>
      </main>
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
      SAMPLE PREVIEW — Read-only demo with mock data
      <Link to="/admin/settings?section=demo_portals" className="underline ml-2">Back to settings</Link>
    </div>
  );
}
