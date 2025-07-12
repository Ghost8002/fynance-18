
export interface TransactionFilters {
  search: string;
  dateRange: string;
  type: "all" | "income" | "expense";
  categoryId: string;
  accountId: string;
  cardId: string;
  minAmount: string;
  maxAmount: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}
