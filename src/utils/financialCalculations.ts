import { format } from "date-fns";

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  account_id?: string | null;
  description: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface FinancialPeriod {
  startDate: Date;
  endDate: Date;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  periodBalance: number;
  totalAccountBalance: number;
  transactionCount: number;
}

/**
 * Converte valor para número de forma segura
 */
export const safeToNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Filtra transações por período de forma robusta
 */
export const filterTransactionsByPeriod = (
  transactions: Transaction[], 
  period: FinancialPeriod
): Transaction[] => {
  if (!transactions || !Array.isArray(transactions)) return [];
  
  return transactions.filter(transaction => {
    try {
      const transactionDate = new Date(transaction.date);
      
      // Verifica se a data é válida
      if (isNaN(transactionDate.getTime())) {
        console.warn(`Data inválida na transação ${transaction.id}: ${transaction.date}`);
        return false;
      }
      
      // Normaliza as datas para comparação (remove horário)
      const normalizedTransactionDate = new Date(
        transactionDate.getFullYear(),
        transactionDate.getMonth(),
        transactionDate.getDate()
      );
      
      const normalizedStartDate = new Date(
        period.startDate.getFullYear(),
        period.startDate.getMonth(),
        period.startDate.getDate()
      );
      
      const normalizedEndDate = new Date(
        period.endDate.getFullYear(),
        period.endDate.getMonth(),
        period.endDate.getDate()
      );
      
      return normalizedTransactionDate >= normalizedStartDate && 
             normalizedTransactionDate <= normalizedEndDate;
    } catch (error) {
      console.error(`Erro ao filtrar transação ${transaction.id}:`, error);
      return false;
    }
  });
};

/**
 * Calcula resumo financeiro do período
 */
export const calculatePeriodSummary = (
  transactions: Transaction[],
  period: FinancialPeriod,
  accounts: Account[] = []
): FinancialSummary => {
  console.log(`Calculando resumo para período: ${format(period.startDate, 'dd/MM/yyyy')} - ${format(period.endDate, 'dd/MM/yyyy')}`);
  
  // Filtrar transações do período
  const periodTransactions = filterTransactionsByPeriod(transactions, period);
  console.log(`Transações encontradas no período: ${periodTransactions.length}`);
  
  // Calcular receitas e despesas
  const incomeTransactions = periodTransactions.filter(t => t.type === 'income');
  const expenseTransactions = periodTransactions.filter(t => t.type === 'expense');
  
  // Receitas: valores positivos
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(safeToNumber(t.amount)), 0);
  // Despesas: valores negativos (convertidos para positivo para exibição)
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(safeToNumber(t.amount)), 0);
  
  // Saldo do período = Receitas - Despesas
  const periodBalance = totalIncome - totalExpenses;
  
  // Calcular saldo total das contas
  const totalAccountBalance = accounts.reduce((sum, account) => {
    return sum + safeToNumber(account.balance);
  }, 0);
  
  console.log(`Resumo calculado:`, {
    totalIncome,
    totalExpenses,
    periodBalance,
    totalAccountBalance,
    transactionCount: periodTransactions.length
  });
  
  return {
    totalIncome,
    totalExpenses,
    periodBalance,
    totalAccountBalance,
    transactionCount: periodTransactions.length
  };
};

/**
 * Calcula saldo das contas baseado em transações (alternativa)
 */
export const calculateAccountBalanceFromTransactions = (
  accounts: Account[],
  allTransactions: Transaction[]
): number => {
  if (!accounts || !allTransactions) return 0;
  
  return accounts.reduce((totalSum, account) => {
    const initialBalance = safeToNumber(account.balance);
    
    // Buscar transações da conta
    const accountTransactions = allTransactions.filter(t => t.account_id === account.id);
    
    // Calcular impacto das transações
    const totalIncome = accountTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(safeToNumber(t.amount)), 0);
    
    const totalExpense = accountTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(safeToNumber(t.amount)), 0);
    
    // Saldo = Saldo Inicial + Receitas - Despesas
    const accountBalance = initialBalance + totalIncome - totalExpense;
    
    console.log(`Conta ${account.name}: ${initialBalance} + ${totalIncome} - ${totalExpense} = ${accountBalance}`);
    
    return totalSum + accountBalance;
  }, 0);
};

/**
 * Valida dados financeiros
 */
export const validateFinancialData = (
  transactions: Transaction[],
  accounts: Account[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validar transações
  if (!transactions || !Array.isArray(transactions)) {
    errors.push('Transações não são um array válido');
  } else {
    transactions.forEach((transaction, index) => {
      if (!transaction.id) errors.push(`Transação ${index} sem ID`);
      if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
        errors.push(`Transação ${transaction.id} com tipo inválido: ${transaction.type}`);
      }
      
      // Validar consistência entre tipo e valor
      const amount = safeToNumber(transaction.amount);
      if (transaction.type === 'income' && amount < 0) {
        errors.push(`Transação ${transaction.id} de receita com valor negativo: ${transaction.amount}`);
      }
      if (transaction.type === 'expense' && amount > 0) {
        errors.push(`Transação ${transaction.id} de despesa com valor positivo: ${transaction.amount}`);
      }
      if (amount === 0) {
        errors.push(`Transação ${transaction.id} com valor zero: ${transaction.amount}`);
      }
      
      if (!transaction.date) {
        errors.push(`Transação ${transaction.id} sem data`);
      }
    });
  }
  
  // Validar contas
  if (!accounts || !Array.isArray(accounts)) {
    errors.push('Contas não são um array válido');
  } else {
    accounts.forEach((account, index) => {
      if (!account.id) errors.push(`Conta ${index} sem ID`);
      if (!account.name) errors.push(`Conta ${account.id} sem nome`);
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
