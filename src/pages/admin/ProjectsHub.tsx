import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List, Plus, Briefcase, DollarSign, CheckCircle2, TrendingUp } from "lucide-react";
import { useProjectsHub } from "@/hooks/useProjectsHub";
import { ProjectPipelineBoard } from "@/components/admin/projects/ProjectPipelineBoard";
import { ProjectListView } from "@/components/admin/projects/ProjectListView";
import { ProjectDetailPanel } from "@/components/admin/projects/ProjectDetailPanel";
import { NewJobDialog } from "@/components/admin/NewJobDialog";
import type { HubProject } from "@/hooks/useProjectsHub";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
}

export default function ProjectsHub() {
  const { projects, pipeline, isLoading } = useProjectsHub();
  const qc = useQueryClient();
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<HubProject | null>(null);
  const [showNewJob, setShowNewJob] = useState(false);

  const totalRevenue = useMemo(
    () => projects.reduce((s, p) => s + (p.job_costs?.estimated_revenue ?? 0), 0),
    [projects]
  );

  const filtered = useMemo(() => {
    let list = projects;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.customer_name?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.project_type?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((p) => {
        if (statusFilter === "active") return p.project_status === "in_production" || p.project_status === "in_progress";
        return p.project_status === statusFilter;
      });
    }
    return list;
  }, [projects, search, statusFilter]);

  async function handleStatusChange(id: string, status: string) {
    await supabase.from("projects").update({ project_status: status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["hub-projects"] });
  }

  const kpis = [
    { icon: Briefcase, label: "Active", value: String(pipeline.in_progress), color: "text-[hsl(var(--state-success))]" },
    { icon: DollarSign, label: "Pipeline", value: fmt(totalRevenue), color: "text-foreground" },
    { icon: CheckCircle2, label: "Completed", value: String(pipeline.completed), color: "text-[hsl(var(--state-neutral))]" },
    { icon: TrendingUp, label: "Revenue", value: fmt(totalRevenue), color: "text-foreground" },
  ];

  return (
    <AdminLayout title="Projects">
      <div className="space-y-4 p-4 md:p-6 max-w-7xl mx-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <k.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <p className={cn("text-lg font-semibold font-mono", k.color)}>{k.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setShowNewJob(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Job
          </Button>

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

          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-44 text-xs"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({projects.length})</SelectItem>
              <SelectItem value="pending">Pending ({pipeline.pending})</SelectItem>
              <SelectItem value="active">Active ({pipeline.in_progress})</SelectItem>
              <SelectItem value="completed">Done ({pipeline.completed})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading projects...</div>
        ) : view === "board" ? (
          <ProjectPipelineBoard projects={filtered} onSelect={setSelected} onStatusChange={handleStatusChange} />
        ) : (
          <ProjectListView projects={filtered} onSelect={setSelected} />
        )}

        {/* Detail Panel */}
        <ProjectDetailPanel project={selected} open={!!selected} onClose={() => setSelected(null)} />

        {/* New Job Dialog */}
        <NewJobDialog open={showNewJob} onOpenChange={setShowNewJob} />
      </div>
    </AdminLayout>
  );
}
