import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Copy,
  Check,
  Share2,
  MessageCircle,
  Mail,
  Users,
  DollarSign,
  TrendingUp,
  LogOut,
  Gift,
  Search,
  X,
  Plus,
  QrCode,
  Trophy,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ReferralProfile, Referral, ReferralReward, ReferralTier, getTierInfo } from '@/hooks/useReferralProfile';
import ReferralQRCode from './ReferralQRCode';
import AddReferralForm from './AddReferralForm';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Props {
  profile: ReferralProfile;
  referrals: Referral[];
  rewards: ReferralReward[];
  tier: ReferralTier;
  isLoading: boolean;
  onAddReferral: (name: string, phone: string, email?: string) => Promise<any>;
  onSignOut?: () => void;
}

const STAGE_META: Record<string, { label: string; dot: string; chip: string }> = {
  pending: { label: 'Pending', dot: 'bg-muted-foreground/40', chip: 'bg-muted text-muted-foreground' },
  contacted: { label: 'Contacted', dot: 'bg-blue-500', chip: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  converted: { label: 'Converted', dot: 'bg-emerald-500', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  expired: { label: 'Expired', dot: 'bg-muted-foreground/30', chip: 'bg-muted text-muted-foreground' },
};

export default function ReferralDashboard({
  profile,
  referrals,
  rewards,
  tier,
  isLoading,
  onAddReferral,
  onSignOut,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const SITE_BASE_URL = 'https://www.axofloorsnj.com';
  const referralUrl = `${SITE_BASE_URL}/referral-program?ref=${profile.referral_code}`;

  const tierInfo = getTierInfo(tier);
  const nextThreshold = tierInfo.next;
  const tierProgress = nextThreshold ? Math.min((profile.total_converted / nextThreshold) * 100, 100) : 100;

  // Stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of referrals) counts[r.status] = (counts[r.status] || 0) + 1;
    return counts;
  }, [referrals]);

  // Filtered referrals
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return referrals.filter((r) => {
      if (activeStage && r.status !== activeStage) return false;
      if (term && !r.referred_name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [referrals, activeStage, search]);

  // Group by month
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Referral[]> = {};
    for (const r of filtered) {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      (groups[key] ||= []).push(r);
    }
    return groups;
  }, [filtered]);

  const converted = referrals.filter((r) => r.status === 'converted').length;
  const conversionRate = referrals.length > 0 ? ((converted / referrals.length) * 100).toFixed(0) : '0';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({ title: 'Link Copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `Check out AXO Floors for amazing hardwood flooring! Use my referral link: ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };
  const handleSMS = () => {
    const text = `Hey! I love AXO Floors and thought you would too. Check them out: ${referralUrl}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
  };
  const handleEmail = () => {
    const subject = 'Check out AXO Floors!';
    const body = `I had an amazing experience with AXO Floors and wanted to share.\n\nUse my referral link: ${referralUrl}\n\nWe both benefit from their referral program!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleAdd = async (name: string, phone: string, email?: string) => {
    const res = await onAddReferral(name, phone, email);
    if (res) setAddOpen(false);
    return res;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground leading-none">Welcome,</p>
            <p className="text-sm font-semibold leading-tight truncate">
              {profile.name.split(' ')[0]}
            </p>
          </div>
          <span className={cn(
            'text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-primary/10',
            tierInfo.color
          )}>
            {tier === 'diamond' && <Trophy className="w-3 h-3 inline mr-1" />}
            {tierInfo.label}
          </span>
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-4 space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              <span>Referrals</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{profile.total_referrals}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>Converted</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{profile.total_converted}</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" />
              <span>Rate</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{conversionRate}%</p>
          </Card>
          <Card className="p-3 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span>Credits</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(profile.total_credits)}</p>
          </Card>
        </div>

        {/* Tier progress */}
        {nextThreshold && (
          <Card className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Tier Progress
              </p>
              <p className="text-[11px] tabular-nums font-semibold">
                {profile.total_converted}/{nextThreshold} converted
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {nextThreshold - profile.total_converted} more to unlock{' '}
              {getTierInfo(
                tier === 'starter' ? 'bronze' :
                tier === 'bronze' ? 'silver' :
                tier === 'silver' ? 'gold' : 'diamond'
              ).label}
            </p>
          </Card>
        )}

        {/* Referral link bar */}
        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            <Share2 className="w-3 h-3" />
            <span>Your Referral Link</span>
            <span className="ml-auto font-mono text-primary normal-case tracking-normal text-xs">
              {profile.referral_code}
            </span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 text-xs font-mono truncate flex items-center">
              {referralUrl}
            </div>
            <Button onClick={handleCopy} size="icon" variant="outline" className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <Button onClick={handleWhatsApp} variant="outline" size="sm" className="h-9 text-xs">
              <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
            </Button>
            <Button onClick={handleSMS} variant="outline" size="sm" className="h-9 text-xs">
              <Share2 className="w-3.5 h-3.5 mr-1" /> SMS
            </Button>
            <Button onClick={handleEmail} variant="outline" size="sm" className="h-9 text-xs">
              <Mail className="w-3.5 h-3.5 mr-1" /> Email
            </Button>
            <Button onClick={() => setQrOpen(true)} variant="outline" size="sm" className="h-9 text-xs">
              <QrCode className="w-3.5 h-3.5 mr-1" /> QR
            </Button>
          </div>
        </Card>

        {/* Stage filter chips */}
        {referrals.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Filter by stage
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveStage(null)}
                className={cn(
                  'text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors',
                  !activeStage
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                )}
              >
                All · {referrals.length}
              </button>
              {Object.entries(STAGE_META).map(([key, meta]) => {
                const count = stageCounts[key] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveStage(activeStage === key ? null : key)}
                    className={cn(
                      'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors',
                      activeStage === key
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted'
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                    {meta.label} · {count}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        {referrals.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search referrals by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Referrals list grouped by month */}
        <div>
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Your Referrals {filtered.length > 0 && `· ${filtered.length}`}
            </p>
            <Button onClick={() => setAddOpen(true)} size="sm" className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add referral
            </Button>
          </div>

          {referrals.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold mb-1">No referrals yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Share your link or add a referral manually to get started.
              </p>
              <Button onClick={() => setAddOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add your first referral
              </Button>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No referrals match this filter.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByMonth).map(([month, items]) => (
                <div key={month}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 px-1">
                    {month}
                  </p>
                  <Card className="divide-y overflow-hidden">
                    {items.map((r) => {
                      const meta = STAGE_META[r.status] || STAGE_META.pending;
                      return (
                        <div key={r.id} className="p-3 flex items-center gap-3">
                          <span className={cn('w-2 h-2 rounded-full shrink-0', meta.dot)} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-tight truncate">
                              {r.referred_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              {formatDate(r.created_at)}
                            </p>
                          </div>
                          {r.credit_amount > 0 && (
                            <span className="text-xs font-bold text-emerald-600 tabular-nums">
                              +{formatCurrency(r.credit_amount)}
                            </span>
                          )}
                          <span className={cn('text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full', meta.chip)}>
                            {meta.label}
                          </span>
                        </div>
                      );
                    })}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credit history */}
        {rewards.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Credit History
            </p>
            <Card className="divide-y overflow-hidden">
              {rewards.map((rw) => (
                <div key={rw.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight truncate">{rw.description || rw.type}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {formatDate(rw.created_at)}
                    </p>
                  </div>
                  <span className={cn(
                    'text-sm font-bold tabular-nums',
                    rw.type === 'credit' ? 'text-emerald-600' : 'text-destructive'
                  )}>
                    {rw.type === 'credit' ? '+' : '-'}{formatCurrency(rw.amount)}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </main>

      {/* Add referral sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Add a referral</SheetTitle>
            <SheetDescription>
              Submit a friend or neighbor directly. We'll reach out to them and credit you on conversion.
            </SheetDescription>
          </SheetHeader>
          <AddReferralForm onSubmit={handleAdd} isLoading={isLoading} />
        </SheetContent>
      </Sheet>

      {/* QR sheet */}
      <Sheet open={qrOpen} onOpenChange={setQrOpen}>
        <SheetContent side="bottom" className="max-h-[90vh]">
          <SheetHeader className="text-left mb-4">
            <SheetTitle>Your QR code</SheetTitle>
            <SheetDescription>Scan to open your referral link.</SheetDescription>
          </SheetHeader>
          <div className="flex justify-center py-6">
            <ReferralQRCode url={referralUrl} size={220} />
          </div>
          <p className="text-center text-xs text-muted-foreground font-mono break-all px-4">
            {referralUrl}
          </p>
        </SheetContent>
      </Sheet>
    </div>
  );
}
