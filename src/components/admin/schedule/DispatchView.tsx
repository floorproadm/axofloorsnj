import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MapPin, Clock, UserPlus, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const START_HOUR = 6;
const END_HOUR = 20;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
const LEFT_COL = 140;
const HOUR_WIDTH = 70;
const TIMELINE_WIDTH = (END_HOUR - START_HOUR) * HOUR_WIDTH;

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  photo_url: string | null;
  status: string;
}

interface DispatchAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_hours: number | null;
  customer_name: string;
  location: string | null;
  notes: string | null;
  project_id: string | null;
  assigned_to: string[] | null;
  appointment_type: string;
  project_status?: string;
  project_square_footage?: number | null;
  project_type?: string | null;
}

interface Props {
  date: Date;
}

function statusColor(projectStatus?: string, apptType?: string) {
  const s = projectStatus || apptType || "";
  if (s.includes("planning") || s.includes("pending")) return { bar: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" };
  if (s.includes("in_progress") || s === "production") return { bar: "bg-primary", bg: "bg-primary/5", text: "text-primary", border: "border-primary/30" };
  if (s.includes("completed")) return { bar: "bg-green-500", bg: "bg-green-50", text: "text-green-800", border: "border-green-200" };
  return { bar: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-200" };
}

function partnerStatusBadge(jobsToday: number, completed: number) {
  if (jobsToday === 0) return { label: "Disponível", className: "bg-green-100 text-green-800 border-green-200" };
  if (completed >= jobsToday && jobsToday > 0) return { label: "Concluído", className: "bg-slate-100 text-slate-700 border-slate-200" };
  return { label: "Em Campo", className: "bg-primary/10 text-primary border-primary/30" };
}

function shortAddress(loc: string | null) {
  if (!loc) return "Sem endereço";
  // first comma chunk
  return loc.split(",")[0].trim();
}

function parseHourFloat(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return (h || 0) + (m || 0) / 60;
}

export function DispatchView({ date }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filterPartner, setFilterPartner] = useState<string | null>(null);
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: partners = [] } = useQuery({
    queryKey: ["dispatch-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, company_name, contact_name, photo_url, status")
        .eq("organization_id", AXO_ORG_ID)
        .eq("status", "active")
        .order("company_name");
      if (error) throw error;
      return (data || []) as Partner[];
    },
  });

  const { data: dayAppointments = [] } = useQuery({
    queryKey: ["dispatch-appointments", dateStr],
    queryFn: async () => {
      const [apptRes, projRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .eq("organization_id", AXO_ORG_ID)
          .eq("appointment_date", dateStr),
        supabase
          .from("projects")
          .select("id, customer_name, address, project_type, project_status, square_footage, start_date, referred_by_partner_id")
          .eq("organization_id", AXO_ORG_ID)
          .eq("start_date", dateStr),
      ]);
      const real: DispatchAppointment[] = ((apptRes.data || []) as any[]).map((a) => ({
        id: a.id,
        appointment_date: a.appointment_date,
        appointment_time: a.appointment_time || "08:00:00",
        duration_hours: a.duration_hours,
        customer_name: a.customer_name,
        location: a.location,
        notes: a.notes,
        project_id: a.project_id,
        assigned_to: a.assigned_to || [],
        appointment_type: a.appointment_type,
      }));
      const fromProjects: DispatchAppointment[] = ((projRes.data || []) as any[]).map((p) => ({
        id: `proj-${p.id}`,
        appointment_date: p.start_date,
        appointment_time: "08:00:00",
        duration_hours: 8,
        customer_name: p.customer_name || "Projeto",
        location: p.address,
        notes: p.project_type,
        project_id: p.id,
        assigned_to: p.referred_by_partner_id ? [p.referred_by_partner_id] : [],
        appointment_type: "production",
        project_status: p.project_status,
        project_square_footage: p.square_footage,
        project_type: p.project_type,
      }));
      return [...real, ...fromProjects];
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ appointmentId, partnerId }: { appointmentId: string; partnerId: string }) => {
      if (appointmentId.startsWith("proj-")) {
        // We can't update real appointments table; tag the partner as referred_by? skip — toast only
        throw new Error("Esse job vem direto do projeto. Crie um agendamento real para atribuir um técnico.");
      }
      const { data: existing } = await supabase
        .from("appointments")
        .select("assigned_to")
        .eq("id", appointmentId)
        .maybeSingle();
      const current: string[] = (existing as any)?.assigned_to || [];
      if (current.includes(partnerId)) return;
      const next = [...current, partnerId];
      const { error } = await (supabase as any)
        .from("appointments")
        .update({ assigned_to: next })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dispatch-appointments"] });
      toast({ title: "Técnico atribuído" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Build map: partnerId -> appointments for that partner today
  const byPartner = useMemo(() => {
    const map = new Map<string, DispatchAppointment[]>();
    partners.forEach((p) => map.set(p.id, []));
    dayAppointments.forEach((a) => {
      (a.assigned_to || []).forEach((pid) => {
        if (map.has(pid)) map.get(pid)!.push(a);
      });
    });
    return map;
  }, [partners, dayAppointments]);

  // Queue: appointments today with no assignee mapped to a known partner
  const queue = useMemo(() => {
    const partnerIds = new Set(partners.map((p) => p.id));
    return dayAppointments.filter((a) => {
      const list = a.assigned_to || [];
      return list.length === 0 || !list.some((id) => partnerIds.has(id));
    });
  }, [dayAppointments, partners]);

  const visiblePartners = filterPartner
    ? partners.filter((p) => p.id === filterPartner)
    : partners;

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Live header badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            {format(date, "EEEE, MMM dd")}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-0.5 text-[11px] font-semibold text-green-700 dark:text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Operações ao Vivo
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {dayAppointments.length} jobs · {partners.length} técnicos
        </div>
      </div>

      {/* === DESKTOP TIMELINE === */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: LEFT_COL + TIMELINE_WIDTH }}>
            {/* Hour ruler */}
            <div className="flex sticky top-0 z-10 bg-muted/50 border-b border-border">
              <div style={{ width: LEFT_COL }} className="shrink-0 px-3 py-2 text-[10px] uppercase font-semibold text-muted-foreground border-r border-border">
                Técnico
              </div>
              <div className="relative" style={{ width: TIMELINE_WIDTH }}>
                {HOURS.slice(0, -1).map((h, i) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 border-l border-border text-[10px] text-muted-foreground px-1 py-1"
                    style={{ left: i * HOUR_WIDTH, width: HOUR_WIDTH }}
                  >
                    {h % 12 === 0 ? 12 : h % 12}{h < 12 ? "a" : "p"}
                  </div>
                ))}
                <div className="h-7" />
              </div>
            </div>

            {/* Rows */}
            {visiblePartners.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum parceiro/técnico ativo
              </div>
            ) : (
              visiblePartners.map((p) => {
                const jobs = byPartner.get(p.id) || [];
                const completed = jobs.filter((j) => j.project_status === "completed").length;
                const stat = partnerStatusBadge(jobs.length, completed);
                return (
                  <div key={p.id} className="flex border-b border-border last:border-0 min-h-[72px]">
                    {/* Left col */}
                    <div
                      style={{ width: LEFT_COL }}
                      className="shrink-0 border-r border-border px-3 py-2 flex flex-col gap-1.5 bg-muted/20"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={p.photo_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {p.contact_name?.split(" ").map((s) => s[0]).slice(0, 2).join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" title={p.contact_name}>
                            {p.contact_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate" title={p.company_name}>
                            {p.company_name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-medium ${stat.className} w-fit`}>
                        {stat.label}
                      </Badge>
                    </div>

                    {/* Timeline */}
                    <div className="relative" style={{ width: TIMELINE_WIDTH }}>
                      {/* hour grid */}
                      {HOURS.slice(0, -1).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 border-l border-border/40"
                          style={{ left: i * HOUR_WIDTH }}
                        />
                      ))}
                      {jobs.map((j) => {
                        const startH = parseHourFloat(j.appointment_time);
                        const isAllDay = !j.appointment_time || j.appointment_time === "00:00:00";
                        const dur = j.duration_hours || 2;
                        const offset = Math.max(0, startH - START_HOUR);
                        const left = offset * HOUR_WIDTH;
                        const width = Math.max(60, dur * HOUR_WIDTH);
                        const c = statusColor(j.project_status, j.appointment_type);
                        return (
                          <button
                            key={j.id}
                            onClick={() => j.project_id && navigate(`/admin/jobs/${j.project_id}`)}
                            className={`absolute top-2 bottom-2 rounded-md border ${c.border} ${c.bg} px-2 py-1 text-left overflow-hidden hover:shadow-md transition-shadow`}
                            style={{ left, width: isAllDay ? TIMELINE_WIDTH - 8 : width }}
                            title={`${j.customer_name} · ${j.location || ""}`}
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
                            <div className="pl-1 text-[11px] leading-tight">
                              <p className={`font-semibold truncate ${c.text}`}>
                                {shortAddress(j.location)}
                              </p>
                              <p className="text-muted-foreground truncate">
                                {isAllDay ? "Dia inteiro" : j.appointment_time.slice(0, 5)}
                                {j.project_type ? ` · ${j.project_type}` : ""}
                                {j.project_square_footage ? ` · ${Number(j.project_square_footage)}sf` : ""}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                      {jobs.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground/60">
                          Sem jobs hoje
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {/* === MOBILE: vertical stacked === */}
      <div className="md:hidden space-y-3">
        {visiblePartners.map((p) => {
          const jobs = byPartner.get(p.id) || [];
          const completed = jobs.filter((j) => j.project_status === "completed").length;
          const stat = partnerStatusBadge(jobs.length, completed);
          return (
            <Card key={p.id} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p.photo_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {p.contact_name?.split(" ").map((s) => s[0]).slice(0, 2).join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.contact_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{p.company_name}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${stat.className}`}>
                  {stat.label}
                </Badge>
              </div>
              {jobs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Sem jobs hoje</p>
              ) : (
                <div className="space-y-1.5">
                  {jobs.map((j) => {
                    const c = statusColor(j.project_status, j.appointment_type);
                    const isAllDay = !j.appointment_time || j.appointment_time === "00:00:00";
                    return (
                      <button
                        key={j.id}
                        onClick={() => j.project_id && navigate(`/admin/jobs/${j.project_id}`)}
                        className={`block w-full text-left rounded-md border ${c.border} ${c.bg} px-2.5 py-2 relative overflow-hidden`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
                        <div className="pl-2">
                          <p className={`text-xs font-semibold ${c.text}`}>{shortAddress(j.location)}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {isAllDay ? "Dia inteiro" : j.appointment_time.slice(0, 5)}
                            {j.project_type ? ` · ${j.project_type}` : ""}
                            {j.project_square_footage ? ` · ${Number(j.project_square_footage)}sf` : ""}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* === QUEUE === */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Jobs sem técnico atribuído hoje
          <span className="text-xs font-normal text-muted-foreground">({queue.length})</span>
        </h3>
        {queue.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Tudo atribuído. Operação no controle.
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {queue.map((j) => {
              const c = statusColor(j.project_status, j.appointment_type);
              const isAllDay = !j.appointment_time || j.appointment_time === "00:00:00";
              return (
                <Card
                  key={j.id}
                  className={`shrink-0 w-72 p-3 border-l-4 ${c.border} relative`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{j.customer_name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {shortAddress(j.location)}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isAllDay ? "Dia inteiro" : j.appointment_time.slice(0, 5)}
                      {j.project_type ? ` · ${j.project_type}` : ""}
                    </p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="default" className="w-full h-7 text-xs">
                          <UserPlus className="w-3 h-3 mr-1" /> Atribuir
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="max-h-72 overflow-auto">
                        {partners.length === 0 ? (
                          <DropdownMenuItem disabled>Nenhum técnico</DropdownMenuItem>
                        ) : (
                          partners.map((p) => (
                            <DropdownMenuItem
                              key={p.id}
                              onClick={() => assignMutation.mutate({ appointmentId: j.id, partnerId: p.id })}
                            >
                              <Avatar className="h-5 w-5 mr-2">
                                <AvatarImage src={p.photo_url || undefined} />
                                <AvatarFallback className="text-[9px]">
                                  {p.contact_name?.split(" ").map((s) => s[0]).slice(0, 2).join("") || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate">{p.contact_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{p.company_name}</p>
                              </div>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
