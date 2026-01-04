import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

type SubscriptionContextType = {
  isSubscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

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
