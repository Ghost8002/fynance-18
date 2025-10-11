
import { format } from "date-fns";

export interface FinancialPeriod {
  startDate: Date;
  endDate: Date;
}

// Função auxiliar para criar data local sem problemas de timezone
const createLocalDate = (year: number, month: number, day: number): Date => {
  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getFinancialPeriod = (monthStartDay: number = 1, referenceDate?: Date): FinancialPeriod => {
  const today = referenceDate || new Date();
  const currentDay = today.getDate();
  
  let startDate: Date;
  let endDate: Date;
  
  if (currentDay >= monthStartDay) {
    // Estamos no período financeiro atual
    startDate = createLocalDate(today.getFullYear(), today.getMonth(), monthStartDay);
    endDate = createLocalDate(today.getFullYear(), today.getMonth() + 1, monthStartDay - 1);
  } else {
    // Estamos no período financeiro anterior
    startDate = createLocalDate(today.getFullYear(), today.getMonth() - 1, monthStartDay);
    endDate = createLocalDate(today.getFullYear(), today.getMonth(), monthStartDay - 1);
  }
  
  // Ajustar endDate para 23:59:59 para incluir todo o último dia
  endDate.setHours(23, 59, 59, 999);
  
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
      startDate = createLocalDate(
        current3Months.startDate.getFullYear(),
        current3Months.startDate.getMonth() - 2,
        current3Months.startDate.getDate()
      );
      endDate = current3Months.endDate;
      break;
      
    case 'last-6-months':
      const current6Months = getFinancialPeriod(monthStartDay, now);
      startDate = createLocalDate(
        current6Months.startDate.getFullYear(),
        current6Months.startDate.getMonth() - 5,
        current6Months.startDate.getDate()
      );
      endDate = current6Months.endDate;
      break;
      
    case 'current-year':
      startDate = createLocalDate(now.getFullYear(), 0, 1);
      endDate = createLocalDate(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
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
