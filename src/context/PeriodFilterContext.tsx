import React, { createContext, useContext } from 'react';
import { usePeriodFilter } from '@/hooks/usePeriodFilter';
import { PeriodType } from '@/components/dashboard/PeriodFilter';

interface PeriodFilterContextType {
  selectedPeriod: PeriodType;
  setSelectedPeriod: (period: PeriodType) => void;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filterTransactionsByPeriod: (transactions: any[]) => any[];
}

const PeriodFilterContext = createContext<PeriodFilterContextType | null>(null);

export const PeriodFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const periodFilter = usePeriodFilter();
  
  return (
    <PeriodFilterContext.Provider value={periodFilter}>
      {children}
    </PeriodFilterContext.Provider>
  );
};

export const usePeriodFilterContext = () => {
  const context = useContext(PeriodFilterContext);
  if (!context) {
    throw new Error('usePeriodFilterContext must be used within a PeriodFilterProvider');
  }
  return context;
};