import { useParams, Navigate } from "react-router-dom";
import { useCollaboratorProjects } from "@/hooks/useCollaboratorProjects";
import { useMediaFiles, getMediaSignedUrls, type MediaFile } from "@/hooks/useMediaFiles";
import { useCollaboratorUpload } from "@/hooks/useCollaboratorUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, MapPin, ArrowLeft, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { convertHeicToJpeg } from "@/utils/heicConverter";

export default function CollaboratorProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: projects, isLoading: loadingProjects } = useCollaboratorProjects();
  const { data: mediaFiles, isLoading: loadingMedia } = useMediaFiles({ projectId });
  const upload = useCollaboratorUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [folderType, setFolderType] = useState<"job_progress" | "before_after">("job_progress");

  const project = projects?.find((p) => p.project_id === projectId);

  // Generate signed URLs for private bucket
  useEffect(() => {
    if (!mediaFiles || mediaFiles.length === 0) return;
    const paths = mediaFiles.map((m) => m.storage_path);
    getMediaSignedUrls(paths).then(setSignedUrls);
  }, [mediaFiles]);

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return <Navigate to="/collaborator" replace />;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !projectId) return;

    for (const rawFile of Array.from(files)) {
      let file = rawFile;
      // Convert HEIC if needed
      if (file.name.toLowerCase().endsWith(".heic") || file.type === "image/heic") {
        try {
          file = await convertHeicToJpeg(file);
        } catch {
          // fallback: upload as-is
        }
      }
      await upload.mutateAsync({ file, projectId, folderType });
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const photos = mediaFiles || [];

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        to="/collaborator"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      {/* Project Info */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{project.customer_name}</CardTitle>
            <Badge variant="outline">{project.project_status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>{project.project_type}</p>
          {(project.address || project.city) && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{[project.address, project.city].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Enviar Fotos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Folder type selector */}
          <div className="flex gap-2">
            <Button
              variant={folderType === "job_progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setFolderType("job_progress")}
            >
              Progresso
            </Button>
            <Button
              variant={folderType === "before_after" ? "default" : "outline"}
              size="sm"
              onClick={() => setFolderType("before_after")}
            >
              Before/After
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic"
            multiple
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          <Button
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.isPending}
          >
            {upload.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {upload.isPending ? "Enviando..." : "Tirar Foto / Escolher Arquivo"}
          </Button>
        </CardContent>
      </Card>

      {/* Photos Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Fotos do Projeto ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMedia ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <ImageIcon className="h-10 w-10 mx-auto" />
              <p className="text-sm">Nenhuma foto enviada ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo) => (
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
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute bottom-1 left-1 text-[10px] px-1"
                  >
                    {photo.folder_type === "before_after" ? "B/A" : "Prog"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
