import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import type { OnboardingData } from "@/hooks/useOnboarding";

type Props = {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
};

export default function OnboardingStep1({ data, setData }: Props) {
  return (
    <div className="space-y-5">
      <header className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl bg-[#0066FF]/15 flex items-center justify-center">
          <User className="h-6 w-6 text-[#0066FF]" />
        </div>
        <h2 className="text-xl font-semibold text-white">Sobre ti</h2>
        <p className="text-sm text-white/60">Vamos começar pelo básico.</p>
      </header>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="o-name" className="text-white/80">Nome completo *</Label>
          <Input
            id="o-name"
            value={data.full_name}
            onChange={(e) => setData({ full_name: e.target.value })}
            maxLength={120}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="o-phone" className="text-white/80">Telefone *</Label>
          <Input
            id="o-phone"
            type="tel"
            placeholder="+351"
            value={data.phone}
            onChange={(e) => setData({ phone: e.target.value })}
            maxLength={30}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="o-web" className="text-white/80">Website da empresa</Label>
          <Input
            id="o-web"
            type="url"
            placeholder="https://"
            value={data.website}
            onChange={(e) => setData({ website: e.target.value })}
            maxLength={255}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
      </div>
    </div>
  );
}
