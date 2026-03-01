import { useCollaboratorProjects } from "@/hooks/useCollaboratorProjects";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMediaSignedUrls } from "@/hooks/useMediaFiles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";

export default function CollaboratorDocs() {
  const { data: projects = [], isLoading: loadingProjects } = useCollaboratorProjects();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const projectIds = projects.map((p) => p.project_id);

  const { data: allMedia = [], isLoading: loadingMedia } = useQuery({
    queryKey: ["collaborator-docs-media", projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase
        .from("media_files")
        .select("id, storage_path, folder_type, project_id, created_at")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: projectIds.length > 0,
  });

  useEffect(() => {
    if (allMedia.length === 0) return;
    const paths = allMedia.map((m) => m.storage_path);
    getMediaSignedUrls(paths).then(setSignedUrls);
  }, [allMedia]);

  if (loadingProjects || loadingMedia) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (allMedia.length === 0) {
    return (
      <div className="text-center py-20 space-y-2">
        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Nenhuma foto enviada ainda</p>
      </div>
    );
  }

  // Group by project
  const grouped = projects
    .map((p) => ({
      ...p,
      photos: allMedia.filter((m) => m.project_id === p.project_id),
    }))
    .filter((p) => p.photos.length > 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-heading font-bold text-foreground">Fotos</h1>

      {grouped.map((project) => (
        <Card key={project.project_id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">
                {project.customer_name}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {project.photos.length} foto{project.photos.length > 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {project.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-md overflow-hidden bg-muted relative"
                >
                  {signedUrls[photo.storage_path] ? (
                    <img
                      src={signedUrls[photo.storage_path]}
                      alt="Foto do projeto"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute bottom-0.5 left-0.5 text-[8px] px-1 py-0"
                  >
                    {photo.folder_type === "before_after" ? "B/A" : "Prog"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
