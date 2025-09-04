/**
 * Sistema de matching de categorias com múltiplos algoritmos
 */

import { KEYWORD_DATABASE, CategoryMapping } from './KeywordDatabase';

export interface MatchResult {
  category: string;
  confidence: number;
  method: 'exact' | 'fuzzy' | 'regex' | 'partial';
  matchedKeyword?: string;
}

export interface CategorizationResult {
  category: string;
  confidence: number;
  method: string;
  matchedKeyword?: string;
  alternatives?: MatchResult[];
}

/**
 * Classe para matching de categorias com múltiplos algoritmos
 */
export class CategoryMatcher {
  private fuzzyThreshold = 0.7; // Limiar para matching fuzzy
  private partialThreshold = 0.6; // Limiar para matching parcial

  /**
   * Categoriza uma transação baseada na descrição
   */
  categorize(
    description: string,
    type: 'income' | 'expense',
    availableCategories?: string[]
  ): CategorizationResult | null {
    const descriptionLower = description.toLowerCase().trim();
    
    if (!descriptionLower) {
      return null;
    }

    // Obter categorias disponíveis
    const categories = availableCategories 
      ? this.filterAvailableCategories(availableCategories, type)
      : this.getCategoriesByType(type);

    // Tentar diferentes métodos de matching
    const results: MatchResult[] = [];

    // 1. Matching exato
    const exactMatch = this.exactMatch(descriptionLower, categories);
    if (exactMatch) {
      results.push(exactMatch);
    }

    // 2. Matching parcial (includes)
    const partialMatches = this.partialMatch(descriptionLower, categories);
    results.push(...partialMatches);

    // 3. Matching fuzzy (similaridade)
    const fuzzyMatches = this.fuzzyMatch(descriptionLower, categories);
    results.push(...fuzzyMatches);

    // 4. Matching por regex (padrões complexos)
    const regexMatches = this.regexMatch(descriptionLower, categories);
    results.push(...regexMatches);

    if (results.length === 0) {
      return null;
    }

    // Ordenar por confiança e prioridade
    results.sort((a, b) => {
      const aCategory = KEYWORD_DATABASE[this.getCategoryKeyByName(a.category)];
      const bCategory = KEYWORD_DATABASE[this.getCategoryKeyByName(b.category)];
      
      const aScore = a.confidence * (aCategory?.priority || 1);
      const bScore = b.confidence * (bCategory?.priority || 1);
      
      return bScore - aScore;
    });

    const bestMatch = results[0];
    const alternatives = results.slice(1, 4); // Top 3 alternativas

    return {
      category: bestMatch.category,
      confidence: bestMatch.confidence,
      method: bestMatch.method,
      matchedKeyword: bestMatch.matchedKeyword,
      alternatives: alternatives.length > 0 ? alternatives : undefined
    };
  }

  /**
   * Matching exato - palavra-chave exata na descrição
   */
  private exactMatch(description: string, categories: CategoryMapping): MatchResult | null {
    for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
      for (const keyword of categoryInfo.keywords) {
        if (description === keyword.toLowerCase()) {
          return {
            category: categoryInfo.name,
            confidence: categoryInfo.confidence,
            method: 'exact',
            matchedKeyword: keyword
          };
        }
      }
    }
    return null;
  }

  /**
   * Matching parcial - palavra-chave contida na descrição
   */
  private partialMatch(description: string, categories: CategoryMapping): MatchResult[] {
    const results: MatchResult[] = [];

    for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
      for (const keyword of categoryInfo.keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Verificar se a palavra-chave está contida na descrição
        if (description.includes(keywordLower)) {
          // Calcular confiança baseada no tamanho da palavra-chave vs descrição
          const confidence = Math.min(
            categoryInfo.confidence,
            (keywordLower.length / description.length) * 100
          );

          if (confidence >= this.partialThreshold * 100) {
            results.push({
              category: categoryInfo.name,
              confidence: Math.round(confidence),
              method: 'partial',
              matchedKeyword: keyword
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Matching fuzzy - similaridade de texto usando algoritmo de Levenshtein
   */
  private fuzzyMatch(description: string, categories: CategoryMapping): MatchResult[] {
    const results: MatchResult[] = [];

    for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
      for (const keyword of categoryInfo.keywords) {
        const similarity = this.calculateSimilarity(description, keyword.toLowerCase());
        
        if (similarity >= this.fuzzyThreshold) {
          const confidence = Math.round(similarity * categoryInfo.confidence);
          
          results.push({
            category: categoryInfo.name,
            confidence,
            method: 'fuzzy',
            matchedKeyword: keyword
          });
        }
      }
    }

    return results;
  }

  /**
   * Matching por regex - padrões complexos
   */
  private regexMatch(description: string, categories: CategoryMapping): MatchResult[] {
    const results: MatchResult[] = [];

    // Padrões regex específicos para casos complexos
    const regexPatterns = [
      {
        pattern: /transfer[êe]ncia\s+(recebida|enviada)/i,
        category: 'Transferências',
        confidence: 95
      },
      {
        pattern: /pix\s+(recebido|enviado)/i,
        category: 'Transferências',
        confidence: 95
      },
      {
        pattern: /boleto\s+(pago|recebido)/i,
        category: 'Transferências',
        confidence: 90
      },
      {
        pattern: /dep[óo]sito/i,
        category: 'Transferências',
        confidence: 90
      },
      {
        pattern: /saque/i,
        category: 'Transferências',
        confidence: 85
      },
      {
        pattern: /sal[áa]rio/i,
        category: 'Salário',
        confidence: 95
      },
      {
        pattern: /freelance|bico|projeto/i,
        category: 'Freelance',
        confidence: 90
      }
    ];

    for (const pattern of regexPatterns) {
      if (pattern.pattern.test(description)) {
        const categoryInfo = this.getCategoryByName(pattern.category);
        if (categoryInfo) {
          results.push({
            category: pattern.category,
            confidence: pattern.confidence,
            method: 'regex',
            matchedKeyword: pattern.pattern.source
          });
        }
      }
    }

    return results;
  }

  /**
   * Calcula similaridade entre duas strings usando algoritmo de Levenshtein
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calcula a distância de Levenshtein entre duas strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Filtra categorias disponíveis baseado na lista fornecida
   */
  private filterAvailableCategories(availableCategories: string[], type: 'income' | 'expense'): CategoryMapping {
    const filtered: CategoryMapping = {};
    
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (category.type === type && availableCategories.includes(category.name)) {
        filtered[key] = category;
      }
    }
    
    return filtered;
  }

  /**
   * Obtém categorias por tipo
   */
  private getCategoriesByType(type: 'income' | 'expense'): CategoryMapping {
    const filtered: CategoryMapping = {};
    
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (category.type === type) {
        filtered[key] = category;
      }
    }
    
    return filtered;
  }

  /**
   * Obtém categoria pelo nome
   */
  private getCategoryByName(name: string) {
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (category.name === name) {
        return category;
      }
    }
    return null;
  }

  /**
   * Obtém chave da categoria pelo nome
   */
  private getCategoryKeyByName(name: string): string {
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (category.name === name) {
        return key;
      }
    }
    return '';
  }
}
