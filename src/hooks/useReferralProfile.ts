import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

function generateReferralCode(name: string): string {
  const cleanName = name.split(' ')[0].toUpperCase().slice(0, 6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `AXO-${cleanName}-${random}`;
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
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const register = useCallback(async (name: string, email: string, phone: string) => {
    setIsLoading(true);
    try {
      // Check if email already registered
      const { data: existing } = await supabase
        .from('referral_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        setProfile(existing as unknown as ReferralProfile);
        await loadReferrals(existing.id as string);
        await loadRewards(existing.id as string);
        toast({ title: 'Welcome back!', description: 'Your referral dashboard is ready.' });
        return existing as unknown as ReferralProfile;
      }

      const referral_code = generateReferralCode(name);
      const { data, error } = await supabase
        .from('referral_profiles')
        .insert({ name, email, phone, referral_code })
        .select()
        .single();

      if (error) throw error;
      const p = data as unknown as ReferralProfile;
      setProfile(p);
      toast({ title: 'Account Created!', description: `Your referral code is ${p.referral_code}` });
      return p;
    } catch (err: any) {
      console.error('Referral registration error:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const lookupByEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('referral_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (data) {
        const p = data as unknown as ReferralProfile;
        setProfile(p);
        await loadReferrals(p.id);
        await loadRewards(p.id);
        return p;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadReferrals = async (referrerId: string) => {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });
    if (data) setReferrals(data as unknown as Referral[]);
  };

  const loadRewards = async (referrerId: string) => {
    const { data } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });
    if (data) setRewards(data as unknown as ReferralReward[]);
  };

  const addReferral = useCallback(async (name: string, phone: string, email?: string) => {
    if (!profile) return null;
    setIsLoading(true);
    try {
      // Create referral record
      const { data: ref, error: refErr } = await supabase
        .from('referrals')
        .insert({
          referrer_id: profile.id,
          referred_name: name,
          referred_phone: phone,
          referred_email: email || null,
        })
        .select()
        .single();
      if (refErr) throw refErr;

      // Also create a lead linked to this referral
      const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .insert({
          name,
          phone,
          email: email || null,
          lead_source: 'referral',
          status: 'cold_lead',
          notes: `Referred by ${profile.name} (${profile.referral_code})`,
        })
        .select()
        .single();

      if (lead && ref) {
        // Link lead to referral
        await supabase
          .from('referrals')
          .update({ lead_id: lead.id })
          .eq('id', (ref as any).id);
      }

      // Update referral count
      await supabase
        .from('referral_profiles')
        .update({ total_referrals: profile.total_referrals + 1 })
        .eq('id', profile.id);

      setProfile(prev => prev ? { ...prev, total_referrals: prev.total_referrals + 1 } : null);
      await loadReferrals(profile.id);

      toast({ title: 'Referral Added!', description: `${name} has been added to your referrals.` });
      return ref;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  return {
    profile,
    referrals,
    rewards,
    isLoading,
    register,
    lookupByEmail,
    addReferral,
    tier: profile ? getTier(profile.total_converted) : 'starter' as ReferralTier,
  };
}
