import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, startOfDay } from 'date-fns';

export interface VirtualRecurrence {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending';
  notes?: string;
  account_id?: string;
  category_id?: string;
  is_recurring: boolean;
  recurrence_type: 'weekly' | 'monthly' | 'yearly';
  max_occurrences?: number;
  current_count?: number;
  recurrence_end_date?: string;
  is_virtual: true;
  parent_id: string;
  occurrence_number: number;
  card_id?: string;
  is_card_bill?: boolean;
  bill_month?: number;
  bill_year?: number;
  installment_id?: string;
  installment_number?: number;
}

export interface RecurringDebt {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  account_id?: string;
  category_id?: string;
  is_recurring: boolean;
  recurrence_type?: 'weekly' | 'monthly' | 'yearly';
  max_occurrences?: number;
  current_count?: number;
  recurrence_end_date?: string;
  card_id?: string;
  is_card_bill?: boolean;
  bill_month?: number;
  bill_year?: number;
  installment_id?: string;
  installment_number?: number;
}

/**
 * Gera recorrências virtuais para uma dívida recorrente
 * @param debt - A dívida base para gerar recorrências
 * @param monthsAhead - Quantos meses à frente gerar recorrências (padrão: 6)
 * @returns Array de recorrências virtuais
 */
export function generateVirtualRecurrences(
  debt: RecurringDebt, 
  monthsAhead: number = 6
): VirtualRecurrence[] {
  if (!debt.is_recurring || !debt.recurrence_type) {
    return [];
  }

  const virtualRecurrences: VirtualRecurrence[] = [];
  const baseDate = new Date(debt.due_date);
  const currentDate = startOfDay(new Date());
  const endDate = addMonths(currentDate, monthsAhead);
  
  let nextDate = baseDate;
  let occurrenceNumber = (debt.current_count || 1) + 1;
  
  // Função para calcular a próxima data baseada no tipo de recorrência
  const getNextDate = (date: Date, type: string): Date => {
    switch (type) {
      case 'weekly':
        return addWeeks(date, 1);
      case 'monthly':
        return addMonths(date, 1);
      case 'yearly':
        return addYears(date, 1);
      default:
        return addMonths(date, 1);
    }
  };

  // Função para verificar se a recorrência deve parar
  const shouldStop = (occurrence: number, date: Date): boolean => {
    // Parar se passou da data limite
    if (debt.recurrence_end_date && isAfter(date, new Date(debt.recurrence_end_date))) {
      return true;
    }
    
    // Parar se atingiu o número máximo de ocorrências
    if (debt.max_occurrences && occurrence > debt.max_occurrences) {
      return true;
    }
    
    // Parar se passou do período de visualização
    if (isAfter(date, endDate)) {
      return true;
    }
    
    return false;
  };

  // Gerar recorrências até atingir os limites
  while (!shouldStop(occurrenceNumber, nextDate)) {
    // Só incluir se a data for diferente da data base (evitar duplicatas)
    if (nextDate.toISOString().split('T')[0] !== baseDate.toISOString().split('T')[0]) {
      const virtualRecurrence: VirtualRecurrence = {
      id: `virtual-${debt.id}-${occurrenceNumber}`,
      description: debt.description,
      amount: debt.amount,
      due_date: nextDate.toISOString().split('T')[0],
      status: 'pending',
      notes: debt.notes,
      account_id: debt.account_id,
      category_id: debt.category_id,
      is_recurring: debt.is_recurring,
      recurrence_type: debt.recurrence_type,
      max_occurrences: debt.max_occurrences,
      current_count: occurrenceNumber,
      recurrence_end_date: debt.recurrence_end_date,
      is_virtual: true,
      parent_id: debt.id,
      occurrence_number: occurrenceNumber,
      card_id: debt.card_id,
      is_card_bill: debt.is_card_bill,
      bill_month: debt.bill_month,
      bill_year: debt.bill_year,
      installment_id: debt.installment_id,
      installment_number: debt.installment_number
    };
    
      virtualRecurrences.push(virtualRecurrence);
    }
    
    nextDate = getNextDate(nextDate, debt.recurrence_type);
    occurrenceNumber++;
  }
  
  return virtualRecurrences;
}

/**
 * Combina dívidas reais com recorrências virtuais
 * @param debts - Array de dívidas reais
 * @param monthsAhead - Quantos meses à frente gerar recorrências
 * @returns Array combinado de dívidas reais e virtuais
 */
export function combineDebtsWithVirtualRecurrences(
  debts: RecurringDebt[], 
  monthsAhead: number = 6
): (RecurringDebt | VirtualRecurrence)[] {
  const result: (RecurringDebt | VirtualRecurrence)[] = [];
  
  for (const debt of debts) {
    // Sempre incluir a dívida original
    result.push(debt);
    
    // Se for recorrente, gerar recorrências virtuais
    if (debt.is_recurring) {
      const virtualRecurrences = generateVirtualRecurrences(debt, monthsAhead);
      result.push(...virtualRecurrences);
    }
  }
  
  return result;
}

/**
 * Filtra recorrências virtuais por período
 * @param virtualRecurrences - Array de recorrências virtuais
 * @param startDate - Data de início do período
 * @param endDate - Data de fim do período
 * @returns Array filtrado de recorrências virtuais
 */
export function filterVirtualRecurrencesByPeriod(
  virtualRecurrences: VirtualRecurrence[],
  startDate: Date,
  endDate: Date
): VirtualRecurrence[] {
  return virtualRecurrences.filter(recurrence => {
    const dueDate = new Date(recurrence.due_date);
    return dueDate >= startDate && dueDate <= endDate;
  });
}
