
import { TransactionFilters } from "../types/transactionTypes";

export const applyTransactionFilters = (transactions: any[], filters: TransactionFilters) => {
  if (!transactions) return [];

  let filtered = [...transactions];

  // Search filter - including tag search
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(searchTerm) ||
      t.notes?.toLowerCase().includes(searchTerm) ||
      (t.tags && Array.isArray(t.tags) && t.tags.some((tag: any) => 
        tag && tag.name && tag.name.toLowerCase().includes(searchTerm)
      ))
    );
  }

  // Type filter
  if (filters.type !== "all") {
    filtered = filtered.filter(t => t.type === filters.type);
  }

  // Category filter
  if (filters.categoryId !== "all") {
    filtered = filtered.filter(t => t.category_id === filters.categoryId);
  }

  // Account filter
  if (filters.accountId !== "all") {
    filtered = filtered.filter(t => t.account_id === filters.accountId);
  }

  // Card filter
  if (filters.cardId !== "all") {
    filtered = filtered.filter(t => t.card_id === filters.cardId);
  }

  // Amount filters
  if (filters.minAmount) {
    const minAmount = parseFloat(filters.minAmount);
    if (!isNaN(minAmount)) {
      filtered = filtered.filter(t => Number(t.amount) >= minAmount);
    }
  }

  if (filters.maxAmount) {
    const maxAmount = parseFloat(filters.maxAmount);
    if (!isNaN(maxAmount)) {
      filtered = filtered.filter(t => Number(t.amount) <= maxAmount);
    }
  }

  // Helper para criar data local sem conversão UTC
  const createLocalDateFromString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Date range filter - usando datas locais para evitar problemas de timezone
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  startOfToday.setHours(0, 0, 0, 0);
  
  const startOfThisWeek = new Date(startOfToday);
  startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfThisMonth.setHours(0, 0, 0, 0);
  
  const startOfThisYear = new Date(now.getFullYear(), 0, 1);
  startOfThisYear.setHours(0, 0, 0, 0);
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  startOfLastMonth.setHours(0, 0, 0, 0);
  
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  endOfLastMonth.setHours(23, 59, 59, 999);

  switch (filters.dateRange) {
    case "today":
      filtered = filtered.filter(t => {
        const transactionDate = createLocalDateFromString(t.date);
        return transactionDate >= startOfToday;
      });
      break;
    case "this-week":
      filtered = filtered.filter(t => {
        const transactionDate = createLocalDateFromString(t.date);
        return transactionDate >= startOfThisWeek;
      });
      break;
    case "last-7-days":
      filtered = filtered.filter(t => {
        const transactionDate = createLocalDateFromString(t.date);
        return transactionDate >= sevenDaysAgo;
      });
      break;
    case "current-month":
      filtered = filtered.filter(t => {
        const transactionDate = createLocalDateFromString(t.date);
        return transactionDate >= startOfThisMonth;
      });
      break;
    case "last-month":
      filtered = filtered.filter(t => {
        const transactionDate = createLocalDateFromString(t.date);
        return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
      });
      break;
    case "this-year":
    case "current-year":
      filtered = filtered.filter(t => {
        const transactionDate = createLocalDateFromString(t.date);
        return transactionDate >= startOfThisYear;
      });
      break;
    case "last-30-days":
      filtered = filtered.filter(t => {
        const transactionDate = createLocalDateFromString(t.date);
        return transactionDate >= thirtyDaysAgo;
      });
      break;
    case "all":
    default:
      // No date filtering
      break;
  }

  // Sort by date (newest first) - usando comparação de strings para evitar timezone
  return filtered.sort((a, b) => {
    // Comparar datas como strings no formato YYYY-MM-DD funciona corretamente
    return b.date.localeCompare(a.date);
  });
};
