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
  const { isSubscribed } = useSubscription();
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

  // Redirect to pricing if subscription is required but user is not subscribed
  if (requireSubscription && !isSubscribed) {
    return <Navigate to="/precos" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
