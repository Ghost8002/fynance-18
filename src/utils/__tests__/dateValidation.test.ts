/**
 * Testes para validação de datas e correção de timezone
 * Verifica se as funções corrigem adequadamente o problema de deslocamento de datas
 */

import { 
  convertToLocalDateString, 
  getCurrentLocalDateString, 
  dateToLocalDateString,
  convertOFXDate,
  isValidOFXDate
} from '../dateValidation';

describe('dateValidation', () => {
  describe('convertToLocalDateString', () => {
    it('deve converter componentes de data para string local corretamente', () => {
      // Teste com data específica
      const result = convertToLocalDateString('2025', '10', '01');
      expect(result).toBe('2025-10-01');
    });

    it('deve lidar com meses e dias com zero à esquerda', () => {
      const result = convertToLocalDateString('2025', '01', '05');
      expect(result).toBe('2025-01-05');
    });
  });

  describe('getCurrentLocalDateString', () => {
    it('deve retornar data atual no formato correto', () => {
      const result = getCurrentLocalDateString();
      // Verifica se está no formato YYYY-MM-DD
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Verifica se a data é válida
      const date = new Date(result + 'T00:00:00');
      expect(date.getFullYear()).toBeGreaterThan(2020);
      expect(date.getFullYear()).toBeLessThan(2030);
    });
  });

  describe('dateToLocalDateString', () => {
    it('deve converter Date object para string local', () => {
      const testDate = new Date(2025, 9, 1); // 1 de outubro de 2025
      const result = dateToLocalDateString(testDate);
      expect(result).toBe('2025-10-01');
    });

    it('deve lidar com diferentes meses corretamente', () => {
      const janDate = new Date(2025, 0, 15); // 15 de janeiro
      expect(dateToLocalDateString(janDate)).toBe('2025-01-15');
      
      const decDate = new Date(2025, 11, 31); // 31 de dezembro
      expect(dateToLocalDateString(decDate)).toBe('2025-12-31');
    });
  });

  describe('convertOFXDate', () => {
    it('deve converter data OFX (YYYYMMDD) corretamente', () => {
      const result = convertOFXDate('20251001');
      expect(result).toBe('2025-10-01');
    });

    it('deve lançar erro para formato inválido', () => {
      expect(() => convertOFXDate('2025101')).toThrow('Formato de data OFX inválido');
      expect(() => convertOFXDate('')).toThrow('Formato de data OFX inválido');
    });
  });

  describe('isValidOFXDate', () => {
    it('deve validar datas OFX corretas', () => {
      expect(isValidOFXDate('20251001')).toBe(true);
      expect(isValidOFXDate('20250101')).toBe(true);
      expect(isValidOFXDate('20251231')).toBe(true);
    });

    it('deve rejeitar datas OFX inválidas', () => {
      expect(isValidOFXDate('20251301')).toBe(false); // mês inválido
      expect(isValidOFXDate('20250230')).toBe(false); // dia inválido para fevereiro
      expect(isValidOFXDate('2025101')).toBe(false);  // formato incorreto
      expect(isValidOFXDate('')).toBe(false);
    });
  });

  describe('Comparação com comportamento problemático anterior', () => {
    it('deve demonstrar que a nova função corrige o problema de timezone', () => {
      // Simula o comportamento problemático anterior
      const problematicDate = new Date('2025-10-01');
      const problematicResult = problematicDate.toISOString().split('T')[0];
      
      // Usa a nova função corrigida
      const correctedResult = convertToLocalDateString('2025', '10', '01');
      
      // Em timezone UTC-3 (Brasil), o comportamento anterior retornaria '2025-09-30'
      // A nova função deve retornar '2025-10-01'
      expect(correctedResult).toBe('2025-10-01');
      
      // Se estivermos em timezone UTC-3, o resultado problemático seria diferente
      if (new Date().getTimezoneOffset() === 180) { // UTC-3
        expect(problematicResult).toBe('2025-09-30');
      }
    });
  });
});
