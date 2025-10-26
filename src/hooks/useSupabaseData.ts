
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

type TableName = keyof Database['public']['Tables'];

export const useSupabaseData = (table: TableName, userId?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Regular fetch for all tables - tags are already stored in transactions.tags column
      const { data: result, error } = await supabase
        .from(table as any)
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log(`useSupabaseData: Fetched ${table}`, {
        count: result?.length || 0,
        sampleData: result?.[0] || null
      });
      
      setData(result || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [table, userId]);

  const insert = async (newData: any) => {
    try {
      console.log(`=== INSERT INTO ${table} ===`);
      console.log('Dados sendo inseridos:', JSON.stringify(newData, null, 2));
      console.log('Tabela:', table);
      console.log('User ID:', userId);
      
      const { data: result, error } = await supabase
        .from(table as any)
        .insert(newData)
        .select();

      console.log('Resultado da query:', { data: result, error });

      if (error) {
        console.error(`❌ Erro na inserção em ${table}:`, error);
        throw error;
      }
      
      if (result) {
        console.log(`✅ Inserção bem-sucedida em ${table}:`, result);
        setData(prev => [...prev, ...result]);
      }
      
      return { data: result, error: null };
    } catch (err) {
      console.error(`❌ Erro ao inserir em ${table}:`, err);
      let errorMessage = 'An error occurred';
      
      if (err instanceof Error) {
        console.error('Mensagem de erro:', err.message);
        console.error('Stack trace:', err.stack);
        
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
      
      if (result && Array.isArray(result) && result.length > 0) {
        const updatedItem = result[0];
        if (updatedItem && typeof updatedItem === 'object' && updatedItem !== null && !Array.isArray(updatedItem)) {
          setData(prev => prev.map(item => 
            item.id === id ? { ...item, ...(updatedItem as Record<string, any>) } : item
          ));
        }
      }
      
      return { data: result, error: null };
    } catch (err) {
      console.error(`Error updating ${table}:`, err);
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
      
      setData(prev => prev.filter(item => item.id !== id));
      
      return { error: null };
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      return { error: errorMessage };
    }
  };

  const refetch = () => {
    fetchData();
  };

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
