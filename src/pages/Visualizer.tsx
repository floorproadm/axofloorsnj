import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, Download, RefreshCw, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PhotoUploader from "@/components/visualizer/PhotoUploader";
import BeforeAfterSlider from "@/components/visualizer/BeforeAfterSlider";
import { FLOOR_STYLES, type FloorStyle } from "@/lib/visualizer/floorStyles";

const CATEGORIES = ["Light", "Medium", "Dark", "Red", "Gray"] as const;

export default function Visualizer() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [selected, setSelected] = useState<FloorStyle | null>(null);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Light");
  const isAdmin = useLocation().pathname.startsWith("/admin");
  const backTo = isAdmin ? "/admin" : "/";

  const reset = () => {
    setPhoto(null);
    setResult(null);
    setSelected(null);
  };

  const generate = async (style: FloorStyle) => {
    if (!photo || loading) return;
    setSelected(style);
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("visualize-floor", {
        body: { imageDataUrl: photo, stylePrompt: style.prompt, styleName: style.name },
      });
      if (error) throw error;
      if (!data?.imageDataUrl) throw new Error("No image returned");
      setResult(data.imageDataUrl);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not generate. Try another photo.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `floorpro-${selected?.id ?? "preview"}.png`;
    a.click();
  };

  const styles = FLOOR_STYLES.filter((s) => s.category === category);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to={backTo}
            className="inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#0066FF]" />
            <h1 className="text-sm font-semibold tracking-tight">AI Floor Visualizer</h1>
          </div>
          {photo ? (
            <button
              onClick={reset}
              className="inline-flex items-center text-sm text-white/60 hover:text-white"
            >
              <ImagePlus className="h-4 w-4 mr-1.5" />
              New
            </button>
          ) : (
            <span className="w-12" />
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-32">
        {!photo ? (
          <div className="space-y-6 pt-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <PhotoUploader onPhoto={setPhoto} />
            </div>
            <ol className="text-xs text-white/50 space-y-1.5 px-2">
              <li>1. Stand back and capture the full floor area</li>
              <li>2. Keep lighting natural — avoid heavy shadows</li>
              <li>3. Pick a wood style — AI does the rest</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Preview */}
            <div className="relative">
              {result ? (
                <BeforeAfterSlider before={photo} after={result} />
              ) : (
                <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                  <img
                    src={photo}
                    alt="Your room"
                    className="block w-full h-auto"
                    draggable={false}
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
                      <div className="text-sm font-medium">Rendering {selected?.name}…</div>
                      <div className="text-xs text-white/50">This usually takes 10–20 seconds</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Result actions */}
            {result && !loading && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-0 text-white"
                  onClick={() => selected && generate(selected)}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-0 text-white"
                  onClick={download}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Save
                </Button>
                <div className="flex-1" />
                {selected && (
                  <span className="text-xs text-white/60 truncate">{selected.name}</span>
                )}
              </div>
            )}

            {/* Category tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/10">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${
                    category === c
                      ? "bg-white text-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Floor grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {styles.map((s) => {
                const active = selected?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => generate(s)}
                    disabled={loading}
                    className={`group relative aspect-square overflow-hidden rounded-lg border transition disabled:opacity-50 ${
                      active
                        ? "border-[#0066FF] ring-2 ring-[#0066FF]/40"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={s.swatch}
                      alt={s.name}
                      loading="lazy"
                      width={1024}
                      height={1024}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
                      <div className="text-[10px] font-medium leading-tight text-white">
                        {s.name}
                      </div>
                    </div>
                    {active && loading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            {result && (
              <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur p-3">
                <div className="max-w-3xl mx-auto flex gap-2">
                  <Button
                    asChild
                    className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] text-white font-semibold h-11"
                  >
                    <Link to="/floor-diagnostic">
                      Get a quote for {selected?.name ?? "this floor"}
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            <p className="text-[10px] leading-relaxed text-white/40 text-center pt-2">
              AI preview is an approximation. Final color and grain depend on lighting, subfloor and finish.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
