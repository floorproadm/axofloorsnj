import { AdminLayout } from "@/components/admin/AdminLayout";
import { GalleryPublicPanel } from "@/components/admin/gallery/GalleryPublicPanel";
import { ProjectPhotosPanel } from "@/components/admin/gallery/ProjectPhotosPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GalleryHub() {
  return (
    <AdminLayout title="Gallery" breadcrumbs={[{ label: "Gallery" }]}>
      <div className="max-w-6xl mx-auto space-y-4 animate-fade-in pb-12">
        <Tabs defaultValue="projects" className="w-full">
          <TabsList>
            <TabsTrigger value="projects">Fotos dos Projetos</TabsTrigger>
            <TabsTrigger value="public">Public Gallery</TabsTrigger>
          </TabsList>
          <TabsContent value="projects" className="pt-4">
            <ProjectPhotosPanel />
          </TabsContent>
          <TabsContent value="public" className="pt-4">
            <div className="max-w-3xl mx-auto">
              <GalleryPublicPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
