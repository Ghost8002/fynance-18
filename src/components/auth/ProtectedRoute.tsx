import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import loadingGraph from '@/assets/loading-graph.gif';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute = ({ children, requireSubscription = true }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const { isSubscribed } = useSubscription();
  const location = useLocation();

  // Only show loader for initial auth check, not for subscription
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={loadingGraph} alt="Carregando" className="h-16 w-16" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
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
