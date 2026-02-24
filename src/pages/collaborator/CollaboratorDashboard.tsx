import { useCollaboratorProjects } from "@/hooks/useCollaboratorProjects";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderOpen, MapPin } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Concluído",
  on_hold: "Pausado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  in_progress: "default",
  completed: "secondary",
  on_hold: "destructive",
};

export default function CollaboratorDashboard() {
  const { data: projects, isLoading, error } = useCollaboratorProjects();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-destructive">
        Erro ao carregar projetos: {(error as Error).message}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-20 space-y-2">
        <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">
          Nenhum projeto atribuído a você no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-heading font-bold text-foreground">
        Meus Projetos
      </h1>

      {projects.map((p) => (
        <Link key={p.project_id} to={`/collaborator/project/${p.project_id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {p.customer_name}
                </span>
                <Badge variant={STATUS_VARIANT[p.project_status] || "outline"}>
                  {STATUS_LABELS[p.project_status] || p.project_status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">{p.project_type}</p>

              {(p.address || p.city) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {[p.address, p.city].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
