/**
 * Motor de Categorização Melhorado
 * Sistema inteligente que corrige problemas de categorização automática
 */

import { CategoryEngine, CategorizationResult } from './CategoryEngine';
import { KEYWORD_DATABASE } from './KeywordDatabase';

export interface ImprovedCategorizationResult extends CategorizationResult {
  correctedType?: 'income' | 'expense';
  typeCorrectionReason?: string;
  confidence: number;
  validationWarnings?: string[];
}

export interface TransactionContext {
  description: string;
  amount: number;
  originalType: 'income' | 'expense';
  date?: string;
  accountType?: string;
}

export class ImprovedCategoryEngine extends CategoryEngine {
  private typeCorrectionRules: Map<string, 'income' | 'expense'>;
  private contextKeywords: Map<string, { type: 'income' | 'expense'; confidence: number }>;

  constructor(options: any = {}) {
    super(options);
    this.initializeTypeCorrectionRules();
    this.initializeContextKeywords();
  }

  /**
   * Categoriza uma transação com correções inteligentes
   */
  categorizeWithCorrections(
    transaction: TransactionContext,
    availableCategories?: string[]
  ): ImprovedCategorizationResult | null {
    // 1. Primeiro, corrigir o tipo da transação se necessário
    const typeCorrection = this.correctTransactionType(transaction);
    
    // 2. Usar o tipo corrigido para categorização
    const correctedTransaction = {
      ...transaction,
      type: typeCorrection.correctedType || transaction.originalType
    };

    // 3. Aplicar categorização normal
    const categorization = this.categorize({
      date: transaction.date || '',
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      type: correctedTransaction.type,
      category: undefined,
      tags: []
    }, { availableCategories });

    if (!categorization) {
      return null;
    }

    // 4. Validar consistência da categoria com o tipo
    const validationWarnings = this.validateCategorizationConsistency(
      categorization.category,
      correctedTransaction.type,
      transaction.description
    );

    // 5. Ajustar confiança baseada nas correções
    let finalConfidence = categorization.confidence;
    if (typeCorrection.correctedType && typeCorrection.correctedType !== transaction.originalType) {
      finalConfidence = Math.max(50, finalConfidence - 20); // Reduzir confiança se tipo foi corrigido
    }

    return {
      ...categorization,
      correctedType: typeCorrection.correctedType,
      typeCorrectionReason: typeCorrection.reason,
      confidence: finalConfidence,
      validationWarnings
    };
  }

  /**
   * Corrige o tipo da transação baseado na descrição e contexto
   */
  private correctTransactionType(transaction: TransactionContext): {
    correctedType?: 'income' | 'expense';
    reason?: string;
  } {
    const description = transaction.description.toLowerCase();
    const amount = transaction.amount;

    // Regras específicas para correção de tipo
    for (const [pattern, expectedType] of this.typeCorrectionRules) {
      if (description.includes(pattern.toLowerCase())) {
        // Verificar se o tipo atual está incorreto
        if (expectedType !== transaction.originalType) {
          return {
            correctedType: expectedType,
            reason: `Padrão "${pattern}" indica ${expectedType === 'income' ? 'receita' : 'despesa'}`
          };
        }
      }
    }

    // Análise contextual mais avançada
    const contextAnalysis = this.analyzeTransactionContext(transaction);
    if (contextAnalysis.type && contextAnalysis.type !== transaction.originalType) {
      return {
        correctedType: contextAnalysis.type,
        reason: contextAnalysis.reason
      };
    }

    return {};
  }

  /**
   * Analisa o contexto da transação para determinar o tipo correto
   */
  private analyzeTransactionContext(transaction: TransactionContext): {
    type?: 'income' | 'expense';
    reason?: string;
  } {
    const description = transaction.description.toLowerCase();
    const amount = transaction.amount;

    // Palavras que indicam claramente despesas (saída de dinheiro)
    const expenseIndicators = [
      'compra', 'pagamento', 'débito', 'saque', 'retirada', 'cobrança',
      'fatura', 'boleto pago', 'cartão', 'débito automático', 'desconto',
      'taxa', 'tarifa', 'anuidade', 'mensalidade', 'aluguel', 'financiamento'
    ];

    // Palavras que indicam claramente receitas (entrada de dinheiro)
    const incomeIndicators = [
      'recebimento', 'crédito', 'depósito', 'deposito', 'salário', 'salario',
      'transferência recebida', 'transferencia recebida', 'pix recebido',
      'estorno', 'rendimento', 'juros', 'dividendos', 'freelance', 'venda'
    ];

    // Verificar indicadores de despesa
    for (const indicator of expenseIndicators) {
      if (description.includes(indicator)) {
        if (transaction.originalType === 'income') {
          return {
            type: 'expense',
            reason: `Palavra "${indicator}" indica despesa (saída de dinheiro)`
          };
        }
      }
    }

    // Verificar indicadores de receita
    for (const indicator of incomeIndicators) {
      if (description.includes(indicator)) {
        if (transaction.originalType === 'expense') {
          return {
            type: 'income',
            reason: `Palavra "${indicator}" indica receita (entrada de dinheiro)`
          };
        }
      }
    }

    // Análise de padrões específicos
    if (description.includes('pix')) {
      if (description.includes('enviado') || description.includes('pagamento')) {
        if (transaction.originalType === 'income') {
          return {
            type: 'expense',
            reason: 'PIX enviado indica despesa (saída de dinheiro)'
          };
        }
      } else if (description.includes('recebido')) {
        if (transaction.originalType === 'expense') {
          return {
            type: 'income',
            reason: 'PIX recebido indica receita (entrada de dinheiro)'
          };
        }
      }
    }

    // Análise de transferências
    if (description.includes('transferência') || description.includes('transferencia')) {
      if (description.includes('enviada') || description.includes('saída') || description.includes('saida')) {
        if (transaction.originalType === 'income') {
          return {
            type: 'expense',
            reason: 'Transferência enviada indica despesa'
          };
        }
      } else if (description.includes('recebida') || description.includes('entrada')) {
        if (transaction.originalType === 'expense') {
          return {
            type: 'income',
            reason: 'Transferência recebida indica receita'
          };
        }
      }
    }

    return {};
  }

  /**
   * Valida se a categoria faz sentido para o tipo de transação
   */
  private validateCategorizationConsistency(
    categoryName: string,
    transactionType: 'income' | 'expense',
    description: string
  ): string[] {
    const warnings: string[] = [];

    // Buscar a categoria na base de dados
    const categoryInfo = this.getCategoryInfoByName(categoryName);
    if (!categoryInfo) {
      return warnings;
    }

    // Verificar se o tipo da categoria corresponde ao tipo da transação
    if (categoryInfo.type !== transactionType) {
      warnings.push(
        `⚠️ Categoria "${categoryName}" é do tipo ${categoryInfo.type === 'income' ? 'receita' : 'despesa'}, ` +
        `mas a transação foi classificada como ${transactionType === 'income' ? 'receita' : 'despesa'}. ` +
        `Verifique se está correto.`
      );
    }

    // Verificações específicas baseadas na descrição
    const descLower = description.toLowerCase();
    
    // Verificar se categorias de despesa estão sendo aplicadas a receitas suspeitas
    if (transactionType === 'income' && categoryInfo.type === 'expense') {
      if (descLower.includes('recebido') || descLower.includes('depósito') || descLower.includes('deposito')) {
        warnings.push(
          `🚨 ATENÇÃO: Transação parece ser receita (contém "recebido" ou "depósito") ` +
          `mas foi categorizada como despesa "${categoryName}". Verifique!`
        );
      }
    }

    // Verificar se categorias de receita estão sendo aplicadas a despesas suspeitas
    if (transactionType === 'expense' && categoryInfo.type === 'income') {
      if (descLower.includes('pagamento') || descLower.includes('débito') || descLower.includes('saque')) {
        warnings.push(
          `🚨 ATENÇÃO: Transação parece ser despesa (contém "pagamento", "débito" ou "saque") ` +
          `mas foi categorizada como receita "${categoryName}". Verifique!`
        );
      }
    }

    return warnings;
  }

  /**
   * Inicializa regras de correção de tipo
   */
  private initializeTypeCorrectionRules(): void {
    this.typeCorrectionRules = new Map([
      // Despesas claras
      ['compra no', 'expense'],
      ['pagamento de', 'expense'],
      ['débito automático', 'expense'],
      ['boleto pago', 'expense'],
      ['taxa de', 'expense'],
      ['anuidade', 'expense'],
      ['mensalidade', 'expense'],
      ['aluguel', 'expense'],
      ['financiamento', 'expense'],
      ['cartão de crédito', 'expense'],
      ['saque', 'expense'],
      ['retirada', 'expense'],
      ['transferência enviada', 'expense'],
      ['pix enviado', 'expense'],
      ['ted enviado', 'expense'],
      
      // Receitas claras
      ['salário', 'income'],
      ['salario', 'income'],
      ['depósito', 'income'],
      ['deposito', 'income'],
      ['transferência recebida', 'income'],
      ['transferencia recebida', 'income'],
      ['pix recebido', 'income'],
      ['ted recebido', 'income'],
      ['estorno', 'income'],
      ['rendimento', 'income'],
      ['juros', 'income'],
      ['dividendos', 'income'],
      ['freelance', 'income'],
      ['venda', 'income'],
      ['recebimento', 'income']
    ]);
  }

  /**
   * Inicializa palavras-chave contextuais
   */
  private initializeContextKeywords(): void {
    this.contextKeywords = new Map([
      // Contextos de despesa
      ['pagamento', { type: 'expense', confidence: 90 }],
      ['compra', { type: 'expense', confidence: 85 }],
      ['débito', { type: 'expense', confidence: 95 }],
      ['saque', { type: 'expense', confidence: 95 }],
      ['taxa', { type: 'expense', confidence: 80 }],
      
      // Contextos de receita
      ['recebimento', { type: 'income', confidence: 90 }],
      ['depósito', { type: 'income', confidence: 85 }],
      ['crédito', { type: 'income', confidence: 85 }],
      ['salário', { type: 'income', confidence: 95 }],
      ['estorno', { type: 'income', confidence: 90 }]
    ]);
  }

  /**
   * Obtém informações de categoria pelo nome
   */
  private getCategoryInfoByName(categoryName: string) {
    for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
      if (category.name === categoryName) {
        return category;
      }
    }
    return null;
  }

  /**
   * Processa um lote de transações com correções
   */
  categorizeBatchWithCorrections(
    transactions: Array<TransactionContext>,
    availableCategories?: string[]
  ): Array<{ transaction: TransactionContext; result: ImprovedCategorizationResult | null }> {
    return transactions.map(transaction => ({
      transaction,
      result: this.categorizeWithCorrections(transaction, availableCategories)
    }));
  }

  /**
   * Gera relatório de correções aplicadas
   */
  generateCorrectionReport(
    results: Array<{ transaction: TransactionContext; result: ImprovedCategorizationResult | null }>
  ): {
    totalTransactions: number;
    typeCorrections: number;
    warnings: number;
    averageConfidence: number;
    corrections: Array<{
      description: string;
      originalType: 'income' | 'expense';
      correctedType: 'income' | 'expense';
      reason: string;
      category: string;
    }>;
  } {
    const report = {
      totalTransactions: results.length,
      typeCorrections: 0,
      warnings: 0,
      averageConfidence: 0,
      corrections: [] as Array<{
        description: string;
        originalType: 'income' | 'expense';
        correctedType: 'income' | 'expense';
        reason: string;
        category: string;
      }>
    };

    let totalConfidence = 0;
    let validResults = 0;

    results.forEach(({ transaction, result }) => {
      if (result) {
        totalConfidence += result.confidence;
        validResults++;

        if (result.correctedType && result.correctedType !== transaction.originalType) {
          report.typeCorrections++;
          report.corrections.push({
            description: transaction.description,
            originalType: transaction.originalType,
            correctedType: result.correctedType,
            reason: result.typeCorrectionReason || 'Tipo corrigido automaticamente',
            category: result.category
          });
        }

        if (result.validationWarnings && result.validationWarnings.length > 0) {
          report.warnings += result.validationWarnings.length;
        }
      }
    });

    if (validResults > 0) {
      report.averageConfidence = totalConfidence / validResults;
    }

    return report;
  }
}

// Instância global do motor melhorado
let globalImprovedCategoryEngine: ImprovedCategoryEngine | null = null;

/**
 * Obtém instância global do ImprovedCategoryEngine
 */
export function getImprovedCategoryEngine(options?: any): ImprovedCategoryEngine {
  if (!globalImprovedCategoryEngine) {
    globalImprovedCategoryEngine = new ImprovedCategoryEngine(options);
  }
  return globalImprovedCategoryEngine;
}

/**
 * Cria nova instância do ImprovedCategoryEngine
 */
export function createImprovedCategoryEngine(options?: any): ImprovedCategoryEngine {
  return new ImprovedCategoryEngine(options);
}
