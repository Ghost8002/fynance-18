import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const useReceivablesWithTags = () => {
  const { user } = useSupabaseAuth();
  const [receivables, setReceivables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReceivablesWithTags = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Buscar os recebíveis
      const { data: receivablesData, error: receivablesError } = await supabase
        .from('receivable_payments')
        .select('*')
        .eq('user_id', user.id);

      if (receivablesError) throw receivablesError;
      
      // Se não há recebíveis, retornar vazio
      if (!receivablesData || receivablesData.length === 0) {
        setReceivables([]);
        return;
      }
      
      // Buscar todas as associações de tags para os recebíveis
      const { data: receivableTagsData, error: receivableTagsError } = await supabase
        .from('receivable_payment_tags')
        .select('*')
        .in('receivable_payment_id', receivablesData.map(r => r.id));
      
      if (receivableTagsError) throw receivableTagsError;
      
      // Buscar os detalhes das tags
      let tagsData: any[] = [];
      if (receivableTagsData && receivableTagsData.length > 0) {
        const tagIds = [...new Set(receivableTagsData.map(rpt => rpt.tag_id))];
        const { data, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds);
        
        if (tagsError) throw tagsError;
        tagsData = data || [];
      }
      
      // Mapear tags para cada recebível
      const receivablesWithTags = receivablesData.map(receivable => {
        const receivableTagIds = receivableTagsData
          .filter(rpt => rpt.receivable_payment_id === receivable.id)
          .map(rpt => rpt.tag_id);
        
        const receivableTags = tagsData.filter(tag => receivableTagIds.includes(tag.id));
        
        return {
          ...receivable,
          tags: receivableTags
        };
      });
      
      setReceivables(receivablesWithTags);
    } catch (err) {
      console.error('Error fetching receivables with tags:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReceivablesWithTags();
  }, [fetchReceivablesWithTags]);

  const refetch = () => {
    fetchReceivablesWithTags();
  };

  return { 
    data: receivables, 
    loading, 
    error, 
    refetch 
  };
};