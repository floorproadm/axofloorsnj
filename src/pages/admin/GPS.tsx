import { useState } from "react";
import { MapView } from "@/components/admin/schedule/MapView";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function GPS() {
  const [date] = useState(new Date());
  return (
    <AdminLayout title="Map View">
      <div className="p-3 h-full">
        <MapView date={date} />
      </div>
    </AdminLayout>
  );
}
