import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Subcategory = Tables<'subcategories'>;

interface UseSubcategoriesProps {
  userId: string | undefined;
  categoryId?: string;
}

export const useSubcategories = ({ userId, categoryId }: UseSubcategoriesProps) => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubcategories = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('subcategories')
        .select('*')
        .eq('user_id', userId);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;

      setSubcategories(data || []);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setError('Failed to fetch subcategories');
    } finally {
      setLoading(false);
    }
  }, [userId, categoryId]);

  const createSubcategory = async (subcategory: Omit<Subcategory, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert({
          ...subcategory,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista local
      setSubcategories(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error creating subcategory:', err);
      setError('Failed to create subcategory');
      return null;
    }
  };

  const updateSubcategory = async (id: string, updates: Partial<Subcategory>) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Atualizar a lista local
      setSubcategories(prev => prev.map(sub => sub.id === id ? data : sub));
      return data;
    } catch (err) {
      console.error('Error updating subcategory:', err);
      setError('Failed to update subcategory');
      return null;
    }
  };

  const deleteSubcategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // Atualizar a lista local
      setSubcategories(prev => prev.filter(sub => sub.id !== id));
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      setError('Failed to delete subcategory');
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  return {
    subcategories,
    loading,
    error,
    fetchSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
};