import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { DashboardStats } from "./components/DashboardStats";
import { ConversionChart } from "./components/ConversionChart";
import { ServicesChart } from "./components/ServicesChart";

export default function Dashboard() {
  const { shouldShowLoading, canAccessAdmin } = useAdminAuth();

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null; // useAdminAuth já redirecionou
  }

  return (
    <AdminLayout 
      title="Dashboard" 
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="space-y-4 max-w-full overflow-hidden">
        {/* Métricas Principais */}
        <DashboardStats />
        
        {/* Charts - Stack completely on mobile, side by side on xl+ */}
        <div className="flex flex-col xl:grid xl:grid-cols-2 gap-4">
          <ConversionChart />
          <ServicesChart />
        </div>
      </div>
    </AdminLayout>
  );
}