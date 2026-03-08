import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Share2, MessageCircle, Mail, Users, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ReferralProfile, Referral, ReferralReward, ReferralTier } from '@/hooks/useReferralProfile';
import ReferralQRCode from './ReferralQRCode';
import ReferralTierBadge from './ReferralTierBadge';
import AddReferralForm from './AddReferralForm';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
  profile: ReferralProfile;
  referrals: Referral[];
  rewards: ReferralReward[];
  tier: ReferralTier;
  isLoading: boolean;
  onAddReferral: (name: string, phone: string, email?: string) => Promise<any>;
}

export default function ReferralDashboard({ profile, referrals, rewards, tier, isLoading, onAddReferral }: Props) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `${window.location.origin}?ref=${profile.referral_code}`;

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

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    converted: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      {/* Welcome + Tier */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold font-heading text-primary mb-1">
          Welcome, {profile.name.split(' ')[0]}!
        </h2>
        <p className="text-muted-foreground mb-4">Your referral code: <span className="font-mono font-bold text-accent">{profile.referral_code}</span></p>
        <ReferralTierBadge tier={tier} converted={profile.total_converted} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-accent" />
            <p className="text-2xl font-bold">{profile.total_referrals}</p>
            <p className="text-xs text-muted-foreground">Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{profile.total_converted}</p>
            <p className="text-xs text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-accent" />
            <p className="text-2xl font-bold">{formatCurrency(profile.total_credits)}</p>
            <p className="text-xs text-muted-foreground">Credits</p>
          </CardContent>
        </Card>
      </div>

      {/* Share Tools */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading">Share Your Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link + Copy */}
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate">
              {referralUrl}
            </div>
            <Button onClick={handleCopy} size="icon" variant="outline">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button onClick={handleWhatsApp} variant="outline" className="h-10 text-xs">
              <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
            </Button>
            <Button onClick={handleSMS} variant="outline" className="h-10 text-xs">
              <Share2 className="w-4 h-4 mr-1" /> SMS
            </Button>
            <Button onClick={handleEmail} variant="outline" className="h-10 text-xs">
              <Mail className="w-4 h-4 mr-1" /> Email
            </Button>
          </div>

          {/* QR Code */}
          <div className="flex justify-center pt-2">
            <ReferralQRCode url={referralUrl} size={160} />
          </div>
        </CardContent>
      </Card>

      {/* Add Referral */}
      <AddReferralForm onSubmit={onAddReferral} isLoading={isLoading} />

      {/* Referral History */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading">Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{r.referred_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.credit_amount > 0 && (
                      <span className="text-xs font-semibold text-green-600">{formatCurrency(r.credit_amount)}</span>
                    )}
                    <Badge className={statusColors[r.status] || 'bg-muted'} variant="secondary">
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards History */}
      {rewards.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading">Credit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rewards.map(rw => (
                <div key={rw.id} className="flex items-center justify-between p-2 text-sm">
                  <span className="text-muted-foreground">{rw.description || rw.type}</span>
                  <span className={rw.type === 'credit' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {rw.type === 'credit' ? '+' : '-'}{formatCurrency(rw.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
