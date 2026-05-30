import { useMemo, useState } from "react";
import { useAllOrgPhotos } from "@/hooks/useProjectPhotos";
import { useAllOrgBeforeAfter } from "@/hooks/useBeforeAfter";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

type Filter = "all" | "ba" | "standalone";

export function ProjectPhotosPanel() {
  const { data: photos = [], isLoading } = useAllOrgPhotos();
  const { data: pairs = [] } = useAllOrgBeforeAfter();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [type, setType] = useState<Filter>("all");
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  const baPhotoIds = useMemo(() => {
    const s = new Set<string>();
    pairs.forEach((p) => {
      if (p.before_photo_id) s.add(p.before_photo_id);
      if (p.after_photo_id) s.add(p.after_photo_id);
    });
    return s;
  }, [pairs]);

  const projects = useMemo(() => {
    const m = new Map<string, string>();
    photos.forEach((p: any) => m.set(p.project_id, p.project_name));
    return Array.from(m.entries());
  }, [photos]);

  const filtered = useMemo(() => {
    let arr = [...photos];
    if (projectFilter !== "all") arr = arr.filter((p) => p.project_id === projectFilter);
    if (type === "ba") arr = arr.filter((p) => baPhotoIds.has(p.id));
    if (type === "standalone") arr = arr.filter((p) => !baPhotoIds.has(p.id));
    arr.sort((a, b) => {
      const da = +new Date(a.taken_at);
      const db = +new Date(b.taken_at);
      return sort === "desc" ? db - da : da - db;
    });
    return arr;
  }, [photos, baPhotoIds, projectFilter, type, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Projeto" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projetos</SelectItem>
            {projects.map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v: any) => setType(v)}>
          <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="ba">Em Before/After</SelectItem>
            <SelectItem value="standalone">Avulsas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v: any) => setSort(v)}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Mais recentes</SelectItem>
            <SelectItem value="asc">Mais antigas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground tabular-nums ml-auto">
          {filtered.length} foto{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Carregando…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground border-dashed">
          Nenhuma foto encontrada com esses filtros.
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filtered.map((p: any) => (
            <Link
              key={p.id}
              to={`/admin/projects/${p.project_id}`}
              className="group relative aspect-square rounded-md overflow-hidden bg-muted border border-border/60"
            >
              <img src={p.photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-6 pb-1 space-y-0.5">
                <p className="text-[10px] text-white font-medium truncate">{p.project_name}</p>
                <p className="text-[10px] text-white/85 tabular-nums flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {format(new Date(p.taken_at), "dd/MM HH:mm")}
                </p>
                {p.location_label && (
                  <p className="text-[10px] text-white/70 truncate flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{p.location_label}</span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
