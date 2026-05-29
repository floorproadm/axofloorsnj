import { useEffect, useMemo, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Users, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Appointment = Tables<"appointments">;

// Distinct hue colors for crews / assigned groups
const CREW_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function makePin(num: number, color: string) {
  const html = `
    <div style="
      position: relative; width: 32px; height: 40px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    ">
      <svg viewBox="0 0 32 40" width="32" height="40">
        <path d="M16 0C7.2 0 0 7 0 15.7c0 11 16 24.3 16 24.3s16-13.3 16-24.3C32 7 24.8 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="15" r="11" fill="white"/>
      </svg>
      <span style="
        position:absolute; top:4px; left:0; right:0; height:22px;
        display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:700; color:${color};
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      ">${num}</span>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] });
}

// Free OSM Nominatim geocoder, cached per address string
async function geocodeAddress(addr: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function FlyTo({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.flyTo([lat, lng], 14, { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

export function DispatchMapView({ appointments, date }: { appointments: Appointment[]; date: Date }) {
  const [crewFilter, setCrewFilter] = useState<string>("all");
  const [focused, setFocused] = useState<{ lat: number; lng: number; id: string } | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const withLocation = useMemo(() => appointments.filter(a => a.location && a.location.trim()), [appointments]);

  // Build crew groups based on first assigned member (proxy for crew)
  const crewKeyOf = (a: Appointment) => {
    const assigned = (a as any).assigned_to as string[] | null;
    return assigned && assigned.length > 0 ? assigned[0] : "unassigned";
  };
  const crews = useMemo(() => {
    const map = new Map<string, { key: string; color: string; count: number }>();
    let idx = 0;
    withLocation.forEach(a => {
      const k = crewKeyOf(a);
      if (!map.has(k)) {
        map.set(k, { key: k, color: k === "unassigned" ? "#94a3b8" : CREW_COLORS[idx++ % CREW_COLORS.length], count: 0 });
      }
      map.get(k)!.count++;
    });
    return map;
  }, [withLocation]);

  const filtered = useMemo(() =>
    crewFilter === "all" ? withLocation : withLocation.filter(a => crewKeyOf(a) === crewFilter),
    [crewFilter, withLocation]
  );

  // Geocode each appointment in parallel (cached)
  const geocodeQueries = useQueries({
    queries: filtered.map(a => ({
      queryKey: ["geocode", a.location],
      queryFn: () => geocodeAddress(a.location!),
      staleTime: 1000 * 60 * 60 * 24,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 1,
    })),
  });

  const points = filtered
    .map((a, i) => ({ a, coords: geocodeQueries[i]?.data ?? null, loading: geocodeQueries[i]?.isLoading }))
    .filter(p => p.coords);

  const loadingAny = geocodeQueries.some(q => q.isLoading);

  // Default center: NJ if no points yet
  const defaultCenter: [number, number] = points.length
    ? [points[0].coords!.lat, points[0].coords!.lng]
    : [40.7357, -74.1724]; // Newark, NJ

  if (withLocation.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground text-sm gap-2">
        <MapPin className="w-8 h-8 opacity-40" />
        Nenhum projeto com endereço agendado para {format(date, "dd/MM/yyyy")}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-20rem)] min-h-[500px] gap-3 p-3">
      {/* Sidebar */}
      <aside className="md:w-72 shrink-0 flex flex-col gap-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <Select value={crewFilter} onValueChange={setCrewFilter}>
            <SelectTrigger className="h-9 text-xs">
              <Users className="w-3.5 h-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as equipes ({withLocation.length})</SelectItem>
              {Array.from(crews.values()).map(c => (
                <SelectItem key={c.key} value={c.key}>
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    {c.key === "unassigned" ? "Sem equipe" : `Equipe ${c.key.slice(0, 6)}`} ({c.count})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingAny && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filtered.map((a, i) => {
            const coords = geocodeQueries[i]?.data;
            const color = crews.get(crewKeyOf(a))?.color || "#94a3b8";
            const isFocused = focused?.id === a.id;
            return (
              <button
                key={a.id}
                onClick={() => {
                  if (coords) {
                    setFocused({ ...coords, id: a.id });
                    markersRef.current[a.id]?.openPopup();
                  }
                }}
                className={cn(
                  "w-full text-left rounded-lg border border-border/60 bg-card p-2.5 hover:border-primary/40 transition-colors",
                  isFocused && "border-primary/60 ring-1 ring-primary/30"
                )}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: color }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{a.customer_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{a.location}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="tabular-nums">{a.appointment_time.slice(0, 5)}</span>
                      <span>·</span>
                      <span>{a.duration_hours}h</span>
                    </div>
                  </div>
                </div>
                {!coords && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">Endereço não localizado</p>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 rounded-lg overflow-hidden border border-border/60 relative">
        <MapContainer center={defaultCenter} zoom={11} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p, i) => {
            const color = crews.get(crewKeyOf(p.a))?.color || "#94a3b8";
            const orderIdx = filtered.findIndex(a => a.id === p.a.id);
            return (
              <Marker
                key={p.a.id}
                position={[p.coords!.lat, p.coords!.lng]}
                icon={makePin(orderIdx + 1, color)}
                ref={(ref) => { if (ref) markersRef.current[p.a.id] = ref as L.Marker; }}
                eventHandlers={{ click: () => setFocused({ ...p.coords!, id: p.a.id }) }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-sm">{p.a.customer_name}</p>
                    <p className="text-muted-foreground">{p.a.location}</p>
                    <p>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {p.a.appointment_time.slice(0, 5)} · {p.a.duration_hours}h
                    </p>
                    <Badge variant="outline" className="text-[10px]">{p.a.status}</Badge>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {focused && <FlyTo lat={focused.lat} lng={focused.lng} />}
        </MapContainer>
      </div>
    </div>
  );
}
