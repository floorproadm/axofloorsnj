import { Hammer, Check } from "lucide-react";
import type { OnboardingData } from "@/hooks/useOnboarding";

const OPTIONS = [
  { id: "install_wood", label: "Instalação de Piso de Madeira", emoji: "🪵" },
  { id: "sanding", label: "Lixagem e Acabamento", emoji: "🔨" },
  { id: "painting", label: "Pintura de Piso", emoji: "🎨" },
  { id: "vinyl_lvp", label: "Vinílico / LVP", emoji: "📐" },
  { id: "tile", label: "Ladrilho / Cerâmica", emoji: "🧱" },
  { id: "repair", label: "Reparações e Manutenção", emoji: "🔧" },
];

type Props = {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
};

export default function OnboardingStep2({ data, setData }: Props) {
  const toggle = (id: string) => {
    const has = data.business_types.includes(id);
    setData({
      business_types: has
        ? data.business_types.filter((x) => x !== id)
        : [...data.business_types, id],
    });
  };
  return (
    <div className="space-y-5">
      <header className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl bg-[#0066FF]/15 flex items-center justify-center">
          <Hammer className="h-6 w-6 text-[#0066FF]" />
        </div>
        <h2 className="text-xl font-semibold text-white">Que tipo de trabalho fazem?</h2>
        <p className="text-sm text-white/60">Seleciona tudo o que se aplica.</p>
      </header>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = data.business_types.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`relative text-left p-3 rounded-xl border transition ${
                active
                  ? "border-[#0066FF] bg-[#0066FF]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-2xl mb-1">{opt.emoji}</div>
              <div className={`text-xs font-medium ${active ? "text-white" : "text-white/80"}`}>
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
