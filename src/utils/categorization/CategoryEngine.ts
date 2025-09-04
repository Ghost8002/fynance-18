/**
 * Motor principal de categorização automática
 * Sistema unificado e inteligente para categorização de transações
 */

import { CategoryMatcher, CategorizationResult } from './CategoryMatcher';
import { KEYWORD_DATABASE } from './KeywordDatabase';

export interface ImportedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  tags?: string[];
}

export interface CategorizationOptions {
  minConfidence?: number; // Confiança mínima para aceitar categoria (padrão: 70)
  enableLearning?: boolean; // Habilitar aprendizado (padrão: true)
  availableCategories?: string[]; // Categorias disponíveis do usuário
}

export interface LearningData {
  description: string;
  userCategory: string;
  originalCategory?: string;
  timestamp: Date;
}

/**
 * Motor principal de categorização
 */
export class CategoryEngine {
  private matcher: CategoryMatcher;
  private learningData: LearningData[] = [];
  private options: Required<CategorizationOptions>;

  constructor(options: CategorizationOptions = {}) {
    this.matcher = new CategoryMatcher();
    this.options = {
      minConfidence: options.minConfidence || 70,
      enableLearning: options.enableLearning !== false,
      availableCategories: options.availableCategories || []
    };
  }

  /**
   * Categoriza uma transação
   */
  categorize(
    transaction: ImportedTransaction,
    options?: Partial<CategorizationOptions>
  ): CategorizationResult | null {
    const finalOptions = { ...this.options, ...options };
    
    // Aplicar aprendizado se habilitado
    if (finalOptions.enableLearning) {
      const learnedCategory = this.getLearnedCategory(transaction.description);
      if (learnedCategory) {
        return {
          category: learnedCategory,
          confidence: 100,
          method: 'learned',
          matchedKeyword: 'Aprendizado do usuário'
        };
      }
    }

    // Usar matcher para categorização automática
    const result = this.matcher.categorize(
      transaction.description,
      transaction.type,
      finalOptions.availableCategories
    );

    // Verificar confiança mínima
    if (result && result.confidence >= finalOptions.minConfidence) {
      return result;
    }

    // Se confiança baixa, retornar categoria padrão
    return {
      category: this.getDefaultCategory(transaction.type),
      confidence: 50,
      method: 'default',
      matchedKeyword: 'Categoria padrão'
    };
  }

  /**
   * Categoriza múltiplas transações em lote
   */
  categorizeBatch(
    transactions: ImportedTransaction[],
    options?: Partial<CategorizationOptions>
  ): Array<ImportedTransaction & { categorization: CategorizationResult | null }> {
    return transactions.map(transaction => ({
      ...transaction,
      categorization: this.categorize(transaction, options)
    }));
  }

  /**
   * Aprende com feedback do usuário
   */
  learn(learningData: LearningData): void {
    if (!this.options.enableLearning) {
      return;
    }

    // Adicionar dados de aprendizado
    this.learningData.push({
      ...learningData,
      timestamp: new Date()
    });

    // Manter apenas os últimos 1000 registros para performance
    if (this.learningData.length > 1000) {
      this.learningData = this.learningData.slice(-1000);
    }

    console.log(`Aprendizado registrado: "${learningData.description}" -> "${learningData.userCategory}"`);
  }

  /**
   * Obtém categoria aprendida para uma descrição
   */
  private getLearnedCategory(description: string): string | null {
    const descriptionLower = description.toLowerCase();
    
    // Buscar correspondência exata primeiro
    for (const data of this.learningData) {
      if (data.description.toLowerCase() === descriptionLower) {
        return data.userCategory;
      }
    }

    // Buscar correspondência parcial
    for (const data of this.learningData) {
      if (descriptionLower.includes(data.description.toLowerCase()) ||
          data.description.toLowerCase().includes(descriptionLower)) {
        return data.userCategory;
      }
    }

    return null;
  }

  /**
   * Obtém categoria padrão para o tipo de transação
   */
  private getDefaultCategory(type: 'income' | 'expense'): string {
    if (type === 'income') {
      return 'Outros Recebimentos';
    } else {
      return 'Outros Gastos';
    }
  }

  /**
   * Obtém estatísticas de categorização
   */
  getStats(): {
    totalCategorized: number;
    averageConfidence: number;
    learningDataCount: number;
    categoryDistribution: Record<string, number>;
  } {
    const stats = {
      totalCategorized: 0,
      averageConfidence: 0,
      learningDataCount: this.learningData.length,
      categoryDistribution: {} as Record<string, number>
    };

    // Calcular estatísticas baseadas nos dados de aprendizado
    let totalConfidence = 0;
    
    for (const data of this.learningData) {
      stats.totalCategorized++;
      totalConfidence += 100; // Aprendizado tem confiança 100%
      
      stats.categoryDistribution[data.userCategory] = 
        (stats.categoryDistribution[data.userCategory] || 0) + 1;
    }

    if (stats.totalCategorized > 0) {
      stats.averageConfidence = totalConfidence / stats.totalCategorized;
    }

    return stats;
  }

  /**
   * Exporta dados de aprendizado
   */
  exportLearningData(): LearningData[] {
    return [...this.learningData];
  }

  /**
   * Importa dados de aprendizado
   */
  importLearningData(data: LearningData[]): void {
    this.learningData = [...data];
    console.log(`Importados ${data.length} registros de aprendizado`);
  }

  /**
   * Limpa dados de aprendizado
   */
  clearLearningData(): void {
    this.learningData = [];
    console.log('Dados de aprendizado limpos');
  }

  /**
   * Obtém todas as categorias disponíveis
   */
  getAvailableCategories(type?: 'income' | 'expense'): Array<{ key: string; name: string; type: string }> {
    const categories = [];
    
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (!type || category.type === type) {
        categories.push({
          key,
          name: category.name,
          type: category.type
        });
      }
    }
    
    return categories;
  }

  /**
   * Atualiza opções do engine
   */
  updateOptions(options: Partial<CategorizationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Obtém palavras-chave para uma categoria
   */
  getKeywordsForCategory(categoryName: string): string[] {
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (category.name === categoryName) {
        return category.keywords;
      }
    }
    return [];
  }

  /**
   * Adiciona nova palavra-chave para uma categoria
   */
  addKeywordToCategory(categoryName: string, keyword: string): boolean {
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (category.name === categoryName) {
        if (!category.keywords.includes(keyword)) {
          category.keywords.push(keyword);
          console.log(`Palavra-chave "${keyword}" adicionada à categoria "${categoryName}"`);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Remove palavra-chave de uma categoria
   */
  removeKeywordFromCategory(categoryName: string, keyword: string): boolean {
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (category.name === categoryName) {
        const index = category.keywords.indexOf(keyword);
        if (index > -1) {
          category.keywords.splice(index, 1);
          console.log(`Palavra-chave "${keyword}" removida da categoria "${categoryName}"`);
          return true;
        }
      }
    }
    return false;
  }
}

// Instância global do engine (singleton)
let globalCategoryEngine: CategoryEngine | null = null;

/**
 * Obtém instância global do CategoryEngine
 */
export function getCategoryEngine(options?: CategorizationOptions): CategoryEngine {
  if (!globalCategoryEngine) {
    globalCategoryEngine = new CategoryEngine(options);
  }
  return globalCategoryEngine;
}

/**
 * Cria nova instância do CategoryEngine
 */
export function createCategoryEngine(options?: CategorizationOptions): CategoryEngine {
  return new CategoryEngine(options);
}
