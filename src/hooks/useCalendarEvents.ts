
import { useMemo } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { parseLocalDate } from '@/utils/dateValidation';

export type CalendarEventType = 'transaction' | 'receivable' | 'debt';

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  amount: number;
  type: CalendarEventType;
  status?: 'pending' | 'received' | 'paid' | 'overdue';
  category?: string;
  account?: string;
  color: string;
  rawData: any;
}

export const useCalendarEvents = () => {
  const { user } = useAuth();
  const { data: transactions, loading: loadingTransactions } = useSupabaseData('transactions', user?.id);
  const { data: receivables, loading: loadingReceivables } = useSupabaseData('receivable_payments', user?.id);
  const { data: debts, loading: loadingDebts } = useSupabaseData('debts', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const accountMap = useMemo(() => {
    return accounts.reduce((acc, account) => {
      acc[account.id] = account.name;
      return acc;
    }, {} as Record<string, string>);
  }, [accounts]);

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    // Processar transações
    transactions.forEach(transaction => {
      allEvents.push({
        id: `transaction-${transaction.id}`,
        date: parseLocalDate(transaction.date),
        title: transaction.type === 'income' ? 'Receita' : 'Despesa',
        description: transaction.description,
        amount: Number(transaction.amount),
        type: 'transaction',
        category: categoryMap[transaction.category_id] || 'Sem categoria',
        account: accountMap[transaction.account_id] || 'Conta padrão',
        color: transaction.type === 'income' ? '#10B981' : '#EF4444',
        rawData: transaction
      });
    });

    // Processar pagamentos a receber
    receivables.forEach(receivable => {
      const isOverdue = new Date(receivable.due_date) < new Date() && receivable.status === 'pending';
      allEvents.push({
        id: `receivable-${receivable.id}`,
        date: new Date(receivable.due_date),
        title: 'Pagamento a Receber',
        description: receivable.description,
        amount: Number(receivable.amount),
        type: 'receivable',
        status: isOverdue ? 'overdue' : receivable.status,
        account: accountMap[receivable.account_id] || 'Conta padrão',
        color: isOverdue ? '#9CA3AF' : '#3B82F6',
        rawData: receivable
      });
    });

    // Processar dívidas
    debts.forEach(debt => {
      const isOverdue = new Date(debt.due_date) < new Date() && debt.status === 'pending';
      allEvents.push({
        id: `debt-${debt.id}`,
        date: new Date(debt.due_date),
        title: 'Dívida a Pagar',
        description: debt.description,
        amount: Number(debt.amount),
        type: 'debt',
        status: isOverdue ? 'overdue' : debt.status,
        account: accountMap[debt.account_id] || 'Conta padrão',
        color: isOverdue ? '#9CA3AF' : '#F97316',
        rawData: debt
      });
    });

    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [transactions, receivables, debts, categoryMap, accountMap]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear()
    );
  };

  const hasEventsForDate = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  const getEventTypesForDate = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    return [...new Set(dayEvents.map(event => event.type))];
  };

  return {
    events,
    getEventsForDate,
    hasEventsForDate,
    getEventTypesForDate,
    loading: loadingTransactions || loadingReceivables || loadingDebts
  };
};
