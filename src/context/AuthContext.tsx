
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Avoid trusting a possibly-stale session from storage; we validate via getSession/getUser below.
      if (event === 'INITIAL_SESSION') return;

      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Create profile for OAuth users (Google, etc.) if it doesn't exist
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(async () => {
          const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          if (!existingProfile) {
            await supabase.from('user_profiles').insert({
              user_id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
              avatar_url: session.user.user_metadata?.avatar_url || null,
            });
          }
        }, 0);
      }
    });

    // THEN check for existing session and validate it against the API
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (!session?.access_token) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.getUser(session.access_token);

      if (error) {
        // Session exists in storage but is invalid/expired server-side
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setSession(session);
      setUser(session.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { error };
      }

      toast.success('Login realizado com sucesso!');
      return { error: null };
    } catch (error: any) {
      setIsLoading(false);
      return { error };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      // Create user profile if user was created successfully
      if (data.user) {
        try {
          await supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              full_name: name,
              avatar_url: null,
            });
        } catch (profileError) {
          console.warn('Failed to create user profile:', profileError);
          // Don't throw error here as user registration was successful
        }
      }

      toast.success('Cadastro realizado com sucesso! Verifique seu email.');
      
      // If email confirmation is disabled, redirect immediately
      if (data.user && !data.user.email_confirmed_at) {
        toast.info('Aguarde a confirmação do email ou verifique as configurações de autenticação.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          ...options,
        },
      });

      if (error) {
        setIsLoading(false);
        return { error };
      }

      toast.success('Cadastro realizado com sucesso! Verifique seu email.');
      return { error: null };
    } catch (error: any) {
      setIsLoading(false);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error('Erro ao fazer login com Google');
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      toast.error('Erro ao fazer login com Google');
      return { error };
    }
  };

  const logout = async () => {
    try {
      // Always clear local session even if the server session no longer exists
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.warn('Supabase signOut warning:', error);
      }

      setSession(null);
      setUser(null);

      toast.success('Logout realizado com sucesso!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout');
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        loading: isLoading,
        login,
        register,
        logout,
        isAuthenticated,
        signIn,
        signUp,
        resetPassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
