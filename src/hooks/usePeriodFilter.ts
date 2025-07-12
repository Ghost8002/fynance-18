
import { useState, useMemo } from 'react';
import { PeriodType } from '@/components/dashboard/PeriodFilter';
import { useFinancialPeriod } from '@/hooks/useFinancialPeriod';

export const usePeriodFilter = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('current-month');
  const { getFinancialPeriod, filterTransactionsByPeriod } = useFinancialPeriod();

  const dateRange = useMemo(() => {
    const { startDate, endDate } = getFinancialPeriod(selectedPeriod);
    return { startDate, endDate };
  }, [selectedPeriod, getFinancialPeriod]);

  const filterTransactionsByPeriodWrapper = (transactions: any[]) => {
    return filterTransactionsByPeriod(transactions, selectedPeriod);
  };

  return {
    selectedPeriod,
    setSelectedPeriod,
    dateRange,
    filterTransactionsByPeriod: filterTransactionsByPeriodWrapper,
  };
};
