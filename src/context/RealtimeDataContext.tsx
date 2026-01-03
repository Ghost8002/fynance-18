import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { devLog, devError } from '@/utils/logger';

type TableName = 'goals' | 'transactions' | 'accounts' | 'categories' | 'tags' | 'debts' | 'receivable_payments' | 'cards' | 'budgets' | 'subcategories';

interface RealtimeDataState {
  [key: string]: any[];
}

interface RealtimeDataContextType {
  data: RealtimeDataState;
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };
  fetchData: (table: TableName) => Promise<void>;
  insertData: (table: TableName, newData: any) => Promise<{ data: any; error: string | null }>;
  updateData: (table: TableName, id: string, updateData: any) => Promise<{ data: any; error: string | null }>;
  removeData: (table: TableName, id: string) => Promise<{ error: string | null }>;
  refetch: (table: TableName) => void;
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

const REALTIME_TABLES: TableName[] = ['goals', 'transactions', 'accounts', 'categories', 'tags', 'debts', 'receivable_payments', 'cards', 'budgets', 'subcategories'];

export const RealtimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState<RealtimeDataState>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string | null }>({});
  const channelsRef = useRef<Map<string, ReturnType<typeof supabase.channel>>>(new Map());
  const initializedTablesRef = useRef<Set<string>>(new Set());

  const fetchData = useCallback(async (table: TableName) => {
    if (!user?.id) return;

    try {
      setLoading(prev => ({ ...prev, [table]: true }));
      
      const { data: result, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      
      devLog(`RealtimeDataContext: Fetched ${table}`, { count: result?.length || 0 });
      
      setData(prev => ({ ...prev, [table]: result || [] }));
      setError(prev => ({ ...prev, [table]: null }));
    } catch (err) {
      devError(`Error fetching ${table}:`, err);
      setError(prev => ({ ...prev, [table]: err instanceof Error ? err.message : 'An error occurred' }));
    } finally {
      setLoading(prev => ({ ...prev, [table]: false }));
    }
  }, [user?.id]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Clean up existing channels
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();

    // Create channels for each table
    REALTIME_TABLES.forEach((table) => {
      const channelName = `realtime-${table}-${user.id}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            devLog(`Realtime ${table}:`, payload.eventType, payload);
            
            setData(prev => {
              const currentData = prev[table] || [];
              
              if (payload.eventType === 'INSERT') {
                const exists = currentData.some(item => item.id === (payload.new as any).id);
                if (exists) return prev;
                return { ...prev, [table]: [...currentData, payload.new] };
              } else if (payload.eventType === 'UPDATE') {
                return {
                  ...prev,
                  [table]: currentData.map(item =>
                    item.id === (payload.new as any).id ? payload.new : item
                  )
                };
              } else if (payload.eventType === 'DELETE') {
                return {
                  ...prev,
                  [table]: currentData.filter(item => item.id !== (payload.old as any).id)
                };
              }
              return prev;
            });
          }
        )
        .subscribe((status) => {
          devLog(`Realtime subscription ${table}:`, status);
        });

      channelsRef.current.set(table, channel);
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
    };
  }, [user?.id]);

  // Initial fetch for commonly used tables
  useEffect(() => {
    if (!user?.id) return;
    
    // Fetch essential tables on mount
    ['goals', 'accounts', 'categories', 'tags'].forEach((table) => {
      if (!initializedTablesRef.current.has(table)) {
        initializedTablesRef.current.add(table);
        fetchData(table as TableName);
      }
    });
  }, [user?.id, fetchData]);

  const insertData = useCallback(async (table: TableName, newData: any) => {
    try {
      devLog(`=== INSERT INTO ${table} ===`);
      
      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert(newData)
        .select();

      if (insertError) {
        devError(`Error inserting into ${table}:`, insertError);
        throw insertError;
      }

      // Optimistic update - realtime will confirm
      if (result && Array.isArray(result)) {
        setData(prev => {
          const currentData = prev[table] || [];
          const newItems = result.filter(
            (newItem: any) => !currentData.some(existing => existing.id === newItem.id)
          );
          return { ...prev, [table]: [...currentData, ...newItems] };
        });
      }

      return { data: result, error: null };
    } catch (err) {
      devError(`Error inserting into ${table}:`, err);
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  }, []);

  const updateData = useCallback(async (table: TableName, id: string, updateDataPayload: any) => {
    try {
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(updateDataPayload)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      // Optimistic update
      if (result && Array.isArray(result) && result.length > 0) {
        setData(prev => ({
          ...prev,
          [table]: (prev[table] || []).map(item =>
            item.id === id ? { ...item, ...result[0] } : item
          )
        }));
      }

      return { data: result, error: null };
    } catch (err) {
      devError(`Error updating ${table}:`, err);
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  }, []);

  const removeData = useCallback(async (table: TableName, id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Optimistic update
      setData(prev => ({
        ...prev,
        [table]: (prev[table] || []).filter(item => item.id !== id)
      }));

      return { error: null };
    } catch (err) {
      devError(`Error deleting from ${table}:`, err);
      return { error: err instanceof Error ? err.message : 'An error occurred' };
    }
  }, []);

  const refetch = useCallback((table: TableName) => {
    fetchData(table);
  }, [fetchData]);

  return (
    <RealtimeDataContext.Provider value={{
      data,
      loading,
      error,
      fetchData,
      insertData,
      updateData,
      removeData,
      refetch
    }}>
      {children}
    </RealtimeDataContext.Provider>
  );
};

export const useRealtimeData = (table: TableName) => {
  const context = useContext(RealtimeDataContext);
  
  if (!context) {
    throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
  }

  const { data, loading, error, fetchData, insertData, updateData, removeData, refetch } = context;

  // Fetch data for this table on first use
  useEffect(() => {
    if (!data[table] && !loading[table]) {
      fetchData(table);
    }
  }, [table, data, loading, fetchData]);

  return {
    data: data[table] || [],
    loading: loading[table] || false,
    error: error[table] || null,
    insert: (newData: any) => insertData(table, newData),
    update: (id: string, updateDataPayload: any) => updateData(table, id, updateDataPayload),
    remove: (id: string) => removeData(table, id),
    refetch: () => refetch(table)
  };
};
