
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

export const useBalanceUpdates = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { data: accounts, refetch: refetchAccounts } = useSupabaseData('accounts', user?.id);
  const { data: cards, refetch: refetchCards } = useSupabaseData('cards', user?.id);
  const { data: goals, refetch: refetchGoals } = useSupabaseData('goals', user?.id);
  const { update: updateAccount } = useSupabaseData('accounts', user?.id);
  const { update: updateCard } = useSupabaseData('cards', user?.id);
  const { update: updateGoal } = useSupabaseData('goals', user?.id);

  const updateAccountBalance = async (accountId: string, amount: number, type: 'income' | 'expense') => {
    try {
      const account = accounts.find(acc => acc.id === accountId);
      
      if (!account) {
        throw new Error('Conta não encontrada');
      }

      const currentBalance = Number(account.balance) || 0;
      const newBalance = type === 'income' 
        ? currentBalance + amount 
        : currentBalance - amount;

      const { error } = await updateAccount(accountId, { balance: newBalance });
      
      if (error) {
        throw new Error(error);
      }

      // Refetch accounts to update the local state
      await refetchAccounts();

      return { success: true, newBalance };
    } catch (error) {
      console.error('Erro ao atualizar saldo da conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o saldo da conta.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateCardUsedAmount = async (cardId: string, amount: number) => {
    try {
      const card = cards.find(c => c.id === cardId);
      
      if (!card) {
        throw new Error('Cartão não encontrado');
      }

      const currentUsed = Number(card.used_amount) || 0;
      const newUsedAmount = currentUsed + amount;

      if (newUsedAmount > Number(card.credit_limit)) {
        toast({
          title: "Atenção",
          description: "Esta transação excederá o limite do cartão.",
          variant: "destructive",
        });
      }

      const { error } = await updateCard(cardId, { used_amount: newUsedAmount });
      
      if (error) {
        throw new Error(error);
      }

      // Refetch cards to update the local state
      await refetchCards();

      return { success: true, newUsedAmount };
    } catch (error) {
      console.error('Erro ao atualizar limite do cartão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o limite do cartão.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const updateGoalProgress = async (goalId: string, amount: number) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal) {
        throw new Error('Meta não encontrada');
      }

      const currentAmount = Number(goal.current_amount) || 0;
      const newCurrentAmount = currentAmount + amount;

      const { error } = await updateGoal(goalId, { current_amount: newCurrentAmount });
      
      if (error) {
        throw new Error(error);
      }

      // Refetch goals to update the local state
      await refetchGoals();

      // Check if goal is completed
      if (newCurrentAmount >= Number(goal.target_amount)) {
        toast({
          title: "Parabéns! 🎉",
          description: `Você atingiu sua meta: ${goal.title}`,
        });
      }

      return { success: true, newCurrentAmount };
    } catch (error) {
      console.error('Erro ao atualizar progresso da meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o progresso da meta.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    updateAccountBalance,
    updateCardUsedAmount,
    updateGoalProgress,
  };
};
