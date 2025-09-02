import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useSupabaseData } from './useSupabaseData';
import { useBalanceUpdates } from './useBalanceUpdates';
import { useImportWorker } from './useImportWorker';
import { ImportedTransaction, ImportResult } from './useImport';
import { useCache } from './useCache';
import { useDebouncedValidation } from './useDebounce';

export const useOFXImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Cache para contas e categorias
  const accountsCache = useCache(`accounts-${user?.id}`, { ttl: 10 * 60 * 1000 }); // 10 minutos
  const categoriesCache = useCache(`categories-${user?.id}`, { ttl: 15 * 60 * 1000 }); // 15 minutos
  
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: existingCategories } = useSupabaseData('categories', user?.id);
  const { insert: insertTransaction } = useSupabaseData('transactions', user?.id);
  const { updateAccountBalance } = useBalanceUpdates();
  const { isProcessing, progress: workerProgress, processOFX: workerProcessOFX, cancelProcessing } = useImportWorker();

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  // Validação com debounce para arquivo OFX
  const fileValidation = useDebouncedValidation(
    async (file: File): Promise<boolean | string> => {
      if (!file) return 'Nenhum arquivo selecionado';
      
      const fileName = file.name.toLowerCase();
      const isOFX = fileName.endsWith('.ofx');
      
      if (!isOFX) {
        return 'Formato de arquivo não suportado. Use OFX.';
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        return 'Arquivo muito grande. Tamanho máximo: 5MB.';
      }
      
      return true;
    },
    300 // 300ms de debounce
  );

  // Função para processar OFX usando Web Worker
  const processOFX = useCallback(async (file: File): Promise<ImportedTransaction[]> => {
    try {
      // Usar o worker para processar o arquivo
      const transactions = await workerProcessOFX(file);
      
      // Atualizar progresso baseado no worker
      if (workerProgress) {
        setProgress(workerProgress.progress);
      }
      
      return transactions;
    } catch (error) {
      console.error('Erro ao processar OFX com worker:', error);
      throw error;
    }
  }, [workerProcessOFX, workerProgress]);

  // Função para importar transações
  const importTransactions = useCallback(async (
    transactions: ImportedTransaction[], 
    accountId: string
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
          // Buscar categoria existente (simplificado)
          let categoryId: string | undefined;
          if (transaction.category && existingCategories) {
            const existingCategory = existingCategories.find(cat => 
              cat.name.toLowerCase() === transaction.category?.toLowerCase()
            );
            categoryId = existingCategory?.id;
          }

          // Inserir transação
          const { error } = await insertTransaction({
            date: transaction.date,
            description: transaction.description,
            amount: transaction.type === 'expense' ? -transaction.amount : transaction.amount,
            type: transaction.type,
            category_id: categoryId,
            account_id: accountId,
            reference: `OFX-${Date.now()}-${i}`,
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
  }, [user, existingCategories, insertTransaction, updateAccountBalance]);

  // Função principal de importação
  const importFile = useCallback(async (file: File, accountId: string): Promise<ImportResult> => {
    try {
      // Processar arquivo
      const transactions = await processOFX(file);
      
      if (transactions.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo OFX');
      }

      // Importar transações
      const result = await importTransactions(transactions, accountId);
      
      toast({
        title: "Importação OFX Concluída",
        description: `${result.success} transações importadas com sucesso. ${result.errors > 0 ? `${result.errors} erros.` : ''}`,
        variant: result.errors > 0 ? "destructive" : "default"
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido na importação OFX';
      toast({
        title: "Erro na Importação OFX",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  }, [processOFX, importTransactions, toast]);

  // Função para resetar o estado
  const reset = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  return {
    importing: importing || isProcessing,
    progress: workerProgress ? workerProgress.progress : progress,
    result,
    accounts,
    importFile,
    reset,
    cancelProcessing,
    fileValidation,
    accountsCache: accountsCache.data,
    categoriesCache: categoriesCache.data,
    cacheSize: accountsCache.cacheSize + categoriesCache.cacheSize
  };
};
