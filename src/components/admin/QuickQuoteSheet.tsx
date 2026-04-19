import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AXO_ORG_ID } from "@/lib/constants";
import { Zap, ArrowRight, ArrowLeft, Check, Loader2, Copy, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Rate Tables (price/sqft, cost/sqft, materials fraction) ────────────────

interface RateRow {
  pricePerSqft: number;
  costPerSqft: number;
  materialsFraction: number;
  laborRate: number;
}

const RATE_TABLES: Record<string, Record<string, RateRow>> = {
  refinishing: {
    good:   { pricePerSqft: 3.50, costPerSqft: 2.20, materialsFraction: 0.30, laborRate: 1.54 },
    better: { pricePerSqft: 4.50, costPerSqft: 2.60, materialsFraction: 0.35, laborRate: 1.69 },
    best:   { pricePerSqft: 6.00, costPerSqft: 3.10, materialsFraction: 0.40, laborRate: 1.86 },
  },
  installation: {
    good:   { pricePerSqft: 7.00, costPerSqft: 4.50, materialsFraction: 0.55, laborRate: 2.03 },
    better: { pricePerSqft: 9.00, costPerSqft: 5.50, materialsFraction: 0.50, laborRate: 2.75 },
    best:   { pricePerSqft: 12.00, costPerSqft: 6.80, materialsFraction: 0.45, laborRate: 3.74 },
  },
  repair: {
    good:   { pricePerSqft: 3.00, costPerSqft: 1.80, materialsFraction: 0.25, laborRate: 1.35 },
    better: { pricePerSqft: 4.00, costPerSqft: 2.30, materialsFraction: 0.30, laborRate: 1.61 },
    best:   { pricePerSqft: 5.50, costPerSqft: 2.80, materialsFraction: 0.35, laborRate: 1.82 },
  },
  vinyl: {
    good:   { pricePerSqft: 5.00, costPerSqft: 3.20, materialsFraction: 0.60, laborRate: 1.28 },
    better: { pricePerSqft: 7.00, costPerSqft: 4.20, materialsFraction: 0.55, laborRate: 1.89 },
    best:   { pricePerSqft: 9.50, costPerSqft: 5.50, materialsFraction: 0.50, laborRate: 2.75 },
  },
};

const SERVICE_LABELS: Record<string, string> = {
  refinishing: "Refinishing",
  installation: "Installation",
  repair: "Repair",
  vinyl: "Vinyl Plank",
};

// Duration estimate: sqft per day by service type
const SQFT_PER_DAY: Record<string, number> = {
  refinishing: 350,
  installation: 250,
  repair: 400,
  vinyl: 300,
};

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

// Add-ons
const ADDONS = [
  { id: "stairs",      label: "Stair Refinishing",   price: 95,   unit: "/step",   hasQty: true  },
  { id: "baseboards",  label: "Baseboards",          price: 8,    unit: "/lin ft", hasQty: true  },
  { id: "waterDamage", label: "Water Damage Repair",  price: 12,   unit: "/sqft",   hasQty: true  },
  { id: "furniture",   label: "Furniture Moving",     price: 200,  unit: "flat",    hasQty: false },
  { id: "customStain", label: "Custom Stain Color",   price: 0.75, unit: "/sqft",   hasQty: false },
];

type AddonState = Record<string, { enabled: boolean; qty: number }>;

// ─── Utilities ──────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtDec(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const MIN_MARGIN = 30;

// ─── Margin Gauge Component ─────────────────────────────────────────────────

function MarginGauge({ margin, minMargin }: { margin: number; minMargin: number }) {
  const status = margin >= minMargin + 10 ? "pass" : margin >= minMargin ? "warn" : "fail";
  const color = status === "pass" ? "bg-green-500" : status === "warn" ? "bg-amber-500" : "bg-destructive";
  const label = status === "pass" ? "PASS" : status === "warn" ? "WARN" : "FAIL";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Margin</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold">{margin.toFixed(1)}%</span>
          <Badge variant="outline" className={cn(
            "text-[9px] h-4 px-1.5 border-0 text-white",
            color
          )}>{label}</Badge>
        </div>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(margin, 60) / 60 * 100}%` }}
        />
        {/* Min margin marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground/60"
          style={{ left: `${minMargin / 60 * 100}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">Min: {minMargin}%</p>
    </div>
  );
}

// ─── Cost Breakdown Component ───────────────────────────────────────────────

function CostBreakdown({
  laborCost,
  materialCost,
  addonTotal,
  totalCost,
  price,
  profit,
  margin,
}: {
  laborCost: number;
  materialCost: number;
  addonTotal: number;
  totalCost: number;
  price: number;
  profit: number;
  margin: number;
}) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Labor</span>
        <span>{fmt(laborCost)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Materials</span>
        <span>{fmt(materialCost)}</span>
      </div>
      {addonTotal > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Add-ons</span>
          <span>{fmt(addonTotal)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-medium">
        <span>Total Cost</span>
        <span>{fmt(totalCost)}</span>
      </div>
      <div className="flex justify-between text-primary font-bold">
        <span>Client Price</span>
        <span>{fmt(price)}</span>
      </div>
      <div className="flex justify-between text-green-600">
        <span>Profit</span>
        <span>{fmt(profit)}</span>
      </div>
      <MarginGauge margin={margin} minMargin={MIN_MARGIN} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function QuickQuoteSheet({ lead, open, onClose, onSuccess }: QuickQuoteSheetProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showRateOverrides, setShowRateOverrides] = useState(false);

  // Pricing mode: 'tiers' (Good/Better/Best) or 'direct' (single price)
  const [pricingMode, setPricingMode] = useState<"tiers" | "direct">("tiers");

  // Direct price mode state
  const [directPrice, setDirectPrice] = useState<number>(0);
  const [directCost, setDirectCost] = useState<number>(0);
  const [directLabel, setDirectLabel] = useState<string>("Custom Quote");

  // Step 1 — Job info
  const [sqft, setSqft] = useState(500);
  const [serviceType, setServiceType] = useState<string>("refinishing");

  // Rate overrides (null = use defaults)
  const [overridePricePerSqft, setOverridePricePerSqft] = useState<Record<string, number | null>>({
    good: null, better: null, best: null,
  });
  const [overrideCostPerSqft, setOverrideCostPerSqft] = useState<Record<string, number | null>>({
    good: null, better: null, best: null,
  });

  // Step 2 — Add-ons
  const [addons, setAddons] = useState<AddonState>(() =>
    Object.fromEntries(ADDONS.map(a => [a.id, { enabled: false, qty: 1 }]))
  );

  // ─── Calculate tiers with full breakdown ─────────────────────────────────
  const { addonTotal, tiers, durationDays } = useMemo(() => {
    const rates = RATE_TABLES[serviceType] ?? RATE_TABLES.refinishing;

    // Add-ons total
    let addonTotal = 0;
    ADDONS.forEach(a => {
      const s = addons[a.id];
      if (!s.enabled) return;
      if (a.id === "customStain") addonTotal += a.price * sqft;
      else if (a.id === "waterDamage") addonTotal += a.price * s.qty;
      else if (a.hasQty) addonTotal += a.price * s.qty;
      else addonTotal += a.price;
    });

    const tiers = TIER_META.map(t => {
      const rate = rates[t.id];
      const effectivePrice = overridePricePerSqft[t.id] ?? rate.pricePerSqft;
      const effectiveCost = overrideCostPerSqft[t.id] ?? rate.costPerSqft;

      const laborCost = sqft * rate.laborRate;
      const materialCost = sqft * effectiveCost * rate.materialsFraction;
      const totalCost = laborCost + materialCost + addonTotal;
      const price = Math.ceil(sqft * effectivePrice) + addonTotal;
      const profit = price - totalCost;
      const margin = price > 0 ? ((price - totalCost) / price) * 100 : 0;

      return {
        ...t,
        price,
        pricePerSqft: effectivePrice,
        costPerSqft: effectiveCost,
        laborCost,
        materialCost,
        totalCost,
        profit,
        margin,
      };
    });

    const sqftPerDay = SQFT_PER_DAY[serviceType] ?? 350;
    const durationDays = Math.max(1, Math.ceil(sqft / sqftPerDay));

    return { addonTotal, tiers, durationDays };
  }, [sqft, serviceType, addons, overridePricePerSqft, overrideCostPerSqft]);

  // ─── Copy estimate text for WhatsApp/SMS ──────────────────────────────────
  function copyEstimateText(tierId: string) {
    const tier = tiers.find(t => t.id === tierId);
    if (!tier || !lead) return;

    const text = `📋 *AXO Floors — Quick Estimate*
    
Hi ${lead.name}! Here's your ${tier.label} tier estimate:

🏠 ${SERVICE_LABELS[serviceType]} — ${sqft.toLocaleString()} sqft
💰 *${fmt(tier.price)}* (${fmtDec(tier.pricePerSqft)}/sqft)
📅 Est. duration: ${durationDays} day${durationDays > 1 ? 's' : ''}

${tier.product}

This estimate is valid for 30 days.
Questions? Call Eduardo: (862) 216-4658`;

    navigator.clipboard.writeText(text).then(() => {
      toast.success("Estimate copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }

  // ─── Reset on open ───────────────────────────────────────────────────────
  function handleOpenChange(v: boolean) {
    if (!v) {
      setStep(1);
      setSqft(500);
      setServiceType("refinishing");
      setShowRateOverrides(false);
      setOverridePricePerSqft({ good: null, better: null, best: null });
      setOverrideCostPerSqft({ good: null, better: null, best: null });
      setAddons(Object.fromEntries(ADDONS.map(a => [a.id, { enabled: false, qty: 1 }])));
      onClose();
    }
  }

  // ─── Save proposal ──────────────────────────────────────────────────────
  async function handleSave(selectedTierId: string) {
    if (!lead) return;
    const selectedTier = tiers.find(t => t.id === selectedTierId);
    if (!selectedTier) return;

    if (selectedTier.margin < MIN_MARGIN) {
      toast.error(`BLOCKED: ${selectedTier.label} margin ${selectedTier.margin.toFixed(1)}% < minimum ${MIN_MARGIN}%`);
      return;
    }

    setSaving(true);
    try {
      const good   = tiers.find(t => t.id === "good")!;
      const better = tiers.find(t => t.id === "better")!;
      const best   = tiers.find(t => t.id === "best")!;

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      // 1. Create customer
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

      // 2. Create project
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

      // 3. Create job_costs with breakdown
      await supabase.from("job_costs").insert({
        project_id: project.id,
        labor_cost: selectedTier.laborCost,
        material_cost: selectedTier.materialCost,
        additional_costs: addonTotal,
        estimated_revenue: selectedTier.price,
      });

      // 4. Create proposal
      const { error: propErr } = await supabase.from("proposals").insert({
        organization_id: AXO_ORG_ID,
        project_id: project.id,
        customer_id: customer.id,
        good_price:    good.price,
        better_price:  better.price,
        best_price:    best.price,
        margin_good:   Math.round(good.margin),
        margin_better: Math.round(better.margin),
        margin_best:   Math.round(best.margin),
        selected_tier: selectedTierId,
        status: "sent",
        valid_until: validUntil.toISOString().slice(0, 10),
        proposal_number: `QQ-${Date.now().toString(36).toUpperCase()}`,
      });
      if (propErr) throw propErr;

      // 5. Link lead
      await supabase
        .from("leads")
        .update({ customer_id: customer.id, converted_to_project_id: project.id })
        .eq("id", lead.id);

      // 6. Move lead stages
      await supabase
        .from("leads")
        .update({ status: "in_draft", status_changed_at: new Date().toISOString() })
        .eq("id", lead.id);

      await supabase
        .from("leads")
        .update({ status: "proposal_sent", status_changed_at: new Date().toISOString() })
        .eq("id", lead.id);

      toast.success(`Proposal ${selectedTier.label} created and lead moved to Proposal Sent`);
      handleOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Error saving proposal");
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
            {step === 1 && "Step 1 of 3 — Job info & rates"}
            {step === 2 && "Step 2 of 3 — Add-ons"}
            {step === 3 && "Step 3 of 3 — Choose tier"}
          </p>
        </SheetHeader>

        {/* ── Step 1: Job Info + Rate Table ── */}
        {step === 1 && (
          <div className="space-y-5">
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

            {/* Rate Table Preview */}
            <div className="rounded-lg border bg-card">
              <div className="px-3 py-2 border-b bg-muted/50">
                <p className="text-xs font-semibold">Rate Table — {SERVICE_LABELS[serviceType]}</p>
              </div>
              <div className="divide-y">
                {["good", "better", "best"].map(tierId => {
                  const rate = RATE_TABLES[serviceType]?.[tierId];
                  if (!rate) return null;
                  const meta = TIER_META.find(t => t.id === tierId)!;
                  return (
                    <div key={tierId} className="px-3 py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] h-4">{meta.label}</Badge>
                      </div>
                      <div className="flex gap-4 text-muted-foreground">
                        <span>Price: <span className="text-foreground font-medium">{fmtDec(rate.pricePerSqft)}/sqft</span></span>
                        <span>Cost: <span className="text-foreground font-medium">{fmtDec(rate.costPerSqft)}/sqft</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rate Overrides */}
            <button
              onClick={() => setShowRateOverrides(!showRateOverrides)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showRateOverrides ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Override rates manually
            </button>

            {showRateOverrides && (
              <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                {TIER_META.map(t => {
                  const rate = RATE_TABLES[serviceType]?.[t.id];
                  if (!rate) return null;
                  return (
                    <div key={t.id} className="space-y-1">
                      <p className="text-xs font-medium">{t.label} Tier</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px]">Price/sqft</Label>
                          <Input
                            type="number"
                            step={0.1}
                            placeholder={rate.pricePerSqft.toString()}
                            value={overridePricePerSqft[t.id] ?? ""}
                            onChange={e => setOverridePricePerSqft(prev => ({
                              ...prev,
                              [t.id]: e.target.value ? Number(e.target.value) : null,
                            }))}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Cost/sqft</Label>
                          <Input
                            type="number"
                            step={0.1}
                            placeholder={rate.costPerSqft.toString()}
                            value={overrideCostPerSqft[t.id] ?? ""}
                            onChange={e => setOverrideCostPerSqft(prev => ({
                              ...prev,
                              [t.id]: e.target.value ? Number(e.target.value) : null,
                            }))}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Duration estimate */}
            <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Est. duration:</span>
              <span className="font-semibold">{durationDays} day{durationDays > 1 ? "s" : ""}</span>
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

        {/* ── Step 3: Tiers with Breakdown ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Choose the tier for <strong>{lead.name}</strong>.
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {durationDays}d
              </div>
            </div>

            {tiers.map(tier => {
              const blocked = tier.margin < MIN_MARGIN;
              return (
                <div
                  key={tier.id}
                  className={cn(
                    "p-4 rounded-xl border-2 space-y-3",
                    blocked ? "border-destructive/50 bg-destructive/5 opacity-75" :
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
                      <p className="text-xs text-muted-foreground">{fmtDec(tier.pricePerSqft)}/sqft</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Cost Breakdown */}
                  <CostBreakdown
                    laborCost={tier.laborCost}
                    materialCost={tier.materialCost}
                    addonTotal={addonTotal}
                    totalCost={tier.totalCost}
                    price={tier.price}
                    profit={tier.profit}
                    margin={tier.margin}
                  />

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      variant={tier.id === "best" ? "default" : "outline"}
                      disabled={saving || blocked}
                      onClick={() => handleSave(tier.id)}
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : blocked ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {blocked ? "Blocked" : `Create ${tier.label}`}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 px-2"
                      onClick={() => copyEstimateText(tier.id)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
