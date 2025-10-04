/**
 * Dados de teste para verificar a funcionalidade de importação XLSX
 */

export const testXLSXData = [
  {
    data: '15/01/2024',
    descricao: 'Compra no supermercado',
    valor: -150.50,
    tipo: 'despesa',
    categoria: 'Alimentação Nova', // Categoria que não existe
    tags: 'compras, mercado, teste' // Tags que podem não existir
  },
  {
    data: '16/01/2024',
    descricao: 'Salário',
    valor: 3000.00,
    tipo: 'receita',
    categoria: 'Salário', // Categoria que provavelmente existe
    tags: 'trabalho, renda'
  },
  {
    data: '17/01/2024',
    descricao: 'Freelance Design',
    valor: 500.00,
    tipo: 'receita',
    categoria: 'Freelance Nova', // Categoria que não existe
    tags: 'design, freelance, criativo' // Tags que podem não existir
  },
  {
    data: '18/01/2024',
    descricao: 'Combustível',
    valor: -80.00,
    tipo: 'despesa',
    categoria: 'Transporte', // Categoria que provavelmente existe
    tags: 'carro, posto'
  },
  {
    data: '19/01/2024',
    descricao: 'Conta de luz',
    valor: -120.00,
    tipo: 'despesa',
    categoria: 'Moradia', // Categoria que provavelmente existe
    tags: 'conta, moradia'
  }
];

export const expectedValidationResult = {
  categories: [
    {
      name: 'Alimentação Nova',
      type: 'category' as const,
      count: 1,
      action: 'create' as const
    },
    {
      name: 'Freelance Nova',
      type: 'category' as const,
      count: 1,
      action: 'create' as const
    }
  ],
  tags: [
    {
      name: 'teste',
      type: 'tag' as const,
      count: 1,
      action: 'create' as const
    },
    {
      name: 'criativo',
      type: 'tag' as const,
      count: 1,
      action: 'create' as const
    }
  ],
  hasUnmappedItems: true
};
