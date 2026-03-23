import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import axoLogoOfficial from '@/assets/axo-logo-official.png';
import { AdminPWAHead } from '@/components/admin/AdminPWAHead';

export default function Auth() {
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

  // Check if user came from password reset email
  useEffect(() => {
    if (mode === 'reset') {
      setView('reset');
    }
  }, [mode]);

  // Detect PWA standalone mode and redirect to scoped auth
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) {
      navigate('/admin/auth', { replace: true });
    }
  }, [navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && view !== 'reset') {
      navigate('/admin');
    }
  }, [user, navigate, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await signIn(email, password);
      if (!result.error) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para a área administrativa...",
        });
        navigate('/admin');
      } else {
        setError(result.error.message);
        toast({
          title: "Erro no login",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
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
    } catch (error) {
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
          navigate('/auth');
        }, 2000);
      } else {
        setError(error.message);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setError("Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-gray-800 border-gray-600 text-white"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-800 border-gray-600 text-white pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gold hover:bg-gold/90" 
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Entrar
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setView('forgot')}
          className="text-sm text-gold hover:text-gold/80 underline"
        >
          Esqueci minha senha
        </button>
      </div>
    </form>
  );

  const renderForgotForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-gray-800 border-gray-600 text-white"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gold hover:bg-gold/90" 
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Enviar Email de Recuperação
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setView('login')}
          className="text-sm text-gray-400 hover:text-white underline"
        >
          Voltar ao login
        </button>
      </div>
    </form>
  );

  const renderResetForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-white">Nova Senha</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="bg-gray-800 border-gray-600 text-white pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-white">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="bg-gray-800 border-gray-600 text-white"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gold hover:bg-gold/90" 
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Atualizar Senha
      </Button>
    </form>
  );

  const getTitle = () => {
    switch (view) {
      case 'forgot': return 'Recuperar Senha';
      case 'reset': return 'Nova Senha';
      default: return 'Login Administrativo';
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
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>

        <Card className="border-2 border-gold/20 shadow-xl bg-black text-white">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={axoLogoOfficial} 
                alt="AXO Floors Logo" 
                className="h-16 w-auto"
              />
            </div>
            <CardTitle className="text-white">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-gray-300">
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

            {view === 'login' && renderLoginForm()}
            {view === 'forgot' && renderForgotForm()}
            {view === 'reset' && renderResetForm()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}