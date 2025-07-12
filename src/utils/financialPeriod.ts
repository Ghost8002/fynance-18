
import { format } from "date-fns";

export interface FinancialPeriod {
  startDate: Date;
  endDate: Date;
}

export const getFinancialPeriod = (monthStartDay: number = 1, referenceDate?: Date): FinancialPeriod => {
  const today = referenceDate || new Date();
  const currentDay = today.getDate();
  
  let startDate: Date;
  let endDate: Date;
  
  if (currentDay >= monthStartDay) {
    // Estamos no período financeiro atual
    startDate = new Date(today.getFullYear(), today.getMonth(), monthStartDay);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, monthStartDay - 1);
  } else {
    // Estamos no período financeiro anterior
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, monthStartDay);
    endDate = new Date(today.getFullYear(), today.getMonth(), monthStartDay - 1);
  }
  
  return { startDate, endDate };
};

export const getFinancialPeriodByType = (
  periodType: string, 
  monthStartDay: number = 1,
  referenceDate?: Date
): FinancialPeriod => {
  const now = referenceDate || new Date();
  let startDate: Date;
  let endDate: Date;

  switch (periodType) {
    case 'current-month':
      return getFinancialPeriod(monthStartDay, now);
      
    case 'last-3-months':
      const current3Months = getFinancialPeriod(monthStartDay, now);
      startDate = new Date(current3Months.startDate);
      startDate.setMonth(startDate.getMonth() - 2);
      endDate = current3Months.endDate;
      break;
      
    case 'last-6-months':
      const current6Months = getFinancialPeriod(monthStartDay, now);
      startDate = new Date(current6Months.startDate);
      startDate.setMonth(startDate.getMonth() - 5);
      endDate = current6Months.endDate;
      break;
      
    case 'current-year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
      
    default:
      return getFinancialPeriod(monthStartDay, now);
  }

  return { startDate, endDate };
};

export const isDateInCurrentFinancialPeriod = (date: Date, monthStartDay: number = 1): boolean => {
  const { startDate, endDate } = getFinancialPeriod(monthStartDay);
  return date >= startDate && date <= endDate;
};

export const formatFinancialPeriod = (period: FinancialPeriod): string => {
  return `${format(period.startDate, 'dd/MM/yyyy')} - ${format(period.endDate, 'dd/MM/yyyy')}`;
};
