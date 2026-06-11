import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminPWAHead } from '@/components/admin/AdminPWAHead';
import floorproLogo from '@/assets/floorpro-logo.png.asset.json';

const hasAdminAccess = async (userId: string) => {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: 'admin',
  });

  return !error && data === true;
};

const hasOrgMembership = async (userId: string) => {
  const { data } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return !!data?.organization_id;
};

export default function AdminAuth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');

  const { signIn, user, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (mode === 'reset') {
      setView('reset');
    }
  }, [mode]);

  useEffect(() => {
    if (!user?.id || view === 'reset' || !window.location.pathname.startsWith('/admin/auth')) return;

    let cancelled = false;

    (async () => {
      const hasOrg = await hasOrgMembership(user.id);
      if (cancelled) return;
      if (!hasOrg) {
        navigate('/onboarding', { replace: true });
        return;
      }
      const isAdmin = await hasAdminAccess(user.id);
      if (!cancelled && isAdmin) {
        navigate('/admin', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, navigate, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await signIn(email, password);
      if (!result.error) {
        const { data: { user: signedInUser } } = await supabase.auth.getUser();
        const uid = signedInUser?.id;

        // New tenant path: no org membership → onboarding wizard
        const hasOrg = uid ? await hasOrgMembership(uid) : false;
        if (!hasOrg) {
          toast({ title: 'Welcome to FloorPRO', description: 'Let\'s set up your company.' });
          navigate('/onboarding', { replace: true });
          return;
        }

        const isAdmin = uid ? await hasAdminAccess(uid) : false;
        if (!isAdmin) {
          const message = 'Esta conta não tem acesso administrativo.';
          await supabase.auth.signOut();
          setError(message);
          toast({
            title: "Acesso negado",
            description: message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para a área administrativa...",
        });
        navigate('/admin', { replace: true });
      } else {
        setError(result.error.message);
        toast({
          title: "Erro no login",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch {
      setError("Erro interno do sistema");
      toast({
        title: "Erro",
        description: "Algo deu errado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await resetPassword(email);
      if (!result.error) {
        setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
      } else {
        setError(result.error.message);
        toast({
          title: "Erro",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch {
      setError("Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (!error) {
        setSuccess('Senha atualizada com sucesso!');
        toast({
          title: "Senha atualizada!",
          description: "Você pode fazer login com sua nova senha.",
        });
        setTimeout(() => {
          setView('login');
          navigate('/admin/auth');
        }, 2000);
      } else {
        setError(error.message);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch {
      setError("Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'forgot': return 'Recuperar Senha';
      case 'reset': return 'Nova Senha';
      default: return 'FloorPRO';
    }
  };

  const getDescription = () => {
    switch (view) {
      case 'forgot': return 'Digite seu email para receber o link de recuperação';
      case 'reset': return 'Digite sua nova senha';
      default: return 'Acesse a área administrativa';
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <AdminPWAHead />
      <div className="w-full max-w-md">
        <Card className="border-2 border-[#bbdefb] shadow-xl bg-white text-foreground">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 bg-white rounded-lg p-4">
              <img src={floorproLogo.url} alt="FloorPro" className="h-20 w-auto object-contain" />
            </div>
            {view !== 'login' && (
              <CardTitle className="text-foreground">
                {getTitle()}
              </CardTitle>
            )}
            <CardDescription className="text-muted-foreground">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-900/50 border-green-500 text-green-100">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {view === 'login' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white border-input text-foreground pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#2563eb] hover:bg-[#1d4fd1] text-white"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Entrar
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-sm text-[#2563eb] hover:text-[#1d4fd1] underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>
            )}

            {view === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border-input text-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#2563eb] hover:bg-[#1d4fd1] text-white"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Email de Recuperação
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Voltar ao login
                  </button>
                </div>
              </form>
            )}

            {view === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-white border-input text-foreground pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-white border-input text-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#2563eb] hover:bg-[#1d4fd1] text-white"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Atualizar Senha
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
