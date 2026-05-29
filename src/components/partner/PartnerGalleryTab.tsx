import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MessageCircle,
  Share2,
  Link2,
  Download,
  MapPin,
  Loader2,
  Palette,
  ExternalLink,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GalleryProject {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url: string;
  is_featured: boolean | null;
}

interface Props {
  partnerCode?: string;
  partnerName?: string | null;
}

const CATEGORY_ORDER = ["All", "Installation", "Stairs", "Tile Services", "Custom Jobs"];

const PUBLIC_BASE = "https://www.axofloorsnj.com";

export function PartnerGalleryTab({ partnerCode, partnerName }: Props) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("All");
  const [selected, setSelected] = useState<GalleryProject | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("gallery_projects")
        .select("id, title, description, category, location, image_url, is_featured")
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .limit(80);
      if (!error && data) setProjects(data as GalleryProject[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () =>
      activeCat === "All"
        ? projects
        : projects.filter((p) => p.category === activeCat),
    [projects, activeCat],
  );

  // Build a referral-tagged link for a project (deep-link to public gallery)
  const buildShareLink = (project: GalleryProject) => {
    const ref = partnerCode ? `?ref=${partnerCode}` : "";
    return `${PUBLIC_BASE}/gallery${ref}#project-${project.id}`;
  };

  const buildShareMessage = (project: GalleryProject) => {
    const link = buildShareLink(project);
    return `Check out this floor we did in ${project.location} — ${project.title}.\n\nAXO Floors handles refinishing, installation, and stairs across NJ. Free diagnostic here:\n${link}`;
  };

  const handleWhatsApp = (project: GalleryProject) => {
    const msg = encodeURIComponent(buildShareMessage(project));
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleSMS = (project: GalleryProject) => {
    const msg = encodeURIComponent(buildShareMessage(project));
    window.location.href = `sms:?&body=${msg}`;
  };

  const handleCopyLink = async (project: GalleryProject) => {
    try {
      await navigator.clipboard.writeText(buildShareLink(project));
      setCopied(true);
      toast({ title: "Link copied", description: "Tagged with your referral code." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  };

  const handleNativeShare = async (project: GalleryProject) => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: project.title,
          text: buildShareMessage(project),
          url: buildShareLink(project),
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    handleCopyLink(project);
  };

  const handleDownload = async (project: GalleryProject) => {
    try {
      const res = await fetch(project.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `axo-${project.title.replace(/\s+/g, "-").toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Image saved", description: "Post it on your stories." });
    } catch {
      window.open(project.image_url, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">Share Our Work</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real AXO projects — every share auto-tags with your referral code.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
        {CATEGORY_ORDER.map((cat) => {
          const isActive = activeCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn(
                "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
                isActive
                  ? "bg-[hsl(var(--navy-primary))] text-white border-[hsl(var(--navy-primary))]"
                  : "bg-card text-muted-foreground border-border hover:text-foreground",
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No projects in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted text-left"
            >
              <img
                src={p.image_url}
                alt={p.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2">
                <p className="text-[11px] font-semibold text-white leading-tight line-clamp-1">
                  {p.title}
                </p>
                <p className="text-[10px] text-white/75 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="line-clamp-1">{p.location}</span>
                </p>
              </div>
              {p.is_featured && (
                <span className="absolute top-1.5 left-1.5 text-[9px] uppercase tracking-wider font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  Featured
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Stain Gallery quick link (kept, compact) */}
      <a
        href={`${PUBLIC_BASE}/stain-gallery${partnerCode ? `?ref=${partnerCode}` : ""}`}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <Card className="p-3 flex items-center gap-3 hover:border-primary/40 transition-colors">
          <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Stain Color Tool</p>
            <p className="text-[11px] text-muted-foreground">
              40 DuraSeal colors · send to your client
            </p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
        </Card>
      </a>

      {/* Detail / Share sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="h-[92vh] overflow-y-auto p-0">
          {selected && (
            <>
              <div className="relative bg-black">
                <img
                  src={selected.image_url}
                  alt={selected.title}
                  className="w-full max-h-[55vh] object-contain"
                />
              </div>
              <SheetHeader className="px-4 pt-4 pb-2 pr-12">
                <SheetTitle className="text-base">{selected.title}</SheetTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selected.location} · {selected.category}
                </p>
              </SheetHeader>

              <div className="px-4 pb-2">
                <p className="text-xs text-muted-foreground">
                  {selected.description}
                </p>
              </div>

              <div className="px-4 pb-2">
                <div className="rounded-lg bg-muted/50 border border-border p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Share link (auto-tagged)
                  </p>
                  <p className="text-[11px] font-mono text-foreground break-all">
                    {buildShareLink(selected)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                <Button
                  onClick={() => handleWhatsApp(selected)}
                  className="bg-[#25D366] hover:bg-[#1ebe5b] text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={() => handleSMS(selected)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  SMS
                </Button>
                <Button variant="outline" onClick={() => handleCopyLink(selected)}>
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copied" : "Copy Link"}
                </Button>
                <Button variant="outline" onClick={() => handleDownload(selected)}>
                  <Download className="w-4 h-4 mr-2" />
                  Save Photo
                </Button>
              </div>

              {typeof navigator !== "undefined" && (navigator as any).share && (
                <div className="px-4 pb-6">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => handleNativeShare(selected)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    More sharing options…
                  </Button>
                </div>
              )}

              {partnerName && (
                <p className="px-4 pb-6 text-[10px] text-muted-foreground text-center">
                  Referred by {partnerName} — credited automatically on every share.
                </p>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
