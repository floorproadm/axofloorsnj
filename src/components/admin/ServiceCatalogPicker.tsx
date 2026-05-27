import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useServiceCatalog, CatalogItem } from "@/hooks/useServiceCatalog";
import { Search, Package, Loader2 } from "lucide-react";

interface ServiceCatalogPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: CatalogItem) => void;
}

function mapCatalogCategory(cat: string | null): string {
  if (!cat) return "other";
  const lower = cat.toLowerCase();
  if (
    lower.includes("install") ||
    lower.includes("sanding") ||
    lower.includes("stairs") ||
    lower.includes("repair")
  )
    return "labor";
  if (lower.includes("add")) return "material";
  if (lower.includes("material")) return "material";
  if (lower.includes("equip")) return "equipment";
  return "other";
}

export function ServiceCatalogPicker({
  open,
  onClose,
  onSelect,
}: ServiceCatalogPickerProps) {
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading } = useServiceCatalog("service");

  const grouped = useMemo(() => {
    const filtered = items.filter(
      (it) =>
        it.name.toLowerCase().includes(search.toLowerCase()) ||
        (it.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (it.category ?? "").toLowerCase().includes(search.toLowerCase())
    );
    const map = new Map<string, CatalogItem[]>();
    filtered.forEach((it) => {
      const cat = it.category ?? "Uncategorized";
      const list = map.get(cat) || [];
      list.push(it);
      map.set(cat, list);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items, search]);

  const handleSelect = (item: CatalogItem) => {
    onSelect(item);
    onClose();
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            Select a Service from Catalog
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : grouped.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No services found.
            </p>
          ) : (
            <div className="space-y-5">
              {grouped.map(([category, list]) => (
                <div key={category}>
                  <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2 mb-2 border-b border-border/40">
                    <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                      {category}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {list.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full text-left rounded-lg border border-border/60 bg-card/60 hover:bg-card hover:border-primary/25 hover:shadow-sm transition-all duration-200 p-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground truncate leading-tight">
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] font-mono font-semibold">
                              ${Number(item.base_price).toLocaleString()}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wide">
                              /{item.price_unit}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-3 border-t flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { mapCatalogCategory };
