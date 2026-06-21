import { DollarSign, Check } from "lucide-react";
import type { OnboardingData } from "@/hooks/useOnboarding";

const OPTIONS = [
  { id: "<50k", label: "Less than $50k" },
  { id: "50k-150k", label: "$50k - $150k" },
  { id: "150k-500k", label: "$150k - $500k" },
  { id: ">500k", label: "More than $500k" },
  { id: "skip", label: "Prefer not to say" },
];

type Props = {
  data: { annual_revenue: string };
  setData: (patch: { annual_revenue: string }) => void;
};

export default function OnboardingStep5({ data, setData }: Props) {
  return (
    <div className="space-y-5">
      <header className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl bg-[#0066FF]/15 flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-[#0066FF]" />
        </div>
        <h2 className="text-xl font-semibold text-white">Faturação anual aproximada</h2>
        <p className="text-sm text-white/60">Ajuda-nos a recomendar o plano certo.</p>
      </header>
      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const active = data.annual_revenue === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setData({ annual_revenue: opt.id })}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                active
                  ? "border-[#0066FF] bg-[#0066FF]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className={`text-sm font-medium ${active ? "text-white" : "text-white/80"}`}>
                {opt.label}
              </span>
              {active && (
                <div className="h-5 w-5 rounded-full bg-[#0066FF] flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
