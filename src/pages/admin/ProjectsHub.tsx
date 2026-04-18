import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List, Plus, Inbox } from "lucide-react";
import { useProjectsHub } from "@/hooks/useProjectsHub";
import { useProjectSignals, computeRisk } from "@/hooks/useProjectSignals";
import { ProjectPipelineBoard } from "@/components/admin/projects/ProjectPipelineBoard";
import { ProjectListView } from "@/components/admin/projects/ProjectListView";
import { ProjectDetailPanel } from "@/components/admin/projects/ProjectDetailPanel";
import { ProjectsHubHeader, type KpiFilter } from "@/components/admin/projects/ProjectsHubHeader";
import { SmartFilterChips, type SmartFilter } from "@/components/admin/projects/SmartFilterChips";
import { AwaitingConversionBanner } from "@/components/admin/projects/AwaitingConversionBanner";
import { NewJobDialog } from "@/components/admin/NewJobDialog";
import type { HubProject } from "@/hooks/useProjectsHub";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

function isThisWeek(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

export default function ProjectsHub() {
  const { projects, pendingProposals, isLoading } = useProjectsHub();
  const qc = useQueryClient();
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null);
  const [chips, setChips] = useState<Set<SmartFilter>>(new Set());
  const [selected, setSelected] = useState<HubProject | null>(null);
  const [showNewJob, setShowNewJob] = useState(false);

  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const { data: signals } = useProjectSignals(projectIds);

  // Pre-compute per-project flags (used by chips counts + filtering)
  const flagged = useMemo(() => {
    return projects.map((p) => {
      const hasMissingProof = signals?.missingProof.has(p.id) ?? false;
      const hasOverdueInvoice = signals?.overdueInvoice.has(p.id) ?? false;
      const unreadCount = signals?.unreadChat.get(p.id) ?? 0;
      const margin = p.job_costs?.margin_percent;
      const risk = computeRisk({
        marginPercent: margin,
        hasMissingProof,
        hasOverdueInvoice,
        status: p.project_status,
      });
      const showProof =
        hasMissingProof &&
        (p.project_status === "completed" ||
          p.project_status === "awaiting_payment" ||
          p.project_status === "paid");
      return {
        p,
        atRisk: risk.level === "risk" && p.project_status !== "paid",
        needPhotos: showProof,
        overdue: hasOverdueInvoice,
        lowMargin: margin != null && margin < 15,
        unreadChat: unreadCount > 0,
      };
    });
  }, [projects, signals]);

  const chipCounts = useMemo(() => {
    return {
      at_risk: flagged.filter((f) => f.atRisk).length,
      need_photos: flagged.filter((f) => f.needPhotos).length,
      overdue: flagged.filter((f) => f.overdue).length,
      low_margin: flagged.filter((f) => f.lowMargin).length,
      unread_chat: flagged.filter((f) => f.unreadChat).length,
    };
  }, [flagged]);

  const filtered = useMemo(() => {
    let list = flagged;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.p.customer_name?.toLowerCase().includes(q) ||
          f.p.address?.toLowerCase().includes(q) ||
          f.p.project_type?.toLowerCase().includes(q),
      );
    }
    if (kpiFilter === "active") {
      list = list.filter(
        (f) => f.p.project_status === "in_production" || f.p.project_status === "in_progress",
      );
    } else if (kpiFilter === "at_risk") {
      list = list.filter((f) => f.atRisk);
    } else if (kpiFilter === "this_week") {
      list = list.filter(
        (f) =>
          (f.p.project_status === "in_production" || f.p.project_status === "in_progress") &&
          isThisWeek(f.p.start_date),
      );
    }
    if (chips.size > 0) {
      list = list.filter((f) => {
        if (chips.has("at_risk") && !f.atRisk) return false;
        if (chips.has("need_photos") && !f.needPhotos) return false;
        if (chips.has("overdue") && !f.overdue) return false;
        if (chips.has("low_margin") && !f.lowMargin) return false;
        if (chips.has("unread_chat") && !f.unreadChat) return false;
        return true;
      });
    }
    return list.map((f) => f.p);
  }, [flagged, search, kpiFilter, chips]);

  const hasFilters = !!search || kpiFilter !== null || chips.size > 0;

  function toggleChip(k: SmartFilter) {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function clearAll() {
    setSearch("");
    setKpiFilter(null);
    setChips(new Set());
  }

  async function handleStatusChange(id: string, status: string) {
    await supabase.from("projects").update({ project_status: status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["hub-projects"] });
  }

  return (
    <AdminLayout title="Projects">
      <div className="space-y-3 p-4 md:p-6 max-w-[1600px] mx-auto">
        {/* Executive KPI Header — clickable filters */}
        <ProjectsHubHeader
          projects={projects}
          signals={signals}
          activeFilter={kpiFilter}
          onFilterChange={setKpiFilter}
        />

        {/* Awaiting conversion banner */}
        <AwaitingConversionBanner proposals={pendingProposals} />

        {/* Smart filter chips */}
        <SmartFilterChips
          active={chips}
          counts={chipCounts}
          onToggle={toggleChip}
          onClear={() => setChips(new Set())}
        />

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setShowNewJob(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New
          </Button>

          <Input
            placeholder="Search address, client, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 text-xs"
          />

          <span className="text-[11px] text-muted-foreground">
            {filtered.length} of {projects.length}
          </span>

          <div className="flex items-center rounded-md border bg-muted p-0.5 ml-auto">
            <Button
              variant={view === "board" ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView("board")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* View */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading projects...</div>
        ) : filtered.length === 0 && hasFilters ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 rounded-lg border border-dashed">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">No projects match these filters</p>
              <p className="text-xs text-muted-foreground mt-0.5">Try clearing filters or broadening the search.</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear all filters
            </Button>
          </div>
        ) : view === "board" ? (
          <ProjectPipelineBoard
            projects={filtered}
            signals={signals}
            onSelect={setSelected}
            onStatusChange={handleStatusChange}
            onNewProject={() => setShowNewJob(true)}
          />
        ) : (
          <ProjectListView projects={filtered} signals={signals} onSelect={setSelected} />
        )}

        <ProjectDetailPanel project={selected} open={!!selected} onClose={() => setSelected(null)} />
        <NewJobDialog open={showNewJob} onOpenChange={setShowNewJob} />
      </div>
    </AdminLayout>
  );
}
