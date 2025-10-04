import * as XLSX from 'xlsx';

/**
 * Gera um template XLSX com as colunas obrigatórias e dados de exemplo
 */
export class XLSXTemplateGenerator {
  /**
   * Cria um template XLSX simples com dados de exemplo
   */
  static createTemplate(): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();

    // Dados de exemplo seguindo a estrutura obrigatória
    const templateData = [
      {
        'Data': '15/01/2024',
        'Descrição': 'Compra no supermercado',
        'Valor': -150.50,
        'Tipo': 'despesa',
        'Categoria': 'Alimentação',
        'Tags': 'compras, mercado'
      },
      {
        'Data': '16/01/2024',
        'Descrição': 'Salário',
        'Valor': 3000.00,
        'Tipo': 'receita',
        'Categoria': 'Salário',
        'Tags': 'trabalho, renda'
      },
      {
        'Data': '17/01/2024',
        'Descrição': 'Combustível',
        'Valor': -80.00,
        'Tipo': 'despesa',
        'Categoria': 'Transporte',
        'Tags': 'carro, posto'
      },
      {
        'Data': '18/01/2024',
        'Descrição': 'Freelance',
        'Valor': 500.00,
        'Tipo': 'receita',
        'Categoria': 'Trabalho Extra',
        'Tags': 'freelance, renda'
      },
      {
        'Data': '19/01/2024',
        'Descrição': 'Conta de luz',
        'Valor': -120.00,
        'Tipo': 'despesa',
        'Categoria': 'Moradia',
        'Tags': 'conta, moradia'
      }
    ];

    // Criar planilha com dados
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Configurar largura das colunas
    worksheet['!cols'] = [
      { wch: 12 }, // Data
      { wch: 30 }, // Descrição
      { wch: 12 }, // Valor
      { wch: 10 }, // Tipo
      { wch: 15 }, // Categoria
      { wch: 25 }  // Tags
    ];

    // Adicionar planilha ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

    return workbook;
  }

  /**
   * Gera arquivo XLSX para download
   */
  static downloadTemplate(filename: string = 'template_transacoes.xlsx'): void {
    const template = this.createTemplate();
    XLSX.writeFile(template, filename);
  }

  /**
   * Gera dados de exemplo em formato JSON
   */
  static getExampleData() {
    return [
      {
        'Data': '15/01/2024',
        'Descrição': 'Compra no supermercado',
        'Valor': -150.50,
        'Tipo': 'despesa',
        'Categoria': 'Alimentação',
        'Tags': 'compras, mercado'
      },
      {
        'Data': '16/01/2024',
        'Descrição': 'Salário',
        'Valor': 3000.00,
        'Tipo': 'receita',
        'Categoria': 'Salário',
        'Tags': 'trabalho, renda'
      },
      {
        'Data': '17/01/2024',
        'Descrição': 'Combustível',
        'Valor': -80.00,
        'Tipo': 'despesa',
        'Categoria': 'Transporte',
        'Tags': 'carro, posto'
      }
    ];
  }
}
