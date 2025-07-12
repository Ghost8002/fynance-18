
import { PaginationInfo } from "../types/transactionTypes";

export const createPaginationInfo = (
  currentPage: number,
  totalItems: number,
  itemsPerPage: number,
  setCurrentPage: (page: number) => void
): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    totalItems,
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
};

export const paginateArray = <T>(array: T[], currentPage: number, itemsPerPage: number): T[] => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return array.slice(startIndex, endIndex);
};
