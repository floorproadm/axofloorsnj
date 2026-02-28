import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useServiceCatalog,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeleteCatalogItem,
  type CatalogItem,
  type CatalogItemType,
  type CatalogItemInsert,
  type PriceUnit,
} from "@/hooks/useServiceCatalog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreVertical, Pencil, Trash2, Package, Wrench, DollarSign } from "lucide-react";
import { toast } from "sonner";

const PRICE_UNITS: { value: PriceUnit; label: string }[] = [
  { value: "sqft", label: "per sqft" },
  { value: "unit", label: "per unit" },
  { value: "step", label: "per step" },
  { value: "linear_ft", label: "per linear ft" },
];

const EMPTY_FORM: CatalogItemInsert = {
  item_type: "service",
  name: "",
  description: null,
  category: null,
  default_material: null,
  default_finish: null,
  base_price: 0,
  price_unit: "sqft",
  is_active: true,
  display_order: 0,
};

export default function Catalog() {
  const { language } = useLanguage();
  const pt = language === "pt";

  const [activeTab, setActiveTab] = useState<CatalogItemType>("service");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<CatalogItemInsert>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);

  const { data: items = [], isLoading } = useServiceCatalog(activeTab);
  const createMutation = useCreateCatalogItem();
  const updateMutation = useUpdateCatalogItem();
  const deleteMutation = useDeleteCatalogItem();

  // Derive categories from items
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((i) => {
      if (i.category) map.set(i.category, (map.get(i.category) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  // Filtered items
  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      list = list.filter((i) => i.category === selectedCategory);
    }
    return list;
  }, [items, search, selectedCategory]);

  function openCreate() {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, item_type: activeTab });
    setDialogOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditingItem(item);
    setForm({
      item_type: item.item_type,
      name: item.name,
      description: item.description,
      category: item.category,
      default_material: item.default_material,
      default_finish: item.default_finish,
      base_price: item.base_price,
      price_unit: item.price_unit,
      is_active: item.is_active,
      display_order: item.display_order,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error(pt ? "Nome é obrigatório" : "Name is required");
      return;
    }
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...form });
        toast.success(pt ? "Item atualizado" : "Item updated");
      } else {
        await createMutation.mutateAsync(form);
        toast.success(pt ? "Item criado" : "Item created");
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(pt ? "Item removido" : "Item deleted");
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
    setDeleteTarget(null);
  }

  async function toggleActive(item: CatalogItem) {
    try {
      await updateMutation.mutateAsync({ id: item.id, is_active: !item.is_active });
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout title={pt ? "Catálogo" : "Catalog"}>
      <div className="space-y-4">
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as CatalogItemType);
            setSelectedCategory(null);
            setSearch("");
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-auto">
              <TabsTrigger
                value="service"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <Wrench className="w-4 h-4 mr-1.5" />
                {pt ? "Serviços" : "Services"}
              </TabsTrigger>
              <TabsTrigger
                value="material"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <Package className="w-4 h-4 mr-1.5" />
                {pt ? "Materiais" : "Materials"}
              </TabsTrigger>
            </TabsList>

            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" />
              {pt ? "Adicionar" : "Add"}
            </Button>
          </div>

          {/* Search + Category chips */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={pt ? "Buscar..." : "Search..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {categories.length > 0 && (
              <div className="flex gap-1.5 flex-wrap items-center">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedCategory(null)}
                >
                  {pt ? "Todos" : "All"} ({items.length})
                </Badge>
                {categories.map(([cat, count]) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  >
                    {cat} ({count})
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content for both tabs (same layout) */}
          <TabsContent value="service" className="mt-0 pt-2">
            <ItemGrid
              items={filtered}
              isLoading={isLoading}
              pt={pt}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onToggle={toggleActive}
            />
          </TabsContent>
          <TabsContent value="material" className="mt-0 pt-2">
            <ItemGrid
              items={filtered}
              isLoading={isLoading}
              pt={pt}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onToggle={toggleActive}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? pt ? "Editar Item" : "Edit Item"
                : pt ? "Novo Item" : "New Item"}
            </DialogTitle>
            <DialogDescription>
              {pt ? "Preencha os dados do item do catálogo." : "Fill in the catalog item details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{pt ? "Nome" : "Name"} *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={activeTab === "service" ? "Sanding & Refinish" : "Red Oak"}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{pt ? "Descrição" : "Description"}</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{pt ? "Categoria" : "Category"}</Label>
                <Input
                  value={form.category || ""}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value || null }))}
                  placeholder="Hardwood, Tile..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>{pt ? "Preço Base" : "Base Price"}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.base_price}
                      onChange={(e) => setForm((f) => ({ ...f, base_price: parseFloat(e.target.value) || 0 }))}
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{pt ? "Unidade de Preço" : "Price Unit"}</Label>
              <Select
                value={form.price_unit}
                onValueChange={(v) => setForm((f) => ({ ...f, price_unit: v as PriceUnit }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.item_type === "service" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{pt ? "Material Padrão" : "Default Material"}</Label>
                  <Input
                    value={form.default_material || ""}
                    onChange={(e) => setForm((f) => ({ ...f, default_material: e.target.value || null }))}
                    placeholder="Red Oak"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{pt ? "Acabamento Padrão" : "Default Finish"}</Label>
                  <Input
                    value={form.default_finish || ""}
                    onChange={(e) => setForm((f) => ({ ...f, default_finish: e.target.value || null }))}
                    placeholder="Satin"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {pt ? "Cancelar" : "Cancel"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? pt ? "Salvando..." : "Saving..."
                : pt ? "Salvar" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pt ? "Remover item?" : "Delete item?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pt
                ? `"${deleteTarget?.name}" será removido permanentemente.`
                : `"${deleteTarget?.name}" will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{pt ? "Cancelar" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {pt ? "Remover" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

/* ─── Item Grid ─── */

function ItemGrid({
  items,
  isLoading,
  pt,
  onEdit,
  onDelete,
  onToggle,
}: {
  items: CatalogItem[];
  isLoading: boolean;
  pt: boolean;
  onEdit: (i: CatalogItem) => void;
  onDelete: (i: CatalogItem) => void;
  onToggle: (i: CatalogItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-32 animate-pulse bg-muted/40" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center min-h-[200px] gap-2">
        <Package className="w-10 h-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {pt ? "Nenhum item encontrado" : "No items found"}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => (
        <Card
          key={item.id}
          className={`p-4 flex flex-col gap-2 transition-opacity ${!item.is_active ? "opacity-50" : ""}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate text-foreground">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  {pt ? "Editar" : "Edit"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggle(item)}>
                  {item.is_active
                    ? pt ? "Desativar" : "Deactivate"
                    : pt ? "Ativar" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  {pt ? "Remover" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-auto">
            {item.category && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {item.category}
              </Badge>
            )}
            {item.base_price > 0 && (
              <span className="text-xs font-medium text-primary">
                ${item.base_price.toFixed(2)}/{item.price_unit}
              </span>
            )}
            {!item.is_active && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                {pt ? "Inativo" : "Inactive"}
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
