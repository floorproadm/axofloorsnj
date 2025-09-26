import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/admin/useAdminAuth";
import { DashboardStats } from "./components/DashboardStats";

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
      <div className="space-y-6">
        <DashboardStats />
        
        {/* Placeholder para gráficos futuros */}
        <div className="text-center py-10 border-2 border-dashed border-muted-foreground/20 rounded-lg">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Gráficos e Relatórios
          </h3>
          <p className="text-sm text-muted-foreground">
            Em breve: gráficos de conversão, tendências e alertas em tempo real.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}