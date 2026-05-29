import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AXO_ORG_ID } from '@/lib/constants';

export interface ReferralProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  referral_code: string;
  total_credits: number;
  total_referrals: number;
  total_converted: number;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string;
  status: string;
  lead_id: string | null;
  credit_amount: number;
  credited_at: string | null;
  created_at: string;
}

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referral_id: string | null;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export type ReferralTier = 'starter' | 'bronze' | 'silver' | 'gold' | 'diamond';

export function getTier(converted: number): ReferralTier {
  if (converted >= 10) return 'diamond';
  if (converted >= 6) return 'gold';
  if (converted >= 3) return 'silver';
  if (converted >= 1) return 'bronze';
  return 'starter';
}

export function getTierInfo(tier: ReferralTier) {
  const map = {
    starter: { label: 'Starter', stars: 0, color: 'text-muted-foreground', next: 1 },
    bronze: { label: 'Bronze', stars: 1, color: 'text-amber-600', next: 3 },
    silver: { label: 'Silver', stars: 2, color: 'text-slate-400', next: 6 },
    gold: { label: 'Gold', stars: 3, color: 'text-yellow-500', next: 10 },
    diamond: { label: 'Diamond', stars: 4, color: 'text-cyan-400', next: null },
  };
  return map[tier];
}

export function useReferralProfile() {
  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards] = useState<ReferralReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Auth listener — primary source of truth
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      if (!data.session) setIsLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load / claim profile whenever user changes
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setReferrals([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        // claim_referral_profile is idempotent: links existing by email, else creates new
        const meta = (await supabase.auth.getUser()).data.user?.user_metadata || {};
        const { data: claimed, error } = await supabase.rpc('claim_referral_profile', {
          p_name: meta.full_name || null,
          p_phone: meta.phone || null,
        });
        if (error) throw error;
        if (cancelled) return;
        const p = claimed as unknown as ReferralProfile;
        setProfile(p);

        // Load referrals via secure RPC (works for both auth and email path)
        const { data: dash } = await supabase.rpc('get_referral_dashboard', { p_email: p.email });
        if (!cancelled && dash) {
          setReferrals(((dash as any)?.referrals ?? []) as Referral[]);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Referral profile load error:', err);
          toast({ title: 'Error loading profile', description: err.message, variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setReferrals([]);
  }, []);

  const addReferral = useCallback(
    async (name: string, phone: string, email?: string) => {
      if (!profile) return null;
      setIsLoading(true);
      try {
        const { data: ref, error: refErr } = await supabase
          .from('referrals')
          .insert({
            referrer_id: profile.id,
            referred_name: name,
            referred_phone: phone,
            referred_email: email || null,
            organization_id: AXO_ORG_ID,
          })
          .select()
          .single();
        if (refErr) throw refErr;

        const { data: lead } = await supabase
          .from('leads')
          .insert({
            name,
            phone,
            email: email || null,
            lead_source: 'referral',
            status: 'cold_lead',
            notes: `Referred by ${profile.name} (${profile.referral_code})`,
            organization_id: AXO_ORG_ID,
          })
          .select()
          .single();

        if (lead && ref) {
          await supabase.from('referrals').update({ lead_id: lead.id }).eq('id', (ref as any).id);
        }

        await supabase
          .from('referral_profiles')
          .update({ total_referrals: profile.total_referrals + 1 })
          .eq('id', profile.id);

        setProfile((prev) =>
          prev ? { ...prev, total_referrals: prev.total_referrals + 1 } : null,
        );

        const { data: dash } = await supabase.rpc('get_referral_dashboard', {
          p_email: profile.email,
        });
        if (dash) setReferrals(((dash as any)?.referrals ?? []) as Referral[]);

        toast({ title: 'Referral Added!', description: `${name} has been added to your referrals.` });
        return ref;
      } catch (err: any) {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [profile],
  );

  return {
    profile,
    referrals,
    rewards,
    isLoading,
    addReferral,
    signOut,
    isAuthenticated: !!userId,
    tier: profile ? getTier(profile.total_converted) : ('starter' as ReferralTier),
  };
}
