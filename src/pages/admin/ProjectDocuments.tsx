import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProjectDocumentsManager } from "@/components/admin/ProjectDocumentsManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDocuments() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project-header", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("id, customer_name, city, project_type, project_status")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  return (
    <AdminLayout title="Documentos do Projeto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/jobs")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : project ? (
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  Documentos — {project.customer_name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {project.project_type} • {project.city || "Sem cidade"} • {project.project_status}
                </p>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-foreground">Projeto não encontrado</h1>
            )}
          </div>
        </div>

        {/* Documents Panel */}
        {projectId && <ProjectDocumentsManager projectId={projectId} />}
      </div>
    </AdminLayout>
  );
}
