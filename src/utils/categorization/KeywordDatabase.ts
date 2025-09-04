/**
 * Base de dados de palavras-chave para categorização automática
 * Baseada na análise de padrões de transações brasileiras
 */

export interface KeywordRule {
  keywords: string[];
  category: string;
  confidence: number; // 0-100
  priority: number;   // Para resolver conflitos (maior = mais prioritário)
  patterns?: RegExp[]; // Regex para padrões complexos
}

export interface CategoryMapping {
  [key: string]: {
    name: string;
    type: 'income' | 'expense';
    keywords: string[];
    confidence: number;
    priority: number;
  };
}

/**
 * Base de dados completa de palavras-chave organizadas por categoria
 */
export const KEYWORD_DATABASE: CategoryMapping = {
  // ALIMENTAÇÃO
  alimentacao: {
    name: 'Alimentação',
    type: 'expense',
    keywords: [
      'supermercado', 'mercadinho', 'mercearia', 'hortifruti', 'padaria', 'panificadora', 'açougue',
      'lanche', 'lanchonete', 'pastelaria', 'salgados', 'cachorro quente', 'hamburguer', 'hamburgueria',
      'pizza', 'pizzaria', 'esfiharia', 'restaurante', 'self-service', 'self service', 'churrascaria',
      'buffet', 'marmita', 'almoço', 'jantar', 'bar', 'boteco', 'pub', 'cervejaria', 'adega', 'chopp',
      'delivery', 'ifood', 'ubereats', 'rappi', 'mcdonalds', 'burger king', 'subway', 'starbucks',
      'café', 'lanche', 'pizza', 'hambúrguer', 'comida', 'food', 'mercado', 'supermercado'
    ],
    confidence: 95,
    priority: 10
  },

  // TRANSPORTE
  transporte: {
    name: 'Transporte',
    type: 'expense',
    keywords: [
      'posto', 'gasolina', 'alcool', 'etanol', 'diesel', 'combustivel', 'petro', 'shell', 'ipiranga',
      'br', 'uber', '99', 'cabify', 'blablacar', 'passagem', 'onibus', 'rodoviaria', 'metro', 'trem',
      'bilhete unico', 'estacionamento', 'parquimetro', 'valet', 'pedagio', 'recarga bilhete',
      'taxi', 'combustível', 'gasolina', 'transporte', 'ipva', 'licenciamento', 'multa'
    ],
    confidence: 95,
    priority: 10
  },

  // COMPRAS
  compras: {
    name: 'Compras',
    type: 'expense',
    keywords: [
      'shopping', 'loja', 'lojas americanas', 'magazine', 'extra', 'carrefour', 'atacadao',
      'mercado livre', 'amazon', 'submarino', 'shopee', 'aliexpress', 'roupas', 'vestuario',
      'moda', 'calcados', 'tenis', 'sapato', 'boutique', 'farmacia', 'drogaria', 'drogasil',
      'raia', 'panvel', 'medicacao', 'remedio', 'cosmetico', 'perfumaria', 'maquiagem',
      'eletronico', 'celular', 'notebook', 'informatica', 'eletrodomestico', 'moveis',
      'decoracao', 'construcao', 'material de construcao', 'ferramenta', 'loja', 'shopping'
    ],
    confidence: 90,
    priority: 8
  },

  // SAÚDE
  saude: {
    name: 'Saúde',
    type: 'expense',
    keywords: [
      'farmacia', 'drogaria', 'medicamento', 'remedio', 'antibiotico', 'generico', 'hospital',
      'clinica', 'laboratorio', 'exame', 'consulta', 'pronto socorro', 'plano de saude',
      'unimed', 'hapvida', 'amil', 'sulamerica', 'odontologia', 'dentista', 'tratamento',
      'ortodontia', 'aparelho', 'fisioterapia', 'psicologo', 'psiquiatra', 'nutricionista',
      'terapia', 'farmácia', 'clínica', 'médico', 'saúde', 'saude'
    ],
    confidence: 95,
    priority: 10
  },

  // EDUCAÇÃO
  educacao: {
    name: 'Educação',
    type: 'expense',
    keywords: [
      'escola', 'colegio', 'faculdade', 'universidade', 'cursinho', 'vestibular', 'enem',
      'curso', 'treinamento', 'capacitação', 'ead', 'online', 'udemy', 'alura', 'coursera',
      'senac', 'senai', 'fundacao', 'instituto', 'material escolar', 'livraria', 'papelaria',
      'caderno', 'livro', 'apostila', 'caneta', 'lapis', 'mochila', 'educação'
    ],
    confidence: 95,
    priority: 10
  },

  // SERVIÇOS
  servicos: {
    name: 'Serviços',
    type: 'expense',
    keywords: [
      'corte', 'salao', 'cabeleireiro', 'barbeiro', 'manicure', 'pedicure', 'estetica',
      'assinatura', 'mensalidade', 'fatura', 'anuidade', 'cobranca', 'netflix', 'spotify',
      'amazon prime', 'disney', 'hbo', 'globoplay', 'deezer', 'tidal', 'paramount',
      'youtube premium', 'academia', 'crossfit', 'pilates', 'yoga', 'personal trainer',
      'manutencao', 'conserto', 'assistencia', 'tecnico', 'instalacao', 'seguro',
      'seguradora', 'cartorio', 'consorcio'
    ],
    confidence: 90,
    priority: 8
  },

  // MORADIA
  moradia: {
    name: 'Moradia',
    type: 'expense',
    keywords: [
      'aluguel', 'imobiliaria', 'condominio', 'sindico', 'conta de luz', 'energia',
      'cemig', 'enel', 'eletropaulo', 'copel', 'ceee', 'equatorial', 'conta de agua',
      'sabesp', 'caesb', 'sanepar', 'copasa', 'internet', 'vivo', 'claro', 'oi', 'tim',
      'net', 'sky', 'gvt', 'telefonia', 'telefone fixo', 'gás', 'botijao', 'ultragaz',
      'supergasbras', 'nacional gas', 'luz', 'água', 'gás', 'internet', 'telefone',
      'energia', 'financiamento', 'condomínio', 'imóvel'
    ],
    confidence: 95,
    priority: 10
  },

  // LAZER E ENTRETENIMENTO
  lazer: {
    name: 'Lazer',
    type: 'expense',
    keywords: [
      'cinema', 'ingresso', 'show', 'espetaculo', 'teatro', 'balada', 'festa', 'evento',
      'parque', 'diversao', 'jogos', 'fliperama', 'viagem', 'turismo', 'agencia',
      'hotel', 'pousada', 'airbnb', 'resort', 'bar', 'pub', 'karaoke', 'boliche',
      'paintball', 'entretenimento'
    ],
    confidence: 90,
    priority: 8
  },

  // INVESTIMENTOS
  investimentos: {
    name: 'Investimentos',
    type: 'expense',
    keywords: [
      'rdb', 'cdb', 'tesouro', 'lci', 'lca', 'acoes', 'bolsa', 'b3', 'fii', 'fundos',
      'aplicacao', 'aplicacao rdb', 'investimento', 'aporte', 'resgate', 'saque',
      'retirada', 'previdencia', 'previdencia privada', 'poupanca', 'cripto',
      'bitcoin', 'ethereum', 'binance', 'corretora', 'xp', 'clear', 'modal', 'btg',
      'bradesco investimentos', 'ação', 'acao', 'dividendo', 'rendimento', 'juros'
    ],
    confidence: 95,
    priority: 10
  },

  // TRANSFERÊNCIAS
  transferencias: {
    name: 'Transferências',
    type: 'income',
    keywords: [
      'pix', 'pix enviado', 'pix recebido', 'transferencia enviada', 'transferencia recebida',
      'ted', 'doc', 'transferencia bancaria', 'deposito', 'saque', 'boleto',
      'boleto pago', 'boleto recebido', 'resgate rdb', 'aplicacao rdb', 'estorno',
      'pagamento', 'pag seguro', 'paypal', 'mercadopago', 'pagarme', 'transferência',
      'transferência recebida', 'transferência enviada'
    ],
    confidence: 95,
    priority: 10
  },

  // IMPOSTOS E TAXAS
  impostos: {
    name: 'Impostos e Taxas',
    type: 'expense',
    keywords: [
      'ipva', 'iptu', 'ir', 'imposto de renda', 'taxa', 'multa', 'juros', 'encargos',
      'tarifa', 'taxa bancaria', 'manutencao de conta', 'anuidade cartao', 'sindicato',
      'contribuicao', 'darf', 'gps', 'mei'
    ],
    confidence: 95,
    priority: 10
  },

  // RECEITAS
  salario: {
    name: 'Salário',
    type: 'income',
    keywords: [
      'salário', 'salario', 'pagamento', 'depósito', 'deposito', 'renda', 'receita'
    ],
    confidence: 95,
    priority: 10
  },

  freelance: {
    name: 'Freelance',
    type: 'income',
    keywords: [
      'freelance', 'bico', 'projeto', 'trabalho', 'serviço', 'servico'
    ],
    confidence: 90,
    priority: 8
  },

  // OUTROS
  outros: {
    name: 'Outros',
    type: 'expense',
    keywords: [
      'diversos', 'outros', 'nao identificado', 'despesa generica', 'sem descricao',
      'outros gastos'
    ],
    confidence: 50,
    priority: 1
  }
};

/**
 * Função para obter todas as palavras-chave de uma categoria
 */
export function getKeywordsForCategory(categoryKey: string): string[] {
  return KEYWORD_DATABASE[categoryKey]?.keywords || [];
}

/**
 * Função para obter informações de uma categoria
 */
export function getCategoryInfo(categoryKey: string) {
  return KEYWORD_DATABASE[categoryKey];
}

/**
 * Função para obter todas as categorias disponíveis
 */
export function getAllCategories(): CategoryMapping {
  return KEYWORD_DATABASE;
}

/**
 * Função para obter categorias por tipo (income/expense)
 */
export function getCategoriesByType(type: 'income' | 'expense'): CategoryMapping {
  const filtered: CategoryMapping = {};
  
  for (const [key, category] of Object.entries(KEYWORD_DATABASE)) {
    if (category.type === type) {
      filtered[key] = category;
    }
  }
  
  return filtered;
}
