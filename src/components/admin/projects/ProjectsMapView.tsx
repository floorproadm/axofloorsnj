import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapPin, Loader2, ExternalLink, Calendar, User, Briefcase, DollarSign, Palette } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { HubProject } from "@/hooks/useProjectsHub";

type ColorMode = "status" | "source";
const COLOR_MODE_KEY = "projects-map-color-mode";

const STATUS_COLORS: Record<string, string> = {
  planning: "#64748b",
  in_progress: "#3b82f6",
  in_production: "#3b82f6",
  completed: "#10b981",
  awaiting_payment: "#f59e0b",
  paid: "#22c55e",
  cancelled: "#ef4444",
};

const SOURCE_COLORS = {
  partner: "#a855f7", // purple — partner referral
  direct: "#f97316", // orange — direct customer
};

const isPartner = (p: HubProject) => !!p.partner_name;

function colorFor(p: HubProject, mode: ColorMode): string {
  if (mode === "source") return isPartner(p) ? SOURCE_COLORS.partner : SOURCE_COLORS.direct;
  return STATUS_COLORS[p.project_status] ?? "#6366f1";
}

const LEGENDS: Record<ColorMode, { color: string; label: string }[]> = {
  status: [
    { color: STATUS_COLORS.planning, label: "Planning" },
    { color: STATUS_COLORS.in_progress, label: "In Progress" },
    { color: STATUS_COLORS.completed, label: "Completed" },
    { color: STATUS_COLORS.awaiting_payment, label: "Awaiting Pmt" },
    { color: STATUS_COLORS.paid, label: "Paid" },
  ],
  source: [
    { color: SOURCE_COLORS.partner, label: "Partner referral" },
    { color: SOURCE_COLORS.direct, label: "Direct customer" },
  ],
};

function makePin(color: string) {
  const html = `
    <div style="position:relative;width:30px;height:38px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
      <svg viewBox="0 0 32 40" width="30" height="38">
        <path d="M16 0C7.2 0 0 7 0 15.7c0 11 16 24.3 16 24.3s16-13.3 16-24.3C32 7 24.8 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="15" r="6" fill="white"/>
      </svg>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [30, 38], iconAnchor: [15, 38] });
}

async function geocodeAddress(addr: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [points, map]);
  return null;
}

interface Props {
  projects: HubProject[];
  onSelect: (p: HubProject) => void;
}

export function ProjectsMapView({ projects, onSelect }: Props) {
  const [active, setActive] = useState<HubProject | null>(null);
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    if (typeof window === "undefined") return "status";
    return (localStorage.getItem(COLOR_MODE_KEY) as ColorMode) || "status";
  });

  useEffect(() => {
    localStorage.setItem(COLOR_MODE_KEY, colorMode);
  }, [colorMode]);

  const withAddress = useMemo(
    () => projects.filter((p) => p.address && p.address.trim()),
    [projects],
  );

  const queries = useQueries({
    queries: withAddress.map((p) => {
      const fullAddr = p.city ? `${p.address}, ${p.city}` : (p.address as string);
      return {
        queryKey: ["geocode", fullAddr],
        queryFn: () => geocodeAddress(fullAddr),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24 * 7,
        retry: 1,
      };
    }),
  });

  const loading = queries.some((q) => q.isLoading);

  const located = useMemo(
    () =>
      withAddress
        .map((p, i) => ({ project: p, coords: queries[i].data ?? null }))
        .filter((x): x is { project: HubProject; coords: { lat: number; lng: number } } => x.coords !== null),
    [withAddress, queries],
  );

  const points = useMemo<[number, number][]>(
    () => located.map((x) => [x.coords.lat, x.coords.lng]),
    [located],
  );

  const center: [number, number] = points[0] ?? [40.7128, -74.006];
  const missing = projects.length - withAddress.length;

  return (
    <div className="relative h-[calc(100dvh-340px)] min-h-[420px] max-h-[720px] rounded-lg border overflow-hidden">
      {loading && (
        <div className="absolute top-3 right-3 z-[500] flex items-center gap-2 rounded-md bg-background/90 backdrop-blur px-3 py-1.5 text-xs border shadow">
          <Loader2 className="h-3 w-3 animate-spin" /> Geocoding addresses...
        </div>
      )}
      {(missing > 0 || withAddress.length === 0) && (
        <div className="absolute top-3 left-3 z-[500] rounded-md bg-background/90 backdrop-blur px-3 py-1.5 text-xs border shadow flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          {withAddress.length === 0
            ? "Nenhum projeto com endereço cadastrado"
            : `${located.length} no mapa · ${missing} sem endereço`}
        </div>
      )}

      {/* Color-by toggle + legend */}
      <div className="absolute bottom-3 left-3 z-[500] rounded-md bg-background/95 backdrop-blur border shadow-md p-2 space-y-2 max-w-[260px]">
        <div className="flex items-center gap-1.5">
          <Palette className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Color by</span>
          <div className="ml-auto flex rounded-md bg-muted p-0.5">
            {(["status", "source"] as ColorMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setColorMode(m)}
                className={`text-[10px] px-2 py-0.5 rounded-sm capitalize transition ${
                  colorMode === m ? "bg-background shadow-sm font-medium" : "text-muted-foreground"
                }`}
              >
                {m === "source" ? "Source" : "Status"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-2.5 gap-y-1">
          {LEGENDS[colorMode].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {located.map(({ project, coords }) => (
          <Marker
            key={`${project.id}-${colorMode}`}
            position={[coords.lat, coords.lng]}
            icon={makePin(colorFor(project, colorMode))}
            eventHandlers={{ click: () => setActive(project) }}
          />
        ))}
      </MapContainer>

      <MapDetailPanel
        project={active}
        colorMode={colorMode}
        onClose={() => setActive(null)}
        onOpen={(p) => {
          setActive(null);
          onSelect(p);
        }}
      />
    </div>
  );
}

function MapDetailPanel({
  project,
  colorMode,
  onClose,
  onOpen,
}: {
  project: HubProject | null;
  colorMode: ColorMode;
  onClose: () => void;
  onOpen: (p: HubProject) => void;
}) {
  const pinColor = project ? colorFor(project, colorMode) : "#6366f1";
  return (
    <Sheet open={!!project} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px] p-0 flex flex-col">
        {project && (
          <>
            <SheetHeader className="p-4 border-b space-y-2">
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: colorFor(project.project_status) }}
                />
                <SheetTitle className="text-base leading-tight">{project.customer_name}</SheetTitle>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[10px] h-5"
                  style={{ borderColor: colorFor(project.project_status), color: colorFor(project.project_status) }}
                >
                  {project.project_status.replace(/_/g, " ")}
                </Badge>
                {project.project_type && (
                  <Badge variant="secondary" className="text-[10px] h-5">{project.project_type}</Badge>
                )}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              <Row icon={MapPin} label="Address">
                {project.address || "—"}
                {project.city ? `, ${project.city}` : ""}
              </Row>
              {project.partner_name && (
                <Row icon={User} label="Partner">{project.partner_name}</Row>
              )}
              {project.square_footage != null && (
                <Row icon={Briefcase} label="Size">{project.square_footage} sqft</Row>
              )}
              {project.start_date && (
                <Row icon={Calendar} label="Start">
                  {format(parseISO(project.start_date), "MMM d, yyyy")}
                </Row>
              )}
              {project.job_costs?.estimated_revenue != null && (
                <Row icon={DollarSign} label="Revenue">
                  ${project.job_costs.estimated_revenue.toLocaleString()}
                  {project.job_costs.margin_percent != null && (
                    <span className="text-muted-foreground ml-2">
                      · {project.job_costs.margin_percent.toFixed(0)}% margin
                    </span>
                  )}
                </Row>
              )}
              {project.next_action && (
                <div className="rounded-md border bg-muted/40 p-2.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Next action</div>
                  <div className="text-xs">{project.next_action}</div>
                </div>
              )}
            </div>

            <div className="p-3 border-t">
              <Button size="sm" className="w-full gap-1.5" onClick={() => onOpen(project)}>
                <ExternalLink className="h-3.5 w-3.5" /> Open full project
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-xs">{children}</div>
      </div>
    </div>
  );
}
