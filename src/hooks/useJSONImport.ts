import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useSupabaseData } from './useSupabaseData';
import { useBalanceUpdates } from './useBalanceUpdates';
import { ImportedTransaction, ImportResult } from './useImport';
import { useCache } from './useCache';
import { useDebouncedValidation } from './useDebounce';

export const useJSONImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Cache para contas e categorias
  const accountsCache = useCache(`accounts-${user?.id}`, { ttl: 10 * 60 * 1000 }); // 10 minutos
  const categoriesCache = useCache(`categories-${user?.id}`, { ttl: 15 * 60 * 1000 }); // 15 minutos
  
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: existingCategories } = useSupabaseData('categories', user?.id);
  const { insert: insertTransaction } = useSupabaseData('transactions', user?.id);
  const { updateAccountBalance } = useBalanceUpdates();

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  // Validação com debounce para arquivo JSON
  const fileValidation = useDebouncedValidation(
    async (file: File): Promise<boolean | string> => {
      if (!file) return 'Nenhum arquivo selecionado';
      
      const fileName = file.name.toLowerCase();
      const isJSON = fileName.endsWith('.json');
      
      if (!isJSON) {
        return 'Formato de arquivo não suportado. Use JSON.';
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        return 'Arquivo muito grande. Tamanho máximo: 5MB.';
      }
      
      return true;
    },
    300 // 300ms de debounce
  );

  // Função para processar JSON
  const processJSON = useCallback(async (file: File): Promise<ImportedTransaction[]> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validar estrutura do JSON
      if (!data.transactions || !Array.isArray(data.transactions)) {
        throw new Error('Formato JSON inválido. O arquivo deve conter um array "transactions".');
      }
      
      const transactions: ImportedTransaction[] = [];
      
      for (const transaction of data.transactions) {
        // Validar campos obrigatórios
        if (!transaction.date || !transaction.description || transaction.amount === undefined || !transaction.type) {
          console.warn('Transação inválida encontrada:', transaction);
          continue;
        }
        
        // Validar tipo
        if (transaction.type !== 'income' && transaction.type !== 'expense') {
          console.warn('Tipo de transação inválido:', transaction.type);
          continue;
        }
        
        // Validar data (formato YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(transaction.date)) {
          console.warn('Formato de data inválido:', transaction.date);
          continue;
        }
        
        transactions.push({
          date: transaction.date,
          description: transaction.description,
          amount: Math.abs(parseFloat(transaction.amount)),
          type: transaction.type,
          category: transaction.category,
          tags: transaction.tags || []
        });
      }
      
      return transactions;
    } catch (error) {
      throw new Error(`Erro ao processar arquivo JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, []);

  // Função para importar transações
  const importTransactions = useCallback(async (
    transactions: ImportedTransaction[], 
    accountId: string,
    categoryMapping: Map<string, string>
  ): Promise<ImportResult> => {
    if (!user || !accountId) {
      throw new Error('Usuário ou conta não selecionada');
    }

    setImporting(true);
    setProgress(0);

    try {
      let successCount = 0;
      let errorCount = 0;
      let duplicateCount = 0;

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        
        try {
          // Buscar categoria existente ou usar a criada
          let categoryId: string | undefined;
          if (transaction.category) {
            categoryId = categoryMapping.get(transaction.category.toLowerCase());
          }

          // Inserir transação
          const { error } = await insertTransaction({
            user_id: user.id, // CRÍTICO: Necessário para RLS
            date: transaction.date,
            description: transaction.description,
            amount: transaction.type === 'expense' ? -transaction.amount : transaction.amount,
            type: transaction.type,
            category_id: categoryId,
            account_id: accountId,
            tags: transaction.tags || []
          });

          if (error) {
            console.error('Erro ao inserir transação:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`Erro na linha ${i + 1}:`, error);
          errorCount++;
        }

        setProgress((i + 1) / transactions.length * 100);
      }

      // Atualizar saldo da conta
      if (successCount > 0) {
        await updateAccountBalance(accountId);
      }

      const result: ImportResult = {
        success: successCount,
        errors: errorCount,
        duplicates: duplicateCount,
        transactions
      };

      setResult(result);
      return result;

    } catch (error) {
      console.error('Erro durante importação:', error);
      throw error;
    } finally {
      setImporting(false);
    }
  }, [user, insertTransaction, updateAccountBalance]);

  // Função principal de importação
  const importFile = useCallback(async (
    file: File, 
    accountId: string, 
    categoryMapping?: Map<string, string>
  ): Promise<ImportResult> => {
    try {
      // Processar arquivo
      const transactions = await processJSON(file);
      
      if (transactions.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo JSON');
      }

      // Se não houver mapeamento, criar um padrão
      const mapping = categoryMapping || new Map<string, string>();
      
      // Mapear categorias existentes
      if (!categoryMapping && existingCategories) {
        existingCategories.forEach(cat => {
          mapping.set(cat.name.toLowerCase(), cat.id);
        });
      }

      // Importar transações
      const result = await importTransactions(transactions, accountId, mapping);
      
      toast({
        title: "Importação JSON Concluída",
        description: `${result.success} transações importadas com sucesso. ${result.errors > 0 ? `${result.errors} erros.` : ''}`,
        variant: result.errors > 0 ? "destructive" : "default"
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido na importação JSON';
      toast({
        title: "Erro na Importação JSON",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  }, [processJSON, importTransactions, existingCategories, toast]);

  // Função para resetar o estado
  const reset = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  return {
    importing,
    progress,
    result,
    accounts,
    categories: existingCategories,
    importFile,
    reset,
    fileValidation,
    processJSON,
    accountsCache: accountsCache.data,
    categoriesCache: categoriesCache.data,
    cacheSize: accountsCache.cacheSize + categoriesCache.cacheSize
  };
};
