
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  account?: string;
  card?: string;
}

export interface Card {
  id: string;
  name: string;
  type: string;
  number: string;
  expiryDate: string;
  limit: number;
  used: number;
  color: string;
  closingDay: number;
  dueDay: number;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  bank: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
}

interface FinancialContextType {
  // Data
  transactions: Transaction[];
  cards: Card[];
  accounts: Account[];
  budgets: Budget[];
  goals: Goal[];
  
  // Actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  addCard: (card: Omit<Card, 'id' | 'used'>) => void;
  updateCard: (id: string, card: Partial<Card>) => void;
  deleteCard: (id: string) => void;
  
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Initial mock data
const initialTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    amount: 5000,
    description: 'Salário',
    category: 'Salário',
    date: new Date(2025, 5, 5),
  },
  {
    id: '2',
    type: 'expense',
    amount: 1200,
    description: 'Aluguel',
    category: 'Moradia',
    date: new Date(2025, 5, 1),
  },
  {
    id: '3',
    type: 'expense',
    amount: 350,
    description: 'Supermercado',
    category: 'Alimentação',
    date: new Date(2025, 5, 3),
  },
];

const initialCards: Card[] = [
  {
    id: "1",
    name: "Nubank",
    type: "Visa",
    number: "**** **** **** 4587",
    expiryDate: "12/26",
    limit: 5000,
    used: 1850,
    color: "bg-purple-600",
    closingDay: 15,
    dueDay: 22,
  },
  {
    id: "2",
    name: "Itaú",
    type: "Mastercard",
    number: "**** **** **** 7521",
    expiryDate: "08/27",
    limit: 8000,
    used: 3200,
    color: "bg-orange-600",
    closingDay: 10,
    dueDay: 17,
  },
];

const initialAccounts: Account[] = [
  {
    id: '1',
    name: 'Conta Corrente',
    type: 'Corrente',
    balance: 2500,
    bank: 'Nubank',
  },
  {
    id: '2',
    name: 'Poupança',
    type: 'Poupança',
    balance: 8500,
    bank: 'Itaú',
  },
];

const initialBudgets: Budget[] = [
  {
    id: '1',
    category: 'Alimentação',
    limit: 800,
    spent: 350,
    period: 'monthly',
  },
  {
    id: '2',
    category: 'Transporte',
    limit: 400,
    spent: 180,
    period: 'monthly',
  },
];

const initialGoals: Goal[] = [
  {
    id: '1',
    title: 'Reserva de Emergência',
    targetAmount: 30000,
    currentAmount: 15000,
    deadline: new Date(2025, 11, 31),
    category: 'Emergência',
  },
  {
    id: '2',
    title: 'Viagem para Europa',
    targetAmount: 12000,
    currentAmount: 3500,
    deadline: new Date(2026, 5, 15),
    category: 'Lazer',
  },
];

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  // Transaction actions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, updatedTransaction: Partial<Transaction>) => {
    setTransactions(prev => 
      prev.map(transaction => 
        transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
      )
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  // Card actions
  const addCard = (card: Omit<Card, 'id' | 'used'>) => {
    const newCard: Card = {
      ...card,
      id: Date.now().toString(),
      used: 0,
    };
    setCards(prev => [...prev, newCard]);
  };

  const updateCard = (id: string, updatedCard: Partial<Card>) => {
    setCards(prev => 
      prev.map(card => 
        card.id === id ? { ...card, ...updatedCard } : card
      )
    );
  };

  const deleteCard = (id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  };

  // Account actions
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
    };
    setAccounts(prev => [...prev, newAccount]);
  };

  const updateAccount = (id: string, updatedAccount: Partial<Account>) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === id ? { ...account, ...updatedAccount } : account
      )
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
  };

  // Budget actions
  const addBudget = (budget: Omit<Budget, 'id' | 'spent'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      spent: 0,
    };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (id: string, updatedBudget: Partial<Budget>) => {
    setBudgets(prev => 
      prev.map(budget => 
        budget.id === id ? { ...budget, ...updatedBudget } : budget
      )
    );
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  // Goal actions
  const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      currentAmount: 0,
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updatedGoal: Partial<Goal>) => {
    setGoals(prev => 
      prev.map(goal => 
        goal.id === id ? { ...goal, ...updatedGoal } : goal
      )
    );
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const value: FinancialContextType = {
    transactions,
    cards,
    accounts,
    budgets,
    goals,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCard,
    updateCard,
    deleteCard,
    addAccount,
    updateAccount,
    deleteAccount,
    addBudget,
    updateBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
