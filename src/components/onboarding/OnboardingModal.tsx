import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  Users, Briefcase, FileText, DollarSign, UsersRound,
  Palette, Package, UserPlus, Image as ImageIcon, Sparkles,
} from "lucide-react";
import floorproLogo from "@/assets/floorpro-logo.png.asset.json";

type TourSlide = {
  icon: typeof Users;
  title: string;
  body: string;
  accent: string;
};

const TOUR: TourSlide[] = [
  {
    icon: Sparkles,
    title: "Welcome to FloorPRO",
    body: "The operating system for flooring contractors. Let's walk you through what's inside — takes less than a minute.",
    accent: "from-[#0066FF] to-[#0052CC]",
  },
  {
    icon: Users,
    title: "Leads & Pipeline",
    body: "Every inquiry lands in one inbox. Move leads through a 10-stage pipeline, automate follow-ups, and never lose a deal.",
    accent: "from-blue-500 to-blue-700",
  },
  {
    icon: Briefcase,
    title: "Projects",
    body: "Run jobs from Planning to Paid. Track measurements, costs, photos, and crew assignments in one place.",
    accent: "from-indigo-500 to-indigo-700",
  },
  {
    icon: FileText,
    title: "Proposals",
    body: "Send Good / Better / Best quotes that protect your margin. Clients sign online, deposits are invoiced automatically.",
    accent: "from-violet-500 to-violet-700",
  },
  {
    icon: DollarSign,
    title: "Payments & Payroll",
    body: "Issue invoices on a 30/40/30 schedule, log expenses, and run weekly labor payroll — without spreadsheets.",
    accent: "from-emerald-500 to-emerald-700",
  },
  {
    icon: UsersRound,
    title: "Your Team",
    body: "Invite installers, sales reps, and partners. Each role gets the right portal — admin, field, or referral.",
    accent: "from-amber-500 to-amber-700",
  },
];

type ChecklistItem = {
  key: string;
  icon: typeof Palette;
  title: string;
  description: string;
  route: string;
};

const CHECKLIST: ChecklistItem[] = [
  {
    key: "branding",
    icon: ImageIcon,
    title: "Upload your logo",
    description: "Show your brand on proposals, invoices and client portals.",
    route: "/admin/settings?section=branding",
  },
  {
    key: "company",
    icon: Palette,
    title: "Set company details",
    description: "Phone, address and tagline used across all documents.",
    route: "/admin/settings?section=company",
  },
  {
    key: "catalog",
    icon: Package,
    title: "Add your first service",
    description: "Define pricing per square foot or per step.",
    route: "/admin/catalog",
  },
  {
    key: "team",
    icon: UserPlus,
    title: "Invite your team",
    description: "Add installers, sales reps or office staff.",
    route: "/admin/team",
  },
];

const STORAGE_KEY = "floorpro_onboarding_checklist";

export default function OnboardingModal() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(0); // 0..TOUR.length-1 = tour, TOUR.length = checklist
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [saving, setSaving] = useState(false);

  // Detect first-login: profile.onboarding_completed === false/null
  useEffect(() => {
    if (authLoading || !user) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!data?.onboarding_completed) setOpen(true);
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const persistChecklist = (next: Record<string, boolean>) => {
    setDone(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const toggleItem = (key: string) => {
    persistChecklist({ ...done, [key]: !done[key] });
  };

  const completeOnboarding = async (opts?: { goTo?: string }) => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setOpen(false);
      if (opts?.goTo) navigate(opts.goTo);
    } finally {
      setSaving(false);
    }
  };

  if (checking || !open) return null;

  const totalSteps = TOUR.length + 1; // tour slides + checklist
  const isChecklist = step >= TOUR.length;
  const current = isChecklist ? null : TOUR[step];
  const Icon = current?.icon;

  const completedCount = CHECKLIST.filter(i => done[i.key]).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) completeOnboarding(); }}>
      <DialogContent className="max-w-[520px] p-0 gap-0 overflow-hidden border-[#E6F0FF]">
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 px-6 pt-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i === step ? "bg-[#0066FF]" :
                i < step ? "bg-[#0066FF]/60" : "bg-[#E6F0FF]"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <img src={floorproLogo.url} alt="FloorPRO" className="h-7" />
          <button
            type="button"
            onClick={() => completeOnboarding()}
            disabled={saving}
            className="text-xs text-muted-foreground hover:text-[#1A1A1A] transition"
          >
            Skip for now
          </button>
        </div>

        <div className="px-6 pb-6 pt-2 min-h-[360px] flex flex-col">
          {!isChecklist && current && Icon && (
            <div className="flex-1 flex flex-col items-center text-center pt-4">
              <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${current.accent} flex items-center justify-center shadow-lg mb-6`}>
                <Icon className="h-10 w-10 text-white" strokeWidth={1.75} />
              </div>
              <h2 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">
                {current.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-[380px] leading-relaxed">
                {current.body}
              </p>
              <div className="mt-6 text-[11px] uppercase tracking-wider text-muted-foreground">
                {step + 1} of {TOUR.length}
              </div>
            </div>
          )}

          {isChecklist && (
            <div className="flex-1 flex flex-col">
              <div className="text-center mb-5">
                <h2 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">
                  Get set up in 4 steps
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Tick them off now or come back later — your call.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-[#0066FF] font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completedCount} of {CHECKLIST.length} done
                </div>
              </div>

              <div className="space-y-2">
                {CHECKLIST.map((item) => {
                  const ItemIcon = item.icon;
                  const isDone = !!done[item.key];
                  return (
                    <div
                      key={item.key}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                        isDone
                          ? "border-[#0066FF]/30 bg-[#E6F0FF]/40"
                          : "border-[#E6F0FF] hover:bg-[#E6F0FF]/30"
                      }`}
                    >
                      <Checkbox
                        checked={isDone}
                        onCheckedChange={() => toggleItem(item.key)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ItemIcon className="h-3.5 w-3.5 text-[#0066FF]" />
                          <span className={`text-sm font-medium ${isDone ? "text-muted-foreground line-through" : "text-[#1A1A1A]"}`}>
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 text-[#0066FF] hover:text-[#0052CC] hover:bg-[#E6F0FF]"
                        onClick={() => completeOnboarding({ goTo: item.route })}
                        disabled={saving}
                      >
                        Open
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="flex items-center gap-2 pt-6 mt-auto">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={saving}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
            )}
            {!isChecklist ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white"
              >
                Next <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => completeOnboarding()}
                disabled={saving}
                className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white"
              >
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Finish & enter FloorPRO
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
