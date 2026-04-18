import { AdminLayout } from "@/components/admin/AdminLayout";
import { GalleryPublicPanel } from "@/components/admin/gallery/GalleryPublicPanel";

/**
 * Gallery Hub — focused on Public Gallery management.
 *
 * NOTE: The "Internal Feed" tab was archived on 2026-04-18.
 * The GalleryFeedPanel component and feed_* tables remain intact for
 * future re-enablement (e.g. service photo timeline, project storytelling).
 * To restore: re-add Tabs wrapper and import GalleryFeedPanel.
 */
export default function GalleryHub() {
  return (
    <AdminLayout title="Gallery" breadcrumbs={[{ label: "Gallery" }]}>
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
        <GalleryPublicPanel />
      </div>
    </AdminLayout>
  );
}
