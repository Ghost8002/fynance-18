import { 
  calculatePeriodSummary, 
  filterTransactionsByPeriod, 
  safeToNumber,
  validateFinancialData 
} from '../financialCalculations';

describe('Financial Calculations', () => {
  const mockTransactions = [
    {
      id: '1',
      type: 'income' as const,
      amount: 100, // Receita: valor positivo
      date: '2025-09-15',
      description: 'Salário',
      account_id: 'acc1'
    },
    {
      id: '2',
      type: 'expense' as const,
      amount: -50, // Despesa: valor negativo
      date: '2025-09-20',
      description: 'Compras',
      account_id: 'acc1'
    },
    {
      id: '3',
      type: 'income' as const,
      amount: 25,
      date: '2025-08-15', // Fora do período
      description: 'Freelance',
      account_id: 'acc1'
    }
  ];

  const mockAccounts = [
    {
      id: 'acc1',
      name: 'Conta Corrente',
      balance: 1000
    }
  ];

  const mockPeriod = {
    startDate: new Date('2025-09-01'),
    endDate: new Date('2025-09-30')
  };

  describe('safeToNumber', () => {
    it('should convert valid numbers correctly', () => {
      expect(safeToNumber(100)).toBe(100);
      expect(safeToNumber('50.5')).toBe(50.5);
      expect(safeToNumber(0)).toBe(0);
    });

    it('should handle invalid values', () => {
      expect(safeToNumber(null)).toBe(0);
      expect(safeToNumber(undefined)).toBe(0);
      expect(safeToNumber('')).toBe(0);
      expect(safeToNumber('invalid')).toBe(0);
    });
  });

  describe('filterTransactionsByPeriod', () => {
    it('should filter transactions correctly by period', () => {
      const filtered = filterTransactionsByPeriod(mockTransactions, mockPeriod);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.id)).toEqual(['1', '2']);
    });

    it('should handle empty transactions array', () => {
      const filtered = filterTransactionsByPeriod([], mockPeriod);
      expect(filtered).toHaveLength(0);
    });

    it('should handle invalid dates gracefully', () => {
      const invalidTransactions = [
        {
          id: '1',
          type: 'income' as const,
          amount: 100,
          date: 'invalid-date',
          description: 'Test',
          account_id: 'acc1'
        }
      ];
      
      const filtered = filterTransactionsByPeriod(invalidTransactions, mockPeriod);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('calculatePeriodSummary', () => {
    it('should calculate correct financial summary', () => {
      const summary = calculatePeriodSummary(mockTransactions, mockPeriod, mockAccounts);
      
      expect(summary.totalIncome).toBe(100); // Apenas a transação de setembro
      expect(summary.totalExpenses).toBe(50); // Valor absoluto da despesa
      expect(summary.periodBalance).toBe(50); // 100 - 50
      expect(summary.totalAccountBalance).toBe(1000);
      expect(summary.transactionCount).toBe(2);
    });

    it('should handle empty data', () => {
      const summary = calculatePeriodSummary([], mockPeriod, []);
      
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.periodBalance).toBe(0);
      expect(summary.totalAccountBalance).toBe(0);
      expect(summary.transactionCount).toBe(0);
    });
  });

  describe('validateFinancialData', () => {
    it('should validate correct data', () => {
      const validation = validateFinancialData(mockTransactions, mockAccounts);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid transactions', () => {
      const invalidTransactions = [
        {
          id: '',
          type: 'invalid' as any,
          amount: -100,
          date: '',
          description: 'Test',
          account_id: 'acc1'
        }
      ];
      
      const validation = validateFinancialData(invalidTransactions, mockAccounts);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect inconsistent type and amount', () => {
      const inconsistentTransactions = [
        {
          id: '1',
          type: 'income' as const,
          amount: -100, // Receita com valor negativo
          date: '2025-09-15',
          description: 'Test',
          account_id: 'acc1'
        },
        {
          id: '2',
          type: 'expense' as const,
          amount: 50, // Despesa com valor positivo
          date: '2025-09-15',
          description: 'Test',
          account_id: 'acc1'
        }
      ];
      
      const validation = validateFinancialData(inconsistentTransactions, mockAccounts);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('receita com valor negativo'))).toBe(true);
      expect(validation.errors.some(error => error.includes('despesa com valor positivo'))).toBe(true);
    });

    it('should detect invalid accounts', () => {
      const invalidAccounts = [
        {
          id: '',
          name: '',
          balance: 1000
        }
      ];
      
      const validation = validateFinancialData(mockTransactions, invalidAccounts);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
