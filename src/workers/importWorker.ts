// Web Worker para processamento assíncrono de importação
// Este worker processa arquivos XLSX e OFX sem bloquear a thread principal

// Importar o sistema de categorização
import { CategoryEngine } from '../utils/categorization/CategoryEngine';

interface WorkerMessage {
  type: 'process-xlsx' | 'process-ofx' | 'progress';
  data: any;
  id: string;
}

interface XLSXData {
  headers: string[];
  dataRows: any[][];
}

interface OFXData {
  text: string;
}

interface ProcessedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  tags?: string[];
}

// Instância global do motor de categorização
let categoryEngine: CategoryEngine | null = null;

// Inicializar motor de categorização
function initializeCategoryEngine() {
  if (!categoryEngine) {
    categoryEngine = new CategoryEngine({
      minConfidence: 70,
      enableLearning: true
    });
  }
  return categoryEngine;
}

// Função para processar XLSX
function processXLSX(data: XLSXData): ProcessedTransaction[] {
  const { headers, dataRows } = data;
  
  // Mapeamento automático de colunas
  const columnMapping = {
    date: headers.findIndex(h => h.toLowerCase().includes('data') || h.toLowerCase().includes('date')),
    description: headers.findIndex(h => h.toLowerCase().includes('desc') || h.toLowerCase().includes('memo')),
    amount: headers.findIndex(h => h.toLowerCase().includes('valor') || h.toLowerCase().includes('amount')),
    type: headers.findIndex(h => h.toLowerCase().includes('tipo') || h.toLowerCase().includes('type')),
    category: headers.findIndex(h => h.toLowerCase().includes('categoria') || h.toLowerCase().includes('category')),
    tags: headers.findIndex(h => h.toLowerCase().includes('tag') || h.toLowerCase().includes('etiqueta'))
  };

  const transactions: ProcessedTransaction[] = [];
  const totalRows = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    try {
      // Extrair dados básicos
      const date = columnMapping.date >= 0 ? String(row[columnMapping.date] || '') : '';
      const description = columnMapping.description >= 0 ? String(row[columnMapping.description] || '') : '';
      const amountStr = columnMapping.amount >= 0 ? String(row[columnMapping.amount] || '') : '';
      const typeStr = columnMapping.type >= 0 ? String(row[columnMapping.type] || '') : '';
      const category = columnMapping.category >= 0 ? String(row[columnMapping.category] || '') : '';
      const tagsStr = columnMapping.tags >= 0 ? String(row[columnMapping.tags] || '') : '';

      // Validação básica
      if (!date || !description || !amountStr) continue;

      // Processar valor monetário
      const amount = parseAmount(amountStr);
      if (isNaN(amount) || amount === 0) continue;

      // Determinar tipo
      let type: 'income' | 'expense' = 'expense';
      if (typeStr) {
        const typeLower = typeStr.toLowerCase();
        if (typeLower.includes('receita') || typeLower.includes('income') || typeLower.includes('entrada')) {
          type = 'income';
        }
      } else {
        type = amount > 0 ? 'income' : 'expense';
      }

      // Processar tags
      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];

      transactions.push({
        date: formatDate(date),
        description: description.trim(),
        amount: Math.abs(amount),
        type,
        category: category.trim() || undefined,
        tags
      });

      // Reportar progresso a cada 100 linhas ou 10% do total
      if (i % Math.max(1, Math.floor(totalRows / 10)) === 0) {
        self.postMessage({
          type: 'progress',
          data: { progress: (i / totalRows) * 100, processed: i, total: totalRows }
        });
      }
    } catch (error) {
      console.warn(`Erro ao processar linha ${i + 2}:`, error);
      continue;
    }
  }

  return transactions;
}

// Função para processar OFX
function processOFX(data: OFXData): ProcessedTransaction[] {
  const { text } = data;
  const transactions: ProcessedTransaction[] = [];
  
  console.log('Iniciando processamento OFX, tamanho do arquivo:', text.length);
  
  // Buscar transações usando regex mais robusto
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  let count = 0;
  let processedCount = 0;
  
  while ((match = transactionRegex.exec(text)) !== null) {
    const transactionBlock = match[1];
    processedCount++;
    
    try {
      // Extrair dados básicos com regex mais flexíveis
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
      
      console.log(`Processando transação ${processedCount}:`, {
        hasDate: !!dateMatch,
        hasAmount: !!amountMatch,
        hasMemo: !!memoMatch,
        hasFitId: !!fitIdMatch,
        hasName: !!nameMatch,
        hasCheckNum: !!checkNumMatch,
        hasTrnType: !!trnTypeMatch,
        trnType: trnTypeMatch ? trnTypeMatch[1] : 'N/A'
      });
      
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
        
        console.log(`Transação ${processedCount} - Data: ${dateStr}, Valor: ${amount}, Descrição: ${description}`);
        
        if (!isNaN(amount) && description && amount !== 0) {
          // Converter data OFX (YYYYMMDD) para formato padrão
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
          const engine = initializeCategoryEngine();
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
          console.log(`Transação ${count} adicionada: ${description} - R$ ${Math.abs(amount)}`);
        } else {
          console.warn(`Transação ${processedCount} ignorada - valor inválido ou descrição vazia:`, {
            amount,
            description,
            isValidAmount: !isNaN(amount) && amount !== 0,
            hasDescription: !!description
          });
        }
      } else {
        console.warn(`Transação ${processedCount} ignorada - campos obrigatórios ausentes:`, {
          hasDate: !!dateMatch,
          hasAmount: !!amountMatch,
          transactionBlock: transactionBlock.substring(0, 200) + '...'
        });
      }
    } catch (error) {
      console.warn(`Erro ao processar transação OFX ${processedCount}:`, error);
      continue;
    }
  }
  
  console.log(`Processamento OFX concluído: ${count} transações válidas de ${processedCount} processadas`);
  return transactions;
}

// Funções utilitárias
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

// Listener para mensagens do thread principal
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, data, id } = event.data;
  
  try {
    let result: ProcessedTransaction[] = [];
    
    switch (type) {
      case 'process-xlsx':
        // Processar dados XLSX já convertidos
        result = processXLSX(data);
        break;
        
      case 'process-ofx':
        result = processOFX(data);
        break;
        
      default:
        throw new Error(`Tipo de mensagem desconhecido: ${type}`);
    }
    
    // Enviar resultado de volta
    self.postMessage({
      type: 'result',
      data: { transactions: result, id }
    });
    
  } catch (error) {
    // Enviar erro de volta
    self.postMessage({
      type: 'error',
      data: { 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        id 
      }
    });
  }
});

// Notificar que o worker está pronto
self.postMessage({ type: 'ready', data: { message: 'Import Worker inicializado' } });
