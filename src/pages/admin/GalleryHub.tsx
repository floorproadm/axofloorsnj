import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Globe } from "lucide-react";
import { GalleryFeedPanel } from "@/components/admin/gallery/GalleryFeedPanel";
import { GalleryPublicPanel } from "@/components/admin/gallery/GalleryPublicPanel";

export default function GalleryHub() {
  const [searchParams, setSearchParams] = useSearchParams();

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
