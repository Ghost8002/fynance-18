import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { TransactionFilters } from "./types/transactionTypes";
import { applyTransactionFilters } from "./utils/transactionFilters";
import { createPaginationInfo, paginateArray } from "./utils/paginationUtils";

export type { TransactionFilters } from "./types/transactionTypes";

export const useTransactionsPaginated = (filters: TransactionFilters, itemsPerPage: number = 50) => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all necessary data
  const { 
    data: rawTransactions, 
    refetch: refetchTransactions, 
    update, 
    remove 
  } = useSupabaseData('transactions', user?.id);

  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: cards } = useSupabaseData('cards', user?.id);
  const { data: tags } = useSupabaseData('tags', user?.id);

  // Listen for transaction events
  useEffect(() => {
    const handleTransactionAdded = async () => {
      console.log('useTransactionsPaginated: Received transaction added event');
      await refetchTransactions();
    };

    window.addEventListener('transactionWithTagsAdded', handleTransactionAdded);
    return () => window.removeEventListener('transactionWithTagsAdded', handleTransactionAdded);
  }, [refetchTransactions]);

  // Enhanced transactions - tags are already embedded from useSupabaseData
  const enhancedTransactions = useMemo(() => {
    console.log('useTransactionsPaginated: Processing transactions', {
      rawTransactions: rawTransactions?.length || 0,
      sampleTransaction: rawTransactions?.[0] || null
    });

    if (!rawTransactions) return [];
    
    // Tags are already embedded, no need to process further
    return rawTransactions;
  }, [rawTransactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    const filtered = applyTransactionFilters(enhancedTransactions, filters);
    
    console.log('useTransactionsPaginated: Filtered transactions', {
      original: enhancedTransactions.length,
      filtered: filtered.length,
      filters: filters
    });

    return filtered;
  }, [enhancedTransactions, filters]);

  // Pagination calculations
  const totalItems = filteredTransactions.length;
  const paginatedTransactions = paginateArray(filteredTransactions, currentPage, itemsPerPage);
  const paginationInfo = createPaginationInfo(currentPage, totalItems, itemsPerPage, setCurrentPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Update loading state
  useEffect(() => {
    setLoading(!rawTransactions);
    setError(null);
  }, [rawTransactions]);

  const wrappedUpdate = async (id: string, data: any) => {
    try {
      const result = await update(id, data);
      await refetchTransactions();
      return result;
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError('Failed to update transaction');
      throw error;
    }
  };

  const wrappedRemove = async (id: string) => {
    try {
      const result = await remove(id);
      await refetchTransactions();
      return result;
    } catch (error) {
      console.error('Error removing transaction:', error);
      setError('Failed to remove transaction');
      throw error;
    }
  };

  return {
    transactions: paginatedTransactions,
    loading,
    error,
    update: wrappedUpdate,
    remove: wrappedRemove,
    categories: categories || [],
    accounts: accounts || [],
    cards: cards || [],
    tags: tags || [],
    pagination: paginationInfo,
  };
};
