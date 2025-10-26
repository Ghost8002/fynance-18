import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const useDebitsWithTags = () => {
  const { user } = useSupabaseAuth();
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDebitsWithTags = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Buscar as dívidas
      const { data: debtsData, error: debtsError } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id);

      if (debtsError) throw debtsError;
      
      // Se não há dívidas, retornar vazio
      if (!debtsData || debtsData.length === 0) {
        setDebts([]);
        return;
      }
      
      // Buscar todas as associações de tags para as dívidas
      const { data: debtTagsData, error: debtTagsError } = await supabase
        .from('debt_tags')
        .select('*')
        .in('debt_id', debtsData.map(d => d.id));
      
      if (debtTagsError) throw debtTagsError;
      
      // Buscar os detalhes das tags
      let tagsData: any[] = [];
      if (debtTagsData && debtTagsData.length > 0) {
        const tagIds = [...new Set(debtTagsData.map(dt => dt.tag_id))];
        const { data, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds);
        
        if (tagsError) throw tagsError;
        tagsData = data || [];
      }
      
      // Mapear tags para cada dívida
      const debtsWithTags = debtsData.map(debt => {
        const debtTagIds = debtTagsData
          .filter(dt => dt.debt_id === debt.id)
          .map(dt => dt.tag_id);
        
        const debtTags = tagsData.filter(tag => debtTagIds.includes(tag.id));
        
        return {
          ...debt,
          tags: debtTags
        };
      });
      
      setDebts(debtsWithTags);
    } catch (err) {
      console.error('Error fetching debts with tags:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDebitsWithTags();
  }, [fetchDebitsWithTags]);

  const refetch = () => {
    fetchDebitsWithTags();
  };

  return { 
    data: debts, 
    loading, 
    error, 
    refetch 
  };
};