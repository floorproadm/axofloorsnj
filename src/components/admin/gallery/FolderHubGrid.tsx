import { FolderOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FolderHubItem {
  id: string;
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  item_count: number;
}

interface FolderHubGridProps {
  folders: FolderHubItem[];
  onOpenFolder: (folder: FolderHubItem) => void;
  onRename?: (folder: FolderHubItem) => void;
  onDelete?: (folder: FolderHubItem) => void;
  /** Optional "all items / unfiled" pseudo-folder */
  unfiledCount?: number;
  onOpenUnfiled?: () => void;
}

export function FolderHubGrid({
  folders,
  onOpenFolder,
  onRename,
  onDelete,
  unfiledCount,
  onOpenUnfiled,
}: FolderHubGridProps) {
  const hasUnfiled = typeof unfiledCount === "number" && onOpenUnfiled;

  if (folders.length === 0 && !hasUnfiled) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma pasta ainda</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Crie pastas para organizar suas fotos por projeto ou serviço
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {hasUnfiled && (
        <Card
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-dashed border-border/60"
          onClick={onOpenUnfiled}
        >
          <div className="aspect-square bg-muted/40 flex items-center justify-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <CardContent className="p-2.5">
            <p className="text-xs font-semibold truncate">Sem pasta</p>
            <p className="text-[11px] text-muted-foreground">{unfiledCount} item(s)</p>
          </CardContent>
        </Card>
      )}

      {folders.map((folder) => (
        <Card
          key={folder.id}
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group relative"
          onClick={() => onOpenFolder(folder)}
        >
          <div className="aspect-square bg-muted/40 relative">
            {folder.cover_image_url ? (
              <img
                src={folder.cover_image_url}
                alt={folder.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-primary/40" />
              </div>
            )}
            {(onRename || onDelete) && (
              <div
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="secondary" className="h-7 w-7">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onRename && (
                      <DropdownMenuItem onClick={() => onRename(folder)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Renomear
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(folder)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <CardContent className="p-2.5">
            <p className="text-xs font-semibold truncate">{folder.name}</p>
            <p className="text-[11px] text-muted-foreground">{folder.item_count} item(s)</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
