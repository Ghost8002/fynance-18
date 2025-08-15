import { useState, useEffect, useCallback } from 'react';
import { FilterConfig, FilterPreset } from '@/components/shared/AdvancedFilters';

const STORAGE_KEY = 'fynance-advanced-filters';

export const useAdvancedFilters = (type: 'receivables' | 'debts') => {
  const [filters, setFilters] = useState<FilterConfig>({
    searchTerm: '',
    status: 'all',
    categoryId: 'all',
    accountId: 'all',
    minAmount: '',
    maxAmount: '',
    isRecurring: 'all',
    priority: 'all',
    startDate: undefined,
    endDate: undefined,
    tags: [],
  });

  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load filters and presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${type}`);
      if (stored) {
        const { filters: storedFilters, presets: storedPresets } = JSON.parse(stored);
        if (storedFilters) setFilters(storedFilters);
        if (storedPresets) setPresets(storedPresets);
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
  }, [type]);

  // Save filters and presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}-${type}`, JSON.stringify({ filters, presets }));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [filters, presets, type]);

  const updateFilters = useCallback((newFilters: Partial<FilterConfig>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      status: 'all',
      categoryId: 'all',
      accountId: 'all',
      minAmount: '',
      maxAmount: '',
      isRecurring: 'all',
      priority: 'all',
      startDate: undefined,
      endDate: undefined,
      tags: [],
    });
  }, []);

  const savePreset = useCallback((preset: FilterPreset) => {
    setPresets(prev => {
      const existingIndex = prev.findIndex(p => p.id === preset.id);
      if (existingIndex >= 0) {
        // Update existing preset
        const updated = [...prev];
        updated[existingIndex] = preset;
        return updated;
      } else {
        // Add new preset
        return [...prev, preset];
      }
    });
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
    }
  }, [presets]);

  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  const clearAllPresets = useCallback(() => {
    setPresets([]);
  }, []);

  // Filter data based on current filters
  const applyFilters = useCallback((data: any[]) => {
    if (!data || data.length === 0) return [];

    return data.filter(item => {
      // Search term filter
      if (filters.searchTerm && !item.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        let actualStatus = item.status;
        if (item.status === 'pending' && item.due_date) {
          const today = new Date();
          const due = new Date(item.due_date);
          if (due < today) actualStatus = 'overdue';
        }
        if (actualStatus !== filters.status) return false;
      }

      // Category filter
      if (filters.categoryId !== 'all' && item.category_id !== filters.categoryId) {
        return false;
      }

      // Account filter
      if (filters.accountId !== 'all' && item.account_id !== filters.accountId) {
        return false;
      }

      // Amount range filter
      const amount = Number(item.amount);
      if (filters.minAmount && amount < Number(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && amount > Number(filters.maxAmount)) {
        return false;
      }

      // Recurrence filter
      if (filters.isRecurring !== 'all') {
        const isRecurring = Boolean(item.is_recurring);
        if (isRecurring !== (filters.isRecurring === 'true')) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority !== 'all' && item.priority !== filters.priority) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const itemDate = new Date(item.due_date);
        if (filters.startDate && itemDate < filters.startDate) {
          return false;
        }
        if (filters.endDate && itemDate > filters.endDate) {
          return false;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const itemTags = item.tags || [];
        const hasMatchingTag = filters.tags.some(tag => itemTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [filters]);

  // Get active filters count
  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'startDate' || key === 'endDate') {
        if (value !== undefined) count++;
      } else if (key === 'tags') {
        if (Array.isArray(value) && value.length > 0) count++;
      } else if (value !== '' && value !== 'all') {
        count++;
      }
    });
    return count;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return getActiveFiltersCount() > 0;
  }, [getActiveFiltersCount]);

  return {
    filters,
    presets,
    isLoading,
    updateFilters,
    resetFilters,
    savePreset,
    loadPreset,
    deletePreset,
    clearAllPresets,
    applyFilters,
    getActiveFiltersCount,
    hasActiveFilters,
  };
};
