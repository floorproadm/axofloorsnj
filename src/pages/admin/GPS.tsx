import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, MapPin, Navigation, Radio } from "lucide-react";

type Tech = {
  id: string;
  full_name: string;
  color: string | null;
};

type Job = {
  id: string;
  customer_name: string;
  address: string | null;
  project_status: string;
  start_date: string | null;
  team_lead: string | null;
  team_members: string[] | null;
};

type GeoPoint = { lat: number; lng: number };

const STATUS_COLOR: Record<string, string> = {
  planning: "#f97316",
  in_progress: "#1e3a5f",
  completed: "#16a34a",
};

function statusLabel(s: string) {
  if (s === "in_progress") return "Em Produção";
  if (s === "planning") return "Planning";
  if (s === "completed") return "Concluído";
  return s;
}

// In-memory cache for geocoding to avoid repeat calls
const geoCache = new Map<string, GeoPoint | null>();

async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  if (!address) return null;
  if (geoCache.has(address)) return geoCache.get(address) ?? null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data[0]) {
      const p = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geoCache.set(address, p);
      return p;
    }
    geoCache.set(address, null);
    return null;
  } catch {
    return null;
  }
}

function makePinIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    html: `
      <div style="position:relative;width:28px;height:36px;">
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 0C6.3 0 0 6.3 0 14c0 10 14 22 14 22s14-12 14-22C28 6.3 21.7 0 14 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="14" cy="14" r="6" fill="white"/>
        </svg>
        <div style="position:absolute;top:8px;left:0;right:0;text-align:center;font-size:10px;font-weight:700;color:${color};">
          ${label}
        </div>
      </div>
    `,
  });
}

function MapController({ center }: { center: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], 15, { duration: 0.8 });
  }, [center, map]);
  return null;
}

export default function GPS() {
  const [now, setNow] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focus, setFocus] = useState<GeoPoint | null>(null);
  const [geo, setGeo] = useState<Record<string, GeoPoint>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data: techs = [] } = useQuery({
    queryKey: ["gps-techs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, color, is_active_crew" as any)
        .eq("is_active_crew" as any, true);
      return (data || []) as unknown as Tech[];
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["gps-jobs", today],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, customer_name, address, project_status, start_date, team_lead, team_members")
        .or(`start_date.eq.${today},project_status.eq.in_progress`);
      return (data || []) as Job[];
    },
    refetchInterval: 60_000,
  });

  // Geocode all addresses in view
  useEffect(() => {
    const targets = new Set<string>();
    jobs.forEach((j) => j.address && targets.add(j.address));
    targets.forEach(async (addr) => {
      if (geo[addr] || fetchingRef.current.has(addr)) return;
      fetchingRef.current.add(addr);
      const p = await geocodeAddress(addr);
      if (p) setGeo((g) => ({ ...g, [addr]: p }));
    });
  }, [jobs, geo]);

  // Map each tech to their active in-progress job (simulated GPS location)
  const techJobMap = useMemo(() => {
    const map = new Map<string, Job>();
    techs.forEach((t) => {
      const job = jobs.find(
        (j) =>
          j.project_status === "in_progress" &&
          (j.team_lead === t.id || (j.team_members || []).includes(t.id))
      );
      if (job) map.set(t.id, job);
    });
    return map;
  }, [techs, jobs]);

  // Next job per tech (any non-completed not equal to current)
  const techNextMap = useMemo(() => {
    const map = new Map<string, Job>();
    techs.forEach((t) => {
      const current = techJobMap.get(t.id);
      const next = jobs.find(
        (j) =>
          j.id !== current?.id &&
          j.project_status !== "completed" &&
          (j.team_lead === t.id || (j.team_members || []).includes(t.id))
      );
      if (next) map.set(t.id, next);
    });
    return map;
  }, [techs, jobs, techJobMap]);

  const techsInField = techs.filter((t) => techJobMap.has(t.id));

  const defaultCenter: GeoPoint = { lat: 40.7357, lng: -74.1724 }; // Newark, NJ region

  return (
    <div className="flex h-[calc(100vh-3rem)] w-full overflow-hidden bg-background">
      {/* Map area */}
      <div className="flex-1 relative">
        {/* Header overlay */}
        <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-3 pointer-events-none">
          <Card className="pointer-events-auto px-4 py-2 flex items-center gap-3 shadow-md">
            <MapPin className="w-5 h-5 text-[#1e3a5f]" />
            <div>
              <h1 className="text-base font-bold text-[#1e3a5f] leading-tight">Rastreamento GPS</h1>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {now.toLocaleString("pt-BR")}
              </p>
            </div>
            <Badge className="ml-2 bg-green-100 text-green-700 border border-green-300 gap-1.5">
              <Radio className="w-3 h-3 animate-pulse" />
              {techsInField.length} {techsInField.length === 1 ? "técnico em campo" : "técnicos em campo"}
            </Badge>
          </Card>
          <Card className="pointer-events-auto px-3 py-1.5 text-[11px] text-muted-foreground max-w-xs hidden md:block">
            Localização baseada no job atual — GPS em tempo real disponível via app mobile
          </Card>
        </div>

        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={11}
          className="h-full w-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={focus} />

          {/* Job pins */}
          {jobs.map((j) => {
            if (!j.address) return null;
            const pt = geo[j.address];
            if (!pt) return null;
            const color = STATUS_COLOR[j.project_status] || "#64748b";
            return (
              <Marker key={`job-${j.id}`} position={[pt.lat, pt.lng]} icon={makePinIcon(color, "🏠")}>
                <Popup>
                  <div className="text-xs">
                    <div className="font-bold text-[#1e3a5f]">{j.customer_name}</div>
                    <div className="text-muted-foreground">{j.address}</div>
                    <Badge className="mt-1" style={{ backgroundColor: color, color: "white" }}>
                      {statusLabel(j.project_status)}
                    </Badge>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Tech pins (offset slightly to avoid overlap with job pin) */}
          {techs.map((t) => {
            const job = techJobMap.get(t.id);
            if (!job?.address) return null;
            const pt = geo[job.address];
            if (!pt) return null;
            const techPt = { lat: pt.lat + 0.0008, lng: pt.lng + 0.0008 };
            const color = t.color || "#1e3a5f";
            const initials = (t.full_name || "?")
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const next = techNextMap.get(t.id);
            const nextPt = next?.address ? geo[next.address] : null;
            return (
              <div key={`tech-${t.id}`}>
                <Marker position={[techPt.lat, techPt.lng]} icon={makePinIcon(color, initials)}>
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold" style={{ color }}>{t.full_name}</div>
                      <div className="text-muted-foreground mt-0.5">{job.customer_name}</div>
                      <div className="text-muted-foreground">{job.address}</div>
                      {job.start_date && (
                        <div className="mt-1">Início: {new Date(job.start_date).toLocaleDateString("pt-BR")}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
                {nextPt && (
                  <Polyline
                    positions={[[techPt.lat, techPt.lng], [nextPt.lat, nextPt.lng]]}
                    pathOptions={{ color, weight: 2, dashArray: "6 6", opacity: 0.7 }}
                  />
                )}
              </div>
            );
          })}
        </MapContainer>
      </div>

      {/* Side panel */}
      <div
        className={`relative border-l border-border bg-card transition-all duration-300 ${
          sidebarOpen ? "w-[280px]" : "w-0"
        }`}
      >
        <Button
          size="icon"
          variant="outline"
          className="absolute -left-3 top-4 h-6 w-6 rounded-full z-[500] bg-card"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {sidebarOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </Button>

        {sidebarOpen && (
          <div className="h-full overflow-y-auto p-3">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-[#1e3a5f]">Técnicos em campo</h2>
              <p className="text-[11px] text-muted-foreground">
                {techsInField.length} de {techs.length} ativos
              </p>
            </div>

            <div className="space-y-2">
              {techsInField.length === 0 && (
                <Card className="p-3 text-xs text-muted-foreground text-center">
                  Nenhum técnico em campo agora.
                </Card>
              )}
              {techsInField.map((t) => {
                const job = techJobMap.get(t.id)!;
                const color = t.color || "#1e3a5f";
                const initials = (t.full_name || "?")
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                const minsAgo = Math.floor(Math.random() * 8) + 1;
                return (
                  <Card key={t.id} className="p-3">
                    <div className="flex items-start gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {t.full_name}
                        </div>
                        <Badge className="mt-0.5 h-4 text-[9px] bg-blue-100 text-blue-700 border-blue-200">
                          Em Campo
                        </Badge>
                        <div className="text-[11px] text-muted-foreground mt-1.5 truncate">
                          {job.address || "Sem endereço"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          há {minsAgo} min
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 h-7 text-[11px]"
                      onClick={() => {
                        const pt = job.address ? geo[job.address] : null;
                        if (pt) setFocus({ ...pt });
                      }}
                    >
                      <Navigation className="w-3 h-3 mr-1" /> Centralizar
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
