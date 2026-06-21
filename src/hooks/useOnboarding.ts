import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type OnboardingData = {
  full_name: string;
  phone: string;
  website: string;
  business_types: string[];
  company_name: string;
  city: string;
  years_experience: string;
  team_size: string;
  annual_revenue: string;
};

export type ChecklistKey =
  | "account"
  | "first_customer"
  | "first_project"
  | "first_proposal"
  | "first_team_member"
  | "company_settings";

export const CHECKLIST_KEYS: ChecklistKey[] = [
  "account",
  "first_customer",
  "first_project",
  "first_proposal",
  "first_team_member",
  "company_settings",
];

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  website: string | null;
  business_types: string[] | null;
  company_name: string | null;
  city: string | null;
  years_experience: string | null;
  team_size: string | null;
  annual_revenue: string | null;
  onboarding_completed: boolean | null;
  onboarding_skipped: boolean | null;
  onboarding_checklist: Record<string, boolean> | null;
};

export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [skippedThisSession, setSkippedThisSession] = useState(false);

  const refetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select(
        "full_name,phone,website,business_types,company_name,city,years_experience,team_size,annual_revenue,onboarding_completed,onboarding_skipped,onboarding_checklist"
      )
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data as ProfileRow) ?? null);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      await refetch();
      setLoading(false);
    })();
  }, [user, authLoading, refetch]);

  const completed = !!profile?.onboarding_completed;
  const skipped = !!profile?.onboarding_skipped;
  const shouldShowModal =
    !loading && !!user && !completed && !skipped && !skippedThisSession;

  const saveOnboarding = useCallback(
    async (data: OnboardingData) => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name || null,
          phone: data.phone || null,
          website: data.website || null,
          business_types: data.business_types?.length ? data.business_types : null,
          company_name: data.company_name || null,
          city: data.city || null,
          years_experience: data.years_experience || null,
          team_size: data.team_size || null,
          annual_revenue: data.annual_revenue || null,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_skipped: false,
        })
        .eq("user_id", user.id);
      if (!error) await refetch();
      return error;
    },
    [user, refetch]
  );

  const skipOnboarding = useCallback(async () => {
    setSkippedThisSession(true);
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ onboarding_skipped: true })
      .eq("user_id", user.id);
    await refetch();
  }, [user, refetch]);

  const resumeOnboarding = useCallback(async () => {
    setSkippedThisSession(false);
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ onboarding_skipped: false, onboarding_completed: false })
      .eq("user_id", user.id);
    await refetch();
  }, [user, refetch]);

  const checklist: Record<string, boolean> = {
    account: true, // always done once signed up
    ...(profile?.onboarding_checklist ?? {}),
  };

  const setChecklistItem = useCallback(
    async (key: ChecklistKey, value: boolean) => {
      if (!user) return;
      const next = { ...(profile?.onboarding_checklist ?? {}), [key]: value };
      await supabase
        .from("profiles")
        .update({ onboarding_checklist: next })
        .eq("user_id", user.id);
      await refetch();
    },
    [user, profile, refetch]
  );

  const completedCount = CHECKLIST_KEYS.filter((k) => checklist[k]).length;
  const checklistAllDone = completedCount === CHECKLIST_KEYS.length;

  return {
    loading,
    profile,
    completed,
    shouldShowModal,
    saveOnboarding,
    skipOnboarding,
    resumeOnboarding,
    checklist,
    setChecklistItem,
    completedCount,
    checklistAllDone,
    totalChecklist: CHECKLIST_KEYS.length,
  };
}
