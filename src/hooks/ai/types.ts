
import { CRUDOperation } from '@/hooks/useAICRUD';

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  isUser: boolean;
  crudOperation?: {
    executed: boolean;
    operation: CRUDOperation;
    result?: any;
  };
}

export interface UserFinancialData {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  categories: Array<{ name: string; amount: number; percentage: number }>;
  goals: Array<{ title: string; progress: number; target: number }>;
  totalBalance: number;
}
