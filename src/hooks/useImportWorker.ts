import { useState, useCallback, useRef, useEffect } from 'react';
import { ImportedTransaction } from './useImport';

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
              console.log('Import Worker inicializado:', data.message);
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
                resolveCurrentTask(data.transactions);
              }
              break;

            case 'error':
              if (data.id === currentTaskId.current) {
                setIsProcessing(false);
                setProgress(null);
                // Rejeitar a promise com o erro
                rejectCurrentTask(new Error(data.error));
              }
              break;
          }
        };

        workerRef.current.onerror = (error) => {
          console.error('Erro no Import Worker:', error);
          setIsProcessing(false);
          setProgress(null);
          rejectCurrentTask(error);
        };

        return () => {
          if (workerRef.current) {
            workerRef.current.terminate();
          }
        };
      } catch (error) {
        console.error('Erro ao inicializar Import Worker:', error);
      }
    }
  }, []);

  // Referências para resolver/rejeitar promises
  const resolveCurrentTask = useRef<(transactions: ImportedTransaction[]) => void>();
  const rejectCurrentTask = useRef<(error: Error) => void>();

  // Função para processar XLSX usando worker
  const processXLSX = useCallback(async (file: File): Promise<ImportedTransaction[]> => {
    if (!workerRef.current) {
      // Fallback para processamento síncrono se worker não estiver disponível
      console.warn('Web Worker não disponível, usando processamento síncrono');
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
      console.warn('Web Worker não disponível, usando processamento síncrono');
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
            console.log('Novo Import Worker inicializado após cancelamento');
          }
        };
        
        workerRef.current.onerror = (error) => {
          console.error('Erro no novo Import Worker:', error);
        };
        
      } catch (error) {
        console.error('Erro ao recriar Import Worker:', error);
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

          const amount = parseFloat(amountStr.replace(/[R$\s]/g, '').replace(',', '.'));
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
          console.warn(`Erro ao processar linha ${i + 2}:`, error);
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
              const year = dateStr.substring(0, 4);
              const month = dateStr.substring(4, 6);
              const day = dateStr.substring(6, 8);
              const date = `${year}-${month}-${day}`;
              
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
