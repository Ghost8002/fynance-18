/**
 * Utilitários para validação de datas
 */

export const validateDay = (day: number, month?: number, year?: number): boolean => {
  if (day < 1 || day > 31) return false;
  
  if (month !== undefined) {
    const daysInMonth = new Date(year || 2024, month, 0).getDate();
    return day <= daysInMonth;
  }
  
  return true;
};

export const validateMonth = (month: number): boolean => {
  return month >= 1 && month <= 12;
};

export const validateYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 10 && year <= currentYear + 10;
};

export const validateDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const calculateDaysUntilDue = (dueDay: number): number => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  let dueDate = new Date(currentYear, currentMonth, dueDay);
  
  // Se a data já passou, calcular para o próximo mês
  if (dueDate < today) {
    dueDate = new Date(currentYear, currentMonth + 1, dueDay);
  }

  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (!validateDate(date)) {
      return 'Data inválida';
    }
    
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

export const formatCurrency = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}; 