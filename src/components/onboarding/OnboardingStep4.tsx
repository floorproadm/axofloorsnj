import { UsersRound, Check } from "lucide-react";
import type { OnboardingData } from "@/hooks/useOnboarding";

const OPTIONS = [
  { id: "solo", label: "Só eu (freelancer)", emoji: "👤" },
  { id: "2-5", label: "2-5 pessoas", emoji: "👥" },
  { id: "6-15", label: "6-15 pessoas", emoji: "👥" },
  { id: "15+", label: "+15 pessoas", emoji: "🏢" },
];

type Props = {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
};

export default function OnboardingStep4({ data, setData }: Props) {
  return (
    <div className="space-y-5">
      <header className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl bg-[#0066FF]/15 flex items-center justify-center">
          <UsersRound className="h-6 w-6 text-[#0066FF]" />
        </div>
        <h2 className="text-xl font-semibold text-white">Qual é o tamanho da tua equipa?</h2>
      </header>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = data.team_size === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setData({ team_size: opt.id })}
              className={`relative text-left p-4 rounded-xl border transition ${
                active
                  ? "border-[#0066FF] bg-[#0066FF]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-2xl mb-1.5">{opt.emoji}</div>
              <div className={`text-sm font-medium ${active ? "text-white" : "text-white/80"}`}>
                {opt.label}
              </div>
              {active && (
                <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#0066FF] flex items-center justify-center">
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
