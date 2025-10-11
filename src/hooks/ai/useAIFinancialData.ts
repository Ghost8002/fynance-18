
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { UserFinancialData } from './types';
import { parseLocalDate } from '@/utils/dateValidation';

export const useAIFinancialData = () => {
  const { user } = useAuth();
  
  const { data: transactions } = useSupabaseData('transactions', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: goals } = useSupabaseData('goals', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);

  const prepareUserData = (): UserFinancialData => {
    console.log('Preparing user data...');
    console.log('Accounts:', accounts);
    console.log('Transactions:', transactions);
    console.log('Goals:', goals);

    // Calculate monthly income and expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = parseLocalDate(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    console.log('Monthly transactions:', monthlyTransactions);

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    // Calculate category breakdown using category names
    const categoryMap = new Map<string, number>();
    monthlyTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = categories.find(c => c.id === t.category_id);
        const categoryName = category ? category.name : 'Outros';
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + Number(t.amount));
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

    console.log('Calculated total balance:', totalBalance);

    // Prepare goals data
    const goalsData = goals.map(goal => ({
      title: goal.title,
      progress: Number(goal.current_amount) || 0,
      target: Number(goal.target_amount) || 0
    }));

    const userData = {
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      categories: categoriesData,
      goals: goalsData,
      totalBalance
    };

    console.log('Final user data:', userData);
    return userData;
  };

  return {
    prepareUserData,
    transactions,
    accounts,
    goals,
    categories
  };
};
