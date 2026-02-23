import { FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FeedFolder } from "@/hooks/admin/useFeedData";

interface FeedFolderGridProps {
  folders: FeedFolder[];
  onFolderClick?: (folder: FeedFolder) => void;
}

export function FeedFolderGrid({ folders, onFolderClick }: FeedFolderGridProps) {
  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Nenhuma pasta criada. Organize o feed por projeto ou tipo de servico.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Pastas alimentam o portfolio publico</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {folders.map((folder) => (
        <Card
          key={folder.id}
          className="hover:shadow-md transition-shadow cursor-pointer border-border/60"
          onClick={() => onFolderClick?.(folder)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {folder.item_count} items
              </span>
            </div>
            <h3 className="font-semibold text-sm text-foreground truncate">{folder.name}</h3>
            {folder.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{folder.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
