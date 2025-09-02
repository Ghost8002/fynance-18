// Web Worker para processamento assíncrono de importação
// Este worker processa arquivos XLSX e OFX sem bloquear a thread principal

interface WorkerMessage {
  type: 'process-xlsx' | 'process-ofx' | 'progress';
  data: any;
  id: string;
}

interface XLSXData {
  arrayBuffer: ArrayBuffer;
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
  
  // Buscar transações usando regex
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;
  let count = 0;
  
  while ((match = transactionRegex.exec(text)) !== null) {
    const transactionBlock = match[1];
    
    try {
      // Extrair dados básicos
      const dateMatch = transactionBlock.match(/<DTPOST>(\d{8})<\/DTPOST>/);
      const amountMatch = transactionBlock.match(/<TRNAMT>([^<]+)<\/TRNAMT>/);
      const memoMatch = transactionBlock.match(/<MEMO>([^<]+)<\/MEMO>/);
      
      if (dateMatch && amountMatch && memoMatch) {
        const dateStr = dateMatch[1];
        const amount = parseFloat(amountMatch[1]);
        const description = memoMatch[1].trim();
        
        if (!isNaN(amount) && description) {
          // Converter data OFX (YYYYMMDD) para formato padrão
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          const date = `${year}-${month}-${day}`;
          
          // Determinar tipo baseado no valor
          const type: 'income' | 'expense' = amount > 0 ? 'income' : 'expense';
          
          // Categorização básica baseada em palavras-chave
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
          
          count++;
        }
      }
    } catch (error) {
      console.warn('Erro ao processar transação OFX:', error);
      continue;
    }
  }
  
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
        // Para XLSX, precisamos primeiro converter o ArrayBuffer
        // Como o worker não tem acesso direto ao XLSX, vamos processar os dados já convertidos
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
