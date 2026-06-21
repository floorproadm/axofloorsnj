import { Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { OnboardingData } from "@/hooks/useOnboarding";

const YEARS = [
  "Menos de 1 ano",
  "1-3 anos",
  "3-5 anos",
  "5-10 anos",
  "+10 anos",
];

type Props = {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
};

export default function OnboardingStep3({ data, setData }: Props) {
  return (
    <div className="space-y-5">
      <header className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl bg-[#0066FF]/15 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-[#0066FF]" />
        </div>
        <h2 className="text-xl font-semibold text-white">Conta-nos sobre a tua empresa</h2>
      </header>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="o-company" className="text-white/80">Nome da empresa *</Label>
          <Input
            id="o-company"
            value={data.company_name}
            onChange={(e) => setData({ company_name: e.target.value })}
            maxLength={160}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="o-city" className="text-white/80">Cidade / Região *</Label>
          <Input
            id="o-city"
            value={data.city}
            onChange={(e) => setData({ city: e.target.value })}
            maxLength={120}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/80">Anos de experiência</Label>
          <Select
            value={data.years_experience || undefined}
            onValueChange={(v) => setData({ years_experience: v })}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Seleciona…" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
