// Helper function to format Brazilian currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Helper function to validate and parse card data
export const parseCardData = (card: any) => {
  const creditLimit = typeof card.credit_limit === 'number' ? card.credit_limit : 
                     isNaN(parseFloat(card.credit_limit)) ? 0 : parseFloat(card.credit_limit);
  const usedAmount = typeof card.used_amount === 'number' ? card.used_amount : 
                    isNaN(parseFloat(card.used_amount || '0')) ? 0 : parseFloat(card.used_amount || '0');
  const availableAmount = Math.max(0, creditLimit - usedAmount);
  const usagePercentage = creditLimit > 0 ? (usedAmount / creditLimit) * 100 : 0;
  
  return { creditLimit, usedAmount, availableAmount, usagePercentage };
};

// Helper function to calculate days until due date
export const calculateDaysUntilDue = (dueDay: number): number => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create due date for current month
    let dueDate = new Date(currentYear, currentMonth, dueDay);
    
    // If due date has passed this month, calculate for next month
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  } catch (error) {
    console.error('Erro ao calcular dias até vencimento:', error);
    return 0;
  }
};

// Helper function to get usage status
export const getUsageStatus = (usagePercentage: number) => {
  if (usagePercentage >= 90) return { label: "Limite Crítico", variant: "destructive" as const, icon: "AlertTriangle" };
  if (usagePercentage >= 70) return { label: "Atenção", variant: "secondary" as const, icon: "AlertTriangle" };
  return { label: "Normal", variant: "default" as const, icon: "CheckCircle" };
};

// Helper function to get due date status
export const getDueDateStatus = (daysUntilDue: number) => {
  if (daysUntilDue === 0) return { label: "Vence hoje", variant: "destructive" as const };
  if (daysUntilDue <= 3) return { label: `Vence em ${daysUntilDue} dias`, variant: "secondary" as const };
  if (daysUntilDue <= 7) return { label: `Vence em ${daysUntilDue} dias`, variant: "default" as const };
  return { label: `Vence em ${daysUntilDue} dias`, variant: "outline" as const };
};

// Validation functions
export const validateCardNumber = (number: string): boolean => {
  return /^\d{4}$/.test(number);
};

export const validateCardLimit = (limit: string): boolean => {
  const numLimit = parseFloat(limit);
  return !isNaN(numLimit) && isFinite(numLimit) && numLimit > 0;
};

export const validateCardDays = (day: string): boolean => {
  const numDay = parseInt(day);
  return !isNaN(numDay) && numDay >= 1 && numDay <= 31;
};

export const validateCardName = (name: string): boolean => {
  return name.trim().length > 0;
};

// Check for duplicate cards
export const isDuplicateCard = (cards: any[], name: string, number: string, excludeId?: string): boolean => {
  return cards.some(card => 
    card.name === name && 
    card.last_four_digits === number && 
    card.id !== excludeId
  );
};

// Generate random card color
export const generateCardColor = (): string => {
  const colors = ["bg-purple-600", "bg-blue-600", "bg-green-600", "bg-red-600", "bg-orange-600"];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Format card number for display
export const formatCardNumber = (lastFourDigits: string): string => {
  return `•••• •••• •••• ${lastFourDigits}`;
};

// Get card type display name
export const getCardTypeDisplayName = (type: string): string => {
  const typeMap: Record<string, string> = {
    'Visa': 'Visa',
    'Mastercard': 'Mastercard',
    'American Express': 'American Express',
    'Elo': 'Elo',
    'Hipercard': 'Hipercard',
    'Outros': 'Outros'
  };
  return typeMap[type] || type;
}; 