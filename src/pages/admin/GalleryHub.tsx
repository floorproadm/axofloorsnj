import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Camera, Globe } from "lucide-react";
import { GalleryFeedPanel } from "@/components/admin/gallery/GalleryFeedPanel";
import { GalleryPublicPanel } from "@/components/admin/gallery/GalleryPublicPanel";

const CompanyFeed = lazy(() => import("./CompanyFeed"));

const Fallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

export default function GalleryHub() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Project context bypasses the tab shell — render legacy Feed directly
  if (searchParams.get("project")) {
    return (
      <Suspense fallback={<Fallback />}>
        <CompanyFeed />
      </Suspense>
    );
  }

  const tab = searchParams.get("tab") === "public" ? "public" : "feed";

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "public") next.set("tab", "public");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };

  return (
    <AdminLayout title="Gallery" breadcrumbs={[{ label: "Gallery" }]}>
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="feed"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <Camera className="w-4 h-4" /> Feed Interno
            </TabsTrigger>
            <TabsTrigger
              value="public"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
            >
              <Globe className="w-4 h-4" /> Galeria Publica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            <GalleryFeedPanel />
          </TabsContent>

          <TabsContent value="public" className="mt-4">
            <GalleryPublicPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
