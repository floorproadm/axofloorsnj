import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { DashboardStats } from "./components/DashboardStats";
import { ConversionChart } from "./components/ConversionChart";
import { ServicesChart } from "./components/ServicesChart";
import { RevenueProjection } from "./components/RevenueProjection";
import { LeadAlerts } from "./components/LeadAlerts";

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
      <div className="space-y-4 md:space-y-6 px-2 md:px-0">
        {/* Métricas Principais */}
        <DashboardStats />
        
        {/* Alertas Urgentes */}
        <LeadAlerts />
        
        {/* Charts Row 1 - Stack on mobile */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <ConversionChart />
          <ServicesChart />
        </div>
        
        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          <RevenueProjection />
        </div>
      </div>
    </AdminLayout>
  );
}