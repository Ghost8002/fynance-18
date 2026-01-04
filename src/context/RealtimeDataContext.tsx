import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineStorage, PendingOperation } from '@/lib/offlineStorage';
import { devLog, devError } from '@/utils/logger';
import { toast } from 'sonner';

type TableName = 'goals' | 'transactions' | 'accounts' | 'categories' | 'tags' | 'debts' | 'receivable_payments' | 'cards' | 'budgets' | 'subcategories';

interface RealtimeDataState {
  [key: string]: any[];
}

interface RealtimeDataContextType {
  data: RealtimeDataState;
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  fetchData: (table: TableName) => Promise<void>;
  insertData: (table: TableName, newData: any) => Promise<{ data: any; error: string | null }>;
  updateData: (table: TableName, id: string, updateData: any) => Promise<{ data: any; error: string | null }>;
  removeData: (table: TableName, id: string) => Promise<{ error: string | null }>;
  refetch: (table: TableName) => void;
  syncPendingOperations: () => Promise<void>;
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

const REALTIME_TABLES: TableName[] = ['goals', 'transactions', 'accounts', 'categories', 'tags', 'debts', 'receivable_payments', 'cards', 'budgets', 'subcategories'];

export const RealtimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isOnline, wasOffline } = useOnlineStatus();
  const [data, setData] = useState<RealtimeDataState>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string | null }>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const channelsRef = useRef<Map<string, ReturnType<typeof supabase.channel>>>(new Map());
  const initializedTablesRef = useRef<Set<string>>(new Set());

  // Generate temporary ID for offline items
  const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await offlineStorage.getPendingCount();
    setPendingCount(count);
  }, []);

  // Sync pending operations when back online
  const syncPendingOperations = useCallback(async () => {
    if (!isOnline || !user?.id || isSyncing) return;

    setIsSyncing(true);
    const operations = await offlineStorage.getPendingOperations();

    if (operations.length === 0) {
      setIsSyncing(false);
      return;
    }

    devLog(`Syncing ${operations.length} pending operations...`);
    toast.info(`Sincronizando ${operations.length} operações...`);

    let successCount = 0;
    let errorCount = 0;

    for (const op of operations) {
      try {
        if (op.operation === 'INSERT') {
          // Remove temp ID and let Supabase generate a new one
          const { id, ...dataWithoutId } = op.data;
          const isTemp = id?.startsWith('temp-');
          
          const { error: insertError } = await supabase
            .from(op.table as any)
            .insert(isTemp ? dataWithoutId : op.data);

          if (insertError) throw insertError;

          // If it was a temp ID, remove the cached item with temp ID
          if (isTemp && user?.id) {
            await offlineStorage.removeCachedItem(op.table, user.id, id);
          }
        } else if (op.operation === 'UPDATE') {
          const { error: updateError } = await supabase
            .from(op.table as any)
            .update(op.data.updateData)
            .eq('id', op.data.id);

          if (updateError) throw updateError;
        } else if (op.operation === 'DELETE') {
          // Skip deleting temp items (they were never synced)
          if (!op.data.id?.startsWith('temp-')) {
            const { error: deleteError } = await supabase
              .from(op.table as any)
              .delete()
              .eq('id', op.data.id);

            if (deleteError) throw deleteError;
          }
        }

        await offlineStorage.removePendingOperation(op.id);
        successCount++;
      } catch (err) {
        devError(`Failed to sync operation ${op.id}:`, err);
        errorCount++;
      }
    }

    await updatePendingCount();

    // Refetch all data after sync
    for (const table of REALTIME_TABLES) {
      if (initializedTablesRef.current.has(table)) {
        await fetchData(table);
      }
    }

    setIsSyncing(false);

    if (successCount > 0) {
      toast.success(`${successCount} operações sincronizadas!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} operações falharam ao sincronizar`);
    }
  }, [isOnline, user?.id, isSyncing, updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      devLog('Back online, syncing pending operations...');
      syncPendingOperations();
    }
  }, [wasOffline, isOnline, syncPendingOperations]);

  // Load pending count on mount
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  const fetchData = useCallback(async (table: TableName) => {
    if (!user?.id) return;

    try {
      setLoading(prev => ({ ...prev, [table]: true }));

      if (isOnline) {
        // Online: fetch from Supabase
        const { data: result, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;

        devLog(`RealtimeDataContext: Fetched ${table}`, { count: result?.length || 0 });

        setData(prev => ({ ...prev, [table]: result || [] }));
        setError(prev => ({ ...prev, [table]: null }));

        // Cache the data for offline use
        await offlineStorage.cacheData(table, user.id, result || []);
      } else {
        // Offline: load from cache
        const cachedData = await offlineStorage.getCachedData(table, user.id);
        
        if (cachedData) {
          devLog(`RealtimeDataContext: Loaded ${table} from cache`, { count: cachedData.length });
          setData(prev => ({ ...prev, [table]: cachedData }));
          setError(prev => ({ ...prev, [table]: null }));
        } else {
          devLog(`RealtimeDataContext: No cached data for ${table}`);
          setError(prev => ({ ...prev, [table]: 'Sem dados em cache' }));
        }
      }
    } catch (err) {
      devError(`Error fetching ${table}:`, err);
      
      // Try to load from cache on error
      const cachedData = await offlineStorage.getCachedData(table, user.id);
      if (cachedData) {
        devLog(`RealtimeDataContext: Fallback to cache for ${table}`, { count: cachedData.length });
        setData(prev => ({ ...prev, [table]: cachedData }));
      } else {
        setError(prev => ({ ...prev, [table]: err instanceof Error ? err.message : 'An error occurred' }));
      }
    } finally {
      setLoading(prev => ({ ...prev, [table]: false }));
    }
  }, [user?.id, isOnline]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user?.id || !isOnline) return;

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
          async (payload) => {
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

            // Update cache
            if (user?.id) {
              const currentData = data[table] || [];
              if (payload.eventType === 'INSERT') {
                await offlineStorage.addCachedItem(table, user.id, payload.new);
              } else if (payload.eventType === 'UPDATE') {
                await offlineStorage.updateCachedItem(table, user.id, (payload.new as any).id, payload.new);
              } else if (payload.eventType === 'DELETE') {
                await offlineStorage.removeCachedItem(table, user.id, (payload.old as any).id);
              }
            }
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
  }, [user?.id, isOnline]);

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

      if (isOnline) {
        // Online: insert directly
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

          // Update cache
          if (user?.id && result[0]) {
            await offlineStorage.addCachedItem(table, user.id, result[0]);
          }
        }

        return { data: result, error: null };
      } else {
        // Offline: save to queue and update local state
        const tempId = generateTempId();
        const offlineItem = { ...newData, id: tempId, _offline: true };

        // Add to pending operations
        const operation: PendingOperation = {
          id: `op-${tempId}`,
          table,
          operation: 'INSERT',
          data: offlineItem,
          timestamp: Date.now()
        };
        await offlineStorage.addPendingOperation(operation);
        await updatePendingCount();

        // Optimistic update
        setData(prev => ({
          ...prev,
          [table]: [...(prev[table] || []), offlineItem]
        }));

        // Update cache
        if (user?.id) {
          await offlineStorage.addCachedItem(table, user.id, offlineItem);
        }

        toast.info('Salvo offline. Será sincronizado quando voltar online.');

        return { data: [offlineItem], error: null };
      }
    } catch (err) {
      devError(`Error inserting into ${table}:`, err);
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  }, [isOnline, user?.id, updatePendingCount]);

  const updateData = useCallback(async (table: TableName, id: string, updateDataPayload: any) => {
    try {
      if (isOnline && !id.startsWith('temp-')) {
        // Online: update directly (skip temp items)
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

          // Update cache
          if (user?.id) {
            await offlineStorage.updateCachedItem(table, user.id, id, result[0]);
          }
        }

        return { data: result, error: null };
      } else {
        // Offline or temp item: save to queue
        const operation: PendingOperation = {
          id: `op-update-${id}-${Date.now()}`,
          table,
          operation: 'UPDATE',
          data: { id, updateData: updateDataPayload },
          timestamp: Date.now()
        };
        await offlineStorage.addPendingOperation(operation);
        await updatePendingCount();

        // Optimistic update
        setData(prev => ({
          ...prev,
          [table]: (prev[table] || []).map(item =>
            item.id === id ? { ...item, ...updateDataPayload, _offline: true } : item
          )
        }));

        // Update cache
        if (user?.id) {
          await offlineStorage.updateCachedItem(table, user.id, id, updateDataPayload);
        }

        toast.info('Atualização salva offline.');

        return { data: [{ id, ...updateDataPayload }], error: null };
      }
    } catch (err) {
      devError(`Error updating ${table}:`, err);
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' };
    }
  }, [isOnline, user?.id, updatePendingCount]);

  const removeData = useCallback(async (table: TableName, id: string) => {
    try {
      if (isOnline && !id.startsWith('temp-')) {
        // Online: delete directly (skip temp items)
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

        // Update cache
        if (user?.id) {
          await offlineStorage.removeCachedItem(table, user.id, id);
        }

        return { error: null };
      } else {
        // Offline: save to queue
        const operation: PendingOperation = {
          id: `op-delete-${id}-${Date.now()}`,
          table,
          operation: 'DELETE',
          data: { id },
          timestamp: Date.now()
        };
        await offlineStorage.addPendingOperation(operation);
        await updatePendingCount();

        // Optimistic update
        setData(prev => ({
          ...prev,
          [table]: (prev[table] || []).filter(item => item.id !== id)
        }));

        // Update cache
        if (user?.id) {
          await offlineStorage.removeCachedItem(table, user.id, id);
        }

        toast.info('Exclusão salva offline.');

        return { error: null };
      }
    } catch (err) {
      devError(`Error deleting from ${table}:`, err);
      return { error: err instanceof Error ? err.message : 'An error occurred' };
    }
  }, [isOnline, user?.id, updatePendingCount]);

  const refetch = useCallback((table: TableName) => {
    fetchData(table);
  }, [fetchData]);

  return (
    <RealtimeDataContext.Provider value={{
      data,
      loading,
      error,
      isOnline,
      pendingCount,
      isSyncing,
      fetchData,
      insertData,
      updateData,
      removeData,
      refetch,
      syncPendingOperations
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

  const { data, loading, error, isOnline, pendingCount, isSyncing, fetchData, insertData, updateData, removeData, refetch, syncPendingOperations } = context;

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
    isOnline,
    pendingCount,
    isSyncing,
    insert: (newData: any) => insertData(table, newData),
    update: (id: string, updateDataPayload: any) => updateData(table, id, updateDataPayload),
    remove: (id: string) => removeData(table, id),
    refetch: () => refetch(table),
    syncPendingOperations
  };
};

// Hook to access offline status and sync functions
export const useOfflineSync = () => {
  const context = useContext(RealtimeDataContext);

  if (!context) {
    throw new Error('useOfflineSync must be used within a RealtimeDataProvider');
  }

  return {
    isOnline: context.isOnline,
    pendingCount: context.pendingCount,
    isSyncing: context.isSyncing,
    syncPendingOperations: context.syncPendingOperations
  };
};
