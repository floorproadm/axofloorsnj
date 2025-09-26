import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';

const Admin = () => {
  const navigate = useNavigate();
  const { shouldShowLoading, canAccessAdmin } = useAdminAuth();

  useEffect(() => {
    // Redireciona para o novo dashboard quando acessar /admin
    if (canAccessAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [canAccessAdmin, navigate]);

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecionando para o painel administrativo...</p>
        </div>
      </div>
    );
  }

  // Se não pode acessar admin, useAdminAuth já redirecionou
  return null;
};

export default Admin;