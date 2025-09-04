
import { useState, useMemo } from 'react';
import { PeriodType } from '@/components/dashboard/PeriodFilter';
import { useFinancialPeriod } from '@/hooks/useFinancialPeriod';

export const usePeriodFilter = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('current-month');
  const { getFinancialPeriod, filterTransactionsByPeriod } = useFinancialPeriod();
  const [referenceDate, setReferenceDate] = useState<Date | null>(null);

  const dateRange = useMemo(() => {
    const { startDate, endDate } = getFinancialPeriod(selectedPeriod, referenceDate || undefined);
    return { startDate, endDate };
  }, [selectedPeriod, referenceDate, getFinancialPeriod]);

  const filterTransactionsByPeriodWrapper = (transactions: any[]) => {
    return filterTransactionsByPeriod(transactions, selectedPeriod, referenceDate || undefined);
  };

  const goToPreviousMonth = () => {
    const base = referenceDate ? new Date(referenceDate) : new Date();
    base.setMonth(base.getMonth() - 1);
    setReferenceDate(base);
    setSelectedPeriod('current-month');
  };

  const goToNextMonth = () => {
    const base = referenceDate ? new Date(referenceDate) : new Date();
    base.setMonth(base.getMonth() + 1);
    setReferenceDate(base);
    setSelectedPeriod('current-month');
  };

  return {
    selectedPeriod,
    setSelectedPeriod,
    dateRange,
    filterTransactionsByPeriod: filterTransactionsByPeriodWrapper,
    goToPreviousMonth,
    goToNextMonth,
  };
};
