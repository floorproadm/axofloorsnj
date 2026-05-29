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
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Folder,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StainPickerSheet } from "./StainPickerSheet";
import { QuickPitchSheet } from "./QuickPitchSheet";

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

const CATEGORIES = ["Installation", "Stairs", "Tile Services", "Custom Jobs"];

const PUBLIC_BASE = "https://www.axofloorsnj.com";

export function PartnerGalleryTab({ partnerCode, partnerName }: Props) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [selected, setSelected] = useState<GalleryProject | null>(null);
  const [copied, setCopied] = useState(false);
  const [stainOpen, setStainOpen] = useState(false);
  const [pitchOpen, setPitchOpen] = useState(false);

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

  const folders = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = projects.filter((p) => p.category === cat);
      return { name: cat, items, cover: items[0]?.image_url };
    }).filter((f) => f.items.length > 0);
  }, [projects]);

  const currentFolder = useMemo(
    () => folders.find((f) => f.name === openFolder) || null,
    [folders, openFolder],
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
      <div className="flex items-start gap-2">
        {currentFolder && (
          <button
            onClick={() => setOpenFolder(null)}
            className="mt-1 -ml-1 p-1 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Back to folders"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold">
            {currentFolder ? currentFolder.name : "Share Our Work"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentFolder
              ? `${currentFolder.items.length} ${currentFolder.items.length === 1 ? "project" : "projects"} · tap to share with referral code`
              : "Real AXO projects organized by service — every share auto-tags your referral code."}
          </p>
        </div>
      </div>

      {/* Body — Folders or Project grid */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !currentFolder ? (
        // Folder list (minimalist)
        folders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No projects yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {folders.map((f) => (
              <button
                key={f.name}
                onClick={() => setOpenFolder(f.name)}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted text-left"
              >
                {f.cover && (
                  <img
                    src={f.cover}
                    alt={f.name}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-70 transition-transform group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/10" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <Folder className="w-5 h-5 text-white/90" />
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight line-clamp-1">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-white/70 mt-0.5">
                      {f.items.length} {f.items.length === 1 ? "project" : "projects"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        // Inside folder — project grid
        <div className="grid grid-cols-2 gap-2">
          {currentFolder.items.map((p) => (
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


      {/* Sales Toolkit — Stain Picker + Quick Pitch */}
      <div className="pt-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2">
          Sales Toolkit
        </p>
        <div className="grid grid-cols-1 gap-2">
          <button onClick={() => setStainOpen(true)} className="text-left">
            <Card className="p-3 flex items-center gap-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Send Stain Colors</p>
                <p className="text-[11px] text-muted-foreground">
                  Pick 3 from 39 DuraSeal colors · client gets WhatsApp message
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Card>
          </button>

          <button onClick={() => setPitchOpen(true)} className="text-left">
            <Card className="p-3 flex items-center gap-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-md bg-[hsl(var(--navy-primary))]/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[hsl(var(--navy-primary))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Ready-to-Send Pitches</p>
                <p className="text-[11px] text-muted-foreground">
                  4 pre-written messages · Floor Diagnostic, Why AXO, Quote in 24h
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Card>
          </button>

          <a
            href={`${PUBLIC_BASE}/stain-gallery${partnerCode ? `?ref=${partnerCode}` : ""}`}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Card className="p-3 flex items-center gap-3 hover:border-primary/40 transition-colors">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Public Stain Gallery</p>
                <p className="text-[11px] text-muted-foreground">
                  Full DuraSeal catalog on White Oak & Red Oak samples
                </p>
              </div>
            </Card>
          </a>
        </div>
      </div>

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

      <StainPickerSheet
        open={stainOpen}
        onOpenChange={setStainOpen}
        partnerCode={partnerCode}
      />
      <QuickPitchSheet
        open={pitchOpen}
        onOpenChange={setPitchOpen}
        partnerCode={partnerCode}
        partnerName={partnerName}
      />
    </div>
  );
}
