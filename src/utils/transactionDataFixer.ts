import { supabase } from '@/integrations/supabase/client';

export interface TransactionFix {
  id: string;
  currentAmount: number;
  currentType: string;
  fixedAmount: number;
  fixedType: string;
  description: string;
}

/**
 * Analisa transações e identifica inconsistências entre tipo e valor
 */
export const analyzeTransactionInconsistencies = async (userId: string): Promise<TransactionFix[]> => {
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, amount, type, description')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }

  const inconsistencies: TransactionFix[] = [];

  transactions?.forEach(transaction => {
    const amount = Number(transaction.amount);
    const type = transaction.type;
    
    // Identificar inconsistências
    if (type === 'income' && amount < 0) {
      // Receita com valor negativo - deve ser positivo
      inconsistencies.push({
        id: transaction.id,
        currentAmount: amount,
        currentType: type,
        fixedAmount: Math.abs(amount),
        fixedType: 'income',
        description: transaction.description
      });
    } else if (type === 'expense' && amount > 0) {
      // Despesa com valor positivo - deve ser negativo
      inconsistencies.push({
        id: transaction.id,
        currentAmount: amount,
        currentType: type,
        fixedAmount: -Math.abs(amount),
        fixedType: 'expense',
        description: transaction.description
      });
    }
  });

  return inconsistencies;
};

/**
 * Corrige transações inconsistentes
 */
export const fixTransactionInconsistencies = async (
  userId: string, 
  fixes: TransactionFix[]
): Promise<{ success: number; errors: number; details: string[] }> => {
  let success = 0;
  let errors = 0;
  const details: string[] = [];

  for (const fix of fixes) {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: fix.fixedAmount,
          type: fix.fixedType
        })
        .eq('id', fix.id)
        .eq('user_id', userId);

      if (error) {
        console.error(`Erro ao corrigir transação ${fix.id}:`, error);
        errors++;
        details.push(`Erro ao corrigir transação ${fix.id}: ${error.message}`);
      } else {
        success++;
        details.push(`Transação ${fix.id} corrigida: ${fix.currentAmount} → ${fix.fixedAmount}`);
      }
    } catch (error) {
      console.error(`Erro ao corrigir transação ${fix.id}:`, error);
      errors++;
      details.push(`Erro ao corrigir transação ${fix.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  return { success, errors, details };
};

/**
 * Gera relatório de inconsistências
 */
export const generateInconsistencyReport = (inconsistencies: TransactionFix[]): string => {
  if (inconsistencies.length === 0) {
    return '✅ Nenhuma inconsistência encontrada!';
  }

  let report = `🔍 Encontradas ${inconsistencies.length} inconsistências:\n\n`;
  
  const incomeWithNegative = inconsistencies.filter(f => f.currentType === 'income' && f.currentAmount < 0);
  const expenseWithPositive = inconsistencies.filter(f => f.currentType === 'expense' && f.currentAmount > 0);

  if (incomeWithNegative.length > 0) {
    report += `📈 Receitas com valor negativo (${incomeWithNegative.length}):\n`;
    incomeWithNegative.forEach(fix => {
      report += `  • ${fix.description}: ${fix.currentAmount} → ${fix.fixedAmount}\n`;
    });
    report += '\n';
  }

  if (expenseWithPositive.length > 0) {
    report += `📉 Despesas com valor positivo (${expenseWithPositive.length}):\n`;
    expenseWithPositive.forEach(fix => {
      report += `  • ${fix.description}: ${fix.currentAmount} → ${fix.fixedAmount}\n`;
    });
    report += '\n';
  }

  report += `💡 Recomendação: Execute a correção automática para padronizar os valores.`;

  return report;
};
