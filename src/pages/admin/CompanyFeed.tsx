import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Plus, FolderPlus, ArrowLeft, FolderOpen, Camera, CheckCircle, ImageIcon } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FeedPostCard } from "@/components/admin/feed/FeedPostCard";
import { FeedFolderGrid } from "@/components/admin/feed/FeedFolderGrid";
import { CreateFolderDialog } from "@/components/admin/feed/CreateFolderDialog";
import { FeedFiltersSheet, FeedFilters, countActiveFilters } from "@/components/admin/feed/FeedFiltersSheet";
import { useFeedPosts, useFeedFolders } from "@/hooks/admin/useFeedData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const FOLDER_TYPE_LABELS: Record<string, { label: string; icon: typeof Camera }> = {
  job_proof_before: { label: "Fotos Antes", icon: Camera },
  job_proof_after: { label: "Fotos Depois", icon: ImageIcon },
  quality_control: { label: "Controle de Qualidade", icon: CheckCircle },
  job_progress: { label: "Progresso do Job", icon: FolderOpen },
};

const FEED_PAGE_SIZE = 20;

export default function CompanyFeed() {
  const [search, setSearch] = useState("");
  const [feedPage, setFeedPage] = useState(0);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FeedFilters>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  // Fetch project info when in project context
  const { data: projectInfo } = useQuery({
    queryKey: ["project-info", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("customer_name, project_type, city")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Merge project_id into filters when in project context
  const effectiveFilters = useMemo(() => {
    if (!projectId) return filters;
    return { ...filters, project_id: projectId };
  }, [filters, projectId]);

  const activeFilterCount = countActiveFilters(filters);

  const { data: feedData, isLoading: postsLoading } = useFeedPosts(search || undefined, feedPage, FEED_PAGE_SIZE, effectiveFilters);
  const posts = feedData?.posts ?? [];
  const totalFeedCount = feedData?.totalCount ?? 0;
  const totalFeedPages = Math.max(1, Math.ceil(totalFeedCount / FEED_PAGE_SIZE));
  const { data: folders = [], isLoading: foldersLoading } = useFeedFolders();

  // Extract unique categories from posts for the filter dropdown
  const categories = useMemo(() => {
    const cats = new Set<string>();
    posts.forEach((p) => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [posts]);

  const handleFiltersChange = (newFilters: FeedFilters) => {
    setFilters(newFilters);
    setFeedPage(0);
  };

  const breadcrumbs = projectId && projectInfo
    ? [{ label: "Jobs", href: "/admin/jobs" }, { label: projectInfo.customer_name }, { label: "Feed" }]
    : [{ label: "Feed" }];

  return (
    <AdminLayout title={projectId ? "Projeto — Feed" : "Company Feed"} breadcrumbs={breadcrumbs}>
      <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">

        {/* Project context header */}
        {projectId && projectInfo && (
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-card">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/jobs")}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar ao Job
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{projectInfo.customer_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {[projectInfo.project_type, projectInfo.city].filter(Boolean).join(" • ")}
              </p>
            </div>
          </div>
        )}

        {/* Search + filters + new */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search feed..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFeedPage(0); }}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="flex-shrink-0 relative"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {!projectId && (
            <Button size="icon" onClick={() => navigate("/admin/feed/new/edit")} className="flex-shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="feed" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Feed
            </TabsTrigger>
            <TabsTrigger value="folders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Folders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-3 mt-0">
            {postsLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Carregando feed...</div>
            ) : posts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  {projectId
                    ? "Nenhum post vinculado a este projeto"
                    : activeFilterCount > 0
                      ? "Nenhum post encontrado com os filtros aplicados"
                      : "Nenhum post no feed ainda"}
                </p>
                {activeFilterCount > 0 && !projectId ? (
                  <Button variant="link" size="sm" className="mt-1 text-xs" onClick={() => handleFiltersChange({})}>
                    Limpar filtros
                  </Button>
                ) : !projectId ? (
                  <p className="text-xs text-muted-foreground/70 mt-1">Posts aparecerão aqui conforme forem criados</p>
                ) : null}
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <FeedPostCard
                    key={post.id}
                    post={post}
                    onClick={() => navigate(`/admin/feed/${post.id}`)}
                  />
                ))}
                {totalFeedPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">{totalFeedCount} posts</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={feedPage === 0} onClick={() => setFeedPage(p => p - 1)}>
                        Anterior
                      </Button>
                      <span className="text-xs text-muted-foreground">{feedPage + 1} / {totalFeedPages}</span>
                      <Button variant="outline" size="sm" disabled={feedPage >= totalFeedPages - 1} onClick={() => setFeedPage(p => p + 1)}>
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="folders" className="mt-0">
            {!projectId && (
              <div className="flex justify-end mb-3">
                <Button size="sm" variant="outline" onClick={() => setFolderDialogOpen(true)}>
                  <FolderPlus className="w-4 h-4 mr-1" /> Nova Pasta
                </Button>
              </div>
            )}
            {foldersLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Carregando pastas...</div>
            ) : (
              <FeedFolderGrid folders={folders} />
            )}
            <CreateFolderDialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen} />
          </TabsContent>
        </Tabs>
      </div>

      <FeedFiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        folders={folders}
        categories={categories}
      />
    </AdminLayout>
  );
}
