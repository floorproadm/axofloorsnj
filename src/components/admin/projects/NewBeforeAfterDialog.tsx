import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectPhotos, useUploadProjectPhoto } from "@/hooks/useProjectPhotos";
import { useCreateBeforeAfterPair } from "@/hooks/useBeforeAfter";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Check } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
}

export function NewBeforeAfterDialog({ open, onOpenChange, projectId }: Props) {
  const { data: photos = [] } = useProjectPhotos(projectId);
  const create = useCreateBeforeAfterPair();
  const upload = useUploadProjectPhoto();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [completedDate, setCompletedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setBeforeId(null);
    setAfterId(null);
    setBeforeUrl(null);
    setAfterUrl(null);
  }

  async function handleFileUpload(file: File, kind: "before" | "after") {
    if (kind === "before") setUploadingBefore(true);
    else setUploadingAfter(true);
    try {
      const photo = (await upload.mutateAsync({ file, projectId })) as any;
      if (kind === "before") {
        setBeforeId(photo.id);
        setBeforeUrl(photo.photo_url);
      } else {
        setAfterId(photo.id);
        setAfterUrl(photo.photo_url);
      }
    } catch (e: any) {
      toast({ title: "Falha no upload", description: e.message, variant: "destructive" });
    } finally {
      setUploadingBefore(false);
      setUploadingAfter(false);
    }
  }

  function pick(id: string, photoUrl: string, kind: "before" | "after") {
    if (kind === "before") {
      setBeforeId(id);
      setBeforeUrl(photoUrl);
    } else {
      setAfterId(id);
      setAfterUrl(photoUrl);
    }
  }

  async function save() {
    if (!beforeUrl || !afterUrl) {
      toast({ title: "Selecione duas fotos", variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({
        project_id: projectId,
        before_photo_id: beforeId,
        after_photo_id: afterId,
        before_url: beforeUrl,
        after_url: afterUrl,
        title: title || "Before & After",
        completed_date: completedDate,
      });
      toast({ title: "Par Before/After criado" });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Falha ao criar par", description: e.message, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Before & After</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Sala principal" />
            </div>
            <div>
              <Label>Data de conclusão</Label>
              <Input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="existing">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="existing">Escolher fotos existentes</TabsTrigger>
              <TabsTrigger value="upload">Upload novo par</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <PhotoPicker
                  label="Before"
                  photos={photos}
                  selectedId={beforeId}
                  onPick={(p) => pick(p.id, p.photo_url, "before")}
                />
                <PhotoPicker
                  label="After"
                  photos={photos}
                  selectedId={afterId}
                  onPick={(p) => pick(p.id, p.photo_url, "after")}
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="pt-3">
              <div className="grid grid-cols-2 gap-3">
                <UploadSlot
                  label="Before"
                  url={beforeUrl}
                  busy={uploadingBefore}
                  onFile={(f) => handleFileUpload(f, "before")}
                />
                <UploadSlot
                  label="After"
                  url={afterUrl}
                  busy={uploadingAfter}
                  onFile={(f) => handleFileUpload(f, "after")}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={create.isPending || !beforeUrl || !afterUrl}>
            {create.isPending ? "Salvando…" : "Criar par"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhotoPicker({
  label,
  photos,
  selectedId,
  onPick,
}: {
  label: string;
  photos: any[];
  selectedId: string | null;
  onPick: (p: any) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <div className="h-56 overflow-y-auto border rounded-md p-2 grid grid-cols-3 gap-1.5 bg-muted/30">
        {photos.length === 0 && (
          <p className="col-span-3 text-xs text-muted-foreground text-center py-6">
            Nenhuma foto. Faça upload na aba "Todas".
          </p>
        )}
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p)}
            className={`relative aspect-square rounded overflow-hidden border-2 transition-colors ${
              selectedId === p.id ? "border-primary" : "border-transparent hover:border-border"
            }`}
          >
            <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
            {selectedId === p.id && (
              <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadSlot({
  label,
  url,
  busy,
  onFile,
}: {
  label: string;
  url: string | null;
  busy: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <label className="cursor-pointer block aspect-square border-2 border-dashed rounded-md overflow-hidden bg-muted/30 hover:bg-muted/60 transition-colors">
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Upload className="h-6 w-6" />
            <span className="text-xs">{busy ? "Enviando…" : "Selecionar foto"}</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.currentTarget.value = "";
          }}
        />
      </label>
    </div>
  );
}
