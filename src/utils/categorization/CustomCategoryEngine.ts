/**
 * Motor de Categorização Customizado
 * Usa especificamente o banco de dados CATEGORIAS E PALAVRAS-CHAVE.txt
 */

import { 
  CUSTOM_KEYWORD_DATABASE, 
  CustomCategoryMapping,
  findCategoryByKeyword,
  normalizeDescription,
  extractKeywords,
  getCustomCategoriesByType
} from './CustomKeywordDatabase';

export interface CustomCategorizationResult {
  category: string;
  categoryKey: string;
  confidence: number;
  method: 'exact' | 'partial' | 'keyword' | 'context';
  matchedKeyword?: string;
  matchedKeywords?: string[];
  type: 'income' | 'expense';
  alternatives?: Array<{
    category: string;
    categoryKey: string;
    confidence: number;
    reason: string;
  }>;
  warnings?: string[];
}

export interface TransactionContext {
  description: string;
  amount: number;
  originalType: 'income' | 'expense';
  date?: string;
}

export class CustomCategoryEngine {
  private minConfidence: number;
  private enableTypeCorrection: boolean;
  private cache: Map<string, CustomCategorizationResult | null> = new Map();

  constructor(options: {
    minConfidence?: number;
    enableTypeCorrection?: boolean;
  } = {}) {
    this.minConfidence = options.minConfidence || 70;
    this.enableTypeCorrection = options.enableTypeCorrection !== false;
  }

  /**
   * Categoriza uma transação usando o banco de dados customizado
   */
  categorize(
    transaction: TransactionContext,
    availableCategories?: string[]
  ): CustomCategorizationResult | null {
    // Criar chave de cache
    const cacheKey = `${normalizeDescription(transaction.description)}_${transaction.originalType}_${availableCategories?.join(',') || 'all'}`;
    
    // Verificar cache primeiro
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }

    const normalizedDescription = normalizeDescription(transaction.description);
    const keywords = extractKeywords(normalizedDescription);

    // 1. Busca exata por palavras-chave
    const exactMatches = this.findExactMatches(normalizedDescription, keywords);
    
    // 2. Busca parcial (palavras-chave contidas na descrição)
    const partialMatches = this.findPartialMatches(normalizedDescription, keywords);
    
    // 3. Busca por contexto (análise semântica)
    const contextMatches = this.findContextMatches(normalizedDescription, transaction);

    // Combinar todos os resultados - CONTEXTO PRIMEIRO (mais preciso)
    const allMatches = [...contextMatches, ...exactMatches, ...partialMatches];

    // Filtrar por categorias disponíveis se especificado
    const filteredMatches = availableCategories 
      ? allMatches.filter(match => availableCategories.includes(match.category))
      : allMatches;

    if (filteredMatches.length === 0) {
      return null;
    }

    // Ordenar por confiança e prioridade
    const sortedMatches = filteredMatches.sort((a, b) => {
      const scoreA = a.confidence * this.getCategoryPriority(a.categoryKey);
      const scoreB = b.confidence * this.getCategoryPriority(b.categoryKey);
      return scoreB - scoreA;
    });

    const bestMatch = sortedMatches[0];

    // Verificar se a confiança é suficiente
    if (bestMatch.confidence < this.minConfidence) {
      return null;
    }

    // Validar consistência de tipo
    const warnings = this.validateTypeConsistency(bestMatch, transaction);

    // Corrigir tipo se necessário - APENAS se há inconsistência clara
    let finalType = bestMatch.type;
    if (this.enableTypeCorrection && warnings.length > 0) {
      const typeCorrection = this.correctTransactionType(transaction, bestMatch);
      if (typeCorrection.correctedType && typeCorrection.correctedType !== transaction.originalType) {
        finalType = typeCorrection.correctedType;
        warnings.push(`Tipo corrigido: ${typeCorrection.reason}`);
      }
    }

    const result: CustomCategorizationResult = {
      category: bestMatch.category,
      categoryKey: bestMatch.categoryKey,
      confidence: bestMatch.confidence,
      method: bestMatch.method,
      matchedKeyword: bestMatch.matchedKeyword,
      matchedKeywords: bestMatch.matchedKeywords,
      type: finalType,
      alternatives: sortedMatches.slice(1, 4).map(match => ({
        category: match.category,
        categoryKey: match.categoryKey,
        confidence: match.confidence,
        reason: `${match.method}: ${match.matchedKeyword}`
      })),
      warnings: warnings.length > 0 ? warnings : undefined
    };

    // Armazenar no cache (limitado a 1000 entradas para evitar vazamento de memória)
    if (this.cache.size >= 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * Busca exata por palavras-chave
   */
  private findExactMatches(description: string, keywords: string[]): Array<{
    category: string;
    categoryKey: string;
    confidence: number;
    method: 'exact';
    matchedKeyword: string;
    matchedKeywords: string[];
    type: 'income' | 'expense';
  }> {
    const matches: Array<{
      category: string;
      categoryKey: string;
      confidence: number;
      method: 'exact';
      matchedKeyword: string;
      matchedKeywords: string[];
      type: 'income' | 'expense';
    }> = [];

    for (const [categoryKey, categoryInfo] of Object.entries(CUSTOM_KEYWORD_DATABASE)) {
      const matchedKeywords: string[] = [];
      
      for (const keyword of categoryInfo.keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Busca exata - descrição idêntica à palavra-chave
        if (description === keywordLower) {
          matchedKeywords.push(keyword);
          matches.push({
            category: categoryInfo.name,
            categoryKey,
            confidence: categoryInfo.confidence,
            method: 'exact',
            matchedKeyword: keyword,
            matchedKeywords: [...matchedKeywords],
            type: categoryInfo.type
          });
        }
      }
    }

    return matches;
  }

  /**
   * Busca parcial (palavras-chave contidas na descrição)
   */
  private findPartialMatches(description: string, keywords: string[]): Array<{
    category: string;
    categoryKey: string;
    confidence: number;
    method: 'partial';
    matchedKeyword: string;
    matchedKeywords: string[];
    type: 'income' | 'expense';
  }> {
    const matches: Array<{
      category: string;
      categoryKey: string;
      confidence: number;
      method: 'partial';
      matchedKeyword: string;
      matchedKeywords: string[];
      type: 'income' | 'expense';
    }> = [];

    for (const [categoryKey, categoryInfo] of Object.entries(CUSTOM_KEYWORD_DATABASE)) {
      const matchedKeywords: string[] = [];
      
      for (const keyword of categoryInfo.keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Busca parcial - palavra-chave contida na descrição (mas não exata)
        if (description.includes(keywordLower) && description !== keywordLower) {
          // Calcular confiança baseada no tamanho da palavra-chave vs descrição
          const keywordLength = keywordLower.length;
          const descriptionLength = description.length;
          const lengthRatio = keywordLength / descriptionLength;
          
          // Confiança baseada na proporção da palavra-chave na descrição
          let confidence = categoryInfo.confidence * Math.min(lengthRatio * 2, 0.9); // Máximo 90% da confiança original
          
          // Reduzir confiança para palavras muito curtas (evitar matches fracos)
          if (keywordLength < 4) {
            confidence *= 0.7;
          }
          
          // Reduzir confiança para palavras muito genéricas
          if (['loja', 'pagamento', 'compra'].includes(keywordLower)) {
            confidence *= 0.8;
          }
          
          matchedKeywords.push(keyword);
          matches.push({
            category: categoryInfo.name,
            categoryKey,
            confidence: Math.round(confidence),
            method: 'partial',
            matchedKeyword: keyword,
            matchedKeywords: [...matchedKeywords],
            type: categoryInfo.type
          });
        }
      }
    }

    return matches;
  }

  /**
   * Busca por contexto (análise semântica)
   */
  private findContextMatches(description: string, transaction: TransactionContext): Array<{
    category: string;
    categoryKey: string;
    confidence: number;
    method: 'context';
    matchedKeyword: string;
    matchedKeywords: string[];
    type: 'income' | 'expense';
  }> {
    const matches: Array<{
      category: string;
      categoryKey: string;
      confidence: number;
      method: 'context';
      matchedKeyword: string;
      matchedKeywords: string[];
      type: 'income' | 'expense';
    }> = [];

    // Análise de padrões específicos - PADRÕES MAIS ROBUSTOS
    const contextPatterns = [
      // PIX - Padrões mais específicos primeiro
      {
        pattern: /pix\s+recebido/i,
        categories: [{ key: 'transferencias_recebidas', type: 'income' as const }]
      },
      {
        pattern: /pix\s+enviado/i,
        categories: [{ key: 'transferencias_enviadas', type: 'expense' as const }]
      },
      // Transferências - Padrões específicos
      {
        pattern: /transfer[êe]ncia\s+recebida/i,
        categories: [{ key: 'transferencias_recebidas', type: 'income' as const }]
      },
      {
        pattern: /transfer[êe]ncia\s+enviada/i,
        categories: [{ key: 'transferencias_enviadas', type: 'expense' as const }]
      },
      // Depósitos e Saques
      {
        pattern: /dep[óo]sito/i,
        categories: [{ key: 'transferencias_recebidas', type: 'income' as const }]
      },
      {
        pattern: /saque/i,
        categories: [{ key: 'transferencias_enviadas', type: 'expense' as const }]
      },
      // Salário
      {
        pattern: /sal[áa]rio/i,
        categories: [{ key: 'salario_rendas', type: 'income' as const }]
      },
      // Pagamentos genéricos
      {
        pattern: /pagamento\s+de|pago\s+para/i,
        categories: [{ key: 'transferencias_enviadas', type: 'expense' as const }]
      }
    ];

    for (const patternInfo of contextPatterns) {
      const match = description.match(patternInfo.pattern);
      if (match) {
        for (const categoryInfo of patternInfo.categories) {
          const category = CUSTOM_KEYWORD_DATABASE[categoryInfo.key];
          if (category) {
            matches.push({
              category: category.name,
              categoryKey: categoryInfo.key,
              confidence: 90,
              method: 'context',
              matchedKeyword: match[0],
              matchedKeywords: [match[0]],
              type: categoryInfo.type
            });
          }
        }
      }
    }

    return matches;
  }

  /**
   * Valida consistência de tipo
   */
  private validateTypeConsistency(match: any, transaction: TransactionContext): string[] {
    const warnings: string[] = [];

    if (match.type !== transaction.originalType) {
      warnings.push(
        `Tipo sugerido (${match.type === 'income' ? 'receita' : 'despesa'}) ` +
        `diferente do tipo original (${transaction.originalType === 'income' ? 'receita' : 'despesa'})`
      );
    }

    // Verificações específicas baseadas na descrição
    const descLower = transaction.description.toLowerCase();
    
    if (match.type === 'expense' && (descLower.includes('recebido') || descLower.includes('depósito'))) {
      warnings.push('Atenção: Descrição sugere receita mas categoria é de despesa');
    }
    
    if (match.type === 'income' && (descLower.includes('pagamento') || descLower.includes('débito'))) {
      warnings.push('Atenção: Descrição sugere despesa mas categoria é de receita');
    }

    return warnings;
  }

  /**
   * Corrige tipo da transação baseado no contexto
   */
  private correctTransactionType(transaction: TransactionContext, match: any): {
    correctedType?: 'income' | 'expense';
    reason?: string;
  } {
    const descLower = transaction.description.toLowerCase();

    // Se há avisos de inconsistência, tentar corrigir
    if (match.type !== transaction.originalType) {
      // Verificar se a correção faz sentido
      if (descLower.includes('recebido') || descLower.includes('depósito') || descLower.includes('salário')) {
        return {
          correctedType: 'income',
          reason: 'Palavras na descrição indicam receita'
        };
      }
      
      if (descLower.includes('pagamento') || descLower.includes('débito') || descLower.includes('pago')) {
        return {
          correctedType: 'expense',
          reason: 'Palavras na descrição indicam despesa'
        };
      }
    }

    return {};
  }

  /**
   * Obtém prioridade de uma categoria
   */
  private getCategoryPriority(categoryKey: string): number {
    return CUSTOM_KEYWORD_DATABASE[categoryKey]?.priority || 1;
  }

  /**
   * Categoriza múltiplas transações
   */
  categorizeBatch(
    transactions: TransactionContext[],
    availableCategories?: string[]
  ): Array<{ transaction: TransactionContext; result: CustomCategorizationResult | null }> {
    return transactions.map(transaction => ({
      transaction,
      result: this.categorize(transaction, availableCategories)
    }));
  }

  /**
   * Gera estatísticas de categorização
   */
  generateStats(results: Array<{ transaction: TransactionContext; result: CustomCategorizationResult | null }>): {
    totalTransactions: number;
    categorizedTransactions: number;
    averageConfidence: number;
    categoryDistribution: Record<string, number>;
    methodDistribution: Record<string, number>;
    warningsCount: number;
  } {
    const stats = {
      totalTransactions: results.length,
      categorizedTransactions: 0,
      averageConfidence: 0,
      categoryDistribution: {} as Record<string, number>,
      methodDistribution: {} as Record<string, number>,
      warningsCount: 0
    };

    let totalConfidence = 0;

    results.forEach(({ result }) => {
      if (result) {
        stats.categorizedTransactions++;
        totalConfidence += result.confidence;
        
        stats.categoryDistribution[result.category] = 
          (stats.categoryDistribution[result.category] || 0) + 1;
        
        stats.methodDistribution[result.method] = 
          (stats.methodDistribution[result.method] || 0) + 1;
        
        if (result.warnings) {
          stats.warningsCount += result.warnings.length;
        }
      }
    });

    if (stats.categorizedTransactions > 0) {
      stats.averageConfidence = totalConfidence / stats.categorizedTransactions;
    }

    return stats;
  }

  /**
   * Obtém categorias disponíveis por tipo
   */
  getCategoriesByType(type: 'income' | 'expense'): Array<{ key: string; name: string; keywords: string[] }> {
    const categories = getCustomCategoriesByType(type);
    
    return Object.entries(categories).map(([key, category]) => ({
      key,
      name: category.name,
      keywords: category.keywords
    }));
  }

  /**
   * Busca categoria por nome
   */
  findCategoryByName(name: string): { key: string; name: string; type: 'income' | 'expense'; keywords: string[] } | null {
    for (const [key, category] of Object.entries(CUSTOM_KEYWORD_DATABASE)) {
      if (category.name.toLowerCase() === name.toLowerCase()) {
        return {
          key,
          name: category.name,
          type: category.type,
          keywords: category.keywords
        };
      }
    }
    return null;
  }

  /**
   * Adiciona nova palavra-chave a uma categoria
   */
  addKeywordToCategory(categoryKey: string, keyword: string): boolean {
    const category = CUSTOM_KEYWORD_DATABASE[categoryKey];
    if (category && !category.keywords.includes(keyword)) {
      category.keywords.push(keyword);
      return true;
    }
    return false;
  }

  /**
   * Remove palavra-chave de uma categoria
   */
  removeKeywordFromCategory(categoryKey: string, keyword: string): boolean {
    const category = CUSTOM_KEYWORD_DATABASE[categoryKey];
    if (category) {
      const index = category.keywords.indexOf(keyword);
      if (index > -1) {
        category.keywords.splice(index, 1);
        return true;
      }
    }
    return false;
  }
}

// Instância global do motor customizado
let globalCustomCategoryEngine: CustomCategoryEngine | null = null;

/**
 * Obtém instância global do CustomCategoryEngine
 */
export function getCustomCategoryEngine(options?: {
  minConfidence?: number;
  enableTypeCorrection?: boolean;
}): CustomCategoryEngine {
  if (!globalCustomCategoryEngine) {
    globalCustomCategoryEngine = new CustomCategoryEngine(options);
  }
  return globalCustomCategoryEngine;
}

/**
 * Cria nova instância do CustomCategoryEngine
 */
export function createCustomCategoryEngine(options?: {
  minConfidence?: number;
  enableTypeCorrection?: boolean;
}): CustomCategoryEngine {
  return new CustomCategoryEngine(options);
}
