import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { FynanceLogo } from '@/components/shared/FynanceLogo';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .max(72, 'Máximo 72 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FieldErrors = {
  password?: string;
  confirmPassword?: string;
};

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const validateForm = (): boolean => {
    const result = passwordSchema.safeParse({ password, confirmPassword });
    
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FieldErrors;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return false;
    }
    
    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setSuccess(true);
      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi alterada com sucesso.',
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Erro ao redefinir senha. Tente novamente.');
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao redefinir senha.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-finance-green/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-finance-green" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Senha alterada!</h1>
          <p className="text-muted-foreground">
            Sua senha foi redefinida com sucesso. Você será redirecionado para o dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
              <div className="relative transform group-hover:scale-110 transition-transform duration-300">
                <FynanceLogo size="lg" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground">Redefinir Senha</h1>
          <p className="text-sm text-muted-foreground">
            Digite sua nova senha abaixo
          </p>
        </div>

        {/* Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/80 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
          
          <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8">
            {!isValidSession ? (
              <div className="space-y-6">
                <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-12 rounded-xl"
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      placeholder="••••••••"
                      maxLength={72}
                      className={`h-12 pr-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl ${fieldErrors.password ? 'border-destructive' : ''}`}
                      aria-invalid={!!fieldErrors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>
                  )}
                  {!fieldErrors.password && (
                    <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }}
                      placeholder="••••••••"
                      maxLength={72}
                      className={`h-12 pr-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl ${fieldErrors.confirmPassword ? 'border-destructive' : ''}`}
                      aria-invalid={!!fieldErrors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="animate-fade-in border-destructive/50 bg-destructive/10">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>Redefinindo...</span>
                    </div>
                  ) : (
                    'Redefinir senha'
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 inline mr-1" />
                    Voltar ao login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 opacity-60">
          <p className="text-xs text-muted-foreground">
            © 2025 Fynance. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
