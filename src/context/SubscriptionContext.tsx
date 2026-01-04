import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Duração do trial em milissegundos (1 dia)
const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000;

type SubscriptionContextType = {
  isSubscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
  // Trial
  isInTrial: boolean;
  trialEndsAt: Date | null;
  trialTimeRemaining: number; // em milissegundos
  isTrialExpired: boolean;
  checkSubscription: () => Promise<void>;
  openCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};

// Emails com acesso premium sem necessidade de assinatura
const WHITELISTED_EMAILS = [
  'salesdesouzamatheus@gmail.com'
];

export const SUBSCRIPTION_TIERS = {
  pro: {
    price_id: "price_1SjPFoA4lDqvdenye62OTC3B",
    product_id: "prod_TgmpRA1m2P5lqZ",
    name: "Pro",
    price: "R$ 5,00/mês"
  }
} as const;

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, session, isAuthenticated } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  // isLoading começa true para evitar flash para a tela de preços antes da verificação
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
  
  // Trial state
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState(0);

  // Calcula se está em trial baseado no created_at do usuário
  const isInTrial = !isSubscribed && trialEndsAt !== null && trialTimeRemaining > 0;
  const isTrialExpired = !isSubscribed && trialEndsAt !== null && trialTimeRemaining <= 0;

  // Atualiza o tempo restante do trial a cada segundo
  useEffect(() => {
    if (!user?.created_at || isSubscribed) {
      setTrialEndsAt(null);
      setTrialTimeRemaining(0);
      return;
    }

    const userCreatedAt = new Date(user.created_at);
    const trialEnd = new Date(userCreatedAt.getTime() + TRIAL_DURATION_MS);
    setTrialEndsAt(trialEnd);

    const updateRemaining = () => {
      const now = new Date();
      const remaining = Math.max(0, trialEnd.getTime() - now.getTime());
      setTrialTimeRemaining(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [user?.created_at, isSubscribed]);

  const checkSubscription = useCallback(async (showLoading = false) => {
    if (!session?.access_token) {
      setIsSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      return;
    }

    // Verifica se o email está na whitelist
    const userEmail = user?.email?.toLowerCase();
    if (userEmail && WHITELISTED_EMAILS.includes(userEmail)) {
      setIsSubscribed(true);
      setProductId(SUBSCRIPTION_TIERS.pro.product_id);
      setSubscriptionEnd(null);
      setHasCheckedOnce(true);
      setIsLoading(false);
      return;
    }

    // Only show loading on first check, not on navigation
    if (showLoading && !hasCheckedOnce) {
      setIsLoading(true);
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setIsSubscribed(data.subscribed || false);
      setProductId(data.product_id || null);
      setSubscriptionEnd(data.subscription_end || null);
      setHasCheckedOnce(true);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, user?.email, hasCheckedOnce]);

  const openCheckout = useCallback(async () => {
    if (!session?.access_token) {
      console.error('User must be authenticated to checkout');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error creating checkout:', error);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    }
  }, [session?.access_token]);

  const openCustomerPortal = useCallback(async () => {
    if (!session?.access_token) {
      console.error('User must be authenticated');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error opening portal:', error);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening portal:', error);
    }
  }, [session?.access_token]);

  // Check subscription on auth change - only when session token is available
  useEffect(() => {
    if (isAuthenticated && session?.access_token) {
      checkSubscription(true); // Show loading only on first check
    } else if (!isAuthenticated) {
      setIsSubscribed(false);
      setProductId(null);
      setSubscriptionEnd(null);
      setHasCheckedOnce(false);
      setIsLoading(false); // Não está autenticado, não precisa mostrar loading
    }
  }, [isAuthenticated, session?.access_token, checkSubscription]);

  // Auto-refresh subscription status every minute
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        productId,
        subscriptionEnd,
        isLoading,
        isInTrial,
        trialEndsAt,
        trialTimeRemaining,
        isTrialExpired,
        checkSubscription,
        openCheckout,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export { SubscriptionContext };
