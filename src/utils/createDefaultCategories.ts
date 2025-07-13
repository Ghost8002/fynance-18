
import { SupabaseClient } from '@supabase/supabase-js';

interface DefaultCategory {
  name: string;
  type: 'income' | 'expense';
  color: string;
  sort_order: number;
}

const defaultCategories: DefaultCategory[] = [
  // Income Categories
  { name: 'Salário', type: 'income', color: '#10B981', sort_order: 1 },
  { name: 'Freelance', type: 'income', color: '#059669', sort_order: 2 },
  { name: 'Investimentos', type: 'income', color: '#047857', sort_order: 3 },
  { name: 'Vendas', type: 'income', color: '#065F46', sort_order: 4 },
  { name: 'Prêmios', type: 'income', color: '#064E3B', sort_order: 5 },
  { name: 'Outros Recebimentos', type: 'income', color: '#022C22', sort_order: 6 },

  // Expense Categories
  { name: 'Alimentação', type: 'expense', color: '#EF4444', sort_order: 1 },
  { name: 'Transporte', type: 'expense', color: '#DC2626', sort_order: 2 },
  { name: 'Moradia', type: 'expense', color: '#B91C1C', sort_order: 3 },
  { name: 'Saúde', type: 'expense', color: '#991B1B', sort_order: 4 },
  { name: 'Educação', type: 'expense', color: '#7F1D1D', sort_order: 5 },
  { name: 'Lazer', type: 'expense', color: '#6B21A8', sort_order: 6 },
  { name: 'Compras', type: 'expense', color: '#F59E0B', sort_order: 7 },
  { name: 'Contas Básicas', type: 'expense', color: '#D97706', sort_order: 8 },
  { name: 'Investimentos', type: 'expense', color: '#3B82F6', sort_order: 9 },
  { name: 'Outros Gastos', type: 'expense', color: '#6B7280', sort_order: 10 },
];

export const createDefaultCategories = async (
  supabase: SupabaseClient,
  userId: string
): Promise<void> => {
  try {
    console.log('Creating default categories for user:', userId);
    
    // Check if user already has categories
    const { data: existingCategories, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing categories:', checkError);
      return;
    }

    // If user already has categories, don't create defaults
    if (existingCategories && existingCategories.length > 0) {
      console.log('User already has categories, skipping default creation');
      return;
    }

    // Create default categories
    const categoriesToInsert = defaultCategories.map(category => ({
      ...category,
      user_id: userId,
      is_default: true,
    }));

    const { error: insertError } = await supabase
      .from('categories')
      .insert(categoriesToInsert);

    if (insertError) {
      console.error('Error creating default categories:', insertError);
      return;
    }

    console.log('Default categories created successfully');
  } catch (error) {
    console.error('Error in createDefaultCategories:', error);
  }
};
