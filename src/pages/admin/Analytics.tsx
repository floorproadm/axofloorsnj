import { AdminLayout } from "@/components/admin/AdminLayout";
import { AnalyticsTab } from "@/components/admin/payments/AnalyticsTab";

export default function Analytics() {
  return (
    <AdminLayout title="Analytics">
      <AnalyticsTab />
    </AdminLayout>
  );
}
