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

/**
 * Converte data OFX (YYYYMMDD) para formato ISO com correção de timezone brasileiro
 * Resolve problema de deslocamento de datas em importações OFX
 */
export const convertOFXDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 8) {
    throw new Error('Formato de data OFX inválido');
  }
  
  // Extrair componentes da data (YYYYMMDD)
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  // Usar função genérica para conversão segura
  return convertToLocalDateString(year, month, day);
};

/**
 * Função genérica para converter componentes de data para string ISO local
 * Resolve problemas de timezone em todas as importações (OFX, XLSX, etc.)
 */
export const convertToLocalDateString = (year: string, month: string, day: string): string => {
  // Criar data no timezone local especificando horário para evitar interpretação UTC
  // Usar T00:00:00 para garantir que seja interpretada como horário local
  const localDate = new Date(`${year}-${month}-${day}T00:00:00`);
  
  // Retornar apenas a parte da data em formato YYYY-MM-DD
  return localDate.toISOString().split('T')[0];
};

/**
 * Obtém a data atual no timezone local em formato YYYY-MM-DD
 * Substitui new Date().toISOString().split('T')[0] para evitar problemas de timezone
 */
export const getCurrentLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converte um objeto Date para string no formato YYYY-MM-DD no timezone local
 * Evita problemas de timezone ao usar toISOString()
 */
export const dateToLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converte uma string de data (YYYY-MM-DD) em objeto Date no timezone local
 * Evita problemas de conversão UTC que deslocam a data em 1 dia
 */
export const parseLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Compara duas datas no formato string (YYYY-MM-DD)
 * Retorna: -1 se a < b, 0 se iguais, 1 se a > b
 */
export const compareDateStrings = (a: string, b: string): number => {
  return a.localeCompare(b);
};
/**
 * Valida se uma string é uma data OFX válida (YYYYMMDD)
 */
export const isValidOFXDate = (dateStr: string): boolean => {
  if (!dateStr || dateStr.length < 8) return false;
  
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6));
  const day = parseInt(dateStr.substring(6, 8));
  
  // Validações básicas
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Validar se a data é válida
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}; 