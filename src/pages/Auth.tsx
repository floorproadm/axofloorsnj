import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password strength validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const showPasswordHints = isSignUp && password.length > 0;

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

    // Validate password strength for signup
    if (isSignUp && !isPasswordValid) {
      setError('A senha não atende aos requisitos de segurança.');
      setLoading(false);
      return;
    }

    const { error } = isSignUp 
      ? await signUp(email, password, 'Admin')
      : await signIn(email, password);
    
    if (error) {
      setError(error.message);
      toast({
        title: isSignUp ? "Erro no cadastro" : "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } else {
      if (isSignUp) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Agora você pode fazer login.",
        });
        setIsSignUp(false);
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para a área administrativa...",
        });
        navigate('/admin');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
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

        <Card className="border-2 border-gold/20 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gold">AXO Floors</CardTitle>
            <CardDescription>
              {isSignUp ? "Criar conta administrativa" : "Acesse a área administrativa"}
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
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {showPasswordHints && (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-md text-sm">
                    <p className="font-medium text-muted-foreground">Requisitos da senha:</p>
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordRequirements.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Mínimo 8 caracteres</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordRequirements.hasUppercase ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordRequirements.hasUppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Pelo menos 1 letra maiúscula</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordRequirements.hasSymbol ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordRequirements.hasSymbol ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Pelo menos 1 símbolo (!@#$%^&* etc.)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gold hover:bg-gold/90" 
                disabled={loading || (isSignUp && !isPasswordValid)}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Criar Conta" : "Entrar"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isSignUp ? "Já tem conta? Fazer login" : "Criar conta administrativa"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}