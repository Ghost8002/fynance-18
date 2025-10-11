/**
 * Base de dados de palavras-chave customizada
 * Baseada no arquivo CATEGORIAS E PALAVRAS-CHAVE.txt fornecido pelo usuário
 */

export interface CustomCategoryMapping {
  [key: string]: {
    name: string;
    type: 'income' | 'expense';
    keywords: string[];
    confidence: number;
    priority: number;
  };
}

/**
 * Base de dados completa baseada no arquivo CATEGORIAS E PALAVRAS-CHAVE.txt
 */
export const CUSTOM_KEYWORD_DATABASE: CustomCategoryMapping = {
  // ALIMENTAÇÃO
  alimentacao: {
    name: 'Alimentação',
    type: 'expense',
    keywords: [
      'supermercado', 'mercadinho', 'mercearia', 'hortifruti', 'padaria', 'panificadora', 'açougue',
      'lanche', 'lanchonete', 'pastelaria', 'salgados', 'cachorro quente', 'hamburguer', 'hamburgueria',
      'pizza', 'pizzaria', 'esfiharia', 'restaurante', 'self-service', 'self service', 'churrascaria',
      'buffet', 'marmita', 'almoço', 'jantar', 'bar', 'boteco', 'pub', 'cervejaria', 'adega', 'chopp',
      'delivery', 'ifood', 'ubereats', 'rappi'
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
      'bilhete unico', 'estacionamento', 'parquimetro', 'valet', 'pedagio', 'recarga bilhete'
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
      'moda', 'calcados', 'tenis', 'sapato', 'boutique', 'cosmetico', 'perfumaria', 'maquiagem',
      'eletronico', 'celular', 'notebook', 'informatica', 'eletrodomestico', 'moveis',
      'decoracao', 'construcao', 'material de construcao', 'ferramenta'
    ],
    confidence: 90,
    priority: 8
  },

  // SAÚDE
  saude: {
    name: 'Saúde',
    type: 'expense',
    keywords: [
      'farmacia', 'drogaria', 'drogasil', 'raia', 'panvel', 'medicamento', 'remedio', 
      'antibiotico', 'generico', 'medicacao', 'hospital', 'clinica', 'laboratorio', 
      'exame', 'consulta', 'pronto socorro', 'plano de saude', 'unimed', 'hapvida', 
      'amil', 'sulamerica', 'odontologia', 'dentista', 'tratamento', 'ortodontia', 
      'aparelho', 'fisioterapia', 'psicologo', 'psiquiatra', 'nutricionista', 'terapia'
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
      'caderno', 'livro', 'apostila', 'caneta', 'lapis', 'mochila'
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
      'supergasbras', 'nacional gas'
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
      'paintball'
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
      'bradesco investimentos'
    ],
    confidence: 95,
    priority: 10
  },

  // TRANSFERÊNCIAS (Receitas)
  transferencias_recebidas: {
    name: 'Transferências Recebidas',
    type: 'income',
    keywords: [
      'pix recebido', 'transferencia recebida', 'transferência recebida', 'ted recebido', 
      'doc recebido', 'deposito', 'depósito', 'boleto recebido', 'estorno', 
      'resgate rdb', 'aplicacao rdb', 'aplicação rdb'
    ],
    confidence: 95,
    priority: 10
  },

  // TRANSFERÊNCIAS (Despesas)
  transferencias_enviadas: {
    name: 'Transferências Enviadas',
    type: 'expense',
    keywords: [
      'pix enviado', 'transferencia enviada', 'transferência enviada', 'ted enviado', 
      'doc enviado', 'boleto pago', 'pagamento', 'pag seguro', 'paypal', 
      'mercadopago', 'pagarme', 'saque', 'retirada'
    ],
    confidence: 95,
    priority: 10
  },

  // SALÁRIO E RENDAS
  salario_rendas: {
    name: 'Salário e Rendas',
    type: 'income',
    keywords: [
      'salario', 'salário', 'renda', 'receita', 'freelance', 'bico', 'projeto',
      'trabalho', 'servico', 'serviço', 'venda', 'comissao', 'comissão'
    ],
    confidence: 95,
    priority: 10
  },

  // IMPOSTOS E TAXAS
  impostos_taxas: {
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

  // OUTROS
  outros: {
    name: 'Outros',
    type: 'expense',
    keywords: [
      'diversos', 'outros', 'nao identificado', 'despesa generica', 'sem descricao'
    ],
    confidence: 50,
    priority: 1
  }
};

/**
 * Função para obter todas as palavras-chave de uma categoria
 */
export function getCustomKeywordsForCategory(categoryKey: string): string[] {
  return CUSTOM_KEYWORD_DATABASE[categoryKey]?.keywords || [];
}

/**
 * Função para obter informações de uma categoria customizada
 */
export function getCustomCategoryInfo(categoryKey: string) {
  return CUSTOM_KEYWORD_DATABASE[categoryKey];
}

/**
 * Função para obter todas as categorias customizadas
 */
export function getAllCustomCategories(): CustomCategoryMapping {
  return CUSTOM_KEYWORD_DATABASE;
}

/**
 * Função para obter categorias customizadas por tipo (income/expense)
 */
export function getCustomCategoriesByType(type: 'income' | 'expense'): CustomCategoryMapping {
  const filtered: CustomCategoryMapping = {};
  
  for (const [key, category] of Object.entries(CUSTOM_KEYWORD_DATABASE)) {
    if (category.type === type) {
      filtered[key] = category;
    }
  }
  
  return filtered;
}

/**
 * Função para buscar categoria por palavra-chave
 */
export function findCategoryByKeyword(keyword: string): Array<{
  categoryKey: string;
  categoryName: string;
  categoryType: 'income' | 'expense';
  confidence: number;
  priority: number;
}> {
  const results: Array<{
    categoryKey: string;
    categoryName: string;
    categoryType: 'income' | 'expense';
    confidence: number;
    priority: number;
  }> = [];

  const keywordLower = keyword.toLowerCase();

  for (const [categoryKey, categoryInfo] of Object.entries(CUSTOM_KEYWORD_DATABASE)) {
    for (const categoryKeyword of categoryInfo.keywords) {
      if (categoryKeyword.toLowerCase().includes(keywordLower) || 
          keywordLower.includes(categoryKeyword.toLowerCase())) {
        results.push({
          categoryKey,
          categoryName: categoryInfo.name,
          categoryType: categoryInfo.type,
          confidence: categoryInfo.confidence,
          priority: categoryInfo.priority
        });
        break; // Evitar duplicatas da mesma categoria
      }
    }
  }

  // Ordenar por prioridade e confiança
  return results.sort((a, b) => {
    const scoreA = a.confidence * a.priority;
    const scoreB = b.confidence * b.priority;
    return scoreB - scoreA;
  });
}

/**
 * Função para normalizar descrição para busca
 */
export function normalizeDescription(description: string): string {
  return description
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Função para extrair palavras-chave de uma descrição
 */
export function extractKeywords(description: string): string[] {
  const normalized = normalizeDescription(description);
  const words = normalized.split(' ');
  
  // Retornar palavras com mais de 2 caracteres
  return words.filter(word => word.length > 2);
}
