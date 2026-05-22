import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Save, Loader2, Eye, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ContentOverrides,
  SECTION_KEYS,
  SectionKey,
} from "@/components/admin/ProposalEditPanel";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
  onSaved?: () => void;
}

interface ProposalRow {
  id: string;
  proposal_number: string;
  share_token: string | null;
  valid_until: string;
  content_overrides: ContentOverrides | null;
  hidden_sections: SectionKey[] | null;
  project_id: string;
  customer_id: string;
}

interface ProjectRow {
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  project_type: string;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  square_footage: number | null;
}

const SECTION_LABELS: Record<SectionKey, string> = {
  method: "AXO Method",
  timeline: "Timeline",
  guarantee: "Woody's Guarantee",
  cta: "Call To Action",
};

export function ProposalUnifiedEditor({
  open,
  onOpenChange,
  proposalId,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proposal, setProposal] = useState<ProposalRow | null>(null);
  const [project, setProject] = useState<ProjectRow | null>(null);

  // Editable state
  const [ov, setOv] = useState<ContentOverrides>({});
  const [hidden, setHidden] = useState<SectionKey[]>([]);
  const [validUntil, setValidUntil] = useState("");

  // Iframe reload key
  const [iframeKey, setIframeKey] = useState(0);

  const previewToken = useMemo(() => proposal?.share_token ?? "", [proposal?.share_token]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: p, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", proposalId)
        .maybeSingle();
      if (error || !p) {
        toast.error("Failed to load proposal");
        setLoading(false);
        return;
      }
      let prop = p as unknown as ProposalRow;
      if (!prop.share_token) {
        const newToken = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
        const { error: tokenError } = await supabase
          .from("proposals")
          .update({ share_token: newToken } as any)
          .eq("id", prop.id);
        if (!tokenError) prop = { ...prop, share_token: newToken };
      }
      const { data: proj } = await supabase
        .from("projects")
        .select(
          "customer_name, customer_phone, customer_email, project_type, address, city, zip_code, square_footage",
        )
        .eq("id", prop.project_id)
        .maybeSingle();
      if (cancelled) return;
      setProposal(prop);
      setProject(proj as ProjectRow);
      setOv(prop.content_overrides ?? {});
      setHidden(prop.hidden_sections ?? []);
      setValidUntil(prop.valid_until);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, proposalId]);

  const set = <K extends keyof ContentOverrides>(
    k: K,
    v: ContentOverrides[K],
  ) => setOv((p) => ({ ...p, [k]: v }));

  const toggleSection = (k: SectionKey, visible: boolean) => {
    setHidden((prev) =>
      visible
        ? prev.filter((x) => x !== k)
        : Array.from(new Set([...prev, k])),
    );
  };

  const handleSave = async () => {
    if (!proposal) return;
    setSaving(true);
    try {
      const cleaned: ContentOverrides = Object.fromEntries(
        Object.entries(ov).filter(
          ([, v]) => v !== "" && v !== undefined && v !== null,
        ),
      ) as ContentOverrides;

      const update: Record<string, unknown> = {
        content_overrides: cleaned,
        hidden_sections: hidden,
        valid_until: validUntil,
        use_tiers: useTiers,
      };
      if (useTiers) {
        update.good_price = parseFloat(good) || 0;
        update.better_price = parseFloat(better) || 0;
        update.best_price = parseFloat(best) || 0;
        update.flat_price = null;
      } else {
        update.flat_price = parseFloat(flat) || 0;
      }

      const { error } = await supabase
        .from("proposals")
        .update(update)
        .eq("id", proposal.id);
      if (error) throw error;

      toast.success("Proposal saved");
      setIframeKey((k) => k + 1);
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.open(`/proposal/${previewToken}?print=1`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen p-0 gap-0 border-0 rounded-none flex flex-col bg-zinc-950 text-zinc-100">
        {/* Sticky editor toolbar */}
        <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="h-7 px-2 rounded bg-amber-500/15 border border-amber-500/30 flex items-center text-[11px] tracking-wider font-semibold text-amber-400">
                AXO · EDITOR
              </div>
              <span className="text-xs text-zinc-400">
                {proposal?.proposal_number}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-3.5 h-3.5" /> Close panel
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                onClick={handlePrint}
              >
                <Printer className="w-3.5 h-3.5" /> Export PDF
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs bg-amber-500 text-zinc-950 hover:bg-amber-400"
                onClick={handleSave}
                disabled={saving || loading}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save & refresh preview
              </Button>
            </div>
          </div>

          {loading || !proposal ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4 max-h-[55vh] overflow-y-auto">
              {/* Row 1: Client / project basics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Client name">
                  <Input
                    value={ov.customer_name ?? ""}
                    onChange={(e) => set("customer_name", e.target.value)}
                    placeholder={project?.customer_name || ""}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                  />
                </Field>
                <Field label="Project address">
                  <Input
                    value={ov.address ?? ""}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder={project?.address || ""}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                  />
                </Field>
                <Field label="Valid until">
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                  />
                </Field>
              </div>

              {/* Row 2: contact + project specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Client phone">
                  <Input
                    value={ov.customer_phone ?? ""}
                    onChange={(e) => set("customer_phone", e.target.value)}
                    placeholder={project?.customer_phone || ""}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                  />
                </Field>
                <Field label="Client email">
                  <Input
                    value={ov.customer_email ?? ""}
                    onChange={(e) => set("customer_email", e.target.value)}
                    placeholder={project?.customer_email || ""}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                  />
                </Field>
                <Field label="Project type">
                  <Input
                    value={ov.project_type ?? ""}
                    onChange={(e) => set("project_type", e.target.value)}
                    placeholder={project?.project_type || ""}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                  />
                </Field>
                <Field label="Square footage">
                  <Input
                    type="number"
                    value={ov.square_footage ?? ""}
                    onChange={(e) =>
                      set(
                        "square_footage",
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                    placeholder={String(project?.square_footage || "")}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                  />
                </Field>
              </div>

              {/* Row 3: Site assessment + timeline + CTA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Site assessment notes">
                  <Textarea
                    rows={2}
                    value={ov.site_assessment ?? ""}
                    onChange={(e) => set("site_assessment", e.target.value)}
                    placeholder="Default text used if empty"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  />
                </Field>
                <Field label="Timeline">
                  <Textarea
                    rows={2}
                    value={ov.timeline ?? ""}
                    onChange={(e) => set("timeline", e.target.value)}
                    placeholder="Default text used if empty"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  />
                </Field>
                <Field label="CTA heading + text">
                  <Input
                    value={ov.cta_heading ?? ""}
                    onChange={(e) => set("cta_heading", e.target.value)}
                    placeholder="Ready to move forward?"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9 mb-1.5"
                  />
                  <Textarea
                    rows={2}
                    value={ov.cta_text ?? ""}
                    onChange={(e) => set("cta_text", e.target.value)}
                    placeholder="Contact us to discuss your project..."
                    className="bg-zinc-950 border-zinc-800 text-zinc-100"
                  />
                </Field>
              </div>

              {/* Row 4: Pricing */}
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                    Pricing
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400">
                      Tiers (Good/Better/Best)
                    </span>
                    <Switch
                      checked={useTiers}
                      onCheckedChange={setUseTiers}
                    />
                  </div>
                </div>

                {useTiers ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        key: "good" as const,
                        label: "Good — Essential",
                        v: good,
                        s: setGood,
                      },
                      {
                        key: "better" as const,
                        label: "Better — Recommended",
                        v: better,
                        s: setBetter,
                      },
                      {
                        key: "best" as const,
                        label: "Best — Premium",
                        v: best,
                        s: setBest,
                      },
                    ].map((t) => (
                      <div key={t.key}>
                        <Label className="text-[10px] uppercase tracking-wider text-zinc-500">
                          {t.label}
                        </Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                          <Input
                            type="number"
                            value={t.v}
                            onChange={(e) => t.s(e.target.value)}
                            className="pl-7 bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="max-w-xs">
                    <Label className="text-[10px] uppercase tracking-wider text-zinc-500">
                      Single price
                    </Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <Input
                        type="number"
                        value={flat}
                        onChange={(e) => setFlat(e.target.value)}
                        className="pl-7 bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 5: Sections on/off */}
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                  Sections visible on proposal
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SECTION_KEYS.map((k) => {
                    const visible = !hidden.includes(k);
                    return (
                      <label
                        key={k}
                        className="flex items-center justify-between gap-2 rounded border border-zinc-800 px-3 py-2 cursor-pointer"
                      >
                        <span className="text-xs text-zinc-300">
                          {SECTION_LABELS[k]}
                        </span>
                        <Switch
                          checked={visible}
                          onCheckedChange={(v) => toggleSection(k, v)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="flex-1 min-h-0 bg-zinc-900">
          <div className="h-full overflow-hidden">
            <div className="px-5 py-2 border-b border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-400">
              <Eye className="w-3.5 h-3.5" />
              Live preview — reflects saved changes
            </div>
            <iframe
              key={iframeKey}
              src={`/proposal/${previewToken}`}
              title="Proposal preview"
              className="w-full h-[calc(100%-32px)] bg-white"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </Label>
      {children}
    </div>
  );
}
