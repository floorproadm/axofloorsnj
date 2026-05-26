import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShieldCheck,
  Award,
  Clock,
  Star,
  Hammer,
  Sparkles,
  ThumbsUp,
  Heart,
  Wrench,
  BadgeCheck,
  Trophy,
  Leaf,
  Loader2,
  Save,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Award,
  Clock,
  Star,
  Hammer,
  Sparkles,
  ThumbsUp,
  Heart,
  Wrench,
  BadgeCheck,
  Trophy,
  Leaf,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

type TrustBuilder = { icon: string; title: string; description: string };

const DEFAULT_BUILDERS: TrustBuilder[] = [
  { icon: "ShieldCheck", title: "Licensed & Insured", description: "Fully licensed contractor with comprehensive liability coverage." },
  { icon: "Award", title: "Craftsmanship Guarantee", description: "Every install and refinish backed by Woody's Guarantee." },
  { icon: "Clock", title: "On-Time Delivery", description: "Clear timelines, daily updates, and zero ghosting." },
];

export default function TrustSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowId, setRowId] = useState<string | null>(null);
  const [builders, setBuilders] = useState<TrustBuilder[]>(DEFAULT_BUILDERS);
  const [projectsCompleted, setProjectsCompleted] = useState(0);
  const [yearsInBusiness, setYearsInBusiness] = useState(0);
  const [googleRating, setGoogleRating] = useState(5.0);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("id, trust_builders, projects_completed, years_in_business, google_rating")
        .limit(1)
        .maybeSingle();
      if (error) {
        toast.error("Failed to load settings");
      } else if (data) {
        setRowId(data.id);
        const tb = Array.isArray(data.trust_builders) ? (data.trust_builders as any[]) : [];
        const normalized: TrustBuilder[] = [0, 1, 2].map((i) => ({
          icon: tb[i]?.icon || DEFAULT_BUILDERS[i].icon,
          title: tb[i]?.title || DEFAULT_BUILDERS[i].title,
          description: tb[i]?.description || DEFAULT_BUILDERS[i].description,
        }));
        setBuilders(normalized);
        setProjectsCompleted(data.projects_completed ?? 0);
        setYearsInBusiness(data.years_in_business ?? 0);
        setGoogleRating(Number(data.google_rating ?? 5));
      }
      setLoading(false);
    })();
  }, []);

  const updateBuilder = (idx: number, patch: Partial<TrustBuilder>) => {
    setBuilders((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const handleSave = async () => {
    if (!rowId) return;
    setSaving(true);
    const { error } = await supabase
      .from("company_settings")
      .update({
        trust_builders: builders as any,
        projects_completed: projectsCompleted,
        years_in_business: yearsInBusiness,
        google_rating: googleRating,
      })
      .eq("id", rowId);
    setSaving(false);
    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Trust settings saved");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust Builders */}
      <Card className="border-l-4 border-l-primary p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Trust Builders</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Three reassurance blocks shown across public-facing pages. Pick an icon and write tight, confident copy.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {builders.map((b, idx) => {
            const Icon = ICON_MAP[b.icon] || ShieldCheck;
            return (
              <Card key={idx} className="p-4 bg-muted/30 border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Block {idx + 1}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Icon</Label>
                  <Select value={b.icon} onValueChange={(v) => updateBuilder(idx, { icon: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((name) => {
                        const I = ICON_MAP[name];
                        return (
                          <SelectItem key={name} value={name}>
                            <div className="flex items-center gap-2">
                              <I className="w-4 h-4" />
                              <span>{name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={b.title}
                    onChange={(e) => updateBuilder(idx, { title: e.target.value })}
                    maxLength={60}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    rows={3}
                    value={b.description}
                    onChange={(e) => updateBuilder(idx, { description: e.target.value })}
                    maxLength={200}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Social Proof */}
      <Card className="border-l-4 border-l-[hsl(var(--gold-warm,var(--primary)))] p-6">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Social Proof</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Live counters surfaced across the public site to anchor credibility.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Projects Completed</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={projectsCompleted}
              onChange={(e) => setProjectsCompleted(parseInt(e.target.value || "0", 10))}
            />
            <p className="text-[11px] text-muted-foreground">Total finished jobs to display.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Years in Business</Label>
            <Input
              type="number"
              min={0}
              step={1}
              value={yearsInBusiness}
              onChange={(e) => setYearsInBusiness(parseInt(e.target.value || "0", 10))}
            />
            <p className="text-[11px] text-muted-foreground">Years operating in the market.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Google Rating</Label>
            <Input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={googleRating}
              onChange={(e) => setGoogleRating(parseFloat(e.target.value || "0"))}
            />
            <p className="text-[11px] text-muted-foreground">Average rating, 0.0 – 5.0.</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Trust Settings
        </Button>
      </div>
    </div>
  );
}
