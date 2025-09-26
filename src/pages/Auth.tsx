import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { validatePasswordStrength } from '@/utils/validation';
import axoLogoOfficial from '@/assets/axo-logo-official.png';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validação de senha em tempo real - CORREÇÃO DE SEGURANÇA CRÍTICA
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (isSignUp && value) {
      const validation = validatePasswordStrength(value);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validação adicional de segurança para cadastro
    if (isSignUp) {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        setError('A senha não atende aos requisitos de segurança');
        toast({
          title: "Senha inválida",
          description: passwordValidation.errors.join(', '),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, fullName);
        if (!result.error) {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta.",
          });
        }
      } else {
        result = await signIn(email, password);
        if (!result.error) {
          toast({
            title: "Login realizado com sucesso!",
            description: "Redirecionando para a área administrativa...",
          });
          navigate('/admin');
        }
      }
      
      if (result.error) {
        setError(result.error.message);
        toast({
          title: isSignUp ? "Erro no cadastro" : "Erro no login",
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
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
              {isSignUp ? 'Criar Conta' : 'Login'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isSignUp ? 'Crie uma nova conta administrativa' : 'Acesse a área administrativa'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isSignUp}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              )}
              
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
                    onChange={(e) => handlePasswordChange(e.target.value)}
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
                {isSignUp && passwordErrors.length > 0 && (
                  <div className="text-sm text-red-400 space-y-1">
                    <div className="font-medium">A senha deve conter:</div>
                    {passwordErrors.map((error, index) => (
                      <div key={index} className="text-xs">• {error}</div>
                    ))}
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gold hover:bg-gold/90" 
                disabled={loading || (isSignUp && passwordErrors.length > 0)}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setPasswordErrors([]);
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {isSignUp ? 'Já tem uma conta? Faça login' : 'Precisa criar uma conta? Cadastre-se'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}