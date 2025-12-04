import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Command, Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react";

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const {
    signIn,
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin 
      ? { email, password } 
      : { email, password, fullName };
    
    const result = schema.safeParse(data);
    
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
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          throw error;
        }
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!"
        });

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 100);
      } else {
        const { error } = await signUp(email.trim(), password, {
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
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
      {/* Background Decorativo Animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Seção Esquerda - Formulário de Login */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Header com Logo Animado */}
          <div className="text-center mb-8 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-9 w-9"
                  >
                    <path d="M12 1v22" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
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
                {isLogin ? 'Bem-vindo de volta!' : 'Comece sua jornada'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLogin ? 'Entre para acessar sua conta' : 'Crie sua conta gratuitamente'}
              </p>
            </div>
          </div>

          {/* Card de Login Modernizado */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/80 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            
            {/* Card */}
            <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8 transition-all duration-300 hover:shadow-primary/10">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {!isLogin && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Nome completo
                    </Label>
                    <Input 
                      id="fullName" 
                      type="text" 
                      value={fullName} 
                      onChange={e => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: undefined }));
                      }}
                      placeholder="Seu nome completo" 
                      maxLength={100}
                      className={`h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl ${fieldErrors.fullName ? 'border-destructive' : ''}`}
                      aria-invalid={!!fieldErrors.fullName}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-destructive mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={e => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="seu@email.com" 
                    maxLength={255}
                    className={`h-12 bg-background/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 rounded-xl ${fieldErrors.email ? 'border-destructive' : ''}`}
                    aria-invalid={!!fieldErrors.email}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Senha
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={e => {
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
                  {!isLogin && !fieldErrors.password && (
                    <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres</p>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="animate-fade-in border-destructive/50 bg-destructive/10">
                    <AlertDescription className="text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>{isLogin ? 'Entrando...' : 'Criando conta...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{isLogin ? 'Entrar' : 'Criar conta'}</span>
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="text-center mt-6 pt-6 border-t border-border/50">
                <button 
                  type="button" 
                  onClick={clearForm} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium group"
                >
                  {isLogin ? (
                    <span>Não tem uma conta? <span className="text-primary group-hover:underline">Criar conta</span></span>
                  ) : (
                    <span>Já tem uma conta? <span className="text-primary group-hover:underline">Fazer login</span></span>
                  )}
                </button>
              </div>
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
      <div className="hidden lg:flex w-2/5 relative overflow-hidden">
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
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        
        {/* Conteúdo */}
        <div className="relative w-full flex flex-col items-center justify-center p-12 text-white">
          {/* Ícone Grande Animado */}
          <div className="mb-8 relative group">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl group-hover:bg-white/30 transition-all duration-500"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-14 w-14"
              >
                <path d="M12 1v22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>

          {/* Texto Principal */}
          <div className="text-center space-y-6 max-w-md">
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight animate-fade-in">
              Transforme sua vida financeira
            </h2>
            
            <p className="text-lg text-white/90 leading-relaxed animate-fade-in" style={{animationDelay: '0.1s'}}>
              Com inteligência artificial e ferramentas poderosas, o controle das suas finanças nunca foi tão simples.
            </p>

            {/* Features List */}
            <div className="space-y-4 text-left mt-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
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
    </div>
  );
};

export default AuthForm;
