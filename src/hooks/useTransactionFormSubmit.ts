import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import { useTags } from "@/hooks/useTags";

interface FormData {
  type: string;
  description: string;
  amount: string;
  category_id: string;
  account_id: string;
  card_id: string;
  date: string;
  notes: string;
}

export const useTransactionFormSubmit = (
  defaultGoalId?: string,
  onTransactionAdded?: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { insert, refetch } = useSupabaseData('transactions', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: cards } = useSupabaseData('cards', user?.id);
  const { updateAccountBalance, updateCardUsedAmount, updateGoalProgress } = useBalanceUpdates();
  const { tags } = useTags();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    formData: FormData,
    selectedTags: string[],
    tagsEnabled: boolean
  ) => {
    console.log('Starting transaction submission...');
    console.log('Form data:', formData);
    console.log('Selected tags:', selectedTags);
    console.log('User ID:', user?.id);
    
    if (!user?.id) {
      console.error('No user ID available');
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.description || !formData.amount || !formData.category_id) {
      console.log('Missing required fields:', { 
        description: formData.description, 
        amount: formData.amount, 
        category_id: formData.category_id 
      });
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.account_id && !formData.card_id) {
      console.log('No payment method selected');
      toast({
        title: "Erro",
        description: "Selecione uma conta ou cartão",
        variant: "destructive",
      });
      return false;
    }

    const amount = parseFloat(formData.amount);

    // Check balance for expenses
    if (formData.type === 'expense') {
      if (formData.account_id) {
        const account = accounts?.find(acc => acc.id === formData.account_id);
        if (account) {
          const currentBalance = parseFloat(account.balance);
          if (amount > currentBalance) {
            console.log('Insufficient account balance:', { balance: currentBalance, amount });
            toast({
              title: "Saldo Insuficiente",
              description: `Saldo atual: R$ ${currentBalance.toFixed(2)}. Valor da transação: R$ ${amount.toFixed(2)}`,
              variant: "destructive",
            });
            return false;
          }
        }
      }

      if (formData.card_id) {
        const card = cards?.find(c => c.id === formData.card_id);
        if (card) {
          const creditLimit = parseFloat(card.credit_limit);
          const usedAmount = parseFloat(card.used_amount);
          const availableLimit = creditLimit - usedAmount;
          
          if (amount > availableLimit) {
            console.log('Insufficient card limit:', { availableLimit, amount });
            toast({
              title: "Limite Insuficiente",
              description: `Limite disponível: R$ ${availableLimit.toFixed(2)}. Valor da transação: R$ ${amount.toFixed(2)}`,
              variant: "destructive",
            });
            return false;
          }
        }
      }
    }

    try {
      setLoading(true);
      
      // Prepare tags data - store directly in the tags column as JSONB
      const transactionTags = tagsEnabled && selectedTags.length > 0 
        ? selectedTags
            .map(tagId => tags?.find(tag => tag.id === tagId))
            .filter(tag => tag)
            .map(tag => ({
              id: tag!.id,
              name: tag!.name,
              color: tag!.color
            }))
        : [];

      const transactionData = {
        user_id: user.id,
        type: formData.type as 'income' | 'expense',
        description: formData.description,
        amount: amount,
        category_id: formData.category_id || null,
        account_id: formData.account_id || null,
        card_id: formData.card_id || null,
        date: formData.date,
        notes: formData.notes || null,
        tags: transactionTags, // Store tags directly in the JSONB column
      };

      console.log('Creating transaction with data:', transactionData);
      const { data: transactionResult, error } = await insert(transactionData);

      if (error) {
        console.error('Transaction creation error:', error);
        throw new Error(error);
      }

      if (!transactionResult || !Array.isArray(transactionResult) || transactionResult.length === 0) {
        console.error('No transaction data returned');
        throw new Error('Failed to create transaction - no data returned');
      }

      const createdTransaction = transactionResult[0];
      console.log('Transaction created successfully:', createdTransaction);

      // Update balances and limits
      console.log('Updating balances for amount:', amount);
      
      if (formData.account_id) {
        console.log('Updating account balance for account:', formData.account_id);
        await updateAccountBalance(formData.account_id, amount, formData.type as 'income' | 'expense');
      }
      
      if (formData.card_id && formData.type === 'expense') {
        console.log('Updating card used amount for card:', formData.card_id);
        await updateCardUsedAmount(formData.card_id, amount);
      }

      // Update goal progress if this is for a goal
      if (defaultGoalId && formData.type === 'income') {
        console.log('Updating goal progress for goal:', defaultGoalId);
        await updateGoalProgress(defaultGoalId, amount);
      }

      // Force refetch of transactions
      console.log('Refreshing transaction data...');
      await refetch();

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('transactionWithTagsAdded', {
        detail: { transaction: createdTransaction }
      }));

      // Call the parent callback if provided
      if (onTransactionAdded) {
        console.log('Calling onTransactionAdded callback');
        onTransactionAdded();
      }

      toast({
        title: "Sucesso",
        description: `${formData.type === "expense" ? "Despesa" : "Receita"} adicionada com sucesso!`,
      });

      console.log('Transaction submission completed successfully');
      return true;
      
    } catch (error) {
      console.error('Error during transaction submission:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a transação. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading };
};
