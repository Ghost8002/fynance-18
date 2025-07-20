import { useAuth } from '@/hooks/useAuth';

export const useCardPermissions = () => {
  const { user } = useAuth();

  const canManageCard = (cardUserId: string) => {
    return cardUserId === user?.id;
  };

  const canAdjustLimit = (cardUserId: string) => {
    return cardUserId === user?.id;
  };

  const canMakePayment = (cardUserId: string) => {
    return cardUserId === user?.id;
  };

  const canViewCard = (cardUserId: string) => {
    return cardUserId === user?.id;
  };

  return {
    canManageCard,
    canAdjustLimit,
    canMakePayment,
    canViewCard,
  };
}; 