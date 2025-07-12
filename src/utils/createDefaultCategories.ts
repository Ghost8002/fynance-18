
import { supabase } from '@/integrations/supabase/client';

export const createDefaultCategories = async (userId: string) => {
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
      throw checkError;
    }

    if (existingCategories && existingCategories.length > 0) {
      console.log('User already has categories, skipping creation');
      return { success: true, message: 'Categories already exist' };
    }

    // Create default expense categories
    const expenseCategories = [
      { user_id: userId, name: 'Moradia', type: 'expense', color: '#8B5CF6' },
      { user_id: userId, name: 'Alimentação', type: 'expense', color: '#EF4444' },
      { user_id: userId, name: 'Transporte', type: 'expense', color: '#F97316' },
      { user_id: userId, name: 'Saúde', type: 'expense', color: '#84CC16' },
      { user_id: userId, name: 'Educação', type: 'expense', color: '#6366F1' },
      { user_id: userId, name: 'Lazer', type: 'expense', color: '#06B6D4' },
      { user_id: userId, name: 'Outros', type: 'expense', color: '#9CA3AF' },
    ];

    // Create default income categories
    const incomeCategories = [
      { user_id: userId, name: 'Salário', type: 'income', color: '#10B981' },
      { user_id: userId, name: 'Freelancer', type: 'income', color: '#059669' },
      { user_id: userId, name: 'Investimentos', type: 'income', color: '#047857' },
      { user_id: userId, name: 'Pix', type: 'income', color: '#34D399' },
      { user_id: userId, name: 'Bolsa', type: 'income', color: '#065F46' },
      { user_id: userId, name: 'Outros', type: 'income', color: '#6B7280' },
    ];

    const allCategories = [...expenseCategories, ...incomeCategories];

    const { data, error } = await supabase
      .from('categories')
      .insert(allCategories)
      .select();

    if (error) {
      console.error('Error creating default categories:', error);
      throw error;
    }

    console.log('Successfully created default categories:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in createDefaultCategories:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
