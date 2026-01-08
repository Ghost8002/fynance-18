import { useRealtimeData } from "@/context/RealtimeDataContext";

/**
 * Hook to calculate account balances dynamically from transactions.
 * The stored balance in the account is treated as the INITIAL balance.
 * Current balance = initial balance + incomes - expenses
 */
export const useAccountBalance = () => {
  const { data: accounts } = useRealtimeData('accounts');
  const { data: transactions } = useRealtimeData('transactions');

  const calculateAccountBalance = (accountId: string): number => {
    const account = accounts?.find(acc => acc.id === accountId);
    const initialBalance = Number(account?.balance) || 0;
    
    if (!transactions) return initialBalance;

    // Get all transactions for this account
    const accountTransactions = transactions.filter(t => t.account_id === accountId);

    // Calculate incomes and expenses
    const totalIncome = accountTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    
    const totalExpense = accountTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    return initialBalance + totalIncome - totalExpense;
  };

  const getAccountCurrentBalance = (accountId: string): number => {
    return calculateAccountBalance(accountId);
  };

  return {
    calculateAccountBalance,
    getAccountCurrentBalance,
    accounts,
    transactions,
  };
};
