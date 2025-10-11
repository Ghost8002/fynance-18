import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useSupabaseData } from './useSupabaseData';
import { useBalanceUpdates } from './useBalanceUpdates';
import { useImportWorker } from './useImportWorker';
import { ImportedTransaction, ImportResult } from './useImport';
import { useCache } from './useCache';
import { useDebouncedValidation } from './useDebounce';
import { convertOFXDate, isValidOFXDate } from '../utils/dateValidation';

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
      // Fallback para processamento síncrono
      console.warn('Usando processamento síncrono como fallback');
      return processOFXSync(file);
    }
  }, [workerProcessOFX, workerProgress]);

  // Função de fallback síncrono para OFX
  const processOFXSync = async (file: File): Promise<ImportedTransaction[]> => {
    try {
      const text = await file.text();
      const transactions: ImportedTransaction[] = [];
      
      const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
      let match;
      
      while ((match = transactionRegex.exec(text)) !== null) {
        const transactionBlock = match[1];
        
        try {
          const dateMatch = transactionBlock.match(/<DTPOST>(\d{8})<\/DTPOST>/);
          const amountMatch = transactionBlock.match(/<TRNAMT>([^<]+)<\/TRNAMT>/);
          const memoMatch = transactionBlock.match(/<MEMO>([^<]+)<\/MEMO>/);
          
          if (dateMatch && amountMatch && memoMatch) {
            const dateStr = dateMatch[1];
            const amount = parseFloat(amountMatch[1]);
            const description = memoMatch[1].trim();
            
            if (!isNaN(amount) && description) {
              // Converter data OFX usando função utilitária com correção de timezone
              let date: string;
              try {
                if (isValidOFXDate(dateStr)) {
                  date = convertOFXDate(dateStr);
                } else {
                  console.warn(`Data OFX inválida: ${dateStr}, usando fallback`);
                  date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
                }
              } catch (error) {
                console.warn(`Erro ao converter data OFX: ${dateStr}, usando fallback`, error);
                date = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
              }
              
              // Determinar tipo inicial (será corrigido pelo motor melhorado se necessário)
              const type: 'income' | 'expense' = amount > 0 ? 'income' : 'expense';
              
              let category: string | undefined;
              const descriptionLower = description.toLowerCase();
              
              if (descriptionLower.includes('mercado') || descriptionLower.includes('supermercado') || 
                  descriptionLower.includes('restaurante') || descriptionLower.includes('lanchonete')) {
                category = 'Alimentação';
              } else if (descriptionLower.includes('posto') || descriptionLower.includes('combustível') || 
                         descriptionLower.includes('uber') || descriptionLower.includes('taxi')) {
                category = 'Transporte';
              } else if (descriptionLower.includes('farmacia') || descriptionLower.includes('farmácia') || 
                         descriptionLower.includes('hospital') || descriptionLower.includes('clínica')) {
                category = 'Saúde';
              } else if (descriptionLower.includes('escola') || descriptionLower.includes('universidade') || 
                         descriptionLower.includes('curso') || descriptionLower.includes('livro')) {
                category = 'Educação';
              } else if (descriptionLower.includes('cinema') || descriptionLower.includes('teatro') || 
                         descriptionLower.includes('show') || descriptionLower.includes('viagem')) {
                category = 'Lazer';
              }
              
              transactions.push({
                date,
                description,
                amount: Math.abs(amount),
                type,
                category,
                tags: []
              });
            }
          }
        } catch (error) {
          console.warn('Erro ao processar transação OFX:', error);
          continue;
        }
      }
      
      return transactions;
    } catch (error) {
      throw new Error(`Erro ao processar arquivo OFX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

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
