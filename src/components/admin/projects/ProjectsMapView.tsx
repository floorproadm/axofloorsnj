import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { HubProject } from "@/hooks/useProjectsHub";

const STATUS_COLORS: Record<string, string> = {
  planning: "#64748b",
  in_progress: "#3b82f6",
  in_production: "#3b82f6",
  completed: "#10b981",
  awaiting_payment: "#f59e0b",
  paid: "#22c55e",
  cancelled: "#ef4444",
};

function colorFor(status: string) {
  return STATUS_COLORS[status] ?? "#6366f1";
}

function makePin(color: string) {
  const html = `
    <div style="position:relative;width:30px;height:38px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
      <svg viewBox="0 0 32 40" width="30" height="38">
        <path d="M16 0C7.2 0 0 7 0 15.7c0 11 16 24.3 16 24.3s16-13.3 16-24.3C32 7 24.8 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="15" r="6" fill="white"/>
      </svg>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [30, 38], iconAnchor: [15, 38], popupAnchor: [0, -34] });
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
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

interface Props {
  projects: HubProject[];
  onSelect: (p: HubProject) => void;
}

export function ProjectsMapView({ projects, onSelect }: Props) {
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

  const located = useMemo(() => {
    return withAddress
      .map((p, i) => ({ project: p, coords: queries[i].data ?? null }))
      .filter((x): x is { project: HubProject; coords: { lat: number; lng: number } } => x.coords !== null);
  }, [withAddress, queries]);

  const points = useMemo<[number, number][]>(
    () => located.map((x) => [x.coords.lat, x.coords.lng]),
    [located],
  );

  const center: [number, number] = points[0] ?? [40.7128, -74.006]; // NY fallback

  const missing = projects.length - withAddress.length;

  return (
    <div className="relative h-[calc(100vh-260px)] min-h-[500px] rounded-lg border overflow-hidden">
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
      <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {located.map(({ project, coords }) => (
          <Marker key={project.id} position={[coords.lat, coords.lng]} icon={makePin(colorFor(project.project_status))}>
            <Popup>
              <div className="space-y-1.5 min-w-[200px]">
                <button
                  onClick={() => onSelect(project)}
                  className="font-semibold text-sm hover:underline text-left block"
                >
                  {project.customer_name}
                </button>
                <div className="text-xs text-muted-foreground">{project.address}{project.city ? `, ${project.city}` : ""}</div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
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
                {project.start_date && (
                  <div className="text-[11px] text-muted-foreground pt-0.5">
                    Start: {format(parseISO(project.start_date), "MMM d, yyyy")}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
