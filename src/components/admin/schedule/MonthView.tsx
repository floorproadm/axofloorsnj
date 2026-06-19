import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AXO_ORG_ID } from "@/lib/constants";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip";

type ProjectRow = {
  id: string;
  customer_name: string | null;
  address: string | null;
  project_type: string | null;
  start_date: string;
  project_status: string | null;
};

const MAX_SIMULTANEOUS = 5;

function statusColor(status: string | null) {
  switch ((status || "").toLowerCase()) {
    case "planning":
      return { dot: "bg-orange-500", chip: "bg-orange-50 border-orange-300 text-orange-800" };
    case "in_progress":
    case "in progress":
      return { dot: "bg-blue-500", chip: "bg-blue-50 border-blue-300 text-blue-800" };
    case "completed":
    case "concluído":
    case "concluido":
      return { dot: "bg-emerald-500", chip: "bg-emerald-50 border-emerald-300 text-emerald-800" };
    default:
      return { dot: "bg-gray-400", chip: "bg-gray-50 border-gray-300 text-gray-700" };
  }
}

function shortLabel(p: ProjectRow) {
  const src = p.address || p.customer_name || "Projeto";
  return src.length > 22 ? src.slice(0, 22) + "…" : src;
}

function capacityColor(count: number) {
  const ratio = count / MAX_SIMULTANEOUS;
  if (ratio >= 0.9) return "bg-red-500";
  if (ratio >= 0.7) return "bg-amber-500";
  return "bg-emerald-500";
}

export function MonthView({
  currentDate,
  onChangeMonth,
  onCreateAt,
}: {
  currentDate: Date;
  onChangeMonth: (d: Date) => void;
  onCreateAt?: (date: Date) => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => {
    const arr: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      arr.push(d);
      d = addDays(d, 1);
    }
    return arr;
  }, [gridStart.toISOString(), gridEnd.toISOString()]);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects-month", format(gridStart, "yyyy-MM-dd"), format(gridEnd, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, address, project_type, start_date, project_status")
        .eq("organization_id", AXO_ORG_ID)
        .not("start_date", "is", null)
        .gte("start_date", format(gridStart, "yyyy-MM-dd"))
        .lte("start_date", format(gridEnd, "yyyy-MM-dd"));
      if (error) throw error;
      return (data || []) as ProjectRow[];
    },
  });

  const byDay = useMemo(() => {
    const m: Record<string, ProjectRow[]> = {};
    projects.forEach((p) => {
      (m[p.start_date] ||= []).push(p);
    });
    return m;
  }, [projects]);

  const moveMutation = useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const { error } = await supabase.from("projects").update({ start_date: date }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-month"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Job reagendado" });
    },
    onError: (e: Error) => toast({ title: "Erro ao mover", description: e.message, variant: "destructive" }),
  });

  const goToday = () => onChangeMonth(new Date());

  // Header (shared with mobile/desktop)
  const Header = (
    <div className="flex flex-col gap-3 px-4 pt-3 pb-3 border-b border-border/50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChangeMonth(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-base font-semibold capitalize min-w-[160px] text-center">
            {format(currentDate, "MMMM yyyy", { locale: ptBR })}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChangeMonth(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className="h-8" onClick={goToday}>Hoje</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot color="bg-orange-500" label="Planning" />
        <LegendDot color="bg-blue-500" label="In Progress" />
        <LegendDot color="bg-emerald-500" label="Concluído" />
        <LegendDot color="bg-gray-300" label="Livre" />
      </div>
    </div>
  );

  if (isMobile) {
    // Compact list: next 14 days from today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const list = Array.from({ length: 14 }, (_, i) => addDays(start, i));
    return (
      <div>
        {Header}
        <div className="p-3 space-y-2">
          <div className="text-[11px] text-muted-foreground px-1">Próximos 14 dias</div>
          {list.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const items = byDay[key] || [];
            return (
              <div
                key={key}
                className={cn(
                  "rounded-lg border border-border/50 bg-card p-2.5",
                  isToday(d) && "border-primary/50 bg-primary/5"
                )}
                onClick={() => items.length === 0 && onCreateAt?.(d)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold capitalize">
                    {format(d, "EEE d 'de' MMM", { locale: ptBR })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{items.length} job{items.length !== 1 ? "s" : ""}</div>
                </div>
                {items.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground">Livre</div>
                ) : (
                  <div className="space-y-1">
                    {items.map((p) => {
                      const c = statusColor(p.project_status);
                      return (
                        <button
                          key={p.id}
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/projects/${p.id}`); }}
                          className={cn("w-full text-left rounded border px-2 py-1 text-[11px] truncate", c.chip)}
                        >
                          <span className="font-medium">{p.customer_name || "Cliente"}</span>
                          <span className="text-muted-foreground ml-1">· {p.address || p.project_type}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop grid
  return (
    <TooltipProvider delayDuration={150}>
      <div>
        {Header}
        <div className="grid grid-cols-7 text-[11px] font-medium text-muted-foreground border-b border-border/50">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="px-2 py-1.5 text-center uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border/30">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = byDay[key] || [];
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);
            return (
              <div
                key={key}
                className={cn(
                  "bg-card min-h-[110px] p-1.5 relative flex flex-col cursor-pointer transition-colors",
                  !inMonth && "bg-muted/30 text-muted-foreground/60",
                  today && "ring-1 ring-primary/40"
                )}
                onClick={() => onCreateAt?.(day)}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/project-id");
                  if (id) moveMutation.mutate({ id, date: key });
                }}
              >
                <div className={cn(
                  "flex items-center justify-between mb-1",
                )}>
                  <span className={cn(
                    "leading-none",
                    today ? "text-lg font-bold text-primary" : "text-xs font-semibold"
                  )}>
                    {format(day, "d")}
                  </span>
                  {items.length > 0 && (
                    <span className="text-[9px] text-muted-foreground">{items.length}</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  {items.slice(0, 3).map((p) => {
                    const c = statusColor(p.project_status);
                    return (
                      <button
                        key={p.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/project-id", p.id)}
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/projects/${p.id}`); }}
                        className={cn(
                          "text-left rounded border px-1.5 py-0.5 text-[10px] leading-tight truncate flex items-center gap-1",
                          c.chip
                        )}
                        title={`${p.customer_name || ""} · ${p.address || ""}`}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
                        <span className="truncate">{shortLabel(p)}</span>
                      </button>
                    );
                  })}
                  {items.length > 3 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-primary hover:underline text-left px-1"
                        >
                          +{items.length - 3} mais
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          {items.slice(3).map((p) => (
                            <div key={p.id} className="text-xs">
                              <span className="font-medium">{p.customer_name || "Cliente"}</span>
                              <span className="text-muted-foreground ml-1">· {p.address || p.project_type || ""}</span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                {/* Capacity bar */}
                <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full transition-all", capacityColor(items.length))}
                    style={{ width: `${Math.min(100, (items.length / MAX_SIMULTANEOUS) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {isLoading && (
          <div className="text-center text-xs text-muted-foreground py-2">Carregando...</div>
        )}
      </div>
    </TooltipProvider>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", color)} />
      <span>{label}</span>
    </div>
  );
}
