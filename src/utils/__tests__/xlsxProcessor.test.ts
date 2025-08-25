import { XLSXProcessor } from '../xlsxProcessor';
import * as XLSX from 'xlsx';

describe('XLSXProcessor', () => {
  let processor: XLSXProcessor;

  beforeEach(() => {
    processor = new XLSXProcessor();
  });

  describe('normalizeCategoryName', () => {
    it('should normalize category names correctly', () => {
      expect(processor.normalizeCategoryName('Alimentação')).toBe('alimentacao');
      expect(processor.normalizeCategoryName('ALIMENTAÇÃO ')).toBe('alimentacao');
      expect(processor.normalizeCategoryName(' alimentação ')).toBe('alimentacao');
      expect(processor.normalizeCategoryName('Transporte & Lazer')).toBe('transporte  lazer');
      expect(processor.normalizeCategoryName('Saúde-Médico')).toBe('saude medico');
    });

    it('should handle empty and special cases', () => {
      expect(processor.normalizeCategoryName('')).toBe('');
      expect(processor.normalizeCategoryName('   ')).toBe('');
      expect(processor.normalizeCategoryName('123')).toBe('123');
    });
  });

  describe('normalizeTransactionType', () => {
    it('should normalize income types correctly', () => {
      expect(processor.normalizeTransactionType('Receita')).toBe('income');
      expect(processor.normalizeTransactionType('income')).toBe('income');
      expect(processor.normalizeTransactionType('Entrada')).toBe('income');
      expect(processor.normalizeTransactionType('Ganho')).toBe('income');
    });

    it('should normalize expense types correctly', () => {
      expect(processor.normalizeTransactionType('Despesa')).toBe('expense');
      expect(processor.normalizeTransactionType('expense')).toBe('expense');
      expect(processor.normalizeTransactionType('Saída')).toBe('expense');
      expect(processor.normalizeTransactionType('Gasto')).toBe('expense');
    });

    it('should return null for unknown types', () => {
      expect(processor.normalizeTransactionType('Unknown')).toBeNull();
      expect(processor.normalizeTransactionType('')).toBeNull();
    });
  });

  describe('parseAmount', () => {
    it('should parse currency amounts correctly', () => {
      expect(processor.parseAmount('R$ 150,50')).toBe(150.5);
      expect(processor.parseAmount('150.50')).toBe(150.5);
      expect(processor.parseAmount('-150,50')).toBe(-150.5);
      expect(processor.parseAmount('1.234,56')).toBe(1234.56);
    });

    it('should handle edge cases', () => {
      expect(processor.parseAmount('')).toBeNaN();
      expect(processor.parseAmount('abc')).toBeNaN();
      expect(processor.parseAmount('0')).toBe(0);
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      expect(processor.formatDate('2024-01-15')).toBe('2024-01-15');
      expect(processor.formatDate('15/01/2024')).toBe('2024-01-15');
      expect(processor.formatDate('15-01-2024')).toBe('2024-01-15');
      expect(processor.formatDate('2024/01/15')).toBe('2024-01-15');
    });

    it('should handle invalid dates', () => {
      expect(processor.formatDate('invalid')).toBe('invalid');
      expect(processor.formatDate('')).toBe('');
    });
  });

  describe('validateData', () => {
    it('should validate transactions correctly', () => {
      const mockTemplate = {
        transactions: [
          {
            date: '2024-01-15',
            description: 'Test transaction',
            amount: 100,
            type: 'expense' as const,
            category: 'Test Category',
            tags: [],
            reference: 'TEST-1',
            row_number: 2
          }
        ],
        categories: [],
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          template_name: 'test.xlsx'
        }
      };

      // Mock the template
      (processor as any).template = mockTemplate;

      const existingCategories = [
        { id: '1', name: 'Test Category', type: 'expense' }
      ];

      const result = processor.validateData(existingCategories);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.valid_transactions).toBe(1);
      expect(result.statistics.invalid_transactions).toBe(0);
    });

    it('should detect validation errors', () => {
      const mockTemplate = {
        transactions: [
          {
            date: 'invalid-date',
            description: '',
            amount: -1,
            type: 'expense' as const,
            category: 'Non-existent Category',
            tags: [],
            reference: 'TEST-1',
            row_number: 2
          }
        ],
        categories: [],
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          template_name: 'test.xlsx'
        }
      };

      (processor as any).template = mockTemplate;

      const existingCategories = [
        { id: '1', name: 'Existing Category', type: 'expense' }
      ];

      const result = processor.validateData(existingCategories);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.statistics.valid_transactions).toBe(0);
      expect(result.statistics.invalid_transactions).toBe(1);
    });
  });

  describe('generateCategoryMapping', () => {
    it('should generate mappings for existing categories', () => {
      const mockTemplate = {
        transactions: [],
        categories: [
          { name: 'Existing Category', type: 'expense' as const }
        ],
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          template_name: 'test.xlsx'
        }
      };

      (processor as any).template = mockTemplate;

      const existingCategories = [
        { id: '1', name: 'Existing Category', type: 'expense' }
      ];

      const mappings = processor.generateCategoryMapping(existingCategories);

      expect(mappings).toHaveLength(1);
      expect(mappings[0].action).toBe('map');
      expect(mappings[0].systemId).toBe('1');
      expect(mappings[0].confidence).toBe(1.0);
    });

    it('should generate mappings for new categories', () => {
      const mockTemplate = {
        transactions: [],
        categories: [
          { name: 'New Category', type: 'expense' as const }
        ],
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          template_name: 'test.xlsx'
        }
      };

      (processor as any).template = mockTemplate;

      const existingCategories = [
        { id: '1', name: 'Existing Category', type: 'expense' }
      ];

      const mappings = processor.generateCategoryMapping(existingCategories);

      expect(mappings).toHaveLength(1);
      expect(mappings[0].action).toBe('create');
      expect(mappings[0].systemId).toBeUndefined();
      expect(mappings[0].confidence).toBe(0.8);
    });
  });

  describe('createAdvancedTemplate', () => {
    it('should create a template with multiple sheets', () => {
      const workbook = XLSXProcessor.createAdvancedTemplate();

      expect(workbook.SheetNames).toContain('Transações');
      expect(workbook.SheetNames).toContain('Categorias');
      expect(workbook.SheetNames).toHaveLength(2);
    });

    it('should have correct structure for transactions sheet', () => {
      const workbook = XLSXProcessor.createAdvancedTemplate();
      const transactionSheet = workbook.Sheets['Transações'];
      const jsonData = XLSX.utils.sheet_to_json(transactionSheet, { header: 1 });

      expect(jsonData.length).toBeGreaterThan(1); // Header + data
      expect(jsonData[0]).toContain('Data');
      expect(jsonData[0]).toContain('Descrição');
      expect(jsonData[0]).toContain('Valor');
      expect(jsonData[0]).toContain('Tipo');
      expect(jsonData[0]).toContain('Categoria');
      expect(jsonData[0]).toContain('Tags');
    });

    it('should have correct structure for categories sheet', () => {
      const workbook = XLSXProcessor.createAdvancedTemplate();
      const categorySheet = workbook.Sheets['Categorias'];
      const jsonData = XLSX.utils.sheet_to_json(categorySheet, { header: 1 });

      expect(jsonData.length).toBeGreaterThan(1); // Header + data
      expect(jsonData[0]).toContain('Nome');
      expect(jsonData[0]).toContain('Tipo');
      expect(jsonData[0]).toContain('Cor');
      expect(jsonData[0]).toContain('Ordem');
    });
  });

  describe('processFile', () => {
    it('should process a valid XLSX file', async () => {
      // Create a mock XLSX file
      const workbook = XLSXProcessor.createAdvancedTemplate();
      const arrayBuffer = XLSX.write(workbook, { type: 'array' });
      const file = new File([arrayBuffer], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const template = await processor.processFile(file);

      expect(template.transactions.length).toBeGreaterThan(0);
      expect(template.categories.length).toBeGreaterThan(0);
      expect(template.metadata.template_name).toBe('test.xlsx');
      expect(template.metadata.version).toBe('1.0');
    });

    it('should handle empty files', async () => {
      const emptyWorkbook = XLSX.utils.book_new();
      const emptySheet = XLSX.utils.aoa_to_sheet([['Header']]);
      XLSX.utils.book_append_sheet(emptyWorkbook, emptySheet, 'Empty');
      
      const arrayBuffer = XLSX.write(emptyWorkbook, { type: 'array' });
      const file = new File([arrayBuffer], 'empty.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      await expect(processor.processFile(file)).rejects.toThrow();
    });
  });

  describe('extractCategoriesFromTransactions', () => {
    it('should extract categories from transactions when no dedicated sheet exists', () => {
      const transactions = [
        {
          date: '2024-01-15',
          description: 'Test 1',
          amount: 100,
          type: 'expense' as const,
          category: 'Category A',
          tags: [],
          reference: 'TEST-1',
          row_number: 2
        },
        {
          date: '2024-01-16',
          description: 'Test 2',
          amount: 200,
          type: 'expense' as const,
          category: 'Category A', // Duplicate
          tags: [],
          reference: 'TEST-2',
          row_number: 3
        },
        {
          date: '2024-01-17',
          description: 'Test 3',
          amount: 300,
          type: 'income' as const,
          category: 'Category B',
          tags: [],
          reference: 'TEST-3',
          row_number: 4
        }
      ];

      const mockTemplate = {
        transactions,
        categories: [],
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          template_name: 'test.xlsx'
        }
      };

      (processor as any).template = mockTemplate;

      // This would normally be called internally, but we can test the logic
      const categories = (processor as any).extractCategoriesFromTransactions(transactions);

      expect(categories).toHaveLength(2);
      expect(categories.find(c => c.name === 'category a')).toBeDefined();
      expect(categories.find(c => c.name === 'category b')).toBeDefined();
    });
  });
});
