import { useState, useRef } from "react";
import { Upload, X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeedPost, FeedPostImage } from "@/hooks/admin/useFeedData";
import { useFeedFolders, useUploadFeedImage, useDeleteFeedPostImage } from "@/hooks/admin/useFeedData";

interface FeedPostFormProps {
  post: FeedPost;
  onSave: (updates: Partial<FeedPost>) => void;
  isSaving: boolean;
}

const POST_TYPES = [
  { value: "photo", label: "Foto" },
  { value: "project_update", label: "Atualização de Projeto" },
  { value: "status_change", label: "Mudança de Status" },
  { value: "milestone", label: "Marco" },
];

const CATEGORIES = [
  "Installation",
  "Refinishing",
  "Vinyl",
  "Staircase",
  "Baseboards",
  "Commercial",
  "Residential",
];

const QUALITY_CHECKLIST = [
  "Fotos em boa resolução",
  "Descrição completa do projeto",
  "Localização verificada",
  "Tags relevantes aplicadas",
  "Categoria correta selecionada",
];

export function FeedPostForm({ post, onSave, isSaving }: FeedPostFormProps) {
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description || "");
  const [postType, setPostType] = useState(post.post_type);
  const [location, setLocation] = useState(post.location || "");
  const [category, setCategory] = useState(post.category || "");
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState(post.visibility);
  const [status, setStatus] = useState(post.status);
  const [folderId, setFolderId] = useState(post.folder_id || "");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [images, setImages] = useState<FeedPostImage[]>(post.images || []);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: folders = [] } = useFeedFolders();
  const uploadImage = useUploadFeedImage();
  const deleteImage = useDeleteFeedPostImage();

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !post.id) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage.mutateAsync({
          postId: post.id,
          file: files[i],
          order: images.length + i,
        });
        setImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            feed_post_id: post.id,
            file_url: url,
            file_type: files[i].type.startsWith("video") ? "video" : "image",
            display_order: prev.length,
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (img: FeedPostImage) => {
    deleteImage.mutate({ id: img.id, postId: post.id });
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const handleSave = () => {
    onSave({
      title,
      description: description || null,
      post_type: postType,
      location: location || null,
      category: category || null,
      tags,
      visibility,
      status,
      folder_id: folderId || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Post Type */}
      <div className="space-y-2">
        <Label>Tipo de Post</Label>
        <Select value={postType} onValueChange={setPostType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {POST_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Details */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Detalhes do Projeto</h3>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do post" />
          </div>
          <div className="space-y-2">
            <Label>Localização</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Newark, NJ" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Imagens</h3>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-md overflow-hidden group">
                <img src={img.file_url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(img)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span className="text-xs">{uploading ? "Enviando..." : "Upload"}</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </CardContent>
      </Card>

      {/* Description */}
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o projeto ou atualização..."
          className="min-h-[100px]"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs gap-1">
              {tag}
              <button onClick={() => removeTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Adicionar tag..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Organization */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Organização</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Pasta</Label>
              <Select value={folderId || "none"} onValueChange={(v) => setFolderId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibilidade</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quality Checklist */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Quality Checklist</h3>
          {QUALITY_CHECKLIST.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Checkbox
                checked={checklist[item] || false}
                onCheckedChange={(checked) =>
                  setChecklist((prev) => ({ ...prev, [item]: !!checked }))
                }
              />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={isSaving || !title.trim()} className="w-full">
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Salvar Post
      </Button>
    </div>
  );
}
