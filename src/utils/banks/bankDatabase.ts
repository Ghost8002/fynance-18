/**
 * Banco de dados de bancos brasileiros com logos em SVG
 * Baseado na coleção de logos disponível em Bancos-em-SVG-main/
 */

export interface BankInfo {
  id: string;
  name: string;
  shortName: string;
  logoPath: string;
  alternativeLogos: string[];
  type: 'traditional' | 'digital' | 'investment' | 'credit_union' | 'fintech';
  isActive: boolean;
  website?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Mapeamento de bancos com suas informações e caminhos dos logos
 */
export const BANK_DATABASE: Record<string, BankInfo> = {
  // Bancos Digitais
  'nubank': {
    id: 'nubank',
    name: 'Nu Pagamentos S.A',
    shortName: 'Nubank',
    logoPath: '/Bancos-em-SVG-main/Nu Pagamentos S.A/nubank-logo-2021.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Nu Pagamentos S.A/nubank-branco.svg',
      '/Bancos-em-SVG-main/Nu Pagamentos S.A/nubank-logo-fundo-roxo2021.svg'
    ],
    type: 'digital',
    isActive: true,
    website: 'https://nubank.com.br',
    description: 'Banco digital brasileiro',
    primaryColor: '#8A05BE',
    secondaryColor: '#FFFFFF'
  },

  'inter': {
    id: 'inter',
    name: 'Banco Inter S.A',
    shortName: 'Inter',
    logoPath: '/Bancos-em-SVG-main/Banco Inter S.A/inter.svg',
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://bancointer.com.br',
    description: 'Banco digital brasileiro',
    primaryColor: '#FF8C00',
    secondaryColor: '#FFFFFF'
  },

  'c6': {
    id: 'c6',
    name: 'Banco C6 S.A',
    shortName: 'C6 Bank',
    logoPath: '/Bancos-em-SVG-main/Banco C6 S.A/c6 bank.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco C6 S.A/c6 bank- branco.svg',
      '/Bancos-em-SVG-main/Banco C6 S.A/c6 bank- nome- branco.svg',
      '/Bancos-em-SVG-main/Banco C6 S.A/c6 bank- nome- preto .svg'
    ],
    type: 'digital',
    isActive: true,
    website: 'https://c6bank.com.br',
    description: 'Banco digital brasileiro',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF'
  },

  'neon': {
    id: 'neon',
    name: 'Neon',
    shortName: 'Neon',
    logoPath: '/Bancos-em-SVG-main/Neon/neon.svg',
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://neon.com.br',
    description: 'Fintech brasileira'
  },

  'original': {
    id: 'original',
    name: 'Banco Original S.A',
    shortName: 'Original',
    logoPath: '/Bancos-em-SVG-main/Banco Original S.A/banco-original-logo-verde.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco Original S.A/banco-original-logo-branco.svg',
      '/Bancos-em-SVG-main/Banco Original S.A/banco-original-logo-verde-nome.svg',
      '/Bancos-em-SVG-main/Banco Original S.A/banco-original-logo-branco-nome.svg'
    ],
    type: 'digital',
    isActive: true,
    website: 'https://original.com.br',
    description: 'Banco digital brasileiro'
  },

  // Bancos Tradicionais
  'itau': {
    id: 'itau',
    name: 'Itaú Unibanco S.A',
    shortName: 'Itaú',
    logoPath: '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau-fundo-azul.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau-laranja.svg',
      '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau-laranja-nome.svg',
      '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau-sem-fundo.svg',
      '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau-sem-fundo-nome.svg',
      '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau-fundo-azul-nome.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://itau.com.br',
    description: 'Maior banco privado do Brasil',
    primaryColor: '#FF6900',
    secondaryColor: '#1B365D'
  },

  'bradesco': {
    id: 'bradesco',
    name: 'Bradesco S.A',
    shortName: 'Bradesco',
    logoPath: '/Bancos-em-SVG-main/Bradesco S.A/bradesco.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Bradesco S.A/bradesco-nome.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://bradesco.com.br',
    description: 'Banco brasileiro',
    primaryColor: '#CC092F',
    secondaryColor: '#FFFFFF'
  },

  'santander': {
    id: 'santander',
    name: 'Banco Santander Brasil S.A',
    shortName: 'Santander',
    logoPath: '/Bancos-em-SVG-main/Banco Santander Brasil S.A/banco-santander-logo.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco Santander Brasil S.A/santander-fundo-vermelho.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://santander.com.br',
    description: 'Banco espanhol no Brasil'
  },

  'banco-do-brasil': {
    id: 'banco-do-brasil',
    name: 'Banco do Brasil S.A',
    shortName: 'Banco do Brasil',
    logoPath: '/Bancos-em-SVG-main/Banco do Brasil S.A/banco-do-brasil-sem-fundo.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco do Brasil S.A/banco-do-brasil-com-fundo.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://bb.com.br',
    description: 'Banco público brasileiro'
  },

  'caixa': {
    id: 'caixa',
    name: 'Caixa Econômica Federal',
    shortName: 'Caixa',
    logoPath: '/Bancos-em-SVG-main/Caixa Econômica Federal/caixa-economica-federal.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Caixa Econômica Federal/caixa-economica-federal-X.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://caixa.gov.br',
    description: 'Banco público brasileiro'
  },

  // Bancos de Investimento
  'btg-pactual': {
    id: 'btg-pactual',
    name: 'Banco BTG Pactual',
    shortName: 'BTG Pactual',
    logoPath: '/Bancos-em-SVG-main/Banco BTG Pacutal/btg-pactual.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco BTG Pacutal/btg-pactual-nome .svg'
    ],
    type: 'investment',
    isActive: true,
    website: 'https://btgpactual.com',
    description: 'Banco de investimentos'
  },

  'xp': {
    id: 'xp',
    name: 'XP Investimentos',
    shortName: 'XP',
    logoPath: '/Bancos-em-SVG-main/XP Investimentos/xp-investimentos.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/XP Investimentos/xp-investimentos-nome.svg'
    ],
    type: 'investment',
    isActive: true,
    website: 'https://xpi.com.br',
    description: 'Corretora de investimentos'
  },

  // Fintechs e Pagamentos
  'picpay': {
    id: 'picpay',
    name: 'PicPay',
    shortName: 'PicPay',
    logoPath: '/Bancos-em-SVG-main/PicPay/picpay.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/PicPay/picpay-nome.svg'
    ],
    type: 'fintech',
    isActive: true,
    website: 'https://picpay.com.br',
    description: 'Plataforma de pagamentos'
  },

  'mercado-pago': {
    id: 'mercado-pago',
    name: 'Mercado Pago',
    shortName: 'Mercado Pago',
    logoPath: '/Bancos-em-SVG-main/Mercado Pago/mercado-pago.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Mercado Pago/mercado-pago-nome.svg'
    ],
    type: 'fintech',
    isActive: true,
    website: 'https://mercadopago.com.br',
    description: 'Solução de pagamentos do Mercado Livre'
  },

  'pagseguro': {
    id: 'pagseguro',
    name: 'PagSeguro Internet S.A',
    shortName: 'PagSeguro',
    logoPath: '/Bancos-em-SVG-main/PagSeguro Internet S.A/logo.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/PagSeguro Internet S.A/pagseguro-nome.svg',
      '/Bancos-em-SVG-main/PagSeguro Internet S.A/pagseguro-fundo.svg'
    ],
    type: 'fintech',
    isActive: true,
    website: 'https://pagseguro.uol.com.br',
    description: 'Plataforma de pagamentos'
  },

  'stone': {
    id: 'stone',
    name: 'Stone Pagamentos S.A',
    shortName: 'Stone',
    logoPath: '/Bancos-em-SVG-main/Stone Pagamentos S.A/stone.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Stone Pagamentos S.A/stone-nome.svg',
      '/Bancos-em-SVG-main/Stone Pagamentos S.A/stone-fundo.svg'
    ],
    type: 'fintech',
    isActive: true,
    website: 'https://stone.com.br',
    description: 'Tecnologia em pagamentos'
  },

  // Cooperativas de Crédito
  'sicredi': {
    id: 'sicredi',
    name: 'Sicredi',
    shortName: 'Sicredi',
    logoPath: '/Bancos-em-SVG-main/Sicredi/logo-svg2.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Sicredi/sicredi-nome.svg'
    ],
    type: 'credit_union',
    isActive: true,
    website: 'https://sicredi.com.br',
    description: 'Cooperativa de crédito'
  },

  'sicoob': {
    id: 'sicoob',
    name: 'Sicoob',
    shortName: 'Sicoob',
    logoPath: '/Bancos-em-SVG-main/Sicoob/sicoob-vector-logo.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Sicoob/sicoob-nome.svg'
    ],
    type: 'credit_union',
    isActive: true,
    website: 'https://sicoob.com.br',
    description: 'Cooperativa de crédito'
  },

  // Outros bancos importantes
  'safra': {
    id: 'safra',
    name: 'Banco Safra S.A',
    shortName: 'Safra',
    logoPath: '/Bancos-em-SVG-main/Banco Safra S.A/logo-safra.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco Safra S.A/logo-safra-nome.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://safra.com.br',
    description: 'Banco brasileiro'
  },

  'banrisul': {
    id: 'banrisul',
    name: 'Banrisul',
    shortName: 'Banrisul',
    logoPath: '/Bancos-em-SVG-main/Banrisul/banrisul-logo-2023.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banrisul/banrisul-nome.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://banrisul.com.br',
    description: 'Banco estadual do Rio Grande do Sul'
  },

  'daycoval': {
    id: 'daycoval',
    name: 'Banco Daycoval',
    shortName: 'Daycoval',
    logoPath: '/Bancos-em-SVG-main/Banco Daycoval/logo-Daycoval.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco Daycoval/logo-Daycoval- maior.svg',
      '/Bancos-em-SVG-main/Banco Daycoval/logo-Daycoval-com-fundo.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://daycoval.com.br',
    description: 'Banco brasileiro'
  },

  'votorantim': {
    id: 'votorantim',
    name: 'Banco Votorantim',
    shortName: 'BV',
    logoPath: '/Bancos-em-SVG-main/Banco Votorantim/banco-bv-logo.svg',
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://bv.com.br',
    description: 'Banco brasileiro'
  },

  'mercantil': {
    id: 'mercantil',
    name: 'Banco Mercantil do Brasil S.A',
    shortName: 'Mercantil',
    logoPath: '/Bancos-em-SVG-main/Banco Mercantil do Brasil S.A/banco-mercantil-novo-azul.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco Mercantil do Brasil S.A/banco-mercantil-novo-branco.svg',
      '/Bancos-em-SVG-main/Banco Mercantil do Brasil S.A/logo_mercantil-nome-branco.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://mercantildobrasil.com.br',
    description: 'Banco brasileiro'
  },

  'sofisa': {
    id: 'sofisa',
    name: 'Banco Sofisa',
    shortName: 'Sofisa',
    logoPath: '/Bancos-em-SVG-main/Banco Sofisa/logo-sofisa.svg',
    alternativeLogos: [
      '/Bancos-em-SVG-main/Banco Sofisa/logo-banco-sofisa.svg',
      '/Bancos-em-SVG-main/Banco Sofisa/logo-banco-sofisa-verde.svg',
      '/Bancos-em-SVG-main/Banco Sofisa/logo-sofisa-direto.svg'
    ],
    type: 'traditional',
    isActive: true,
    website: 'https://sofisa.com.br',
    description: 'Banco brasileiro'
  }
};

/**
 * Função para buscar bancos por nome ou palavras-chave
 */
export function searchBanks(query: string): BankInfo[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return Object.values(BANK_DATABASE).filter(bank => bank.isActive);
  }

  return Object.values(BANK_DATABASE)
    .filter(bank => bank.isActive)
    .filter(bank => 
      bank.name.toLowerCase().includes(normalizedQuery) ||
      bank.shortName.toLowerCase().includes(normalizedQuery) ||
      bank.id.toLowerCase().includes(normalizedQuery)
    )
    .sort((a, b) => {
      // Priorizar matches exatos no nome curto
      const aShortNameMatch = a.shortName.toLowerCase().includes(normalizedQuery);
      const bShortNameMatch = b.shortName.toLowerCase().includes(normalizedQuery);
      
      if (aShortNameMatch && !bShortNameMatch) return -1;
      if (!aShortNameMatch && bShortNameMatch) return 1;
      
      // Depois por nome completo
      return a.name.localeCompare(b.name);
    });
}

/**
 * Função para obter banco por ID
 */
export function getBankById(id: string): BankInfo | null {
  return BANK_DATABASE[id] || null;
}

/**
 * Função para obter bancos por tipo
 */
export function getBanksByType(type: BankInfo['type']): BankInfo[] {
  return Object.values(BANK_DATABASE)
    .filter(bank => bank.isActive && bank.type === type)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Função para obter todos os bancos ativos
 */
export function getAllActiveBanks(): BankInfo[] {
  return Object.values(BANK_DATABASE)
    .filter(bank => bank.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Função para obter bancos populares (mais utilizados)
 */
export function getPopularBanks(): BankInfo[] {
  const popularBankIds = [
    'nubank', 'itau', 'bradesco', 'santander', 'inter', 'c6', 
    'banco-do-brasil', 'caixa', 'picpay', 'mercado-pago'
  ];
  
  return popularBankIds
    .map(id => BANK_DATABASE[id])
    .filter(bank => bank && bank.isActive);
}
