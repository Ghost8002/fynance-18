
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { devLog } from '@/utils/logger';
import { FynanceLogo } from '@/components/shared/FynanceLogo';

const Auth = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    devLog('Auth page - Auth state:', { isAuthenticated, loading });
    if (!loading && isAuthenticated) {
      devLog('User authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Should redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <FynanceLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2">Fynance</h1>
          <p className="text-muted-foreground">Gerencie suas finanças de forma inteligente</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;
