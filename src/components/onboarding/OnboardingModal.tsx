import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, Loader2, User, Hammer, Building2,
  UsersRound, DollarSign, Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding, type OnboardingData } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";
import floorproLogo from "@/assets/floorpro-logo.png.asset.json";
import OnboardingStep1 from "./OnboardingStep1";
import OnboardingStep2 from "./OnboardingStep2";
import OnboardingStep3 from "./OnboardingStep3";
import OnboardingStep4 from "./OnboardingStep4";
import OnboardingStep5 from "./OnboardingStep5";

const STEP_ICONS = [User, Hammer, Building2, UsersRound, DollarSign];

const EMPTY: OnboardingData = {
  full_name: "", phone: "", website: "",
  business_types: [], company_name: "", city: "",
  years_experience: "", team_size: "", annual_revenue: "",
};

export default function OnboardingModal() {
  const { user } = useAuth();
  const { shouldShowModal, saveOnboarding, skipOnboarding, profile } = useOnboarding();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>(EMPTY);

  // Pre-fill from auth metadata + existing profile (if user resumes)
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string };
    setData((prev) => ({
      ...prev,
      full_name: prev.full_name || profile?.full_name || meta.full_name || meta.name || "",
      phone: prev.phone || profile?.phone || "",
      website: prev.website || profile?.website || "",
      business_types: prev.business_types.length ? prev.business_types : (profile?.business_types ?? []),
      company_name: prev.company_name || profile?.company_name || "",
      city: prev.city || profile?.city || "",
      years_experience: prev.years_experience || profile?.years_experience || "",
      team_size: prev.team_size || profile?.team_size || "",
      annual_revenue: prev.annual_revenue || profile?.annual_revenue || "",
    }));
  }, [user, profile]);

  const patch = (p: Partial<OnboardingData>) => setData((d) => ({ ...d, ...p }));

  const canNext = useMemo(() => {
    if (step === 1) return data.full_name.trim() && data.phone.trim();
    if (step === 2) return data.business_types.length > 0;
    if (step === 3) return data.company_name.trim() && data.city.trim();
    if (step === 4) return !!data.team_size;
    return true;
  }, [step, data]);

  const handleNext = () => setStep((s) => Math.min(5, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleFinish = async () => {
    setSaving(true);
    const err = await saveOnboarding(data);
    setSaving(false);
    if (err) {
      toast({
        title: "Não foi possível guardar",
        description: err.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Bem-vindo ao FloorPRO" });
  };

  const handleSkip = async () => {
    await skipOnboarding();
  };

  if (!shouldShowModal) return null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent
        className="max-w-[520px] p-0 gap-0 overflow-hidden border-white/10 bg-[#1a1a2e] text-white"
      >
        {/* Top: logo + skip */}
        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
          <img src={floorproLogo.url} alt="FloorPRO" className="h-7" />
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-white/50 hover:text-white transition"
          >
            Skip por agora
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pb-4 flex items-center gap-2">
          {STEP_ICONS.map((Icon, idx) => {
            const n = idx + 1;
            const isActive = step === n;
            const isDone = step > n;
            return (
              <div key={n} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-[#0066FF] text-white"
                      : isDone
                      ? "bg-[#0066FF]/30 text-white"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                {n < 5 && (
                  <div className={`h-px flex-1 ${isDone ? "bg-[#0066FF]/50" : "bg-white/10"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 pt-2 min-h-[380px]">
          <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-200">
            {step === 1 && <OnboardingStep1 data={data} setData={patch} />}
            {step === 2 && <OnboardingStep2 data={data} setData={patch} />}
            {step === 3 && <OnboardingStep3 data={data} setData={patch} />}
            {step === 4 && <OnboardingStep4 data={data} setData={patch} />}
            {step === 5 && (
              <OnboardingStep5
                data={{ annual_revenue: data.annual_revenue }}
                setData={(p) => patch(p)}
              />
            )}
          </div>
        </div>

        {/* Bottom dots + nav */}
        <div className="px-6 pb-6 border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className={`h-1.5 rounded-full transition-all ${
                  n === step ? "w-6 bg-[#0066FF]" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={saving}
                className="bg-transparent border-white/15 text-white hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Anterior
              </Button>
            ) : <div />}
            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canNext}
                className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white"
              >
                Próximo <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white"
              >
                {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Concluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
