import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FeedFolder } from "@/hooks/admin/useFeedData";

export interface FeedFilters {
  folder_id?: string;
  status?: string;
  visibility?: string;
  category?: string;
  post_type?: string;
  date_from?: Date;
  date_to?: Date;
}

const EMPTY_FILTERS: FeedFilters = {};

interface FeedFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FeedFilters;
  onFiltersChange: (filters: FeedFilters) => void;
  folders: FeedFolder[];
  categories: string[];
}

export function countActiveFilters(filters: FeedFilters): number {
  let count = 0;
  if (filters.folder_id) count++;
  if (filters.status) count++;
  if (filters.visibility) count++;
  if (filters.category) count++;
  if (filters.post_type) count++;
  if (filters.date_from) count++;
  if (filters.date_to) count++;
  return count;
}

export function FeedFiltersSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  folders,
  categories,
}: FeedFiltersSheetProps) {
  const [local, setLocal] = useState<FeedFilters>(filters);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setLocal(filters);
    onOpenChange(isOpen);
  };

  const apply = () => {
    onFiltersChange(local);
    onOpenChange(false);
  };

  const clear = () => {
    setLocal(EMPTY_FILTERS);
    onFiltersChange(EMPTY_FILTERS);
    onOpenChange(false);
  };

  const update = (key: keyof FeedFilters, value: any) => {
    setLocal((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent side="right" className="w-[320px] sm:w-[380px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Filtros Avançados</SheetTitle>
          <SheetDescription>Filtre os posts do feed por critérios específicos.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-4">
          {/* Pasta */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Pasta</Label>
            <Select value={local.folder_id || ""} onValueChange={(v) => update("folder_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as pastas" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <Select value={local.status || ""} onValueChange={(v) => update("status", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibilidade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Visibilidade</Label>
            <Select value={local.visibility || ""} onValueChange={(v) => update("visibility", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Interno</SelectItem>
                <SelectItem value="public">Público</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Categoria</Label>
              <Select value={local.category || ""} onValueChange={(v) => update("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo de mídia */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Tipo de mídia</Label>
            <Select value={local.post_type || ""} onValueChange={(v) => update("post_type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Período</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("flex-1 justify-start text-left text-xs font-normal", !local.date_from && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {local.date_from ? format(local.date_from, "dd/MM/yy") : "Início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={local.date_from}
                    onSelect={(d) => update("date_from", d)}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("flex-1 justify-start text-left text-xs font-normal", !local.date_to && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {local.date_to ? format(local.date_to, "dd/MM/yy") : "Fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={local.date_to}
                    onSelect={(d) => update("date_to", d)}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={clear}>
            <X className="w-4 h-4 mr-1" /> Limpar
          </Button>
          <Button className="flex-1" onClick={apply}>
            Aplicar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
