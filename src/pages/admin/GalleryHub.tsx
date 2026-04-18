import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Camera, Images } from "lucide-react";

const CompanyFeed = lazy(() => import("./CompanyFeed"));
const GalleryManager = lazy(() => import("./GalleryManager"));

const Fallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

export default function GalleryHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Project context bypasses the tab shell — render Feed directly
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
      <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="feed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
              <Camera className="w-4 h-4" /> Feed
            </TabsTrigger>
            <TabsTrigger value="public" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
              <Images className="w-4 h-4" /> Public Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            <Suspense fallback={<Fallback />}>
              {/* CompanyFeed renders its own AdminLayout wrapper — render bare */}
              <CompanyFeedEmbed />
            </Suspense>
          </TabsContent>

          <TabsContent value="public" className="mt-4">
            <Suspense fallback={<Fallback />}>
              <GalleryManager embedded />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Wrap CompanyFeed without its outer AdminLayout to avoid double-wrap
function CompanyFeedEmbed() {
  return <CompanyFeed />;
}
