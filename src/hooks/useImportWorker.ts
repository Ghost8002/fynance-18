import { useState, useCallback, useRef, useEffect } from 'react';
import { ImportedTransaction } from './useImport';
import { CategoryEngine } from '../utils/categorization/CategoryEngine';
import { devLog, devWarn, devError } from '@/utils/logger';

interface WorkerProgress {
  progress: number;
  processed: number;
  total: number;
}

interface UseImportWorkerReturn {
  isProcessing: boolean;
  progress: WorkerProgress | null;
  workerAvailable: boolean;
  processXLSX: (file: File) => Promise<ImportedTransaction[]>;
  processOFX: (file: File) => Promise<ImportedTransaction[]>;
  cancelProcessing: () => void;
}

export const useImportWorker = (): UseImportWorkerReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<WorkerProgress | null>(null);
  const [workerAvailable, setWorkerAvailable] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const currentTaskId = useRef<string>('');
  
  // Instância do motor de categorização para fallback
  const categoryEngineRef = useRef<CategoryEngine | null>(null);
  
  // Inicializar motor de categorização
  const getCategoryEngine = useCallback(() => {
    if (!categoryEngineRef.current) {
      categoryEngineRef.current = new CategoryEngine({
        minConfidence: 70,
        enableLearning: true
      });
    }
    return categoryEngineRef.current;
  }, []);

  // Inicializar worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        // Criar worker
        workerRef.current = new Worker(new URL('../workers/importWorker.ts', import.meta.url), {
          type: 'module'
        });

        // Configurar listeners
        workerRef.current.onmessage = (event) => {
          const { type, data } = event.data;

          switch (type) {
            case 'ready':
              devLog('Import Worker inicializado:', data.message);
              setWorkerAvailable(true);
              break;

            case 'progress':
              setProgress(data);
              break;

            case 'result':
              if (data.id === currentTaskId.current) {
                setIsProcessing(false);
                setProgress(null);
                // Resolver a promise com o resultado
                resolveCurrentTask.current(data.transactions);
              }
              break;

            case 'error':
              if (data.id === currentTaskId.current) {
                setIsProcessing(false);
                setProgress(null);
                // Rejeitar a promise com o erro
                rejectCurrentTask.current(new Error(data.error));
              }
              break;
          }
        };

        workerRef.current.onerror = (error) => {
          devError('Erro no Import Worker:', error);
          setIsProcessing(false);
          setProgress(null);
          rejectCurrentTask.current(new Error('Worker error'));
        };

        return () => {
          if (workerRef.current) {
            workerRef.current.terminate();
          }
        };
      } catch (error) {
        devError('Erro ao inicializar Import Worker:', error);
      }
    }
  }, []);

  // Referências para resolver/rejeitar promises
  const resolveCurrentTask = useRef<(transactions: ImportedTransaction[]) => void>(() => {});
  const rejectCurrentTask = useRef<(error: Error) => void>(() => {});

  // Função para processar XLSX usando worker
  const processXLSX = useCallback(async (file: File): Promise<ImportedTransaction[]> => {
    if (!workerRef.current) {
      // Fallback para processamento síncrono se worker não estiver disponível
      devWarn('Web Worker não disponível, usando processamento síncrono');
      return processXLSXSync(file);
    }

    return new Promise<ImportedTransaction[]>((resolve, reject) => {
      try {
        setIsProcessing(true);
        setProgress(null);
        
        // Gerar ID único para esta tarefa
        const taskId = `xlsx-${Date.now()}-${Math.random()}`;
        currentTaskId.current = taskId;
        
        // Armazenar referências para resolver/rejeitar
        resolveCurrentTask.current = resolve;
        rejectCurrentTask.current = reject;

        // Ler arquivo e converter para dados processáveis
        file.arrayBuffer().then((arrayBuffer) => {
          // Usar XLSX para converter ArrayBuffer em dados estruturados
          import('xlsx').then((XLSX) => {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
              throw new Error('Arquivo deve ter pelo menos cabeçalho e uma linha de dados');
            }
            
            const headers = jsonData[0] as string[];
            const dataRows = jsonData.slice(1);
            
            // Enviar dados para o worker
            workerRef.current?.postMessage({
              type: 'process-xlsx',
              data: { headers, dataRows },
              id: taskId
            });
          }).catch((error) => {
            reject(new Error(`Erro ao processar arquivo XLSX: ${error.message}`));
          });
        }).catch((error) => {
          reject(new Error(`Erro ao ler arquivo: ${error.message}`));
        });

      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Função para processar OFX usando worker
  const processOFX = useCallback(async (file: File): Promise<ImportedTransaction[]> => {
    if (!workerRef.current) {
      // Fallback para processamento síncrono se worker não estiver disponível
      devWarn('Web Worker não disponível, usando processamento síncrono');
      return processOFXSync(file);
    }

    return new Promise<ImportedTransaction[]>((resolve, reject) => {
      try {
        setIsProcessing(true);
        setProgress(null);
        
        // Gerar ID único para esta tarefa
        const taskId = `ofx-${Date.now()}-${Math.random()}`;
        currentTaskId.current = taskId;
        
        // Armazenar referências para resolver/rejeitar
        resolveCurrentTask.current = resolve;
        rejectCurrentTask.current = reject;

        // Ler arquivo como texto
        file.text().then((text) => {
          // Enviar dados para o worker
          workerRef.current?.postMessage({
            type: 'process-ofx',
            data: { text },
            id: taskId
          });
        }).catch((error) => {
          reject(new Error(`Erro ao ler arquivo OFX: ${error.message}`));
        });

      } catch (error) {
        reject(error);
      }
    });
  }, []);

  // Função para cancelar processamento
  const cancelProcessing = useCallback(() => {
    if (workerRef.current && isProcessing) {
      // Terminar worker atual e criar um novo
      workerRef.current.terminate();
      
      // Criar novo worker
      try {
        workerRef.current = new Worker(new URL('../workers/importWorker.ts', import.meta.url), {
          type: 'module'
        });
        
        // Reconfigurar listeners
        workerRef.current.onmessage = (event) => {
          const { type, data } = event.data;
          if (type === 'ready') {
            devLog('Novo Import Worker inicializado após cancelamento');
          }
        };
        
        workerRef.current.onerror = (error) => {
          devError('Erro no novo Import Worker:', error);
        };
        
      } catch (error) {
        devError('Erro ao recriar Import Worker:', error);
      }
      
      setIsProcessing(false);
      setProgress(null);
      
      // Rejeitar tarefa atual
      if (rejectCurrentTask.current) {
        rejectCurrentTask.current(new Error('Processamento cancelado pelo usuário'));
      }
    }
  }, [isProcessing]);

  // Funções de fallback síncrono
  const processXLSXSync = async (file: File): Promise<ImportedTransaction[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('Arquivo deve ter pelo menos cabeçalho e uma linha de dados');
      }
      
      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);
      
      // Mapeamento automático simples de colunas
      const columnMapping = {
        date: headers.findIndex(h => h.toLowerCase().includes('data') || h.toLowerCase().includes('date')),
        description: headers.findIndex(h => h.toLowerCase().includes('desc') || h.toLowerCase().includes('memo')),
        amount: headers.findIndex(h => h.toLowerCase().includes('valor') || h.toLowerCase().includes('amount')),
        type: headers.findIndex(h => h.toLowerCase().includes('tipo') || h.toLowerCase().includes('type')),
        category: headers.findIndex(h => h.toLowerCase().includes('categoria') || h.toLowerCase().includes('category')),
        tags: headers.findIndex(h => h.toLowerCase().includes('tag') || h.toLowerCase().includes('etiqueta'))
      };

      const transactions: ImportedTransaction[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i] as any[];
        if (!row || row.length === 0) continue;

        try {
          const date = columnMapping.date >= 0 ? String(row[columnMapping.date] || '') : '';
          const description = columnMapping.description >= 0 ? String(row[columnMapping.description] || '') : '';
          const amountStr = columnMapping.amount >= 0 ? String(row[columnMapping.amount] || '') : '';
          const typeStr = columnMapping.type >= 0 ? String(row[columnMapping.type] || '') : '';
          const category = columnMapping.category >= 0 ? String(row[columnMapping.category] || '') : '';
          const tagsStr = columnMapping.tags >= 0 ? String(row[columnMapping.tags] || '') : '';

          if (!date || !description || !amountStr) continue;

          const amount = parseAmount(amountStr);
          if (isNaN(amount) || amount === 0) continue;

          let type: 'income' | 'expense' = 'expense';
          if (typeStr) {
            const typeLower = typeStr.toLowerCase();
            if (typeLower.includes('receita') || typeLower.includes('income') || typeLower.includes('entrada')) {
              type = 'income';
            }
          } else {
            type = amount > 0 ? 'income' : 'expense';
          }

          const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];

          transactions.push({
            date: formatDate(date),
            description: description.trim(),
            amount: Math.abs(amount),
            type,
            category: category.trim() || undefined,
            tags
          });
        } catch (error) {
          devWarn(`Erro ao processar linha ${i + 2}:`, error);
          continue;
        }
      }
      
      return transactions;
    } catch (error) {
      throw new Error(`Erro ao processar arquivo XLSX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const processOFXSync = async (file: File): Promise<ImportedTransaction[]> => {
    try {
      const text = await file.text();
      const transactions: ImportedTransaction[] = [];
      
      devLog('Processamento OFX síncrono iniciado, tamanho do arquivo:', text.length);
      
      const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
      let match;
      let count = 0;
      let processedCount = 0;
      
      while ((match = transactionRegex.exec(text)) !== null) {
        const transactionBlock = match[1];
        processedCount++;
        
        try {
          // Suportar tanto DTPOST quanto DTPOSTED - capturar apenas os primeiros 8 dígitos da data
          const dateMatch = transactionBlock.match(/<DTPOST(?:ED)?>(\d{8})/);
          const amountMatch = transactionBlock.match(/<TRNAMT>([^<]+)<\/TRNAMT>/);
          const memoMatch = transactionBlock.match(/<MEMO>([^<]+)<\/MEMO>/);
          
          // Tentar também outros campos possíveis
          const fitIdMatch = transactionBlock.match(/<FITID>([^<]+)<\/FITID>/);
          const nameMatch = transactionBlock.match(/<NAME>([^<]+)<\/NAME>/);
          const checkNumMatch = transactionBlock.match(/<CHECKNUM>([^<]+)<\/CHECKNUM>/);
          
          // Suportar TRNTYPE para determinar tipo de transação
          const trnTypeMatch = transactionBlock.match(/<TRNTYPE>([^<]+)<\/TRNTYPE>/);
          
          if (dateMatch && amountMatch) {
            const dateStr = dateMatch[1];
            const amount = parseFloat(amountMatch[1]);
            
            // Usar MEMO, NAME ou CHECKNUM como descrição
            let description = '';
            if (memoMatch) {
              description = memoMatch[1].trim();
            } else if (nameMatch) {
              description = nameMatch[1].trim();
            } else if (checkNumMatch) {
              description = `Cheque ${checkNumMatch[1].trim()}`;
            } else {
              description = 'Transação sem descrição';
            }
            
            if (!isNaN(amount) && description && amount !== 0) {
              const year = dateStr.substring(0, 4);
              const month = dateStr.substring(4, 6);
              const day = dateStr.substring(6, 8);
              const date = `${year}-${month}-${day}`;
              
              // Determinar tipo baseado no TRNTYPE ou valor
              let type: 'income' | 'expense' = 'expense';
              if (trnTypeMatch) {
                const trnType = trnTypeMatch[1].toUpperCase();
                if (trnType === 'CREDIT' || trnType === 'DEP' || trnType === 'DEPOSIT') {
                  type = 'income';
                } else if (trnType === 'DEBIT' || trnType === 'WITHDRAWAL' || trnType === 'PAYMENT') {
                  type = 'expense';
                } else {
                  // Fallback para valor
                  type = amount > 0 ? 'income' : 'expense';
                }
              } else {
                // Fallback para valor se não houver TRNTYPE
                type = amount > 0 ? 'income' : 'expense';
              }
              
              // Categorização inteligente usando o novo sistema
              const engine = getCategoryEngine();
              const categorization = engine.categorize({
                date,
                description,
                amount: Math.abs(amount),
                type,
                category: undefined,
                tags: []
              });
              
              const category = categorization?.category;
              
              transactions.push({
                date,
                description,
                amount: Math.abs(amount),
                type,
                category,
                tags: []
              });
              
              count++;
            }
          }
        } catch (error) {
          devWarn(`Erro ao processar transação OFX ${processedCount}:`, error);
          continue;
        }
      }
      
      devLog(`Processamento OFX síncrono concluído: ${count} transações válidas de ${processedCount} processadas`);
      return transactions;
    } catch (error) {
      throw new Error(`Erro ao processar arquivo OFX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Funções utilitárias para fallback
  function parseAmount(amountStr: string): number {
    let cleanAmount = amountStr.replace(/[R$\s]/g, '');
    cleanAmount = cleanAmount.replace(',', '.');
    return parseFloat(cleanAmount);
  }

  function formatDate(dateStr: string): string {
    if (typeof dateStr === 'string') {
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            return dateStr.replace(/\//g, '-');
          } else {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
      }
      
      if (dateStr.includes('-') || /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
    }
    
    return String(dateStr);
  }

  return {
    isProcessing,
    progress,
    workerAvailable,
    processXLSX,
    processOFX,
    cancelProcessing
  };
};
