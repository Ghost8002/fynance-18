/**
 * Gerenciador de categorias para criação automática e mapeamento inteligente
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { KEYWORD_DATABASE } from './KeywordDatabase';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  is_default?: boolean;
  sort_order?: number;
}

export interface CategoryCreationPlan {
  categoriesToCreate: Array<{
    name: string;
    type: 'income' | 'expense';
    color: string;
    reason: string;
  }>;
  categoriesToMap: Array<{
    suggested: string;
    existing: string;
    reason: string;
  }>;
  totalNewCategories: number;
  totalMappedCategories: number;
}

export interface CategoryCreationResult {
  created: Category[];
  mapped: Array<{ suggested: string; existing: Category }>;
  errors: string[];
}

/**
 * Gerenciador de categorias com criação automática inteligente
 */
export class CategoryManager {
  private supabase: SupabaseClient;
  private userId: string;

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  /**
   * Analisa transações e cria plano de categorias
   */
  async analyzeCategories(
    transactions: Array<{ category?: string; type: 'income' | 'expense' }>
  ): Promise<CategoryCreationPlan> {
    // Obter categorias existentes do usuário
    const existingCategories = await this.getUserCategories();
    
    // Extrair categorias sugeridas das transações
    const suggestedCategories = this.extractSuggestedCategories(transactions);
    
    // Analisar quais categorias precisam ser criadas
    const categoriesToCreate = this.identifyCategoriesToCreate(
      suggestedCategories,
      existingCategories
    );
    
    // Analisar mapeamentos para categorias existentes
    const categoriesToMap = this.identifyCategoriesToMap(
      suggestedCategories,
      existingCategories
    );

    return {
      categoriesToCreate,
      categoriesToMap,
      totalNewCategories: categoriesToCreate.length,
      totalMappedCategories: categoriesToMap.length
    };
  }

  /**
   * Executa o plano de criação de categorias
   */
  async executeCategoryPlan(plan: CategoryCreationPlan): Promise<CategoryCreationResult> {
    const result: CategoryCreationResult = {
      created: [],
      mapped: [],
      errors: []
    };

    try {
      // Criar novas categorias
      if (plan.categoriesToCreate.length > 0) {
        const createdCategories = await this.createCategories(plan.categoriesToCreate);
        result.created = createdCategories;
      }

      // Mapear categorias para existentes
      if (plan.categoriesToMap.length > 0) {
        const existingCategories = await this.getUserCategories();
        for (const mapping of plan.categoriesToMap) {
          const existingCategory = existingCategories.find(
            cat => cat.name === mapping.existing
          );
          if (existingCategory) {
            result.mapped.push({
              suggested: mapping.suggested,
              existing: existingCategory
            });
          }
        }
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Erro desconhecido');
    }

    return result;
  }

  /**
   * Obtém categorias do usuário
   */
  private async getUserCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', this.userId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias do usuário:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Extrai categorias sugeridas das transações
   */
  private extractSuggestedCategories(
    transactions: Array<{ category?: string; type: 'income' | 'expense' }>
  ): Array<{ name: string; type: 'income' | 'expense'; count: number }> {
    const categoryCounts = new Map<string, { type: 'income' | 'expense'; count: number }>();

    for (const transaction of transactions) {
      if (transaction.category) {
        const key = transaction.category.toLowerCase();
        const existing = categoryCounts.get(key);
        
        if (existing) {
          existing.count++;
        } else {
          categoryCounts.set(key, {
            type: transaction.type,
            count: 1
          });
        }
      }
    }

    return Array.from(categoryCounts.entries()).map(([name, data]) => ({
      name: this.capitalizeFirstLetter(name),
      type: data.type,
      count: data.count
    }));
  }

  /**
   * Identifica categorias que precisam ser criadas
   */
  private identifyCategoriesToCreate(
    suggestedCategories: Array<{ name: string; type: 'income' | 'expense'; count: number }>,
    existingCategories: Category[]
  ): Array<{ name: string; type: 'income' | 'expense'; color: string; reason: string }> {
    const categoriesToCreate: Array<{ name: string; type: 'income' | 'expense'; color: string; reason: string }> = [];
    
    // Categorias essenciais que devem ser criadas se não existirem
    const essentialCategories = [
      { name: 'Transferências', type: 'income' as const, color: '#34D399', priority: 1 },
      { name: 'Compras', type: 'expense' as const, color: '#F59E0B', priority: 2 },
      { name: 'Serviços', type: 'expense' as const, color: '#8B5CF6', priority: 3 },
      { name: 'Impostos e Taxas', type: 'expense' as const, color: '#EF4444', priority: 4 }
    ];

    for (const essential of essentialCategories) {
      const exists = existingCategories.some(
        cat => cat.name.toLowerCase() === essential.name.toLowerCase()
      );
      
      if (!exists) {
        // Verificar se há transações que usariam esta categoria
        const hasUsage = suggestedCategories.some(
          suggested => suggested.name.toLowerCase() === essential.name.toLowerCase()
        );
        
        if (hasUsage) {
          categoriesToCreate.push({
            name: essential.name,
            type: essential.type,
            color: essential.color,
            reason: `Categoria essencial para ${essential.name.toLowerCase()}`
          });
        }
      }
    }

    // Adicionar outras categorias sugeridas que não existem (com limite)
    const otherCategories = suggestedCategories.filter(suggested => {
      const exists = existingCategories.some(
        cat => cat.name.toLowerCase() === suggested.name.toLowerCase()
      );
      return !exists && suggested.count >= 2; // Apenas se aparecer 2+ vezes
    });

    for (const suggested of otherCategories.slice(0, 5)) { // Limite de 5 categorias extras
      const color = this.generateColorForCategory(suggested.name, suggested.type);
      categoriesToCreate.push({
        name: suggested.name,
        type: suggested.type,
        color,
        reason: `Categoria sugerida (${suggested.count} transações)`
      });
    }

    return categoriesToCreate;
  }

  /**
   * Identifica categorias que podem ser mapeadas para existentes
   */
  private identifyCategoriesToMap(
    suggestedCategories: Array<{ name: string; type: 'income' | 'expense'; count: number }>,
    existingCategories: Category[]
  ): Array<{ suggested: string; existing: string; reason: string }> {
    const mappings: Array<{ suggested: string; existing: string; reason: string }> = [];

    // Mapeamentos inteligentes baseados em similaridade
    const smartMappings = [
      { suggested: 'Alimentação', existing: 'Alimentação' },
      { suggested: 'Transporte', existing: 'Transporte' },
      { suggested: 'Saúde', existing: 'Saúde' },
      { suggested: 'Educação', existing: 'Educação' },
      { suggested: 'Lazer', existing: 'Lazer' },
      { suggested: 'Moradia', existing: 'Moradia' },
      { suggested: 'Investimentos', existing: 'Investimentos' },
      { suggested: 'Salário', existing: 'Salário' },
      { suggested: 'Freelance', existing: 'Freelance' }
    ];

    for (const suggested of suggestedCategories) {
      // Verificar se já existe exatamente
      const exactMatch = existingCategories.find(
        cat => cat.name.toLowerCase() === suggested.name.toLowerCase()
      );
      
      if (exactMatch) {
        continue; // Já existe, não precisa mapear
      }

      // Verificar mapeamentos inteligentes
      const smartMapping = smartMappings.find(
        mapping => mapping.suggested.toLowerCase() === suggested.name.toLowerCase()
      );
      
      if (smartMapping) {
        const existingCategory = existingCategories.find(
          cat => cat.name.toLowerCase() === smartMapping.existing.toLowerCase()
        );
        
        if (existingCategory) {
          mappings.push({
            suggested: suggested.name,
            existing: existingCategory.name,
            reason: `Mapeamento inteligente para categoria existente`
          });
        }
      }
    }

    return mappings;
  }

  /**
   * Cria categorias no banco de dados
   */
  private async createCategories(
    categoriesToCreate: Array<{ name: string; type: 'income' | 'expense'; color: string; reason: string }>
  ): Promise<Category[]> {
    const createdCategories: Category[] = [];

    for (const categoryData of categoriesToCreate) {
      try {
        const { data, error } = await this.supabase
          .from('categories')
          .insert({
            user_id: this.userId,
            name: categoryData.name,
            type: categoryData.type,
            color: categoryData.color,
            is_default: false,
            sort_order: 100 // Colocar no final
          })
          .select()
          .single();

        if (error) {
          console.error(`Erro ao criar categoria ${categoryData.name}:`, error);
          continue;
        }

        if (data) {
          createdCategories.push(data);
          console.log(`Categoria criada: ${categoryData.name} (${categoryData.reason})`);
        }
      } catch (error) {
        console.error(`Erro ao criar categoria ${categoryData.name}:`, error);
      }
    }

    return createdCategories;
  }

  /**
   * Gera cor para categoria baseada no nome e tipo
   */
  private generateColorForCategory(name: string, type: 'income' | 'expense'): string {
    const colors = {
      income: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
      expense: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D']
    };

    // Usar hash simples do nome para escolher cor consistente
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff;
    }
    
    const colorIndex = Math.abs(hash) % colors[type].length;
    return colors[type][colorIndex];
  }

  /**
   * Capitaliza primeira letra
   */
  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Obtém mapeamento de categorias para IDs
   */
  async getCategoryMapping(): Promise<Map<string, string>> {
    const categories = await this.getUserCategories();
    const mapping = new Map<string, string>();
    
    for (const category of categories) {
      mapping.set(category.name.toLowerCase(), category.id);
    }
    
    return mapping;
  }

  /**
   * Obtém ID da categoria por nome
   */
  async getCategoryId(categoryName: string): Promise<string | null> {
    const mapping = await this.getCategoryMapping();
    return mapping.get(categoryName.toLowerCase()) || null;
  }
}
