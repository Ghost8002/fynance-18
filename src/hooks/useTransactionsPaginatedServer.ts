import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { TransactionFilters, PaginationInfo } from "./types/transactionTypes";
import { useSupabaseData } from "./useSupabaseData";
import { devLog, devError } from "@/utils/logger";

interface UseTransactionsPaginatedServerOptions {
  itemsPerPage?: number;
}

export const useTransactionsPaginatedServer = (
  filters: TransactionFilters,
  options: UseTransactionsPaginatedServerOptions = {}
) => {
  const { itemsPerPage = 50 } = options;
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Related data (not paginated, usually small datasets)
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: cards } = useSupabaseData('cards', user?.id);
  const { data: tags } = useSupabaseData('tags', user?.id);
  const { data: subcategories } = useSupabaseData('subcategories', user?.id);

  // Build date range for filter
  const getDateRange = useCallback((dateRange: string): { start: string | null; end: string | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case "today": {
        const dateStr = today.toISOString().split('T')[0];
        return { start: dateStr, end: dateStr };
      }
      case "this-week": {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { start: startOfWeek.toISOString().split('T')[0], end: null };
      }
      case "last-7-days": {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        return { start: sevenDaysAgo.toISOString().split('T')[0], end: null };
      }
      case "current-month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth.toISOString().split('T')[0], end: null };
      }
      case "last-month": {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return { 
          start: startOfLastMonth.toISOString().split('T')[0], 
          end: endOfLastMonth.toISOString().split('T')[0] 
        };
      }
      case "this-year":
      case "current-year": {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear.toISOString().split('T')[0], end: null };
      }
      case "last-30-days": {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return { start: thirtyDaysAgo.toISOString().split('T')[0], end: null };
      }
      default:
        return { start: null, end: null };
    }
  }, []);

  // Fetch transactions with server-side pagination and filtering
  const fetchTransactions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate offset
      const offset = (currentPage - 1) * itemsPerPage;

      // Build query
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply type filter
      if (filters.type !== "all") {
        query = query.eq('type', filters.type);
      }

      // Apply category filter
      if (filters.categoryId !== "all") {
        query = query.eq('category_id', filters.categoryId);
      }

      // Apply account filter
      if (filters.accountId !== "all") {
        query = query.eq('account_id', filters.accountId);
      }

      // Apply card filter
      if (filters.cardId !== "all") {
        query = query.eq('card_id', filters.cardId);
      }

      // Apply amount filters
      if (filters.minAmount) {
        const minAmount = parseFloat(filters.minAmount);
        if (!isNaN(minAmount)) {
          query = query.gte('amount', minAmount);
        }
      }

      if (filters.maxAmount) {
        const maxAmount = parseFloat(filters.maxAmount);
        if (!isNaN(maxAmount)) {
          query = query.lte('amount', maxAmount);
        }
      }

      // Apply date range filter
      const dateRange = getDateRange(filters.dateRange);
      if (dateRange.start) {
        query = query.gte('date', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('date', dateRange.end);
      }

      // Apply search filter (ilike for description and notes)
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`description.ilike.${searchTerm},notes.ilike.${searchTerm}`);
      }

      // Apply pagination
      query = query.range(offset, offset + itemsPerPage - 1);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      devLog('useTransactionsPaginatedServer: Fetched transactions', {
        count: data?.length || 0,
        totalCount: count,
        currentPage,
        offset
      });

      setTransactions(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      devError('Error fetching paginated transactions:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentPage, itemsPerPage, filters, getDateRange]);

  // Fetch when dependencies change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.search,
    filters.type,
    filters.categoryId,
    filters.accountId,
    filters.cardId,
    filters.minAmount,
    filters.maxAmount,
    filters.dateRange
  ]);

  // Listen for transaction events
  useEffect(() => {
    const handleTransactionAdded = async () => {
      devLog('useTransactionsPaginatedServer: Received transaction added event');
      await fetchTransactions();
    };

    window.addEventListener('transactionWithTagsAdded', handleTransactionAdded);
    return () => window.removeEventListener('transactionWithTagsAdded', handleTransactionAdded);
  }, [fetchTransactions]);

  // Update function
  const update = async (id: string, updateData: any) => {
    try {
      const { data: result, error: updateError } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select();

      if (updateError) throw updateError;

      // Refresh the list
      await fetchTransactions();

      return { data: result, error: null };
    } catch (err) {
      devError('Error updating transaction:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar transação';
      return { data: null, error: errorMessage };
    }
  };

  // Remove function
  const remove = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Refresh the list
      await fetchTransactions();

      return { error: null };
    } catch (err) {
      devError('Error removing transaction:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover transação';
      return { error: errorMessage };
    }
  };

  // Pagination info
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  const pagination: PaginationInfo = {
    currentPage,
    totalPages,
    totalItems: totalCount,
    itemsPerPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage: (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    goToNextPage: () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    },
    goToPrevPage: () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  return {
    transactions,
    loading,
    error,
    update,
    remove,
    refetch: fetchTransactions,
    categories: categories || [],
    accounts: accounts || [],
    cards: cards || [],
    tags: tags || [],
    subcategories: subcategories || [],
    pagination,
  };
};
