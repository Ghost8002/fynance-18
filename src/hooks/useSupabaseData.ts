
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';
import { devLog, devError } from '@/utils/logger';

type TableName = keyof Database['public']['Tables'];

export const useSupabaseData = (table: TableName, userId?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: result, error } = await supabase
        .from(table as any)
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      
      devLog(`useSupabaseData: Fetched ${table}`, {
        count: result?.length || 0,
        sampleData: result?.[0] || null
      });
      
      setData(result || []);
    } catch (err) {
      devError(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [table, userId]);

  // Set up realtime subscription
  useEffect(() => {
    if (!userId) return;

    // Clean up previous channel if exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Create unique channel name
    const channelName = `${table}-${userId}-${Date.now()}`;
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          devLog(`Realtime ${table}:`, payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            setData(prev => {
              // Avoid duplicates
              const exists = prev.some(item => item.id === (payload.new as any).id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item => 
              item.id === (payload.new as any).id ? payload.new : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => item.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe((status) => {
        devLog(`Realtime subscription ${table}:`, status);
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const insert = async (newData: any) => {
    try {
      devLog(`=== INSERT INTO ${table} ===`);
      devLog('Dados sendo inseridos:', JSON.stringify(newData, null, 2));
      
      const { data: result, error } = await supabase
        .from(table as any)
        .insert(newData)
        .select();

      devLog('Resultado da query:', { data: result, error });

      if (error) {
        devError(`❌ Erro na inserção em ${table}:`, error);
        throw error;
      }
      
      // Realtime will handle the update, but we also update locally for immediate feedback
      if (result && Array.isArray(result)) {
        devLog(`✅ Inserção bem-sucedida em ${table}:`, result);
        setData(prev => {
          const newItems = (result as any[]).filter(
            (newItem: any) => !prev.some(existing => existing.id === newItem.id)
          );
          return [...prev, ...newItems];
        });
      }
      
      return { data: result, error: null };
    } catch (err) {
      devError(`❌ Erro ao inserir em ${table}:`, err);
      let errorMessage = 'An error occurred';
      
      if (err instanceof Error) {
        if (err.message.includes('duplicate key')) {
          errorMessage = 'Dados duplicados';
        } else if (err.message.includes('invalid input')) {
          errorMessage = 'Dados inválidos';
        } else if (err.message.includes('permission denied')) {
          errorMessage = 'Permissão negada';
        } else if (err.message.includes('network')) {
          errorMessage = 'Erro de conexão';
        } else if (err.message.includes('column') && err.message.includes('does not exist')) {
          errorMessage = 'Estrutura do banco desatualizada';
        } else {
          errorMessage = err.message;
        }
      }
      
      return { data: null, error: errorMessage };
    }
  };

  const update = async (id: string, updateData: any) => {
    try {
      const { data: result, error } = await supabase
        .from(table as any)
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      // Realtime will handle this, but update locally for immediate feedback
      if (result && Array.isArray(result) && result.length > 0) {
        const updatedItem = result[0];
        if (updatedItem && typeof updatedItem === 'object') {
          setData(prev => prev.map(item => 
            item.id === id ? { ...item, ...(updatedItem as Record<string, any>) } : item
          ));
        }
      }
      
      return { data: result, error: null };
    } catch (err) {
      devError(`Error updating ${table}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      return { data: null, error: errorMessage };
    }
  };

  const remove = async (id: string) => {
    try {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Realtime will handle this, but update locally for immediate feedback
      setData(prev => prev.filter(item => item.id !== id));
      
      return { error: null };
    } catch (err) {
      devError(`Error deleting from ${table}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      return { error: errorMessage };
    }
  };

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    insert, 
    update, 
    remove, 
    refetch 
  };
};
