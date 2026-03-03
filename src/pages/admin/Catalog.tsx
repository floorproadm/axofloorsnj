import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useServiceCatalog,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeleteCatalogItem,
  uploadCatalogImage,
  deleteCatalogImage,
  getCatalogSignedUrls,
  type CatalogItem,
  type CatalogItemType,
  type CatalogItemInsert,
  type PriceUnit,
} from "@/hooks/useServiceCatalog";
import { convertHeicToJpeg, isHeicFile } from "@/utils/heicConverter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus, Search, MoreVertical, Pencil, Trash2, Package, Wrench, DollarSign, ImagePlus, X } from "lucide-react";
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
  image_url: null,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

  // Image upload state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signed URLs cache
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const { data: items = [], isLoading } = useServiceCatalog(activeTab);
  const createMutation = useCreateCatalogItem();
  const updateMutation = useUpdateCatalogItem();
  const deleteMutation = useDeleteCatalogItem();

  // Generate signed URLs when items change
  useEffect(() => {
    const paths = items.filter((i) => i.image_url).map((i) => i.image_url!);
    if (paths.length === 0) {
      setSignedUrls({});
      return;
    }
    getCatalogSignedUrls(paths)
      .then(setSignedUrls)
      .catch(() => setSignedUrls({}));
  }, [items]);

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

  function resetImageState() {
    setPendingFile(null);
    setPreviewUrl(null);
    setRemoveExistingImage(false);
  }

  function openCreate() {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM, item_type: activeTab });
    resetImageState();
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
      image_url: item.image_url,
    });
    resetImageState();
    // Show existing image preview via signed URL
    if (item.image_url && signedUrls[item.image_url]) {
      setPreviewUrl(signedUrls[item.image_url]);
    }
    setDialogOpen(true);
  }

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error(pt ? "Arquivo muito grande (máx 5MB)" : "File too large (max 5MB)");
      return;
    }

    let processedFile = file;
    if (isHeicFile(file)) {
      try {
        processedFile = await convertHeicToJpeg(file);
      } catch {
        toast.error(pt ? "Erro ao converter HEIC" : "Error converting HEIC");
        return;
      }
    }

    setPendingFile(processedFile);
    setRemoveExistingImage(false);
    const url = URL.createObjectURL(processedFile);
    setPreviewUrl(url);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [pt]);

  function handleRemoveImage() {
    setPendingFile(null);
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (editingItem?.image_url) {
      setRemoveExistingImage(true);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error(pt ? "Nome é obrigatório" : "Name is required");
      return;
    }
    try {
      let savedItem: CatalogItem;

      if (editingItem) {
        // Handle image removal
        if (removeExistingImage && editingItem.image_url) {
          await deleteCatalogImage(editingItem.image_url).catch(() => {});
          await updateMutation.mutateAsync({ id: editingItem.id, image_url: null });
        }

        // Handle new image upload
        if (pendingFile) {
          // Delete old image first
          if (editingItem.image_url) {
            await deleteCatalogImage(editingItem.image_url).catch(() => {});
          }
          const path = await uploadCatalogImage(editingItem.id, pendingFile);
          const formWithImage = { ...form, image_url: path };
          savedItem = await updateMutation.mutateAsync({ id: editingItem.id, ...formWithImage });
        } else {
          const updates = { ...form };
          if (removeExistingImage) updates.image_url = null;
          savedItem = await updateMutation.mutateAsync({ id: editingItem.id, ...updates });
        }

        toast.success(pt ? "Item atualizado" : "Item updated");
      } else {
        // Create item first, then upload image
        savedItem = await createMutation.mutateAsync(form);

        if (pendingFile) {
          const path = await uploadCatalogImage(savedItem.id, pendingFile);
          await updateMutation.mutateAsync({ id: savedItem.id, image_url: path });
        }

        toast.success(pt ? "Item criado" : "Item created");
      }

      resetImageState();
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      // Delete image from storage if exists
      if (deleteTarget.image_url) {
        await deleteCatalogImage(deleteTarget.image_url).catch(() => {});
      }
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

          <TabsContent value="service" className="mt-0 pt-2">
            <ItemGrid items={filtered} isLoading={isLoading} pt={pt} signedUrls={signedUrls} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={toggleActive} />
          </TabsContent>
          <TabsContent value="material" className="mt-0 pt-2">
            <ItemGrid items={filtered} isLoading={isLoading} pt={pt} signedUrls={signedUrls} onEdit={openEdit} onDelete={setDeleteTarget} onToggle={toggleActive} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? (pt ? "Editar Item" : "Edit Item") : (pt ? "Novo Item" : "New Item")}
            </DialogTitle>
            <DialogDescription>
              {pt ? "Preencha os dados do item do catálogo." : "Fill in the catalog item details."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image upload area */}
            <div className="space-y-1.5">
              <Label>{pt ? "Foto" : "Photo"}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                onChange={handleFileSelect}
              />
              {previewUrl && !removeExistingImage ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs">{pt ? "Clique para adicionar foto" : "Click to add photo"}</span>
                </button>
              )}
            </div>

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
                <Select value={form.category || ""} onValueChange={(v) => setForm((f) => ({ ...f, category: v || null }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={pt ? "Selecione..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hardwood">Hardwood</SelectItem>
                    <SelectItem value="Vinyl">Vinyl</SelectItem>
                    <SelectItem value="Tile">Tile</SelectItem>
                    <SelectItem value="Laminate">Laminate</SelectItem>
                    <SelectItem value="Staircase">Staircase</SelectItem>
                    <SelectItem value="Baseboard">Baseboard</SelectItem>
                    <SelectItem value="Stain">Stain</SelectItem>
                    <SelectItem value="Finish">Finish</SelectItem>
                    <SelectItem value="Other">{pt ? "Outro" : "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{pt ? "Preço Base" : "Base Price"}</Label>
                <div className="relative">
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
              {saving ? (pt ? "Salvando..." : "Saving...") : (pt ? "Salvar" : "Save")}
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
  signedUrls,
  onEdit,
  onDelete,
  onToggle,
}: {
  items: CatalogItem[];
  isLoading: boolean;
  pt: boolean;
  signedUrls: Record<string, string>;
  onEdit: (i: CatalogItem) => void;
  onDelete: (i: CatalogItem) => void;
  onToggle: (i: CatalogItem) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-40 animate-pulse bg-muted/40" />
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
      {items.map((item) => {
        const imgUrl = item.image_url ? signedUrls[item.image_url] : null;
        return (
          <Card
            key={item.id}
            className={`overflow-hidden flex flex-col transition-opacity cursor-pointer hover:ring-2 hover:ring-primary/30 ${!item.is_active ? "opacity-50" : ""}`}
            onClick={() => onEdit(item)}
          >
            {/* Thumbnail */}
            {imgUrl ? (
              <div className="w-full h-28 bg-muted">
                <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full h-20 bg-muted/30 flex items-center justify-center">
                {item.item_type === "service" ? (
                  <Wrench className="w-8 h-8 text-muted-foreground/30" />
                ) : (
                  <Package className="w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
            )}

            <div className="p-4 flex flex-col gap-2 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm truncate text-foreground">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      {pt ? "Editar" : "Edit"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggle(item)}>
                      {item.is_active ? (pt ? "Desativar" : "Deactivate") : (pt ? "Ativar" : "Activate")}
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
            </div>
          </Card>
        );
      })}
    </div>
  );
}
