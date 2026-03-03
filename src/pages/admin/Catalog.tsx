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
import { Plus, Search, MoreVertical, Pencil, Trash2, Package, Wrench, DollarSign, ImagePlus, X, PlusCircle } from "lucide-react";
import { toast } from "sonner";

const PREDEFINED_SERVICE_CATEGORIES = [
  "Installation",
  "Refinishing",
  "Stairs",
  "Repair",
  "Flooring Sales",
];

const PREDEFINED_MATERIAL_CATEGORIES = [
  "Hardwood",
  "Vinyl",
  "Laminate",
  "Stain & Finish",
  "Adhesives & Underlayment",
  "Trim & Molding",
  "Sundries",
];

type SubcategoryType = "core" | "add-on";

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
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Image upload state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category state
  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [customCategoryValue, setCustomCategoryValue] = useState("");
  const [subcategory, setSubcategory] = useState<SubcategoryType>("core");

  // Signed URLs cache
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const { data: items = [], isLoading } = useServiceCatalog(activeTab);
  const { data: allItems = [] } = useServiceCatalog(); // all items for extracting categories
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

  // Derive display categories from items (merge all "X - Add-ons" into one "Add-ons")
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    let addonsCount = 0;
    items.forEach((i) => {
      if (!i.category) return;
      if (i.category.endsWith("- Add-ons")) {
        addonsCount++;
      } else {
        map.set(i.category, (map.get(i.category) || 0) + 1);
      }
    });
    const categoryOrder: Record<string, number> = {
      "Installation": 1,
      "Refinishing": 2,
      "Stairs": 3,
      "Repair": 4,
    };
    const sorted: [string, number][] = Array.from(map.entries()).sort((a, b) =>
      (categoryOrder[a[0]] ?? 99) - (categoryOrder[b[0]] ?? 99)
    );
    // Only show Add-ons badge for services tab
    if (addonsCount > 0 && activeTab === "service") {
      sorted.push(["Add-ons", addonsCount]);
    }
    return sorted;
  }, [items, activeTab]);

  // Merged category options for the Select – separated by active tab
  const allCategoryOptions = useMemo(() => {
    const predefined = activeTab === "service" ? PREDEFINED_SERVICE_CATEGORIES : PREDEFINED_MATERIAL_CATEGORIES;
    const dbCategories = new Set<string>();
    allItems.forEach((i) => {
      if (i.category && i.item_type === activeTab) {
        const base = i.category.replace(/ - Add-ons$/, "");
        dbCategories.add(base);
      }
    });
    const merged = new Set([...predefined, ...dbCategories]);
    return Array.from(merged).sort();
  }, [allItems, activeTab]);

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
      if (selectedCategory === "Add-ons") {
        list = list.filter((i) => i.category?.endsWith("- Add-ons"));
      } else {
        list = list.filter((i) => i.category === selectedCategory || i.category === `${selectedCategory} - Add-ons`);
      }
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
    setCustomCategoryMode(false);
    setCustomCategoryValue("");
    setSubcategory("core");
    setDialogOpen(true);
  }

  function openEdit(item: CatalogItem) {
    setEditingItem(item);
    // Parse subcategory from stored category
    const isAddon = item.category?.endsWith(" - Add-ons") || false;
    const baseCategory = item.category?.replace(/ - Add-ons$/, "") || null;
    setSubcategory(isAddon ? "add-on" : "core");
    setCustomCategoryMode(false);
    setCustomCategoryValue("");
    setForm({
      item_type: item.item_type,
      name: item.name,
      description: item.description,
      category: baseCategory,
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

    // Resolve final category with subcategory suffix
    const baseCategory = customCategoryMode ? customCategoryValue.trim() : form.category;
    const finalCategory = baseCategory
      ? subcategory === "add-on"
        ? `${baseCategory} - Add-ons`
        : baseCategory
      : null;
    const formToSave = { ...form, category: finalCategory };

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
          const formWithImage = { ...formToSave, image_url: path };
          savedItem = await updateMutation.mutateAsync({ id: editingItem.id, ...formWithImage });
        } else {
          const updates = { ...formToSave };
          if (removeExistingImage) updates.image_url = null;
          savedItem = await updateMutation.mutateAsync({ id: editingItem.id, ...updates });
        }

        toast.success(pt ? "Item atualizado" : "Item updated");
      } else {
        // Create item first, then upload image
        savedItem = await createMutation.mutateAsync(formToSave);

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
    setDeleteConfirmText("");
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
              {editingItem
                ? (activeTab === "service"
                    ? (pt ? "Editar Serviço" : "Edit Service")
                    : (pt ? "Editar Material" : "Edit Material"))
                : (activeTab === "service"
                    ? (pt ? "Novo Serviço" : "New Service")
                    : (pt ? "Novo Material" : "New Material"))}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "service"
                ? (pt ? "Preencha os dados do serviço." : "Fill in the service details.")
                : (pt ? "Preencha os dados do material." : "Fill in the material details.")}
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

            <div className={`grid ${activeTab === "service" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
              <div className="space-y-1.5">
                <Label>{pt ? "Categoria" : "Category"}</Label>
                {customCategoryMode ? (
                  <div className="flex gap-1.5">
                    <Input
                      value={customCategoryValue}
                      onChange={(e) => setCustomCategoryValue(e.target.value)}
                      placeholder={pt ? "Nova categoria..." : "New category..."}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-10 w-10"
                      onClick={() => {
                        setCustomCategoryMode(false);
                        setCustomCategoryValue("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={form.category || ""}
                    onValueChange={(v) => {
                      if (v === "__new__") {
                        setCustomCategoryMode(true);
                        setCustomCategoryValue("");
                        setForm((f) => ({ ...f, category: null }));
                      } else {
                        setForm((f) => ({ ...f, category: v || null }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={pt ? "Selecione..." : "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategoryOptions.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="__new__">
                        <span className="flex items-center gap-1.5 text-primary">
                          <PlusCircle className="w-3.5 h-3.5" />
                          {pt ? "Nova categoria..." : "Add new..."}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {activeTab === "service" && (
                <div className="space-y-1.5">
                  <Label>{pt ? "Subcategoria" : "Subcategory"}</Label>
                  <Select value={subcategory} onValueChange={(v) => setSubcategory(v as SubcategoryType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="add-on">Add-on</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>

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
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pt ? "Remover item?" : "Delete item?"}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span>
                {pt
                  ? `"${deleteTarget?.name}" será removido permanentemente. Esta ação não pode ser desfeita.`
                  : `"${deleteTarget?.name}" will be permanently deleted. This action cannot be undone.`}
              </span>
              <span className="block text-sm font-medium text-foreground mt-2">
                {pt
                  ? `Digite "${deleteTarget?.name}" para confirmar:`
                  : `Type "${deleteTarget?.name}" to confirm:`}
              </span>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deleteTarget?.name || ""}
                className="mt-1"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>{pt ? "Cancelar" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteConfirmText !== deleteTarget?.name}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {pt ? "Remover permanentemente" : "Delete permanently"}
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
