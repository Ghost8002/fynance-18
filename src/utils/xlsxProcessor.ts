import * as XLSX from 'xlsx';

export interface XLSXTemplate {
  transactions: XLSXTransaction[];
  categories: XLSXCategory[];
  metadata: {
    version: string;
    created_at: string;
    template_name: string;
  };
}

export interface XLSXTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  tags?: string[];
  reference?: string;
  row_number: number;
  validation_errors?: string[];
}

export interface XLSXCategory {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  sort_order?: number;
  is_default?: boolean;
}

export interface CategoryMapping {
  xlsxName: string;
  systemId?: string;
  systemName?: string;
  action: 'create' | 'map' | 'ignore';
  confidence: number;
  type: 'income' | 'expense';
  count: number;
}

export interface TagMapping {
  xlsxName: string;
  systemId?: string;
  systemName?: string;
  action: 'create' | 'map' | 'ignore';
  count: number;
}

export interface XLSXValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  statistics: {
    totalTransactions: number;
    validTransactions: number;
    invalidTransactions: number;
    totalCategories: number;
    mappedCategories: number;
    unmappedCategories: number;
    totalTags: number;
    mappedTags: number;
    unmappedTags: number;
  };
}

export class XLSXProcessor {
  private workbook: XLSX.WorkBook | null = null;
  private template: XLSXTemplate | null = null;
  private validationResult: XLSXValidationResult | null = null;

  /**
   * Processa arquivo XLSX e extrai dados estruturados
   */
  async processFile(file: File): Promise<XLSXTemplate> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const template: XLSXTemplate = {
        transactions: [],
        categories: [],
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          template_name: file.name
        }
      };

      // Processar abas
      for (const sheetName of this.workbook.SheetNames) {
        const worksheet = this.workbook.Sheets[sheetName];
        
        if (sheetName.toLowerCase().includes('transaç') || 
            sheetName.toLowerCase().includes('transaction') ||
            sheetName.toLowerCase().includes('dados')) {
          template.transactions = this.processTransactionsSheet(worksheet, sheetName);
        } else if (sheetName.toLowerCase().includes('categor') || 
                   sheetName.toLowerCase().includes('category')) {
          template.categories = this.processCategoriesSheet(worksheet, sheetName);
        }
      }

      // Se não encontrou aba de categorias, extrair das transações
      if (template.categories.length === 0) {
        template.categories = this.extractCategoriesFromTransactions(template.transactions);
      }

      this.template = template;
      return template;
    } catch (error) {
      throw new Error(`Erro ao processar arquivo XLSX: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Processa aba de transações
   */
  private processTransactionsSheet(worksheet: XLSX.WorkSheet, sheetName: string): XLSXTransaction[] {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error(`Aba "${sheetName}" deve ter pelo menos cabeçalho e uma linha de dados`);
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);
    const transactions: XLSXTransaction[] = [];

    // Mapeamento automático de colunas
    const columnMapping = this.autoMapColumns(headers);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[];
      if (!row || row.length === 0) continue;

      try {
        const transaction = this.parseTransactionRow(row, headers, columnMapping, i + 2);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Erro ao processar linha ${i + 2}:`, error);
      }
    }

    return transactions;
  }

  /**
   * Processa aba de categorias
   */
  private processCategoriesSheet(worksheet: XLSX.WorkSheet, sheetName: string): XLSXCategory[] {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      return [];
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);
    const categories: XLSXCategory[] = [];

    // Mapeamento de colunas para categorias
    const nameCol = headers.findIndex(h => 
      h.toLowerCase().includes('nome') || h.toLowerCase().includes('name')
    );
    const typeCol = headers.findIndex(h => 
      h.toLowerCase().includes('tipo') || h.toLowerCase().includes('type')
    );
    const colorCol = headers.findIndex(h => 
      h.toLowerCase().includes('cor') || h.toLowerCase().includes('color')
    );
    const sortCol = headers.findIndex(h => 
      h.toLowerCase().includes('ordem') || h.toLowerCase().includes('sort')
    );

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as any[];
      if (!row || row.length === 0) continue;

      const name = nameCol >= 0 ? String(row[nameCol] || '').trim() : '';
      const typeStr = typeCol >= 0 ? String(row[typeCol] || '').trim() : '';
      const color = colorCol >= 0 ? String(row[colorCol] || '') : undefined;
      const sortOrder = sortCol >= 0 ? Number(row[sortCol]) || 0 : undefined;

      if (name && typeStr) {
        const type = this.normalizeTransactionType(typeStr);
        if (type) {
          categories.push({
            name: this.normalizeCategoryName(name),
            type,
            color,
            sort_order: sortOrder,
            is_default: false
          });
        }
      }
    }

    return categories;
  }

  /**
   * Extrai categorias das transações se não houver aba dedicada
   */
  private extractCategoriesFromTransactions(transactions: XLSXTransaction[]): XLSXCategory[] {
    const categoryMap = new Map<string, { count: number; type: 'income' | 'expense' }>();

    transactions.forEach(transaction => {
      if (transaction.category) {
        const normalizedName = this.normalizeCategoryName(transaction.category);
        const existing = categoryMap.get(normalizedName);
        
        if (existing) {
          existing.count++;
          // Se tipos diferentes, usar o mais comum
          if (existing.type !== transaction.type) {
            // Decidir baseado na contagem ou manter o primeiro
            if (transaction.type === 'expense') {
              existing.type = 'expense'; // Preferir despesa para categorias ambíguas
            }
          }
        } else {
          categoryMap.set(normalizedName, {
            count: 1,
            type: transaction.type
          });
        }
      }
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      type: data.type,
      is_default: false
    }));
  }

  /**
   * Mapeamento automático de colunas
   */
  private autoMapColumns(headers: string[]): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    headers.forEach((header, index) => {
      const headerLower = header.toLowerCase();
      
      if (headerLower.includes('data') || headerLower.includes('date')) {
        mapping[header] = 'date';
      } else if (headerLower.includes('desc') || headerLower.includes('memo') || headerLower.includes('obs')) {
        mapping[header] = 'description';
      } else if (headerLower.includes('valor') || headerLower.includes('amount') || headerLower.includes('montante')) {
        mapping[header] = 'amount';
      } else if (headerLower.includes('tipo') || headerLower.includes('type')) {
        mapping[header] = 'type';
      } else if (headerLower.includes('categoria') || headerLower.includes('category')) {
        mapping[header] = 'category';
      } else if (headerLower.includes('tag') || headerLower.includes('etiqueta')) {
        mapping[header] = 'tags';
      }
    });

    return mapping;
  }

  /**
   * Parse de uma linha de transação
   */
  private parseTransactionRow(
    row: any[], 
    headers: string[], 
    columnMapping: { [key: string]: string },
    rowNumber: number
  ): XLSXTransaction | null {
    const getValue = (field: string): string => {
      const columnName = Object.keys(columnMapping).find(key => columnMapping[key] === field);
      if (!columnName) return '';
      
      const columnIndex = headers.indexOf(columnName);
      return columnIndex >= 0 && columnIndex < row.length ? String(row[columnIndex] || '') : '';
    };

    const date = getValue('date');
    const description = getValue('description');
    const amountStr = getValue('amount');
    const typeStr = getValue('type');
    const category = getValue('category');
    const tagsStr = getValue('tags');

    if (!date || !description || !amountStr) {
      return null;
    }

    // Processar valor
    const amount = this.parseAmount(amountStr);
    if (isNaN(amount) || amount === 0) {
      return null;
    }

    // Determinar tipo
    let type: 'income' | 'expense' = 'expense';
    if (typeStr) {
      type = this.normalizeTransactionType(typeStr) || (amount > 0 ? 'income' : 'expense');
    } else {
      type = amount > 0 ? 'income' : 'expense';
    }

    // Garantir que amount seja positivo
    const finalAmount = Math.abs(amount);

    // Processar tags
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];

    return {
      date: this.formatDate(date),
      description: description.trim(),
      amount: finalAmount,
      type,
      category: category ? this.normalizeCategoryName(category) : undefined,
      tags,
      reference: `XLSX-${rowNumber}`,
      row_number: rowNumber
    };
  }

  /**
   * Normaliza nome de categoria
   */
  normalizeCategoryName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/\s+/g, ' ') // Normaliza espaços
      .replace(/[^\w\s]/g, '') // Remove caracteres especiais
      .trim();
  }

  /**
   * Normaliza tipo de transação
   */
  normalizeTransactionType(type: string): 'income' | 'expense' | null {
    const typeLower = type.toLowerCase().trim();
    
    if (typeLower.includes('receita') || typeLower.includes('income') || 
        typeLower.includes('entrada') || typeLower.includes('ganho')) {
      return 'income';
    } else if (typeLower.includes('despesa') || typeLower.includes('expense') || 
               typeLower.includes('saída') || typeLower.includes('gasto')) {
      return 'expense';
    }
    
    return null;
  }

  /**
   * Parse de valor monetário
   */
  parseAmount(amountStr: string): number {
    let cleanAmount = amountStr.replace(/[R$\s]/g, '');
    cleanAmount = cleanAmount.replace(',', '.');
    return parseFloat(cleanAmount);
  }

  /**
   * Formata data
   */
  formatDate(dateStr: string): string {
    if (typeof dateStr === 'string') {
      const dateFormats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
        /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
      ];

      for (const format of dateFormats) {
        if (format.test(dateStr)) {
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[0].length === 4) {
              return dateStr.replace(/\//g, '-');
            } else {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          } else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts[0].length === 4) {
              return dateStr;
            } else {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
        }
      }
    }
    
    return String(dateStr);
  }

  /**
   * Valida dados extraídos
   */
  validateData(existingCategories: any[] = []): XLSXValidationResult {
    if (!this.template) {
      throw new Error('Nenhum template carregado para validação');
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let validTransactions = 0;
    let invalidTransactions = 0;

    // Validar transações
    this.template.transactions.forEach(transaction => {
      const transactionErrors: string[] = [];

      // Validar data
      if (!transaction.date || !this.isValidDate(transaction.date)) {
        transactionErrors.push('Data inválida');
      }

      // Validar descrição
      if (!transaction.description || transaction.description.length < 2) {
        transactionErrors.push('Descrição muito curta');
      }

      // Validar valor
      if (transaction.amount <= 0) {
        transactionErrors.push('Valor deve ser maior que zero');
      }

      // Validar categoria
      if (transaction.category) {
        const normalizedCategory = this.normalizeCategoryName(transaction.category);
        const existingCategory = existingCategories.find(cat => 
          this.normalizeCategoryName(cat.name) === normalizedCategory
        );
        
        if (!existingCategory) {
          warnings.push(`Categoria "${transaction.category}" não existe no sistema`);
        }
      }

      if (transactionErrors.length > 0) {
        invalidTransactions++;
        errors.push(`Linha ${transaction.row_number}: ${transactionErrors.join(', ')}`);
        transaction.validation_errors = transactionErrors;
      } else {
        validTransactions++;
      }
    });

    // Estatísticas
    const statistics = {
      totalTransactions: this.template.transactions.length,
      validTransactions: validTransactions,
      invalidTransactions: invalidTransactions,
      totalCategories: this.template.categories.length,
      mappedCategories: this.template.categories.filter(cat => 
        !existingCategories.find(existing => 
          this.normalizeCategoryName(existing.name) === this.normalizeCategoryName(cat.name)
        )
      ).length,
      unmappedCategories: this.template.categories.filter(cat => 
        existingCategories.find(existing => 
          this.normalizeCategoryName(existing.name) === this.normalizeCategoryName(cat.name)
        )
      ).length,
      totalTags: 0, // Placeholder, will be updated by detectCategoriesAndTags
      mappedTags: 0, // Placeholder, will be updated by detectCategoriesAndTags
      unmappedTags: 0 // Placeholder, will be updated by detectCategoriesAndTags
    };

    this.validationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      statistics
    };

    return this.validationResult;
  }

  /**
   * Verifica se data é válida
   */
  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  /**
   * Detecta automaticamente categorias e tags na planilha
   */
  detectCategoriesAndTags(transactions: XLSXTransaction[]): {
    categories: { name: string; type: 'income' | 'expense'; count: number }[];
    tags: { name: string; count: number }[];
  } {
    const categoryMap = new Map<string, { type: 'income' | 'expense'; count: number }>();
    const tagMap = new Map<string, number>();

    transactions.forEach(transaction => {
      // Processar categoria
      if (transaction.category) {
        const normalizedName = this.normalizeCategoryName(transaction.category);
        const existing = categoryMap.get(normalizedName);
        
        if (existing) {
          existing.count++;
          // Se tipos diferentes, usar o mais comum
          if (existing.type !== transaction.type) {
            // Decidir baseado na contagem ou manter o primeiro
            if (transaction.type === 'expense') {
              existing.type = 'expense'; // Preferir despesa para categorias ambíguas
            }
          }
        } else {
          categoryMap.set(normalizedName, {
            count: 1,
            type: transaction.type
          });
        }
      }

      // Processar tags
      if (transaction.tags && transaction.tags.length > 0) {
        transaction.tags.forEach(tag => {
          const normalizedTag = tag.trim().toLowerCase();
          if (normalizedTag) {
            tagMap.set(normalizedTag, (tagMap.get(normalizedTag) || 0) + 1);
          }
        });
      }
    });

    return {
      categories: Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        type: data.type,
        count: data.count
      })),
      tags: Array.from(tagMap.entries()).map(([name, count]) => ({
        name,
        count
      }))
    };
  }

  /**
   * Gera mapeamento automático de categorias
   */
  generateCategoryMapping(
    detectedCategories: { name: string; type: 'income' | 'expense'; count: number }[],
    existingCategories: any[]
  ): CategoryMapping[] {
    const mappings: CategoryMapping[] = [];

    detectedCategories.forEach(detected => {
      // Buscar categoria existente com melhor match
      let bestMatch: any = null;
      let bestConfidence = 0;

      existingCategories.forEach(existing => {
        const confidence = this.calculateCategoryConfidence(detected.name, existing.name);
        if (confidence > bestConfidence && confidence > 0.7) {
          bestConfidence = confidence;
          bestMatch = existing;
        }
      });

      if (bestMatch) {
        mappings.push({
          xlsxName: detected.name,
          systemId: bestMatch.id,
          systemName: bestMatch.name,
          action: 'map',
          confidence: bestConfidence,
          type: detected.type,
          count: detected.count
        });
      } else {
        mappings.push({
          xlsxName: detected.name,
          action: 'create',
          confidence: 0,
          type: detected.type,
          count: detected.count
        });
      }
    });

    return mappings;
  }

  /**
   * Gera mapeamento automático de tags
   */
  generateTagMapping(
    detectedTags: { name: string; count: number }[],
    existingTags: any[]
  ): TagMapping[] {
    const mappings: TagMapping[] = [];

    detectedTags.forEach(detected => {
      // Buscar tag existente com melhor match
      let bestMatch: any = null;
      let bestConfidence = 0;

      existingTags.forEach(existing => {
        const confidence = this.calculateTagConfidence(detected.name, existing.name);
        if (confidence > bestConfidence && confidence > 0.8) {
          bestConfidence = confidence;
          bestMatch = existing;
        }
      });

      if (bestMatch) {
        mappings.push({
          xlsxName: detected.name,
          systemId: bestMatch.id,
          systemName: bestMatch.name,
          action: 'map',
          count: detected.count
        });
      } else {
        mappings.push({
          xlsxName: detected.name,
          action: 'create',
          count: detected.count
        });
      }
    });

    return mappings;
  }

  /**
   * Calcula confiança entre duas categorias
   */
  private calculateCategoryConfidence(name1: string, name2: string): number {
    const normalized1 = this.normalizeCategoryName(name1);
    const normalized2 = this.normalizeCategoryName(name2);

    if (normalized1 === normalized2) return 1.0;
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9;
    
    // Calcular similaridade usando algoritmo de Levenshtein
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Calcula confiança entre duas tags
   */
  private calculateTagConfidence(tag1: string, tag2: string): number {
    const normalized1 = tag1.toLowerCase().trim();
    const normalized2 = tag2.toLowerCase().trim();

    if (normalized1 === normalized2) return 1.0;
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.9;
    
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Calcula distância de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Cria template XLSX avançado
   */
  static createAdvancedTemplate(): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // Aba de transações
    const transactionData = [
      {
        Data: '2024-01-15',
        Descrição: 'Compra no supermercado',
        Valor: -150.50,
        Tipo: 'Despesa',
        Categoria: 'Alimentação',
        Tags: 'compras, mercado'
      },
      {
        Data: '2024-01-16',
        Descrição: 'Salário',
        Valor: 3000.00,
        Tipo: 'Receita',
        Categoria: 'Salário',
        Tags: 'trabalho, renda'
      }
    ];

    const transactionSheet = XLSX.utils.json_to_sheet(transactionData);
    transactionSheet['!cols'] = [
      { wch: 12 }, // Data
      { wch: 25 }, // Descrição
      { wch: 12 }, // Valor
      { wch: 10 }, // Tipo
      { wch: 15 }, // Categoria
      { wch: 20 }  // Tags
    ];

    // Aba de categorias
    const categoryData = [
      {
        Nome: 'Alimentação',
        Tipo: 'Despesa',
        Cor: '#EF4444',
        Ordem: 1
      },
      {
        Nome: 'Transporte',
        Tipo: 'Despesa',
        Cor: '#F97316',
        Ordem: 2
      },
      {
        Nome: 'Salário',
        Tipo: 'Receita',
        Cor: '#10B981',
        Ordem: 1
      }
    ];

    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    categorySheet['!cols'] = [
      { wch: 15 }, // Nome
      { wch: 10 }, // Tipo
      { wch: 8 },  // Cor
      { wch: 8 }   // Ordem
    ];

    // Adicionar abas ao workbook
    XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transações');
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categorias');

    return workbook;
  }

  /**
   * Cria template XLSX simples para importação básica
   */
  static createSimpleTemplate(): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // Dados de exemplo para o template
    const transactionData = [
      {
        Data: '15/01/2024',
        Descrição: 'Compra no supermercado',
        Valor: -150.50,
        Tipo: 'Despesa',
        Categoria: 'Alimentação',
        Tags: 'compras, mercado'
      },
      {
        Data: '16/01/2024',
        Descrição: 'Salário',
        Valor: 3000.00,
        Tipo: 'Receita',
        Categoria: 'Salário',
        Tags: 'trabalho, renda'
      },
      {
        Data: '17/01/2024',
        Descrição: 'Combustível',
        Valor: -80.00,
        Tipo: 'Despesa',
        Categoria: 'Transporte',
        Tags: 'carro, posto'
      },
      {
        Data: '18/01/2024',
        Descrição: 'Freelance',
        Valor: 500.00,
        Tipo: 'Receita',
        Categoria: 'Trabalho Extra',
        Tags: 'freelance, renda'
      },
      {
        Data: '19/01/2024',
        Descrição: 'Conta de luz',
        Valor: -120.00,
        Tipo: 'Despesa',
        Categoria: 'Moradia',
        Tags: 'conta, moradia'
      }
    ];

    // Criar planilha com dados
    const worksheet = XLSX.utils.json_to_sheet(transactionData);
    
    // Configurar largura das colunas
    worksheet['!cols'] = [
      { wch: 12 }, // Data
      { wch: 30 }, // Descrição
      { wch: 12 }, // Valor
      { wch: 10 }, // Tipo
      { wch: 15 }, // Categoria
      { wch: 25 }  // Tags
    ];

    // Adicionar planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

    return workbook;
  }

  /**
   * Gera arquivo XLSX para download
   */
  static generateXLSXFile(template: XLSX.WorkBook, filename: string): void {
    // Gerar arquivo XLSX
    XLSX.writeFile(template, filename);
  }

  /**
   * Obtém resultado da validação
   */
  getValidationResult(): XLSXValidationResult | null {
    return this.validationResult;
  }

  /**
   * Obtém template processado
   */
  getTemplate(): XLSXTemplate | null {
    return this.template;
  }
}
