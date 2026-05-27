import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const userId = user?.id;

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      setIsAdmin(null);
      setCheckingRole(false);
      return;
    }

    if (!requireAdmin) {
      setIsAdmin(true);
      setCheckingRole(false);
      return;
    }

    let cancelled = false;
    // Re-validate silently on token refresh — never flip back to the spinner
    // once we have a known admin state, otherwise the admin tree unmounts/
    // remounts on every onAuthStateChange and the page flickers.
    supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }).then(({ data, error }) => {
      if (cancelled) return;
      setIsAdmin(error ? false : data === true);
      setCheckingRole(false);
    });
    return () => { cancelled = true; };
  }, [userId, loading, requireAdmin]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    const authPath = requireAdmin ? "/admin/auth" : "/auth";
    return <Navigate to={authPath} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/auth" replace />;
  }

  return <>{children}</>;
}
