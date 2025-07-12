
import { useMemo } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { getFinancialPeriodByType, type FinancialPeriod } from '@/utils/financialPeriod';
import { PeriodType } from '@/components/dashboard/PeriodFilter';

export const useFinancialPeriod = () => {
  const { generalSettings } = useUserSettings();

  const getFinancialPeriod = (periodType: PeriodType): FinancialPeriod => {
    const monthStartDay = parseInt(generalSettings.month_start_day) || 1;
    return getFinancialPeriodByType(periodType, monthStartDay);
  };

  const filterTransactionsByPeriod = (transactions: any[], periodType: PeriodType) => {
    const { startDate, endDate } = getFinancialPeriod(periodType);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  const getCurrentFinancialPeriod = (): FinancialPeriod => {
    return getFinancialPeriod('current-month');
  };

  return {
    getFinancialPeriod,
    filterTransactionsByPeriod,
    getCurrentFinancialPeriod,
    monthStartDay: parseInt(generalSettings.month_start_day) || 1,
  };
};
