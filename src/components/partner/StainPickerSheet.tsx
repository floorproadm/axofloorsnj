import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, MessageCircle, Link2, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Eagerly load all 39 DuraSeal stain swatches via Vite glob
const STAIN_MODULES = import.meta.glob("@/assets/stains/*.jpg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const toTitleCase = (slug: string) =>
  slug
    .replace(/\.jpg$/i, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

interface StainSwatch {
  name: string;
  url: string;
}

const STAINS: StainSwatch[] = Object.entries(STAIN_MODULES)
  .map(([path, url]) => {
    const slug = path.split("/").pop() || "";
    return { name: toTitleCase(slug), url };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  partnerCode?: string;
}

const PUBLIC_BASE = "https://www.axofloorsnj.com";
const MAX_PICKS = 3;

export function StainPickerSheet({ open, onOpenChange, partnerCode }: Props) {
  const { toast } = useToast();
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (name: string) => {
    setPicked((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= MAX_PICKS) {
        toast({
          title: `Pick up to ${MAX_PICKS} colors`,
          description: "Remove one to add another.",
        });
        return prev;
      }
      return [...prev, name];
    });
  };

  const link = `${PUBLIC_BASE}/stain-gallery${partnerCode ? `?ref=${partnerCode}` : ""}`;

  const message = useMemo(() => {
    if (picked.length === 0) return "";
    const list = picked.map((n) => `• ${n}`).join("\n");
    return `Based on your floor, here are ${picked.length === 1 ? "the color" : `${picked.length} colors`} I'd recommend from AXO Floors (DuraSeal):\n\n${list}\n\nYou can see them on real White Oak and Red Oak samples here:\n${link}`;
  }, [picked, link]);

  const handleSend = () => {
    const msg = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast({ title: "Message copied" });
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ text: message, url: link });
      } catch {
        /* cancel */
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[92vh] overflow-y-auto p-0">
        <SheetHeader className="px-4 pt-4 pb-2 pr-12 sticky top-0 bg-background z-0 border-b">
          <SheetTitle className="text-lg">Send Stain Colors</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Pick up to {MAX_PICKS} colors to recommend — message auto-tags with your referral.
          </p>
        </SheetHeader>

        {/* Swatch grid */}
        <div className="px-3 pt-3 pb-4">
          <div className="grid grid-cols-4 gap-2">
            {STAINS.map((s) => {
              const isPicked = picked.includes(s.name);
              return (
                <button
                  key={s.name}
                  onClick={() => toggle(s.name)}
                  className={cn(
                    "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                    isPicked
                      ? "border-primary ring-2 ring-primary/30 scale-[0.97]"
                      : "border-transparent hover:border-border",
                  )}
                >
                  <img
                    src={s.url}
                    alt={s.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pt-3 pb-1">
                    <p className="text-[9px] font-semibold text-white leading-tight line-clamp-2 text-left">
                      {s.name}
                    </p>
                  </div>
                  {isPicked && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky action bar */}
        {picked.length > 0 && (
          <div className="sticky bottom-0 bg-background border-t p-3 space-y-2">
            <div className="rounded-lg bg-muted/50 border border-border p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Message preview ({picked.length}/{MAX_PICKS})
              </p>
              <p className="text-[11px] text-foreground whitespace-pre-line line-clamp-4">
                {message}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={handleSend}
                className="bg-[#25D366] hover:bg-[#1ebe5b] text-white"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Link2 className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" onClick={handleNativeShare}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
