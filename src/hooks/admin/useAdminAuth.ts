import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AdminAuthState {
  isLoading: boolean;
  isAdmin: boolean;
  userProfile: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
  error: string | null;
}

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<AdminAuthState>({
    isLoading: true,
    isAdmin: false,
    userProfile: null,
    error: null
  });

  useEffect(() => {
    checkAdminAccess();
  }, [user, authLoading]);

  const checkAdminAccess = async () => {
    // Se ainda está carregando auth, aguarda
    if (authLoading) {
      return;
    }

    // Se não há usuário, redireciona para login
    if (!user) {
      setState({
        isLoading: false,
        isAdmin: false,
        userProfile: null,
        error: 'Usuário não autenticado'
      });
      navigate('/auth');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check admin role using the secure has_role function via RPC
      const { data: hasAdminRole, error: roleError } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (roleError) {
        throw new Error(`Erro ao verificar role: ${roleError.message}`);
      }

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdmin = hasAdminRole === true;

      // Se não é admin, redireciona para home
      if (!isAdmin) {
        setState({
          isLoading: false,
          isAdmin: false,
          userProfile: profile ? {
            id: profile.id,
            email: profile.email || user.email || '',
            full_name: profile.full_name || undefined
          } : null,
          error: 'Acesso negado: Permissões de administrador necessárias'
        });
        navigate('/');
        return;
      }

      // Usuário é admin válido
      setState({
        isLoading: false,
        isAdmin: true,
        userProfile: profile ? {
          id: profile.id,
          email: profile.email || user.email || '',
          full_name: profile.full_name || undefined
        } : {
          id: user.id,
          email: user.email || ''
        },
        error: null
      });

    } catch (error) {
      console.error('Erro na verificação de admin:', error);
      setState({
        isLoading: false,
        isAdmin: false,
        userProfile: null,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      // Em caso de erro, redireciona para home por segurança
      navigate('/');
    }
  };

  const refreshAuth = () => {
    checkAdminAccess();
  };

  return {
    ...state,
    refreshAuth,
    // Helpers
    canAccessAdmin: state.isAdmin && !state.isLoading,
    shouldShowLoading: state.isLoading || authLoading
  };
}
