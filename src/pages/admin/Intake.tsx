import { AdminLayout } from "@/components/admin/AdminLayout";
import { IntakeTabContent } from "@/components/admin/IntakeTabContent";

export default function Intake() {
  return (
    <AdminLayout
      title="Captação"
      breadcrumbs={[{ label: "Captação" }]}
    >
      <IntakeTabContent />
    </AdminLayout>
  );
}
