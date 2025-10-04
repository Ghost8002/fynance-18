import { useState, useCallback } from 'react';
import { useSupabaseData } from './useSupabaseData';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ValidationItem {
  name: string;
  type: 'category' | 'tag';
  count: number;
  action: 'create' | 'ignore';
}

interface CategoryTagValidationResult {
  categories: ValidationItem[];
  tags: ValidationItem[];
  hasUnmappedItems: boolean;
}

export const useCategoryTagValidation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: existingCategories } = useSupabaseData('categories', user?.id);
  const { data: existingTags } = useSupabaseData('tags', user?.id);
  const { insert: insertCategory } = useSupabaseData('categories', user?.id);
  const { insert: insertTag } = useSupabaseData('tags', user?.id);

  /**
   * Detecta categorias e tags que não existem no sistema
   */
  const detectUnmappedItems = useCallback((xlsxData: any[]): CategoryTagValidationResult => {
    const categoryMap = new Map<string, number>();
    const tagMap = new Map<string, number>();

    // Coletar todas as categorias e tags do XLSX
    xlsxData.forEach(row => {
      if (row.categoria && row.categoria.trim()) {
        const categoryName = row.categoria.trim();
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
      }

      if (row.tags && row.tags.trim()) {
        const tags = row.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        tags.forEach(tag => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      }
    });

    // Verificar quais não existem no sistema
    const unmappedCategories: ValidationItem[] = [];
    const unmappedTags: ValidationItem[] = [];

    // Verificar categorias
    categoryMap.forEach((count, categoryName) => {
      const normalizedName = categoryName.toLowerCase().trim();
      const exists = existingCategories?.some(cat => 
        cat.name.toLowerCase().trim() === normalizedName
      );
      
      if (!exists) {
        unmappedCategories.push({
          name: categoryName,
          type: 'category',
          count,
          action: 'create' // Padrão: criar
        });
      }
    });

    // Verificar tags
    tagMap.forEach((count, tagName) => {
      const normalizedName = tagName.toLowerCase().trim();
      const exists = existingTags?.some(tag => 
        tag.name.toLowerCase().trim() === normalizedName
      );
      
      if (!exists) {
        unmappedTags.push({
          name: tagName,
          type: 'tag',
          count,
          action: 'create' // Padrão: criar
        });
      }
    });

    return {
      categories: unmappedCategories,
      tags: unmappedTags,
      hasUnmappedItems: unmappedCategories.length > 0 || unmappedTags.length > 0
    };
  }, [existingCategories, existingTags]);

  /**
   * Cria categorias e tags no sistema
   */
  const createItems = useCallback(async (items: ValidationItem[]): Promise<{ success: number; errors: number; createdItems: { [key: string]: any } }> => {
    let success = 0;
    let errors = 0;
    const createdItems: { [key: string]: any } = {};

    for (const item of items) {
      if (item.action === 'create') {
        try {
          if (item.type === 'category') {
            const categoryData = {
              name: item.name,
              type: 'expense', // Padrão para categorias importadas
              color: '#6B7280', // Cor padrão
              user_id: user?.id
            };
            
            const result = await insertCategory(categoryData);
            
            if (result.error) {
              throw new Error(result.error);
            }
            
            if (result.data && result.data[0]) {
              createdItems[`category_${item.name}`] = result.data[0];
            }
          } else if (item.type === 'tag') {
            const tagData = {
              name: item.name,
              color: '#6B7280', // Cor padrão
              user_id: user?.id
            };
            
            const result = await insertTag(tagData);
            
            if (result.error) {
              throw new Error(result.error);
            }
            
            if (result.data && result.data[0]) {
              createdItems[`tag_${item.name}`] = result.data[0];
            }
          }
          success++;
        } catch (error) {
          console.error(`Erro ao criar ${item.type} "${item.name}":`, error);
          errors++;
        }
      }
    }

    return { success, errors, createdItems };
  }, [insertCategory, insertTag, user?.id]);

  /**
   * Busca categoria por nome
   */
  const findCategoryByName = useCallback((categoryName: string): any => {
    const normalizedName = categoryName.toLowerCase().trim();
    return existingCategories?.find(cat => 
      cat.name.toLowerCase().trim() === normalizedName
    );
  }, [existingCategories]);

  /**
   * Busca tag por nome
   */
  const findTagByName = useCallback((tagName: string): any => {
    const normalizedName = tagName.toLowerCase().trim();
    return existingTags?.find(tag => 
      tag.name.toLowerCase().trim() === normalizedName
    );
  }, [existingTags]);

  /**
   * Aplica as escolhas do usuário aos dados XLSX
   */
  const applyValidationChoices = useCallback((xlsxData: any[], validationItems: ValidationItem[], createdItems: { [key: string]: any }): any[] => {
    const createItems = validationItems.filter(item => item.action === 'create');
    const ignoreItems = validationItems.filter(item => item.action === 'ignore');

    return xlsxData.map(row => {
      const newRow = { ...row };

      // Processar categoria
      if (row.categoria && row.categoria.trim()) {
        const categoryName = row.categoria.trim();
        const shouldIgnore = ignoreItems.some(item => 
          item.type === 'category' && item.name === categoryName
        );
        
        if (shouldIgnore) {
          newRow.categoria = null;
          newRow.categoria_id = null;
        } else {
          // Buscar categoria existente ou recém-criada
          let category = findCategoryByName(categoryName);
          
          if (!category && createdItems[`category_${categoryName}`]) {
            category = createdItems[`category_${categoryName}`];
          }
          
          if (category) {
            newRow.categoria_id = category.id;
          }
        }
      }

      // Processar tags
      if (row.tags && row.tags.trim()) {
        const tags = row.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        const processedTags = tags.map(tag => {
          const shouldIgnore = ignoreItems.some(item => 
            item.type === 'tag' && item.name === tag
          );
          
          if (shouldIgnore) {
            return null;
          }
          
          // Buscar tag existente ou recém-criada
          let tagObj = findTagByName(tag);
          
          if (!tagObj && createdItems[`tag_${tag}`]) {
            tagObj = createdItems[`tag_${tag}`];
          }
          
          return tagObj ? {
            id: tagObj.id,
            name: tagObj.name,
            color: tagObj.color
          } : null;
        }).filter(tag => tag !== null);
        
        newRow.tags = processedTags.length > 0 ? processedTags : [];
      }

      return newRow;
    });
  }, [findCategoryByName, findTagByName]);

  /**
   * Valida se há itens duplicados que serão criados
   */
  const validateDuplicates = useCallback((items: ValidationItem[]): string[] => {
    const duplicates: string[] = [];
    const names = new Set<string>();

    items.forEach(item => {
      if (item.action === 'create') {
        const normalizedName = item.name.toLowerCase().trim();
        if (names.has(normalizedName)) {
          duplicates.push(item.name);
        } else {
          names.add(normalizedName);
        }
      }
    });

    return duplicates;
  }, []);

  return {
    detectUnmappedItems,
    createItems,
    applyValidationChoices,
    validateDuplicates,
    findCategoryByName,
    findTagByName
  };
};
