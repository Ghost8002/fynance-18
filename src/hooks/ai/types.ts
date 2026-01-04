
import { CRUDOperation } from '@/hooks/useAICRUD';

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  isUser: boolean;
  crudOperation?: {
    executed: boolean;
    operation?: CRUDOperation;
    operations?: string[];
    results?: Array<{ success: boolean; message: string; data?: any }>;
    result?: any;
  };
}

export interface UserFinancialData {
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  categories: Array<{ name: string; amount: number; percentage: number }> | Array<{ id: string; name: string; color: string; type: string }>;
  goals: Array<{ title: string; progress: number; target: number }> | Array<{ id: string; title: string; progress: number; target: number }>;
  totalBalance: number;
}
