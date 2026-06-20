import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Download, CalendarDays, Users, DollarSign, Edit2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval, startOfMonth, endOfMonth, addWeeks, subWeeks } from "date-fns";
import { MemberDialog, ROLE_LABEL, type TeamMember } from "@/components/admin/team/MemberDialog";

const fmt = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_BADGE: Record<string, string> = {
  approved: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

// Baseline para barra de utilização (diárias por semana). Flooring = 6 dias.
const WEEK_DAYS_TARGET = 6;

export default function Team() {
  const [tab, setTab] = useState<"members" | "daysheets">("members");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekAnchor, { weekStartsOn: 1 });
  const now = new Date();
  const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };
  const currentWeekRange = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };

  const { data: members = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, daily_rate, employment_type, is_active_crew, color" as any)
        .order("full_name");
      if (error) throw error;
      return (data || []) as unknown as TeamMember[];
    },
  });

  const { data: laborEntries = [] } = useQuery({
    queryKey: ["team-labor-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labor_entries")
        .select("id, work_date, crew_member_id, worker_name, project_id, daily_rate, days_worked, status, pay_mode, sqft_worked, sqft_rate, total_cost, projects:projects(customer_name)")
        .order("work_date", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Flooring: pagamento por diária OU por sqft. Não há horas.
  const daysForEntry = (e: any) => (e.pay_mode === "sqft" ? 0 : Number(e.days_worked || 0));
  const sqftForEntry = (e: any) => (e.pay_mode === "sqft" ? Number(e.sqft_worked || 0) : 0);
  const workLabel = (e: any) =>
    e.pay_mode === "sqft"
      ? `${sqftForEntry(e).toLocaleString()} sqft`
      : `${daysForEntry(e).toFixed(daysForEntry(e) % 1 === 0 ? 0 : 2)} ${daysForEntry(e) === 1 ? "diária" : "diárias"}`;

  const metrics = useMemo(() => {
    const active = members.filter((m) => m.is_active_crew).length;
    const weekDays = laborEntries
      .filter((e) => e.work_date && isWithinInterval(parseISO(e.work_date), currentWeekRange))
      .reduce((s, e) => s + daysForEntry(e), 0);
    const weekSqft = laborEntries
      .filter((e) => e.work_date && isWithinInterval(parseISO(e.work_date), currentWeekRange))
      .reduce((s, e) => s + sqftForEntry(e), 0);
    const monthLabor = laborEntries
      .filter((e) => e.work_date && isWithinInterval(parseISO(e.work_date), monthRange))
      .reduce((s, e) => s + Number(e.total_cost || 0), 0);
    return { active, weekDays, weekSqft, monthLabor };
  }, [members, laborEntries]);

  const memberDaysThisWeek = useMemo(() => {
    const map = new Map<string, number>();
    laborEntries.forEach((e) => {
      if (!e.crew_member_id) return;
      if (!e.work_date || !isWithinInterval(parseISO(e.work_date), currentWeekRange)) return;
      map.set(e.crew_member_id, (map.get(e.crew_member_id) || 0) + daysForEntry(e));
    });
    return map;
  }, [laborEntries]);

  // Filtered daysheet rows
  const dsRows = useMemo(() => {
    return laborEntries
      .filter((e) => {
        if (!e.work_date) return false;
        if (!isWithinInterval(parseISO(e.work_date), { start: weekStart, end: weekEnd })) return false;
        if (memberFilter !== "all" && e.crew_member_id !== memberFilter) return false;
        return true;
      })
      .map((e) => ({
        ...e,
        memberName:
          members.find((m) => m.id === e.crew_member_id)?.full_name || e.worker_name || "—",
        projectName: e.projects?.customer_name || "—",
        days: daysForEntry(e),
        sqft: sqftForEntry(e),
        work: workLabel(e),
      }))
      .sort((a, b) => (b.work_date as string).localeCompare(a.work_date));
  }, [laborEntries, members, weekStart, weekEnd, memberFilter]);

  const dsTotalDays = dsRows.reduce((s, r) => s + r.days, 0);
  const dsTotalSqft = dsRows.reduce((s, r) => s + r.sqft, 0);
  const dsByMember = useMemo(() => {
    const map = new Map<string, { days: number; sqft: number }>();
    dsRows.forEach((r) => {
      const cur = map.get(r.memberName) || { days: 0, sqft: 0 };
      map.set(r.memberName, { days: cur.days + r.days, sqft: cur.sqft + r.sqft });
    });
    return map;
  }, [dsRows]);

  const exportCsv = () => {
    const lines: string[] = [];
    lines.push("Date,Member,Project,PayMode,Days,Sqft,Rate,Total");
    dsRows.forEach((r) => {
      const rate = r.pay_mode === "sqft" ? r.sqft_rate : r.daily_rate;
      lines.push(
        `${r.work_date},"${r.memberName}","${r.projectName}",${r.pay_mode || "daily"},${r.days},${r.sqft},${rate || 0},${Number(r.total_cost || 0).toFixed(2)}`
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daysheets-${format(weekStart, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Equipe">
      <div className="space-y-4">

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Membros ativos", value: String(metrics.active), icon: Users, color: "text-primary" },
            {
              label: "Trabalho esta semana",
              value: `${metrics.weekDays.toFixed(metrics.weekDays % 1 === 0 ? 0 : 1)} diárias${metrics.weekSqft > 0 ? ` · ${metrics.weekSqft.toLocaleString()} sqft` : ""}`,
              icon: CalendarDays,
              color: "text-amber-600",
            },
            { label: "Custo de mão de obra (mês)", value: fmt(metrics.monthLabor), icon: DollarSign, color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sub-tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-auto">
            <TabsTrigger
              value="members"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
            >Membros</TabsTrigger>
            <TabsTrigger
              value="daysheets"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
            >Daysheets</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* === MEMBERS === */}
        {tab === "members" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-10 text-center text-muted-foreground">
                  Nenhum membro cadastrado
                </CardContent>
              </Card>
            ) : (
              members.map((m) => {
                const initials = (m.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
                const rateLabel = `$${Number(m.daily_rate || 0).toFixed(2)}/diária`;
                const weekDays = memberDaysThisWeek.get(m.id) || 0;
                const pct = Math.min(100, (weekDays / WEEK_DAYS_TARGET) * 100);
                return (
                  <Card key={m.id} className="shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback
                            style={{ backgroundColor: m.color || "hsl(var(--primary))", color: "white" }}
                            className="text-xs font-semibold"
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate">{m.full_name || "Sem nome"}</p>
                            <Badge
                              variant="outline"
                              className={
                                m.is_active_crew
                                  ? "text-[10px] bg-green-50 text-green-700 border-green-200"
                                  : "text-[10px] bg-slate-100 text-slate-600 border-slate-200"
                              }
                            >
                              {m.is_active_crew ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {ROLE_LABEL[m.role || ""] || m.role || "—"} · {rateLabel}
                          </p>
                          {m.email && (
                            <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditing(m); setDialogOpen(true); }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                          <span>Diárias esta semana</span>
                          <span className="font-medium text-foreground">
                            {weekDays.toFixed(weekDays % 1 === 0 ? 0 : 1)} / {WEEK_DAYS_TARGET}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs"
                        onClick={() => { setTab("daysheets"); setMemberFilter(m.id); }}
                      >
                        Ver daysheets
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* === DAYSHEETS === */}
        {tab === "daysheets" && (
          <div className="space-y-3">
            <p className="text-[11px] text-muted-foreground">
              Flooring é pago por <strong>diária</strong> ou por <strong>valor fechado por sqft</strong>. Não usamos horas.
            </p>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Select value={memberFilter} onValueChange={setMemberFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos os membros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os membros</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name || m.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setWeekAnchor((d) => subWeeks(d, 1))}>
                    ←
                  </Button>
                  <span className="text-xs font-medium px-2">
                    {format(weekStart, "MMM dd")} – {format(weekEnd, "MMM dd")}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setWeekAnchor((d) => addWeeks(d, 1))}>
                    →
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  <Download className="w-4 h-4 mr-1" /> Exportar
                </Button>
                <Button
                  size="sm"
                  onClick={() => window.location.assign("/admin/crews?tab=daysheet")}
                >
                  <Plus className="w-4 h-4 mr-1" /> Registrar daysheet
                </Button>
              </div>
            </div>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                {dsRows.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Sem registros nesta semana
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Data</th>
                          <th className="text-left px-3 py-2 font-medium">Membro</th>
                          <th className="text-left px-3 py-2 font-medium">Projeto</th>
                          <th className="text-left px-3 py-2 font-medium">Modo</th>
                          <th className="text-right px-3 py-2 font-medium">Trabalho</th>
                          <th className="text-right px-3 py-2 font-medium">Custo</th>
                          <th className="text-left px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dsRows.map((r) => (
                          <tr key={r.id} className="border-b border-border last:border-0 even:bg-muted/10">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {format(parseISO(r.work_date), "MMM dd")}
                            </td>
                            <td className="px-3 py-2">{r.memberName}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.projectName}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className="text-[10px]">
                                {r.pay_mode === "sqft" ? "Sqft" : "Diária"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">{r.work}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{fmt(Number(r.total_cost || 0))}</td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[r.status] || ""}`}>
                                {r.status === "approved" ? "Aprovado" : r.status === "pending" ? "Pendente" : r.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
                    <span className="font-semibold">
                      Total: {dsTotalDays.toFixed(dsTotalDays % 1 === 0 ? 0 : 1)} diárias
                      {dsTotalSqft > 0 && ` · ${dsTotalSqft.toLocaleString()} sqft`}
                    </span>
                    {Array.from(dsByMember.entries()).map(([name, v]) => (
                      <span key={name} className="text-muted-foreground">
                        {name}:{" "}
                        <strong className="text-foreground">
                          {v.days.toFixed(v.days % 1 === 0 ? 0 : 1)}d
                          {v.sqft > 0 && ` · ${v.sqft.toLocaleString()} sqft`}
                        </strong>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <MemberDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </AdminLayout>
  );
}
