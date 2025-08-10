
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTags = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = async () => {
    if (!user?.id) {
      setLoading(false);
      setTags([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setTags([]);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tags.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActiveTags = () => {
    return tags.filter(tag => tag && tag.is_active);
  };

  useEffect(() => {
    fetchTags();
  }, [user?.id]);

  return {
    tags,
    loading,
    fetchTags,
    getActiveTags
  };
};
