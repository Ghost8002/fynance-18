import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import AppLayout from '@/components/shared/AppLayout';
import { ContentSkeleton } from '@/components/skeletons/ContentSkeleton';
import { prefetchCriticalRoutes } from '@/utils/routePrefetch';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute = ({ children, requireSubscription = true }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const { isSubscribed, isInTrial, isTrialExpired, isLoading: isSubscriptionLoading } = useSubscription();
  const location = useLocation();

  // Prefetch critical routes when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      prefetchCriticalRoutes();
    }
  }, [isAuthenticated]);

  // Show skeleton inside layout during auth check - keeps sidebar/navbar visible
  if (loading) {
    return (
      <AppLayout>
        <ContentSkeleton variant="dashboard" />
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Aguarda a verificação de assinatura antes de decidir o redirecionamento
  // Isso evita o flash para a tela de preços enquanto verifica o status
  if (requireSubscription && isSubscriptionLoading) {
    return (
      <AppLayout>
        <ContentSkeleton variant="dashboard" />
      </AppLayout>
    );
  }

  // Permite acesso se: está assinado, está em trial, ou não requer assinatura
  const hasAccess = isSubscribed || isInTrial || !requireSubscription;

  // Redireciona para pricing se o trial expirou e não está assinado
  if (requireSubscription && isTrialExpired && !isSubscribed) {
    return <Navigate to="/precos" state={{ from: location }} replace />;
  }

  if (requireSubscription && !hasAccess) {
    return <Navigate to="/precos" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
