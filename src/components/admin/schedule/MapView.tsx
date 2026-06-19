import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Briefcase, Calendar, Users, Edit2, Copy as CopyIcon, Trash2, MapPin, Mail,
  Phone, FileText, DollarSign, ListChecks, ImagePlus, StickyNote, Activity,
  PlayCircle, CheckCircle, Receipt, Plus,
} from "lucide-react";
import {
  useProjectChecklist, useAddChecklistTemplate, useUpdateChecklistItem,
  CHECKLIST_TEMPLATES,
} from "@/hooks/useProjectChecklist";
import { useProjectPhotos, useUploadProjectPhoto } from "@/hooks/useProjectPhotos";
import { useProjectNotes, useUpsertProjectNotes } from "@/hooks/useProjectNotes";
import { useProjectActivity } from "@/hooks/useProjectActivity";

type GeoPoint = { lat: number; lng: number };
type Tech = { id: string; full_name: string; color: string | null };
type JobRow = {
  id: string;
  customer_name: string;
  address: string | null;
  city: string | null;
  project_status: string;
  start_date: string | null;
  team_lead: string | null;
  team_members: string[] | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  priority?: string | null;
  project_type?: string | null;
};

const STATUS_META: Record<string, { label: string; color: string; badge: string }> = {
  planning: { label: "Scheduled", color: "#3b82f6", badge: "bg-blue-100 text-blue-700 border-blue-300" },
  in_progress: { label: "In Progress", color: "#f59e0b", badge: "bg-amber-100 text-amber-700 border-amber-300" },
  completed: { label: "Completed", color: "#16a34a", badge: "bg-green-100 text-green-700 border-green-300" },
  awaiting_payment: { label: "Awaiting Payment", color: "#a855f7", badge: "bg-purple-100 text-purple-700 border-purple-300" },
  paid: { label: "Paid", color: "#22c55e", badge: "bg-green-100 text-green-700 border-green-300" },
};

const geoCache = new Map<string, GeoPoint | null>();
async function geocode(addr: string): Promise<GeoPoint | null> {
  if (!addr) return null;
  if (geoCache.has(addr)) return geoCache.get(addr) ?? null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addr)}`, { headers: { "Accept-Language": "en" } });
    const data = await r.json();
    if (Array.isArray(data) && data[0]) {
      const p = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geoCache.set(addr, p); return p;
    }
  } catch {}
  geoCache.set(addr, null); return null;
}

function briefcasePin(color: string) {
  return L.divIcon({
    className: "",
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));">
      <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.6 0 0 7.4 0 16.5 0 28 17 42 17 42s17-14 17-25.5C34 7.4 26.4 0 17 0z" fill="${color}" stroke="white" stroke-width="2"/>
        <g transform="translate(8.5 8) scale(0.75)">
          <rect x="2" y="6" width="20" height="13" rx="2" fill="white"/>
          <rect x="7" y="3" width="10" height="4" rx="1" fill="white"/>
          <line x1="2" y1="12" x2="22" y2="12" stroke="${color}" stroke-width="1.5"/>
        </g>
      </svg></div>`,
  });
}

function techPin(color: string, initials: string) {
  return L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:11px;">${initials}</div>`,
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 14 });
  }, [points.length]); // eslint-disable-line
  return null;
}

interface Props { date: Date }

export function MapView({ date }: Props) {
  const dateStr = format(date, "yyyy-MM-dd");
  const [geo, setGeo] = useState<Record<string, GeoPoint>>({});
  const fetching = useRef<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: techs = [] } = useQuery({
    queryKey: ["map-techs"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("profiles")
        .select("id, full_name, color, is_active_crew").eq("is_active_crew", true);
      return (data || []) as Tech[];
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["map-jobs", dateStr],
    queryFn: async () => {
      const { data } = await supabase.from("projects")
        .select("id, customer_name, address, city, project_status, start_date, team_lead, team_members, customer_email, customer_phone, project_type")
        .or(`start_date.eq.${dateStr},project_status.eq.in_progress`);
      return (data || []) as JobRow[];
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    jobs.forEach(async (j) => {
      if (!j.address) return;
      const full = j.city ? `${j.address}, ${j.city}` : j.address;
      if (geo[full] || fetching.current.has(full)) return;
      fetching.current.add(full);
      const p = await geocode(full);
      if (p) setGeo((g) => ({ ...g, [full]: p }));
    });
  }, [jobs, geo]);

  const todayCount = jobs.filter((j) => j.start_date === dateStr).length;
  const openCount = jobs.filter((j) => !["completed", "paid", "cancelled"].includes(j.project_status)).length;

  const points: [number, number][] = useMemo(() =>
    jobs.flatMap((j) => {
      if (!j.address) return [];
      const full = j.city ? `${j.address}, ${j.city}` : j.address;
      const p = geo[full]; return p ? [[p.lat, p.lng] as [number, number]] : [];
    }), [jobs, geo]);

  const techJobMap = useMemo(() => {
    const m = new Map<string, JobRow>();
    techs.forEach((t) => {
      const job = jobs.find((j) => j.project_status === "in_progress" &&
        (j.team_lead === t.id || (j.team_members || []).includes(t.id)));
      if (job) m.set(t.id, job);
    });
    return m;
  }, [techs, jobs]);

  const center: [number, number] = points[0] ?? [40.7357, -74.1724];

  return (
    <div className="flex flex-col h-[calc(100dvh-180px)] sm:h-[calc(100vh-240px)] min-h-[420px] w-full overflow-hidden rounded-lg border border-slate-700">
      {/* Top bar — HUD */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-1.5">
          <Pill icon={<Calendar className="w-3.5 h-3.5" />} label={`${todayCount} today`} />
          <Pill icon={<Briefcase className="w-3.5 h-3.5" />} label={`${openCount} open`} />
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 min-h-0 isolate z-0">
        <MapContainer center={center} zoom={11} className="h-full w-full" style={{ zIndex: 0 }} scrollWheelZoom>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
          <FitBounds points={points} />

          {jobs.map((j) => {
            if (!j.address) return null;
            const full = j.city ? `${j.address}, ${j.city}` : j.address;
            const p = geo[full]; if (!p) return null;
            const color = STATUS_META[j.project_status]?.color ?? "#3b82f6";
            return (
              <Marker key={`job-${j.id}`} position={[p.lat, p.lng]} icon={briefcasePin(color)}
                eventHandlers={{ click: () => setSelectedId(j.id) }} />
            );
          })}

          {techs.map((t) => {
            const job = techJobMap.get(t.id); if (!job?.address) return null;
            const full = job.city ? `${job.address}, ${job.city}` : job.address;
            const p = geo[full]; if (!p) return null;
            const initials = (t.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
            return (
              <Marker key={`tech-${t.id}`} position={[p.lat + 0.0009, p.lng + 0.0009]}
                icon={techPin(t.color || "#1e3a5f", initials)} />
            );
          })}
        </MapContainer>
      </div>

      {/* Bottom bar — Legend */}
      <div className="flex items-center gap-x-2 gap-y-1 flex-wrap px-3 py-2 bg-slate-900/95 border-t border-slate-700 shrink-0">
        {[
          ["#3b82f6", "Scheduled"],
          ["#f59e0b", "In Progress"],
          ["#16a34a", "Done"],
          ["#a855f7", "Awaiting $"],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1 text-[11px] text-slate-100 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}
          </span>
        ))}
      </div>

      <JobDetailDrawer projectId={selectedId} onClose={() => setSelectedId(null)} techs={techs} />
    </div>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-800/70 text-slate-100 text-[11px] sm:text-xs font-medium tabular-nums whitespace-nowrap">
      <span className="text-slate-300">{icon}</span>{label}
    </div>
  );
}

/* ============================ Drawer ============================ */

export function JobDetailDrawer({
  projectId, onClose, techs,
}: { projectId: string | null; onClose: () => void; techs: Tech[] }) {
  const open = !!projectId;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: project } = useQuery({
    queryKey: ["map-project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("id", projectId!).maybeSingle();
      return data as any;
    },
  });

  const { data: jobCost } = useQuery({
    queryKey: ["map-jobcost", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await supabase.from("job_costs").select("*").eq("project_id", projectId!).maybeSingle();
      return data as any;
    },
  });

  const { data: costItems = [] } = useQuery({
    queryKey: ["map-costitems", jobCost?.id],
    enabled: !!jobCost?.id,
    queryFn: async () => {
      const { data } = await supabase.from("job_cost_items").select("*").eq("job_cost_id", jobCost.id);
      return (data || []) as any[];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["map-invoices", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("*").eq("project_id", projectId!);
      return (data || []) as any[];
    },
  });

  const { data: proposal } = useQuery({
    queryKey: ["map-proposal", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await supabase.from("proposals").select("id, share_token")
        .eq("project_id", projectId!).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data as any;
    },
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["map-lineitems", proposal?.id],
    enabled: !!proposal?.id,
    queryFn: async () => {
      const { data } = await supabase.from("proposal_line_items").select("*").eq("proposal_id", proposal.id);
      return (data || []) as any[];
    },
  });

  const { data: photos = [] } = useProjectPhotos(projectId || undefined);
  const { data: checklist = [] } = useProjectChecklist(projectId || undefined);
  const { data: notes } = useProjectNotes(projectId || undefined);
  const { data: activity = [] } = useProjectActivity(projectId || undefined);

  const upsertNotes = useUpsertProjectNotes();
  const uploadPhoto = useUploadProjectPhoto();
  const addTemplate = useAddChecklistTemplate();
  const updateChecklistItem = useUpdateChecklistItem();

  const [notesDraft, setNotesDraft] = useState("");
  useEffect(() => { setNotesDraft(notes?.tech_notes ?? ""); }, [notes?.tech_notes, projectId]);

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("projects").update({ project_status: status as any }).eq("id", projectId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["map-project", projectId] });
      qc.invalidateQueries({ queryKey: ["map-jobs"] });
      toast({ title: "Status updated" });
    },
  });

  const [priority, setPriority] = useState<string>("normal");
  useEffect(() => { setPriority((project as any)?.priority || "normal"); }, [project?.id]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId!);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Job deleted" }); qc.invalidateQueries({ queryKey: ["map-jobs"] }); onClose(); },
  });

  const copyToClip = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied` });
  };

  if (!project && !projectId) return null;
  const statusMeta = project ? STATUS_META[project.project_status] : null;

  const revenue = Number(jobCost?.estimated_revenue ?? 0);
  const totalCost = Number(jobCost?.total_cost ?? 0);
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const materials = costItems.filter((i) => i.category === "materials").reduce((s, i) => s + Number(i.amount), 0);
  const labor = costItems.filter((i) => i.category === "labor").reduce((s, i) => s + Number(i.amount), 0);
  const other = costItems.filter((i) => !["materials", "labor"].includes(i.category)).reduce((s, i) => s + Number(i.amount), 0);
  const costSum = materials + labor + other || totalCost || 1;

  const collected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_amount ?? 0), 0);
  const outstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + Number(i.total_amount ?? 0), 0);

  const lineTotal = lineItems.reduce((s, li: any) => s + Number(li.amount ?? li.total ?? 0), 0);

  const teamLeadName = techs.find((t) => t.id === project?.team_lead)?.full_name;

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !projectId) return;
    try { await uploadPhoto.mutateAsync({ file, projectId }); toast({ title: "Photo added" }); }
    catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    e.target.value = "";
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] p-0 flex flex-col">
        {project && (
          <>
            {/* Header */}
            <SheetHeader className="px-4 py-3 border-b space-y-2">
              <div className="flex items-start gap-2">
                <SheetTitle className="text-base flex-1 leading-tight">{project.customer_name}</SheetTitle>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => navigate(`/admin/projects/${project.id}`)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClip(project.id, "Job ID")}><CopyIcon className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onClick={() => { if (confirm("Delete this job?")) deleteMutation.mutate(); }}>
                    <Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <Badge className={`w-fit border ${statusMeta?.badge ?? ""}`}>{statusMeta?.label ?? project.project_status}</Badge>
              <SheetDescription className="sr-only">Job details, line items, finance, payments, photos and checklist.</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
              {/* INFO */}
              <Section title="Info">
                <InfoRow label="Customer">{project.customer_name}</InfoRow>
                <InfoRow label="Status">
                  <Select value={project.project_status} onValueChange={(v) => statusMutation.mutate(v)}>
                    <SelectTrigger className="h-7 text-xs w-[150px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </InfoRow>
                <InfoRow label="Priority">
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-7 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                      <SelectItem value="high" className="text-xs">Alta</SelectItem>
                      <SelectItem value="urgent" className="text-xs">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </InfoRow>
                {project.start_date && <InfoRow label="Scheduled">{format(new Date(project.start_date), "MMM d, yyyy")}</InfoRow>}
                {project.start_time_window && <InfoRow label="Time">{project.start_time_window}</InfoRow>}
                <InfoRow label="Assignee">{teamLeadName || "—"}</InfoRow>
                {project.address && (
                  <InfoRow label="Address">
                    <a className="text-primary underline-offset-2 hover:underline inline-flex items-center gap-1"
                      target="_blank" rel="noreferrer"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.address)}`}>
                      <MapPin className="w-3 h-3" />{project.address}
                    </a>
                  </InfoRow>
                )}
                {project.customer_email && (
                  <InfoRow label="Email">
                    <button className="inline-flex items-center gap-1 hover:text-primary" onClick={() => copyToClip(project.customer_email, "Email")}>
                      <Mail className="w-3 h-3" />{project.customer_email}<CopyIcon className="w-3 h-3 opacity-50" />
                    </button>
                  </InfoRow>
                )}
                {project.customer_phone && (
                  <InfoRow label="Phone">
                    <button className="inline-flex items-center gap-1 hover:text-primary" onClick={() => copyToClip(project.customer_phone, "Phone")}>
                      <Phone className="w-3 h-3" />{project.customer_phone}<CopyIcon className="w-3 h-3 opacity-50" />
                    </button>
                  </InfoRow>
                )}
                {proposal?.id && (
                  <InfoRow label="Proposal">
                    <button className="text-primary inline-flex items-center gap-1 hover:underline"
                      onClick={() => navigate(`/admin/proposals/${proposal.id}`)}>
                      <FileText className="w-3 h-3" />View Proposal
                    </button>
                  </InfoRow>
                )}
              </Section>

              {/* LINE ITEMS */}
              <Section title="Line Items">
                {lineItems.length === 0 ? <Empty>No line items</Empty> : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr><th className="text-left p-2 font-medium">Item</th><th className="text-right p-2 font-medium">QTY</th><th className="text-right p-2 font-medium">Rate</th><th className="text-right p-2 font-medium">Total</th></tr>
                      </thead>
                      <tbody>
                        {lineItems.map((li: any) => (
                          <tr key={li.id} className="border-t">
                            <td className="p-2">{li.description || li.name || "—"}</td>
                            <td className="p-2 text-right tabular-nums">{li.quantity ?? 1}</td>
                            <td className="p-2 text-right tabular-nums">${Number(li.unit_price ?? 0).toLocaleString()}</td>
                            <td className="p-2 text-right tabular-nums">${Number(li.amount ?? li.total ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="border-t bg-muted/30 font-semibold">
                          <td className="p-2" colSpan={3}>Total</td>
                          <td className="p-2 text-right tabular-nums">${lineTotal.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              {/* FINANCE */}
              <Section title="Finance & Costing">
                <div className="grid grid-cols-3 gap-2">
                  <FinCard label="Revenue" value={revenue} accent="text-blue-600" />
                  <FinCard label="Costs" value={totalCost} accent="text-orange-600" />
                  <FinCard label="Profit" value={profit} accent={profit >= 0 ? "text-green-600" : "text-destructive"}
                    sub={`${margin.toFixed(0)}% margin`} />
                </div>
              </Section>

              {/* PAYMENTS */}
              <Section title="Payments">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 rounded-md border p-2.5">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Collected</div>
                    <div className="text-base font-semibold text-green-600 tabular-nums">${collected.toLocaleString()}</div>
                  </div>
                  <div className="flex-1 rounded-md border p-2.5">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Outstanding</div>
                    <div className="text-base font-semibold text-amber-600 tabular-nums">${outstanding.toLocaleString()}</div>
                  </div>
                </div>
                <Button size="sm" className="w-full gap-1.5" onClick={() => navigate(`/admin/projects/${project.id}?tab=invoices`)}>
                  <DollarSign className="w-3.5 h-3.5" />Collect Payment
                </Button>
              </Section>

              {/* COST BREAKDOWN */}
              <Section title="Cost Breakdown">
                <CostBar label="Materials" value={materials} total={costSum} color="bg-blue-500" />
                <CostBar label="Labor" value={labor} total={costSum} color="bg-purple-500" />
                <CostBar label="Other" value={other} total={costSum} color="bg-gray-400" />
              </Section>

              {/* PHOTOS */}
              <Section title="Photos">
                <div className="grid grid-cols-4 gap-1.5">
                  {photos.slice(0, 8).map((p) => (
                    <a key={p.id} href={p.photo_url} target="_blank" rel="noreferrer" className="aspect-square rounded overflow-hidden bg-muted">
                      <img src={p.photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </a>
                  ))}
                  <label className="aspect-square rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted text-muted-foreground">
                    <ImagePlus className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
                  </label>
                </div>
              </Section>

              {/* CHECKLISTS */}
              <Section title="Checklists">
                {checklist.length === 0 ? (
                  <div className="space-y-1.5">
                    <div className="text-xs text-muted-foreground mb-1">Attach Checklist</div>
                    {Object.keys(CHECKLIST_TEMPLATES).map((tpl) => (
                      <Button key={tpl} size="sm" variant="outline" className="w-full justify-start gap-2 text-xs h-7"
                        onClick={() => addTemplate.mutate({ projectId: project.id, items: CHECKLIST_TEMPLATES[tpl], startOrder: 0 })}>
                        <ListChecks className="w-3 h-3" />{tpl}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {checklist.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={c.completed}
                          onChange={(e) => updateChecklistItem.mutate({ id: c.id, patch: { completed: e.target.checked, completed_at: e.target.checked ? new Date().toISOString() : null } })} />
                        <span className={c.completed ? "line-through text-muted-foreground" : ""}>{c.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Section>

              {/* NOTES */}
              <Section title="Notes">
                <Textarea rows={3} value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Internal notes..." className="text-xs" />
                <Button size="sm" variant="outline" className="mt-1.5 gap-1.5"
                  onClick={() => upsertNotes.mutate({ projectId: project.id, patch: { tech_notes: notesDraft } },
                    { onSuccess: () => toast({ title: "Notes saved" }) })}>
                  <StickyNote className="w-3 h-3" />Save Notes
                </Button>
              </Section>

              {/* ACTIVITY */}
              <Section title="Activity">
                {activity.length === 0 ? <Empty>No activity yet</Empty> : (
                  <ol className="space-y-2 relative border-l pl-3">
                    {activity.slice(0, 8).map((a) => (
                      <li key={a.id} className="text-xs">
                        <span className="absolute -left-[5px] mt-1 w-2 h-2 rounded-full bg-primary" />
                        <div className="text-foreground">{a.title}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {a.subtitle ? `${a.subtitle} · ` : ""}{format(new Date(a.created_at), "MMM d, HH:mm")}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>
            </div>

            {/* Footer */}
            <div className="border-t p-2 flex gap-1.5 bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <Button variant="outline" className="flex-1 gap-1.5 text-xs h-10"
                onClick={() => navigate(`/admin/projects/${project.id}?tab=invoices`)}>
                <Receipt className="w-4 h-4" />Invoice
              </Button>
              <Button variant="outline" className="flex-1 gap-1.5 text-xs h-10"
                onClick={() => statusMutation.mutate("in_progress")}>
                <PlayCircle className="w-4 h-4" />Start
              </Button>
              <Button className="flex-1 gap-1.5 text-xs h-10"
                onClick={() => statusMutation.mutate("completed")}>
                <CheckCircle className="w-4 h-4" />Complete
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs py-1 border-b border-dashed last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
function FinCard({ label, value, accent, sub }: { label: string; value: number; accent: string; sub?: string }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${accent}`}>${value.toLocaleString()}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
function CostBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[11px]">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">${value.toLocaleString()} · {pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground italic py-2">{children}</div>;
}
