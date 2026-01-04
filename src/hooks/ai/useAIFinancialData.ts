import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { UserFinancialData } from './types';
import { parseLocalDate } from '@/utils/dateValidation';
import { devLog } from '@/utils/logger';

export const useAIFinancialData = () => {
  const { user } = useAuth();
  
  const { data: transactions } = useSupabaseData('transactions', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: goals } = useSupabaseData('goals', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);

  const prepareUserData = (): UserFinancialData & { 
    categories: Array<{ id: string; name: string; color: string; type: string }>;
    accounts: Array<{ id: string; name: string; balance: number; type: string }>;
  } => {
    devLog('Preparing user data...');

    // Calculate monthly income and expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = parseLocalDate(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    // Calculate category breakdown
    const categoryMap = new Map<string, number>();
    monthlyTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = categories.find(c => c.id === t.category_id);
        const categoryName = category ? category.name : 'Outros';
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + Math.abs(Number(t.amount)));
      });

    const categoriesData = Array.from(categoryMap.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0
    }));

    // Calculate total balance from accounts
    const totalBalance = accounts.reduce((sum, account) => {
      const balance = Number(account.balance) || 0;
      return sum + balance;
    }, 0);

    // Prepare goals data with IDs
    const goalsData = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      progress: Number(goal.current_amount) || 0,
      target: Number(goal.target_amount) || 0
    }));

    // Format categories with IDs for AI tool calls
    const formattedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      type: cat.type
    }));

    // Format accounts with IDs for AI tool calls
    const formattedAccounts = accounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      balance: Number(acc.balance) || 0,
      type: acc.type
    }));

    return {
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      categories: formattedCategories,
      accounts: formattedAccounts,
      goals: goalsData,
      totalBalance
    };
  };

  return {
    prepareUserData,
    transactions,
    accounts,
    goals,
    categories
  };
};
