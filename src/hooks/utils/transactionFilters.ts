
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

  // Date range filter
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThisWeek = new Date(startOfToday);
  startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfThisYear = new Date(now.getFullYear(), 0, 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  switch (filters.dateRange) {
    case "today":
      filtered = filtered.filter(t => new Date(t.date) >= startOfToday);
      break;
    case "this-week":
      filtered = filtered.filter(t => new Date(t.date) >= startOfThisWeek);
      break;
    case "last-7-days":
      filtered = filtered.filter(t => new Date(t.date) >= sevenDaysAgo);
      break;
    case "current-month":
      filtered = filtered.filter(t => new Date(t.date) >= startOfThisMonth);
      break;
    case "last-month":
      filtered = filtered.filter(t => {
        const d = new Date(t.date);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      });
      break;
    case "this-year":
    case "current-year":
      filtered = filtered.filter(t => new Date(t.date) >= startOfThisYear);
      break;
    case "last-30-days":
      filtered = filtered.filter(t => new Date(t.date) >= thirtyDaysAgo);
      break;
    case "all":
    default:
      // No date filtering
      break;
  }

  // Sort by date (newest first)
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
