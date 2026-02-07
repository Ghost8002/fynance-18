
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CRUDOperation {
  operation: 'create' | 'read' | 'update' | 'delete';
  table: string;
  data?: any;
  conditions?: Record<string, any>;
  id?: string;
}

export const useAICRUD = () => {
  const { user } = useAuth();
  const { data: transactions, update: updateTransaction, remove: removeTransaction, insert: insertTransaction } = useSupabaseData('transactions', user?.id);
  const { data: categories, update: updateCategory, remove: removeCategory, insert: insertCategory } = useSupabaseData('categories', user?.id);
  const { data: accounts, update: updateAccount, remove: removeAccount, insert: insertAccount } = useSupabaseData('accounts', user?.id);
  const { data: cards, update: updateCard, remove: removeCard, insert: insertCard } = useSupabaseData('cards', user?.id);
  const { data: goals, update: updateGoal, remove: removeGoal, insert: insertGoal } = useSupabaseData('goals', user?.id);
  const { data: debts, update: updateDebt, remove: removeDebt, insert: insertDebt } = useSupabaseData('debts', user?.id);
  const { data: receivablePayments, update: updateReceivable, remove: removeReceivable, insert: insertReceivable } = useSupabaseData('receivable_payments', user?.id);

  const executeOperation = async (operation: CRUDOperation): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      switch (operation.table) {
        case 'transactions':
          return await handleTransactionOperation(operation);
        case 'categories':
          return await handleCategoryOperation(operation);
        case 'accounts':
          return await handleAccountOperation(operation);
        case 'cards':
          return await handleCardOperation(operation);
        case 'goals':
          return await handleGoalOperation(operation);
        case 'debts':
          return await handleDebtOperation(operation);
        case 'receivable_payments':
          return await handleReceivableOperation(operation);
        default:
          return { success: false, message: `Tabela '${operation.table}' não suportada` };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Erro ao executar operação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  };

  const handleTransactionOperation = async (operation: CRUDOperation) => {
    switch (operation.operation) {
      case 'create':
        const createResult = await insertTransaction({ ...operation.data, user_id: user?.id });
        if (createResult.error) throw new Error(createResult.error);
        return { success: true, message: 'Transação criada com sucesso', data: createResult.data };

      case 'update':
        if (operation.id) {
          const updateResult = await updateTransaction(operation.id, operation.data);
          if (updateResult.error) throw new Error(updateResult.error);
          return { success: true, message: 'Transação atualizada com sucesso', data: updateResult.data };
        } else if (operation.conditions) {
          // Bulk update based on conditions
          const matchingTransactions = transactions.filter(t => 
            Object.entries(operation.conditions!).every(([key, value]) => {
              if (key === 'description_contains') {
                return t.description.toLowerCase().includes(value.toLowerCase());
              }
              return t[key] === value;
            })
          );
          
          const updatePromises = matchingTransactions.map(t => updateTransaction(t.id, operation.data));
          const results = await Promise.all(updatePromises);
          
          const errors = results.filter(r => r.error);
          if (errors.length > 0) throw new Error(`Erro em ${errors.length} atualizações`);
          
          return { 
            success: true, 
            message: `${matchingTransactions.length} transações atualizadas com sucesso`,
            data: { updatedCount: matchingTransactions.length }
          };
        }
        throw new Error('ID ou condições necessárias para atualização');

      case 'delete':
        if (operation.id) {
          const deleteResult = await removeTransaction(operation.id);
          if (deleteResult.error) throw new Error(deleteResult.error);
          return { success: true, message: 'Transação excluída com sucesso' };
        }
        if (operation.conditions?.description_contains) {
          const matching = transactions.filter(t =>
            t.description?.toLowerCase().includes(String(operation.conditions!.description_contains).toLowerCase())
          );
          if (matching.length === 0) {
            return { success: false, message: 'Nenhuma transação encontrada com essa descrição' };
          }
          const toDelete = matching.length === 1 ? matching[0] : matching[0];
          const deleteResult = await removeTransaction(toDelete.id);
          if (deleteResult.error) throw new Error(deleteResult.error);
          const msg = matching.length === 1
            ? 'Transação excluída com sucesso'
            : `${matching.length} transações encontradas; a primeira foi excluída. Seja mais específico para excluir apenas uma.`;
          return { success: true, message: msg };
        }
        throw new Error('ID ou description_contains necessário para exclusão');

      case 'read':
        let filteredTransactions = [...transactions];
        if (operation.conditions) {
          filteredTransactions = transactions.filter(t => 
            Object.entries(operation.conditions!).every(([key, value]) => {
              if (key === 'description_contains') {
                return t.description.toLowerCase().includes(value.toLowerCase());
              }
              return t[key] === value;
            })
          );
        }
        return { 
          success: true, 
          message: `${filteredTransactions.length} transações encontradas`,
          data: filteredTransactions 
        };

      default:
        throw new Error(`Operação '${operation.operation}' não suportada`);
    }
  };

  const handleCategoryOperation = async (operation: CRUDOperation) => {
    switch (operation.operation) {
      case 'create':
        const createResult = await insertCategory({ ...operation.data, user_id: user?.id });
        if (createResult.error) throw new Error(createResult.error);
        return { success: true, message: 'Categoria criada com sucesso', data: createResult.data };

      case 'update':
        if (!operation.id) throw new Error('ID necessário para atualização');
        const updateResult = await updateCategory(operation.id, operation.data);
        if (updateResult.error) throw new Error(updateResult.error);
        return { success: true, message: 'Categoria atualizada com sucesso', data: updateResult.data };

      case 'delete':
        if (!operation.id) throw new Error('ID necessário para exclusão');
        const deleteResult = await removeCategory(operation.id);
        if (deleteResult.error) throw new Error(deleteResult.error);
        return { success: true, message: 'Categoria excluída com sucesso' };

      case 'read':
        return { success: true, message: `${categories.length} categorias encontradas`, data: categories };

      default:
        throw new Error(`Operação '${operation.operation}' não suportada`);
    }
  };

  const handleAccountOperation = async (operation: CRUDOperation) => {
    switch (operation.operation) {
      case 'create':
        const createResult = await insertAccount({ ...operation.data, user_id: user?.id });
        if (createResult.error) throw new Error(createResult.error);
        return { success: true, message: 'Conta criada com sucesso', data: createResult.data };

      case 'update':
        if (!operation.id) throw new Error('ID necessário para atualização');
        const updateResult = await updateAccount(operation.id, operation.data);
        if (updateResult.error) throw new Error(updateResult.error);
        return { success: true, message: 'Conta atualizada com sucesso', data: updateResult.data };

      case 'delete':
        if (!operation.id) throw new Error('ID necessário para exclusão');
        const deleteResult = await removeAccount(operation.id);
        if (deleteResult.error) throw new Error(deleteResult.error);
        return { success: true, message: 'Conta excluída com sucesso' };

      case 'read':
        return { success: true, message: `${accounts.length} contas encontradas`, data: accounts };

      default:
        throw new Error(`Operação '${operation.operation}' não suportada`);
    }
  };

  const handleCardOperation = async (operation: CRUDOperation) => {
    switch (operation.operation) {
      case 'create':
        const createResult = await insertCard({ ...operation.data, user_id: user?.id });
        if (createResult.error) throw new Error(createResult.error);
        return { success: true, message: 'Cartão criado com sucesso', data: createResult.data };

      case 'update':
        if (!operation.id) throw new Error('ID necessário para atualização');
        const updateResult = await updateCard(operation.id, operation.data);
        if (updateResult.error) throw new Error(updateResult.error);
        return { success: true, message: 'Cartão atualizado com sucesso', data: updateResult.data };

      case 'delete':
        if (!operation.id) throw new Error('ID necessário para exclusão');
        const deleteResult = await removeCard(operation.id);
        if (deleteResult.error) throw new Error(deleteResult.error);
        return { success: true, message: 'Cartão excluído com sucesso' };

      case 'read':
        return { success: true, message: `${cards.length} cartões encontrados`, data: cards };

      default:
        throw new Error(`Operação '${operation.operation}' não suportada`);
    }
  };

  const handleGoalOperation = async (operation: CRUDOperation) => {
    switch (operation.operation) {
      case 'create':
        const createResult = await insertGoal({ ...operation.data, user_id: user?.id });
        if (createResult.error) throw new Error(createResult.error);
        return { success: true, message: 'Meta criada com sucesso', data: createResult.data };

      case 'update':
        if (!operation.id) throw new Error('ID necessário para atualização');
        const updateResult = await updateGoal(operation.id, operation.data);
        if (updateResult.error) throw new Error(updateResult.error);
        return { success: true, message: 'Meta atualizada com sucesso', data: updateResult.data };

      case 'delete':
        if (!operation.id) throw new Error('ID necessário para exclusão');
        const deleteResult = await removeGoal(operation.id);
        if (deleteResult.error) throw new Error(deleteResult.error);
        return { success: true, message: 'Meta excluída com sucesso' };

      case 'read':
        return { success: true, message: `${goals.length} metas encontradas`, data: goals };

      default:
        throw new Error(`Operação '${operation.operation}' não suportada`);
    }
  };

  const handleDebtOperation = async (operation: CRUDOperation) => {
    switch (operation.operation) {
      case 'create':
        const createResult = await insertDebt({ ...operation.data, user_id: user?.id });
        if (createResult.error) throw new Error(createResult.error);
        return { success: true, message: 'Dívida criada com sucesso', data: createResult.data };

      case 'update':
        if (!operation.id) throw new Error('ID necessário para atualização');
        const updateResult = await updateDebt(operation.id, operation.data);
        if (updateResult.error) throw new Error(updateResult.error);
        return { success: true, message: 'Dívida atualizada com sucesso', data: updateResult.data };

      case 'delete':
        if (!operation.id) throw new Error('ID necessário para exclusão');
        const deleteResult = await removeDebt(operation.id);
        if (deleteResult.error) throw new Error(deleteResult.error);
        return { success: true, message: 'Dívida excluída com sucesso' };

      case 'read':
        let filteredDebts = [...debts];
        if (operation.conditions) {
          if (operation.conditions.description_contains) {
            const desc = String(operation.conditions.description_contains).toLowerCase();
            filteredDebts = debts.filter(d => d.description?.toLowerCase().includes(desc));
          }
          if (operation.conditions.status) {
            filteredDebts = filteredDebts.filter(d => d.status === operation.conditions!.status);
          }
        }
        return { success: true, message: `${filteredDebts.length} dívidas encontradas`, data: filteredDebts };

      default:
        throw new Error(`Operação '${operation.operation}' não suportada`);
    }
  };

  const handleReceivableOperation = async (operation: CRUDOperation) => {
    switch (operation.operation) {
      case 'create':
        const createResult = await insertReceivable({ ...operation.data, user_id: user?.id });
        if (createResult.error) throw new Error(createResult.error);
        return { success: true, message: 'Recebível criado com sucesso', data: createResult.data };

      case 'update':
        if (!operation.id) throw new Error('ID necessário para atualização');
        const updateResult = await updateReceivable(operation.id, operation.data);
        if (updateResult.error) throw new Error(updateResult.error);
        return { success: true, message: 'Recebível atualizado com sucesso', data: updateResult.data };

      case 'delete':
        if (!operation.id) throw new Error('ID necessário para exclusão');
        const deleteResult = await removeReceivable(operation.id);
        if (deleteResult.error) throw new Error(deleteResult.error);
        return { success: true, message: 'Recebível excluído com sucesso' };

      case 'read':
        let filteredReceivables = [...receivablePayments];
        if (operation.conditions) {
          if (operation.conditions.description_contains) {
            const desc = String(operation.conditions.description_contains).toLowerCase();
            filteredReceivables = receivablePayments.filter((r: { description?: string }) =>
              r.description?.toLowerCase().includes(desc)
            );
          }
          if (operation.conditions.status) {
            filteredReceivables = filteredReceivables.filter(
              (r: { status: string }) => r.status === operation.conditions!.status
            );
          }
        }
        return { success: true, message: `${filteredReceivables.length} recebíveis encontrados`, data: filteredReceivables };

      default:
        throw new Error(`Operação '${operation.operation}' não suportada`);
    }
  };

  // Função para interpretar comandos em linguagem natural
  const parseNaturalLanguageCommand = (command: string): CRUDOperation | null => {
    const lowerCommand = command.toLowerCase();
    
    // Exemplos de comandos suportados:
    // "altere todas as transações do McDonald's para a categoria Alimentação"
    // "mude a categoria das transações que contém 'uber' para Transporte"
    // "delete a transação com id abc123"
    // "crie uma nova categoria chamada Investimentos com cor azul"
    
    if (lowerCommand.includes('altere') || lowerCommand.includes('mude')) {
      if (lowerCommand.includes('transaç')) {
        // Parse transaction update commands
        const descriptionMatch = lowerCommand.match(/(?:do|contém|com) ['"]([^'"]+)['"]|(?:do|contém|com) (\w+)/);
        const categoryMatch = lowerCommand.match(/(?:categoria|para) ['"]([^'"]+)['"]|(?:categoria|para) (\w+)/);
        
        if (descriptionMatch && categoryMatch) {
          const description = descriptionMatch[1] || descriptionMatch[2];
          const categoryName = categoryMatch[1] || categoryMatch[2];
          
          // Find category ID by name
          const category = categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()));
          
          if (category) {
            return {
              operation: 'update',
              table: 'transactions',
              conditions: { description_contains: description },
              data: { category_id: category.id }
            };
          }
        }
      }
    }
    
    if (lowerCommand.includes('delete') || lowerCommand.includes('exclu')) {
      const idMatch = lowerCommand.match(/id ([a-zA-Z0-9-]+)/);
      if (idMatch) {
        return {
          operation: 'delete',
          table: 'transactions', // Default to transactions, could be made smarter
          id: idMatch[1]
        };
      }
    }
    
    if (lowerCommand.includes('crie') || lowerCommand.includes('criar')) {
      if (lowerCommand.includes('categoria')) {
        const nameMatch = lowerCommand.match(/categoria ['"]([^'"]+)['"]|categoria (\w+)/);
        const colorMatch = lowerCommand.match(/cor ['"]([^'"]+)['"]|cor (\w+)/);
        
        if (nameMatch) {
          const name = nameMatch[1] || nameMatch[2];
          const color = colorMatch ? (colorMatch[1] || colorMatch[2]) : '#3B82F6';
          
          return {
            operation: 'create',
            table: 'categories',
            data: { name, color, type: 'expense' }
          };
        }
      }
    }
    
    return null;
  };

  return {
    executeOperation,
    parseNaturalLanguageCommand,
    // Data access for AI context
    transactions,
    categories,
    accounts,
    cards,
    goals,
    debts,
    receivablePayments
  };
};
