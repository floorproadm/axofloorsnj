import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";

export default function PlatformAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isPlatformAdmin, isLoading } = usePlatformAdmin();

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120] text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/auth" replace />;
  if (!isPlatformAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
