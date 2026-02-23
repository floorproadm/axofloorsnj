import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LayoutGrid, Plus } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedPostCard } from "@/components/admin/feed/FeedPostCard";
import { FeedFolderGrid } from "@/components/admin/feed/FeedFolderGrid";
import { useFeedPosts, useFeedFolders } from "@/hooks/admin/useFeedData";

const FEED_PAGE_SIZE = 20;

export default function CompanyFeed() {
  const [search, setSearch] = useState("");
  const [feedPage, setFeedPage] = useState(0);
  const navigate = useNavigate();

  const { data: feedData, isLoading: postsLoading } = useFeedPosts(search || undefined, feedPage, FEED_PAGE_SIZE);
  const posts = feedData?.posts ?? [];
  const totalFeedCount = feedData?.totalCount ?? 0;
  const totalFeedPages = Math.max(1, Math.ceil(totalFeedCount / FEED_PAGE_SIZE));
  const { data: folders = [], isLoading: foldersLoading } = useFeedFolders();

  return (
    <AdminLayout title="Company Feed" breadcrumbs={[{ label: "Feed" }]}>
      <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
        {/* Search + grid toggle */}
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
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button size="icon" onClick={() => navigate("/admin/feed/new/edit")} className="flex-shrink-0">
            <Plus className="w-4 h-4" />
          </Button>
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
                <p className="text-sm text-muted-foreground">Nenhum post no feed ainda</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Posts aparecerão aqui conforme forem criados</p>
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
            {foldersLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">Carregando pastas...</div>
            ) : (
              <FeedFolderGrid folders={folders} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
