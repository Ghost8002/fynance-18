import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useSupabaseData } from './useSupabaseData';
import { useBalanceUpdates } from './useBalanceUpdates';
import { useImportWorker } from './useImportWorker';
import { useCache } from './useCache';
import { useDebouncedValidation } from './useDebounce';

export interface ImportedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  tags?: string[];
}

export interface ImportResult {
  success: number;
  errors: number;
  duplicates: number;
  transactions: ImportedTransaction[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export const useImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Cache para contas e categorias
  const accountsCache = useCache(`accounts-${user?.id}`, { ttl: 10 * 60 * 1000 }); // 10 minutos
  const categoriesCache = useCache(`categories-${user?.id}`, { ttl: 15 * 60 * 1000 }); // 15 minutos
  
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: existingCategories } = useSupabaseData('categories', user?.id);
  const { insert: insertTransaction } = useSupabaseData('transactions', user?.id);
  const { updateAccountBalance } = useBalanceUpdates();
  const { isProcessing, progress: workerProgress, processXLSX: workerProcessXLSX, cancelProcessing } = useImportWorker();

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  
  // Validação com debounce para arquivo
  const fileValidation = useDebouncedValidation(
    async (file: File): Promise<boolean | string> => {
      if (!file) return 'Nenhum arquivo selecionado';
      
      const fileName = file.name.toLowerCase();
      const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      
      if (!isXLSX) {
        return 'Formato de arquivo não suportado. Use XLSX ou XLS.';
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        return 'Arquivo muito grande. Tamanho máximo: 10MB.';
      }
      
      return true;
    },
    300 // 300ms de debounce
  );

  // Função para processar XLSX usando Web Worker
  const processXLSX = useCallback(async (file: File): Promise<ImportedTransaction[]> => {
    try {
      // Usar o worker para processar o arquivo
      const transactions = await workerProcessXLSX(file);
      
      // Atualizar progresso baseado no worker
      if (workerProgress) {
        setProgress(workerProgress.progress);
      }
      
      return transactions;
    } catch (error) {
      console.error('Erro ao processar XLSX com worker:', error);
      throw error;
    }
  }, [workerProcessXLSX, workerProgress]);

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
          // Buscar categoria existente (simplificado - sem normalização complexa)
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
      setImporting(true);
      setProgress(0);
      
      // Processar arquivo usando worker
      const transactions = await processXLSX(file);
      
      if (transactions.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo');
      }

      // Importar transações
      const result = await importTransactions(transactions, accountId);
      
      toast({
        title: "Importação Concluída",
        description: `${result.success} transações importadas com sucesso. ${result.errors > 0 ? `${result.errors} erros.` : ''}`,
        variant: result.errors > 0 ? "destructive" : "default"
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido na importação';
      toast({
        title: "Erro na Importação",
        description: message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setImporting(false);
      setProgress(0);
    }
  }, [processXLSX, importTransactions, toast]);

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

// Funções utilitárias simplificadas
function parseAmount(amountStr: string): number {
  let cleanAmount = amountStr.replace(/[R$\s]/g, '');
  cleanAmount = cleanAmount.replace(',', '.');
  return parseFloat(cleanAmount);
}

function formatDate(dateStr: string): string {
  if (typeof dateStr === 'string') {
    // Formato mais simples - apenas converter DD/MM/YYYY para YYYY-MM-DD
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          return dateStr.replace(/\//g, '-');
        } else {
          // DD/MM/YYYY
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
    }
    
    // Se já está no formato correto ou é uma data do Excel
    if (dateStr.includes('-') || /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
  }
  
  // Fallback para o valor original
  return String(dateStr);
}
