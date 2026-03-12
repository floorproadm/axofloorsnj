import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AXO_ORG_ID } from "@/lib/constants";
import { Zap, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  services?: string[];
  city?: string;
  status: string;
}

interface QuickQuoteSheetProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Dados de pricing (custo estimado por sqft para calcular tiers) ───────────

const QUICK_COST_RATES: Record<string, number> = {
  refinishing: 2.20,
  installation: 4.50,
  repair: 1.80,
};

const SERVICE_LABELS: Record<string, string> = {
  refinishing: "Refinishing",
  installation: "Installation",
  repair: "Repair",
};

// Tiers com nomes reais de produto (importados do QuickQuote)
const TIER_META = [
  {
    id: "good",
    label: "Good",
    badge: "SMART OPTION",
    badgeCls: "bg-slate-500",
    product: "Emulsion® by Basic Coatings",
    popularity: "17% of clients choose this",
    marginTarget: 0.30,
  },
  {
    id: "better",
    label: "Better",
    badge: "POPULAR CHOICE",
    badgeCls: "bg-yellow-500",
    product: "Street Shoe® by Basic Coatings",
    popularity: "31% of clients choose this",
    marginTarget: 0.38,
  },
  {
    id: "best",
    label: "Best",
    badge: "BEST SELLER",
    badgeCls: "bg-amber-500",
    product: "Bona Traffic HD® (Swedish Formula)",
    popularity: "52% of clients choose this",
    marginTarget: 0.45,
  },
];

// Add-ons disponíveis
const ADDONS = [
  { id: "stairs",      label: "Stair Refinishing",  price: 35,   unit: "/step",     hasQty: true  },
  { id: "railing",     label: "Handrail Refinishing",price: 25,   unit: "/lin ft",   hasQty: true  },
  { id: "petDamage",   label: "Pet Damage Repair",   price: 150,  unit: "flat",      hasQty: false },
  { id: "furniture",   label: "Furniture Moving",    price: 200,  unit: "flat",      hasQty: false },
  { id: "customStain", label: "Custom Stain Color",  price: 0.75, unit: "/sqft",     hasQty: false },
];

type AddonState = Record<string, { enabled: boolean; qty: number }>;

// ─── Utilitários ─────────────────────────────────────────────────────────────

function calcTierPrice(baseCost: number, marginTarget: number): number {
  return Math.ceil(baseCost / (1 - marginTarget));
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function QuickQuoteSheet({ lead, open, onClose, onSuccess }: QuickQuoteSheetProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Job info
  const [sqft, setSqft] = useState(500);
  const [serviceType, setServiceType] = useState<string>("refinishing");

  // Step 2 — Add-ons
  const [addons, setAddons] = useState<AddonState>(() =>
    Object.fromEntries(ADDONS.map(a => [a.id, { enabled: false, qty: 1 }]))
  );

  // ─── Cálculo dos tiers ───────────────────────────────────────────────────
  const { addonTotal, tiers } = useMemo(() => {
    const rate = QUICK_COST_RATES[serviceType] ?? 2.20;
    const baseLabor = sqft * rate;

    // Add-ons
    let addonTotal = 0;
    ADDONS.forEach(a => {
      const s = addons[a.id];
      if (!s.enabled) return;
      if (a.id === "customStain") addonTotal += a.price * sqft;
      else if (a.hasQty) addonTotal += a.price * s.qty;
      else addonTotal += a.price;
    });

    const baseCost = baseLabor + addonTotal;

    const tiers = TIER_META.map(t => ({
      ...t,
      price: calcTierPrice(baseCost, t.marginTarget),
    }));

    return { addonTotal, tiers };
  }, [sqft, serviceType, addons]);

  // ─── Reset ao abrir ──────────────────────────────────────────────────────
  function handleOpenChange(v: boolean) {
    if (!v) {
      setStep(1);
      setSqft(500);
      setServiceType("refinishing");
      setAddons(Object.fromEntries(ADDONS.map(a => [a.id, { enabled: false, qty: 1 }])));
      onClose();
    }
  }

  // ─── Salvar proposal ─────────────────────────────────────────────────────
  async function handleSave(selectedTierId: string) {
    if (!lead) return;
    setSaving(true);
    try {
      const selected = tiers.find(t => t.id === selectedTierId)!;
      const good   = tiers.find(t => t.id === "good")!;
      const better = tiers.find(t => t.id === "better")!;
      const best   = tiers.find(t => t.id === "best")!;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      // 1. Create customer from lead data
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .insert({
          organization_id: AXO_ORG_ID,
          full_name: lead.name,
          phone: lead.phone || null,
          email: lead.email || null,
          city: lead.city || null,
        })
        .select("id")
        .single();
      if (custErr) throw custErr;

      // 2. Create project from lead data
      const { data: project, error: projErr } = await supabase
        .from("projects")
        .insert({
          organization_id: AXO_ORG_ID,
          customer_id: customer.id,
          customer_name: lead.name,
          customer_email: lead.email || '',
          customer_phone: lead.phone,
          project_type: serviceType,
          project_status: 'pending',
          square_footage: sqft,
          city: lead.city || null,
        })
        .select("id")
        .single();
      if (projErr) throw projErr;

      // 3. Create job_costs for the project (zeroed, with estimated revenue)
      await supabase.from("job_costs").insert({
        project_id: project.id,
        labor_cost: 0,
        material_cost: 0,
        additional_costs: 0,
        estimated_revenue: selected.price,
      });

      // 4. Create proposal with valid customer_id and project_id
      const { error: propErr } = await supabase.from("proposals").insert({
        organization_id: AXO_ORG_ID,
        project_id: project.id,
        customer_id: customer.id,
        good_price:    good.price,
        better_price:  better.price,
        best_price:    best.price,
        margin_good:   Math.round(good.marginTarget * 100),
        margin_better: Math.round(better.marginTarget * 100),
        margin_best:   Math.round(best.marginTarget * 100),
        selected_tier: selectedTierId,
        status: "sent",
        valid_until: validUntil.toISOString().slice(0, 10),
        proposal_number: `QQ-${Date.now().toString(36).toUpperCase()}`,
      });
      if (propErr) throw propErr;

      // 5. Link lead to customer + project
      await supabase
        .from("leads")
        .update({
          customer_id: customer.id,
          converted_to_project_id: project.id,
        })
        .eq("id", lead.id);

      // 6. Move lead para proposal_sent via direct update
      const { error: leadErr } = await supabase
        .from("leads")
        .update({ status: "proposal_sent" })
        .eq("id", lead.id);
      if (leadErr) throw leadErr;

      toast.success(`Proposal ${selected.label} criada e lead movido para Proposal Sent`);
      handleOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar proposta");
    } finally {
      setSaving(false);
    }
  }

  if (!lead) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Quick Quote — {lead.name}
          </SheetTitle>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  s <= step ? "bg-amber-500" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {step === 1 && "Step 1 of 3 — Job info"}
            {step === 2 && "Step 2 of 3 — Add-ons"}
            {step === 3 && "Step 3 of 3 — Choose tier"}
          </p>
        </SheetHeader>

        {/* ── Step 1: Job Info ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Square footage</Label>
              <Input
                type="number"
                min={100}
                step={50}
                value={sqft}
                onChange={e => setSqft(Number(e.target.value))}
                className="text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">Minimum 100 sqft</p>
            </div>

            <div className="space-y-2">
              <Label>Service type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SERVICE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Estimate base</p>
              <p>{sqft.toLocaleString()} sqft × ${QUICK_COST_RATES[serviceType]}/sqft (cost) = <span className="font-semibold text-foreground">${(sqft * QUICK_COST_RATES[serviceType]).toLocaleString()}</span></p>
            </div>

            <Button
              className="w-full"
              disabled={sqft < 100}
              onClick={() => setStep(2)}
            >
              Next — Add-ons <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Add-ons ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select any additional services for this job.</p>

            {ADDONS.map(addon => {
              const state = addons[addon.id];
              return (
                <div
                  key={addon.id}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    state.enabled ? "border-amber-400 bg-amber-50" : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{addon.label}</p>
                      <p className="text-xs text-muted-foreground">
                        ${addon.price}{addon.unit}
                      </p>
                    </div>
                    <Switch
                      checked={state.enabled}
                      onCheckedChange={v =>
                        setAddons(prev => ({ ...prev, [addon.id]: { ...prev[addon.id], enabled: v } }))
                      }
                    />
                  </div>

                  {state.enabled && addon.hasQty && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-amber-200">
                      <Label className="text-xs w-16 shrink-0">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={state.qty}
                        onChange={e =>
                          setAddons(prev => ({ ...prev, [addon.id]: { ...prev[addon.id], qty: Number(e.target.value) } }))
                        }
                        className="h-8 w-24 text-center"
                      />
                      <span className="text-xs text-muted-foreground">{addon.unit.replace("/", "")}{state.qty > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {addonTotal > 0 && (
              <div className="text-sm text-right text-muted-foreground">
                Add-ons total: <span className="font-semibold text-foreground">{fmt(addonTotal)}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                See Tiers <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Tiers ── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the tier to present to <strong>{lead.name}</strong>.
            </p>

            {tiers.map(tier => (
              <div
                key={tier.id}
                className={cn(
                  "p-4 rounded-xl border-2 space-y-3",
                  tier.id === "best" ? "border-amber-400 bg-amber-50" :
                  tier.id === "better" ? "border-yellow-300 bg-yellow-50" :
                  "border-slate-200 bg-slate-50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{tier.label}</span>
                      <Badge className={cn("text-[9px] h-4 px-1.5 text-white border-0", tier.badgeCls)}>
                        {tier.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground italic">{tier.product}</p>
                    <p className="text-[11px] text-muted-foreground">{tier.popularity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{fmt(tier.price)}</p>
                    <p className="text-xs text-muted-foreground">{fmt(Math.round(tier.price / sqft))}/sqft</p>
                  </div>
                </div>

                <Separator />

                <Button
                  size="sm"
                  className="w-full gap-2"
                  variant={tier.id === "best" ? "default" : "outline"}
                  disabled={saving}
                  onClick={() => handleSave(tier.id)}
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Create {tier.label} Proposal
                </Button>
              </div>
            ))}

            <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
