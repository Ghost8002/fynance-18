
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Command, Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('Attempting login...');
        const { error } = await signIn(email, password);
        if (error) {
          console.error('Login error:', error);
          throw error;
        }
        
        console.log('Login successful, showing toast...');
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!",
        });

        // Force navigation after successful login
        setTimeout(() => {
          console.log('Forcing navigation to dashboard...');
          navigate("/dashboard", { replace: true });
        }, 100);
        
      } else {
        console.log('Attempting signup...');
        const { error } = await signUp(email, password, { full_name: fullName });
        if (error) {
          console.error('Signup error:', error);
          throw error;
        }
        
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso! Verifique seu email.",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Ocorreu um erro durante a autenticação');
      toast({
        title: "Erro",
        description: error.message || 'Ocorreu um erro durante a autenticação',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/3 rounded-full blur-3xl"></div>
      </div>

      {/* Seção Esquerda - Formulário de Login */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Header com Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white mb-4 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Bem-vindo ao Fynance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isLogin ? 'Entre com suas credenciais' : 'Crie sua conta gratuitamente'}
            </p>
          </div>

          {/* Card de Login com Glassmorphism Aprimorado */}
          <div className="relative group">
            {/* Background com Glassmorphism Aprimorado */}
            <div className="absolute inset-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl"></div>
            
            {/* Efeito de borda sutil */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-3xl"></div>
            
            {/* Conteúdo */}
            <div className="relative p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {isLogin ? 'Entrar na conta' : 'Criar nova conta'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {isLogin ? 'Digite suas credenciais para acessar' : 'Preencha os dados para começar'}
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nome completo
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Seu nome completo"
                        className="pl-10 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl h-12 shadow-sm hover:shadow-md transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      className="pl-10 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl h-12 shadow-sm hover:shadow-md transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Sua senha"
                      minLength={6}
                      className="pl-10 pr-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl h-12 shadow-sm hover:shadow-md transition-all duration-300 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                      <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 h-12 group" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isLogin ? 'Entrando...' : 'Criando conta...'}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>{isLogin ? 'Entrar na conta' : 'Criar conta'}</span>
                      <div className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">
                        →
                      </div>
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setEmail('');
                    setPassword('');
                    setFullName('');
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors font-medium hover:underline"
                >
                  {isLogin 
                    ? 'Não tem uma conta? Criar conta' 
                    : 'Já tem uma conta? Fazer login'
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 Fynance. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Seção Direita - Área Azul com Glassmorphism Harmonizado */}
      <div className="hidden lg:flex w-2/5 relative overflow-hidden">
        {/* Background com Glassmorphism Harmonizado */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-2xl border border-primary/30 shadow-2xl"></div>
        
        {/* Efeito de borda sutil harmonizado */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"></div>
        
        {/* Conteúdo */}
        <div className="relative w-full flex items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="text-gray-900 dark:text-gray-100 text-3xl lg:text-4xl font-bold leading-tight space-y-2 drop-shadow-lg">
              <div>A mudança</div>
              <div>financeira</div>
              <div>que você</div>
              <div>busca está a</div>
              <div>alguns</div>
              <div>cliques de</div>
              <div>distância.</div>
            </div>
            
            <div className="mt-8 flex items-center justify-center">
              <div className="w-14 h-14 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-4 shadow-lg border border-primary/30">
                <Command className="w-7 h-7 text-primary dark:text-white" />
              </div>
              <div className="text-left">
                <p className="text-gray-900 dark:text-gray-100 text-lg font-bold">Fynance</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Controle financeiro inteligente</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Versão Mobile - Área Azul com Glassmorphism Harmonizado */}
      <div className="lg:hidden w-full relative overflow-hidden">
        {/* Background com Glassmorphism Harmonizado */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-2xl border border-primary/30 shadow-xl"></div>
        
        {/* Efeito de borda sutil harmonizado */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"></div>
        
        {/* Conteúdo */}
        <div className="relative p-8 text-center">
          <div className="text-gray-900 dark:text-gray-100 text-2xl font-bold leading-tight space-y-2 mb-6 drop-shadow-lg">
            <div>A mudança financeira</div>
            <div>que você busca está a</div>
            <div>alguns cliques de distância.</div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-primary/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-3 shadow-lg border border-primary/30">
              <Command className="w-6 h-6 text-primary dark:text-white" />
            </div>
            <div className="text-left">
              <p className="text-gray-900 dark:text-gray-100 text-base font-bold">Fynance</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs">Controle financeiro inteligente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
