import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectWithCosts } from "@/hooks/usePerformanceData";
import { cn } from "@/lib/utils";

interface Props {
  projects: ProjectWithCosts[];
  isLoading: boolean;
  onSelect: (project: ProjectWithCosts) => void;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Progresso",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export function ProjectPerformanceList({ projects, isLoading, onSelect }: Props) {
  if (isLoading) {
    return (
      <Card className="p-6 space-y-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg" />)}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Projetos Recentes</h3>
      <div className="space-y-1">
        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum projeto encontrado</p>
        )}
        {projects.map(p => {
          const revenue = p.job_costs?.estimated_revenue ?? 0;
          const margin = p.job_costs?.margin_percent ?? null;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{p.customer_name}</p>
                <p className="text-xs text-muted-foreground">{p.project_type}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="secondary" className={cn("text-xs", statusColors[p.project_status] ?? "")}>
                  {statusLabels[p.project_status] ?? p.project_status}
                </Badge>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-semibold text-foreground">${revenue.toLocaleString()}</p>
                  {margin !== null && (
                    <p className={cn("text-xs", margin >= 30 ? "text-emerald-600" : margin >= 15 ? "text-amber-600" : "text-red-600")}>
                      {margin.toFixed(1)}% margem
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
