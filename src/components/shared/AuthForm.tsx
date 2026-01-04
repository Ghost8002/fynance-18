import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Command, Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowLeft } from "lucide-react";
import { FynanceLogo } from './FynanceLogo';
import InstallPWAButton from './InstallPWAButton';

// Email validation schema for forgot password
const emailSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo')
});

// Validation schemas
const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Mínimo 6 caracteres')
});
const signupSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
  fullName: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo')
});
type FieldErrors = {
  email?: string;
  password?: string;
  fullName?: string;
};
const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const {
    signIn,
    signUp,
    resetPassword,
    signInWithGoogle
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const validateForm = (): boolean => {
    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin ? {
      email,
      password
    } : {
      email,
      password,
      fullName
    };
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors: FieldErrors = {};
      result.error.errors.forEach(err => {
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
      if (isLogin) {
        const {
          error
        } = await signIn(email.trim(), password);
        if (error) {
          throw error;
        }
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!"
        });
        setTimeout(() => {
          navigate("/dashboard", {
            replace: true
          });
        }, 100);
      } else {
        const {
          error
        } = await signUp(email.trim(), password, {
          full_name: fullName.trim()
        });
        if (error) {
          throw error;
        }
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso! Verifique seu email."
        });
      }
    } catch (error: any) {
      setError(error.message || 'Ocorreu um erro durante a autenticação');
      toast({
        title: "Erro",
        description: error.message || 'Ocorreu um erro durante a autenticação',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const clearForm = () => {
    setIsLogin(!isLogin);
    setError('');
    setFieldErrors({});
    setEmail('');
    setPassword('');
    setFullName('');
    setShowForgotPassword(false);
    setForgotPasswordSuccess(false);
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = emailSchema.safeParse({
      email
    });
    if (!result.success) {
      setFieldErrors({
        email: result.error.errors[0].message
      });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const {
        error
      } = await resetPassword(email.trim());
      if (error) {
        throw error;
      }
      setForgotPasswordSuccess(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.'
      });
    } catch (error: any) {
      // Generic message for security (don't reveal if email exists)
      setForgotPasswordSuccess(true);
      toast({
        title: 'Email enviado!',
        description: 'Se este email estiver cadastrado, você receberá um link para redefinir sua senha.'
      });
    } finally {
      setLoading(false);
    }
  };
  const backToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordSuccess(false);
    setError('');
    setFieldErrors({});
  };
  return <div className="min-h-screen h-screen flex overflow-hidden bg-background">
      {/* Botão Voltar */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      {/* Install PWA (mobile) */}
      <div className="absolute top-3 right-3 z-20 lg:hidden">
        <InstallPWAButton />
      </div>

      {/* Seção Esquerda - Formulário de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header com Logo Animado */}
          <div className="text-center mb-8 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative transform group-hover:scale-110 transition-transform duration-300">
                  <FynanceLogo size="lg" />
                </div>
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">
                Fynance
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Controle Inteligente
              </p>
            </div>

            <div className="pt-2">
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {showForgotPassword ? 'Recuperar senha' : isLogin ? 'Bem-vindo de volta!' : 'Comece sua jornada'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {showForgotPassword ? 'Digite seu email para receber o link de recuperação' : isLogin ? 'Entre para acessar sua conta' : 'Crie sua conta gratuitamente'}
              </p>
            </div>
          </div>

          {/* Card de Login Modernizado */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/80 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            
            {/* Card */}
            <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8 transition-all duration-300 hover:shadow-primary/10">
              
              {/* Forgot Password Form */}
              {showForgotPassword ? forgotPasswordSuccess ? <div className="space-y-6 text-center animate-fade-in">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Email enviado!</h3>
                      <p className="text-sm text-muted-foreground">
                        Se este email estiver cadastrado, você receberá um link para redefinir sua senha.
                      </p>
                    </div>
                    <Button type="button" onClick={backToLogin} className="w-full h-12 rounded-xl" variant="outline">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar ao login
                    </Button>
                  </div> : <form onSubmit={handleForgotPassword} className="space-y-5 animate-fade-in" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        Email
                      </Label>
                      <Input id="forgot-email" type="email" value={email} onChange={e => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({
                    ...prev,
                    email: undefined
                  }));
                }} placeholder="seu@email.com" maxLength={255} className={`h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl ${fieldErrors.email ? 'border-destructive' : ''}`} aria-invalid={!!fieldErrors.email} autoFocus />
                      {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
                    </div>

                    {error && <Alert variant="destructive" className="animate-fade-in border-destructive/50 bg-destructive/10">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>}

                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" disabled={loading}>
                      {loading ? <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                          <span>Enviando...</span>
                        </div> : 'Enviar link de recuperação'}
                    </Button>

                    <div className="text-center pt-4 border-t border-border/50">
                      <button type="button" onClick={backToLogin} className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4 inline mr-1" />
                        Voltar ao login
                      </button>
                    </div>
                  </form> : (/* Login/Signup Form */
            <div className="space-y-5">
                  {/* Google Login Button */}
                  <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-border/50 hover:bg-muted/50 transition-all duration-300" onClick={async () => {
                setGoogleLoading(true);
                await signInWithGoogle();
                setGoogleLoading(false);
              }} disabled={googleLoading || loading}>
                    {googleLoading ? <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>Conectando...</span>
                      </div> : <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar com Google
                      </>}
                  </Button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {!isLogin && <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Nome completo
                    </Label>
                    <Input id="fullName" type="text" value={fullName} onChange={e => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors(prev => ({
                      ...prev,
                      fullName: undefined
                    }));
                  }} placeholder="Seu nome completo" maxLength={100} className={`h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl ${fieldErrors.fullName ? 'border-destructive' : ''}`} aria-invalid={!!fieldErrors.fullName} />
                    {fieldErrors.fullName && <p className="text-xs text-destructive mt-1">{fieldErrors.fullName}</p>}
                  </div>}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email
                  </Label>
                  <Input id="email" type="email" value={email} onChange={e => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({
                      ...prev,
                      email: undefined
                    }));
                  }} placeholder="seu@email.com" maxLength={255} className={`h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl ${fieldErrors.email ? 'border-destructive' : ''}`} aria-invalid={!!fieldErrors.email} />
                  {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Senha
                  </Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({
                        ...prev,
                        password: undefined
                      }));
                    }} placeholder="••••••••" maxLength={72} className={`h-12 pr-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl ${fieldErrors.password ? 'border-destructive' : ''}`} aria-invalid={!!fieldErrors.password} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-primary/10">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="text-xs text-destructive mt-1">{fieldErrors.password}</p>}
                  {!isLogin && !fieldErrors.password && <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres</p>}
                  {isLogin && <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:underline mt-1">
                      Esqueceu sua senha?
                    </button>}
                </div>

                {error && <Alert variant="destructive" className="animate-fade-in border-destructive/50 bg-destructive/10">
                    <AlertDescription className="text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>}
                
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group" disabled={loading}>
                  {loading ? <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>{isLogin ? 'Entrando...' : 'Criando conta...'}</span>
                    </div> : <div className="flex items-center justify-center gap-2">
                      <span>{isLogin ? 'Entrar' : 'Criar conta'}</span>
                      
                    </div>}
                </Button>
              </form>
              </div>)}
              
              {!showForgotPassword && <div className="text-center mt-6 pt-6 border-t border-border/50">
                <button type="button" onClick={clearForm} className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium group">
                  {isLogin ? <span>Não tem uma conta? <span className="text-primary group-hover:underline">Criar conta</span></span> : <span>Já tem uma conta? <span className="text-primary group-hover:underline">Fazer login</span></span>}
                </button>
              </div>}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 opacity-60 hover:opacity-100 transition-opacity duration-300">
            <p className="text-xs text-muted-foreground">
              © 2025 Fynance. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Seção Direita - Painel Lateral Criativo */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background Gradient Animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        </div>

        {/* Elementos Decorativos Animados */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
        
        {/* Conteúdo */}
        <div className="relative w-full flex flex-col items-center justify-center p-12 text-white">
          {/* Ícone Grande Animado */}
          <div className="mb-8 relative group">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl group-hover:bg-white/30 transition-all duration-500"></div>
            <div className="relative rounded-3xl overflow-hidden transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <img src="/logo-light.svg" alt="Fynance" className="h-24 w-24 rounded-3xl" />
            </div>
          </div>

          {/* Texto Principal */}
          <div className="text-center space-y-6 max-w-md">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight animate-fade-in">
              Transforme sua vida financeira
            </h2>
            
            <p className="text-lg text-white/90 leading-relaxed animate-fade-in" style={{
            animationDelay: '0.1s'
          }}>
              Com inteligência artificial e ferramentas poderosas, o controle das suas finanças nunca foi tão simples.
            </p>

            {/* Features List */}
            <div className="space-y-4 text-left mt-8 animate-fade-in" style={{
            animationDelay: '0.2s'
          }}>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Assistente IA para insights financeiros</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Segurança e privacidade garantidas</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Command className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Interface intuitiva e moderna</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default AuthForm;