/**
 * Banco de dados de bancos brasileiros com logos em SVG
 * Logos são carregados do Supabase Storage
 */

import { bankLogos } from '@/assets/banks';

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
    logoPath: bankLogos['nubank'],
    alternativeLogos: [],
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
    logoPath: bankLogos['inter'],
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
    logoPath: bankLogos['c6'],
    alternativeLogos: [],
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
    logoPath: bankLogos['neon'],
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
    logoPath: bankLogos['original'],
    alternativeLogos: [],
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
    logoPath: bankLogos['itau'],
    alternativeLogos: [],
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
    logoPath: bankLogos['bradesco'],
    alternativeLogos: [],
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
    logoPath: bankLogos['santander'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://santander.com.br',
    description: 'Banco espanhol no Brasil'
  },

  'banco-do-brasil': {
    id: 'banco-do-brasil',
    name: 'Banco do Brasil S.A',
    shortName: 'Banco do Brasil',
    logoPath: bankLogos['banco-do-brasil'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://bb.com.br',
    description: 'Banco público brasileiro'
  },

  'caixa': {
    id: 'caixa',
    name: 'Caixa Econômica Federal',
    shortName: 'Caixa',
    logoPath: bankLogos['caixa'],
    alternativeLogos: [],
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
    logoPath: bankLogos['btg-pactual'],
    alternativeLogos: [],
    type: 'investment',
    isActive: true,
    website: 'https://btgpactual.com',
    description: 'Banco de investimentos'
  },

  'xp': {
    id: 'xp',
    name: 'XP Investimentos',
    shortName: 'XP',
    logoPath: bankLogos['xp'],
    alternativeLogos: [],
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
    logoPath: bankLogos['picpay'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://picpay.com.br',
    description: 'Plataforma de pagamentos'
  },

  'mercado-pago': {
    id: 'mercado-pago',
    name: 'Mercado Pago',
    shortName: 'Mercado Pago',
    logoPath: bankLogos['mercado-pago'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://mercadopago.com.br',
    description: 'Solução de pagamentos do Mercado Livre'
  },

  'pagseguro': {
    id: 'pagseguro',
    name: 'PagSeguro Internet S.A',
    shortName: 'PagSeguro',
    logoPath: bankLogos['pagseguro'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://pagseguro.uol.com.br',
    description: 'Plataforma de pagamentos'
  },

  'stone': {
    id: 'stone',
    name: 'Stone Pagamentos S.A',
    shortName: 'Stone',
    logoPath: bankLogos['stone'],
    alternativeLogos: [],
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
    logoPath: bankLogos['sicredi'],
    alternativeLogos: [],
    type: 'credit_union',
    isActive: true,
    website: 'https://sicredi.com.br',
    description: 'Cooperativa de crédito'
  },

  'sicoob': {
    id: 'sicoob',
    name: 'Sicoob',
    shortName: 'Sicoob',
    logoPath: bankLogos['sicoob'],
    alternativeLogos: [],
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
    logoPath: bankLogos['safra'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://safra.com.br',
    description: 'Banco brasileiro'
  },

  'banrisul': {
    id: 'banrisul',
    name: 'Banrisul',
    shortName: 'Banrisul',
    logoPath: bankLogos['banrisul'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://banrisul.com.br',
    description: 'Banco estadual do Rio Grande do Sul'
  },

  'daycoval': {
    id: 'daycoval',
    name: 'Banco Daycoval',
    shortName: 'Daycoval',
    logoPath: bankLogos['daycoval'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://daycoval.com.br',
    description: 'Banco brasileiro'
  },

  'votorantim': {
    id: 'votorantim',
    name: 'Banco Votorantim',
    shortName: 'BV',
    logoPath: bankLogos['votorantim'],
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
    logoPath: bankLogos['mercantil'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://mercantildobrasil.com.br',
    description: 'Banco brasileiro'
  },

  'sofisa': {
    id: 'sofisa',
    name: 'Banco Sofisa',
    shortName: 'Sofisa',
    logoPath: bankLogos['sofisa'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://sofisa.com.br',
    description: 'Banco brasileiro'
  },

  // Bancos adicionais
  'modo': {
    id: 'modo',
    name: 'Modo',
    shortName: 'Modo',
    logoPath: bankLogos['modo'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://modo.com.br',
    description: 'Banco digital'
  },

  'omie': {
    id: 'omie',
    name: 'Omie',
    shortName: 'Omie',
    logoPath: bankLogos['omie'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://omie.com.br',
    description: 'Plataforma de gestão empresarial'
  },

  'omni': {
    id: 'omni',
    name: 'Omni',
    shortName: 'Omni',
    logoPath: bankLogos['omni'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://omni.com.br',
    description: 'Banco digital'
  },

  'pinbank': {
    id: 'pinbank',
    name: 'Pinbank',
    shortName: 'Pinbank',
    logoPath: bankLogos['pinbank'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://pinbank.com.br',
    description: 'Banco digital'
  },

  'magalupay': {
    id: 'magalupay',
    name: 'Magalu Pay',
    shortName: 'Magalu Pay',
    logoPath: bankLogos['magalupay'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://magalupay.com.br',
    description: 'Solução de pagamentos'
  },

  'bs2': {
    id: 'bs2',
    name: 'Banco BS2',
    shortName: 'BS2',
    logoPath: bankLogos['bs2'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://bs2.com',
    description: 'Banco digital'
  },

  'cora': {
    id: 'cora',
    name: 'Cora',
    shortName: 'Cora',
    logoPath: bankLogos['cora'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://cora.com.br',
    description: 'Banco digital para empresas'
  },

  'letsbank': {
    id: 'letsbank',
    name: 'Letsbank',
    shortName: 'Letsbank',
    logoPath: bankLogos['letsbank'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://letsbank.com.br',
    description: 'Banco digital'
  },

  'bmg': {
    id: 'bmg',
    name: 'Banco BMG',
    shortName: 'BMG',
    logoPath: bankLogos['bmg'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://bmg.com.br',
    description: 'Banco brasileiro'
  },

  'pine': {
    id: 'pine',
    name: 'Pine',
    shortName: 'Pine',
    logoPath: bankLogos['pine'],
    alternativeLogos: [],
    type: 'investment',
    isActive: true,
    website: 'https://pine.com',
    description: 'Corretora de investimentos'
  },

  'abc': {
    id: 'abc',
    name: 'Banco ABC Brasil',
    shortName: 'ABC Brasil',
    logoPath: bankLogos['abc'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://abcbrasil.com.br',
    description: 'Banco brasileiro'
  },

  'bmp': {
    id: 'bmp',
    name: 'BMP Money Plus',
    shortName: 'BMP',
    logoPath: bankLogos['bmp'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://bmp.com.br',
    description: 'Banco digital'
  },

  'arbi': {
    id: 'arbi',
    name: 'Banco Arbi',
    shortName: 'Arbi',
    logoPath: bankLogos['arbi'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://arbi.com.br',
    description: 'Banco brasileiro'
  },

  'industrial': {
    id: 'industrial',
    name: 'Banco Industrial do Brasil',
    shortName: 'Industrial',
    logoPath: bankLogos['industrial'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://industrial.com.br',
    description: 'Banco brasileiro'
  },

  'paulista': {
    id: 'paulista',
    name: 'Banco Paulista',
    shortName: 'Paulista',
    logoPath: bankLogos['paulista'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://paulista.com.br',
    description: 'Banco brasileiro'
  },

  'rendimento': {
    id: 'rendimento',
    name: 'Banco Rendimento',
    shortName: 'Rendimento',
    logoPath: bankLogos['rendimento'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://rendimento.com.br',
    description: 'Banco brasileiro'
  },

  'topazio': {
    id: 'topazio',
    name: 'Banco Topázio',
    shortName: 'Topázio',
    logoPath: bankLogos['topazio'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://topazio.com.br',
    description: 'Banco brasileiro'
  },

  'tribanco': {
    id: 'tribanco',
    name: 'Tribanco',
    shortName: 'Tribanco',
    logoPath: bankLogos['tribanco'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://tribanco.com.br',
    description: 'Banco brasileiro'
  },

  'conta-simples': {
    id: 'conta-simples',
    name: 'Conta Simples',
    shortName: 'Conta Simples',
    logoPath: bankLogos['conta-simples'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://contasimples.com.br',
    description: 'Banco digital para empresas'
  },

  'efi': {
    id: 'efi',
    name: 'Efi Bank',
    shortName: 'Efi',
    logoPath: bankLogos['efi'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://efi.com.br',
    description: 'Solução de pagamentos'
  },

  'duepay': {
    id: 'duepay',
    name: 'DuePay',
    shortName: 'DuePay',
    logoPath: bankLogos['duepay'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://duepay.com.br',
    description: 'Plataforma de pagamentos'
  },

  'ifood-pago': {
    id: 'ifood-pago',
    name: 'iFood Pago',
    shortName: 'iFood Pago',
    logoPath: bankLogos['ifood-pago'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://ifoodpago.com.br',
    description: 'Solução de pagamentos do iFood'
  },

  'recargapay': {
    id: 'recargapay',
    name: 'RecargaPay',
    shortName: 'RecargaPay',
    logoPath: bankLogos['recargapay'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://recargapay.com.br',
    description: 'Plataforma de pagamentos'
  },

  'squid': {
    id: 'squid',
    name: 'Squid',
    shortName: 'Squid',
    logoPath: bankLogos['squid'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://squid.com.br',
    description: 'Plataforma financeira'
  },

  'transfeera': {
    id: 'transfeera',
    name: 'Transfeera',
    shortName: 'Transfeera',
    logoPath: bankLogos['transfeera'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://transfeera.com',
    description: 'Plataforma de pagamentos'
  },

  'asaas': {
    id: 'asaas',
    name: 'Asaas',
    shortName: 'Asaas',
    logoPath: bankLogos['asaas'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://asaas.com',
    description: 'Plataforma de cobranças'
  },

  'unicred': {
    id: 'unicred',
    name: 'Unicred',
    shortName: 'Unicred',
    logoPath: bankLogos['unicred'],
    alternativeLogos: [],
    type: 'credit_union',
    isActive: true,
    website: 'https://unicred.com.br',
    description: 'Cooperativa de crédito'
  },

  'uniprime': {
    id: 'uniprime',
    name: 'Uniprime',
    shortName: 'Uniprime',
    logoPath: bankLogos['uniprime'],
    alternativeLogos: [],
    type: 'credit_union',
    isActive: true,
    website: 'https://uniprime.com.br',
    description: 'Cooperativa de crédito'
  },

  'sulcredi': {
    id: 'sulcredi',
    name: 'Sulcredi',
    shortName: 'Sulcredi',
    logoPath: bankLogos['sulcredi'],
    alternativeLogos: [],
    type: 'credit_union',
    isActive: true,
    website: 'https://sulcredi.com.br',
    description: 'Cooperativa de crédito'
  },

  'sisprime': {
    id: 'sisprime',
    name: 'Sisprime',
    shortName: 'Sisprime',
    logoPath: bankLogos['sisprime'],
    alternativeLogos: [],
    type: 'credit_union',
    isActive: true,
    website: 'https://sisprime.com.br',
    description: 'Sistema de cooperativas'
  },

  'brb': {
    id: 'brb',
    name: 'BRB - Banco de Brasília',
    shortName: 'BRB',
    logoPath: bankLogos['brb'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://brb.com.br',
    description: 'Banco público do Distrito Federal'
  },

  'banpara': {
    id: 'banpara',
    name: 'Banpará',
    shortName: 'Banpará',
    logoPath: bankLogos['banpara'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://banpara.com.br',
    description: 'Banco do Estado do Pará'
  },

  'banese': {
    id: 'banese',
    name: 'Banese',
    shortName: 'Banese',
    logoPath: bankLogos['banese'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://banese.com.br',
    description: 'Banco do Estado de Sergipe'
  },

  'banestes': {
    id: 'banestes',
    name: 'Banestes',
    shortName: 'Banestes',
    logoPath: bankLogos['banestes'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://banestes.com.br',
    description: 'Banco do Estado do Espírito Santo'
  },

  'bnb': {
    id: 'bnb',
    name: 'Banco do Nordeste',
    shortName: 'BNB',
    logoPath: bankLogos['bnb'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://bnb.gov.br',
    description: 'Banco de desenvolvimento regional'
  },

  'banco-amazonia': {
    id: 'banco-amazonia',
    name: 'Banco da Amazônia',
    shortName: 'Basa',
    logoPath: bankLogos['banco-amazonia'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://bancoamazonia.com.br',
    description: 'Banco de desenvolvimento regional'
  },

  'multiplo': {
    id: 'multiplo',
    name: 'Banco Múltiplo',
    shortName: 'Múltiplo',
    logoPath: bankLogos['multiplo'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://multiplo.com.br',
    description: 'Banco brasileiro'
  },

  'bees': {
    id: 'bees',
    name: 'Bees Bank',
    shortName: 'Bees',
    logoPath: bankLogos['bees'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://bees.com',
    description: 'Banco digital'
  },

  'capitual': {
    id: 'capitual',
    name: 'Capitual',
    shortName: 'Capitual',
    logoPath: bankLogos['capitual'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://capitual.com',
    description: 'Banco digital'
  },

  'quality': {
    id: 'quality',
    name: 'Quality Digital Bank',
    shortName: 'Quality',
    logoPath: bankLogos['quality'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://quality.com.br',
    description: 'Banco digital'
  },

  'starbank': {
    id: 'starbank',
    name: 'Starbank',
    shortName: 'Starbank',
    logoPath: bankLogos['starbank'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://starbank.com.br',
    description: 'Banco digital'
  },

  'zemo': {
    id: 'zemo',
    name: 'Zema',
    shortName: 'Zema',
    logoPath: bankLogos['zemo'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://zema.com.br',
    description: 'Banco digital'
  },

  'bk': {
    id: 'bk',
    name: 'Banco BK',
    shortName: 'BK',
    logoPath: bankLogos['bk'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://bancobk.com.br',
    description: 'Banco digital'
  },

  'bnp': {
    id: 'bnp',
    name: 'BNP Paribas',
    shortName: 'BNP',
    logoPath: bankLogos['bnp'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://bnpparibas.com.br',
    description: 'Banco internacional'
  },

  'bofa': {
    id: 'bofa',
    name: 'Bank of America',
    shortName: 'BofA',
    logoPath: bankLogos['bofa'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://bankofamerica.com',
    description: 'Banco internacional'
  },

  'linker': {
    id: 'linker',
    name: 'Linker',
    shortName: 'Linker',
    logoPath: bankLogos['linker'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://linker.com.br',
    description: 'Plataforma de pagamentos'
  },

  'grafeno': {
    id: 'grafeno',
    name: 'Grafeno',
    shortName: 'Grafeno',
    logoPath: bankLogos['grafeno'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://grafeno.digital',
    description: 'Plataforma financeira'
  },

  'infinitepay': {
    id: 'infinitepay',
    name: 'InfinitePay',
    shortName: 'InfinitePay',
    logoPath: bankLogos['infinitepay'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://infinitepay.com.br',
    description: 'Solução de pagamentos'
  },

  'ip4y': {
    id: 'ip4y',
    name: 'IP4Y',
    shortName: 'IP4Y',
    logoPath: bankLogos['ip4y'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://ip4y.com.br',
    description: 'Plataforma de pagamentos'
  },

  'iugo': {
    id: 'iugo',
    name: 'Iugo',
    shortName: 'Iugo',
    logoPath: bankLogos['iugo'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://iugo.com.br',
    description: 'Plataforma financeira'
  },

  'paycash': {
    id: 'paycash',
    name: 'PayCash',
    shortName: 'PayCash',
    logoPath: bankLogos['paycash'],
    alternativeLogos: [],
    type: 'fintech',
    isActive: true,
    website: 'https://paycash.com.br',
    description: 'Solução de pagamentos'
  },

  'contbank': {
    id: 'contbank',
    name: 'Contbank',
    shortName: 'Contbank',
    logoPath: bankLogos['contbank'],
    alternativeLogos: [],
    type: 'digital',
    isActive: true,
    website: 'https://contbank.com.br',
    description: 'Banco digital'
  },

  'credisis': {
    id: 'credisis',
    name: 'Credisis',
    shortName: 'Credisis',
    logoPath: bankLogos['credisis'],
    alternativeLogos: [],
    type: 'credit_union',
    isActive: true,
    website: 'https://credisis.com.br',
    description: 'Cooperativa de crédito'
  },

  'cresol': {
    id: 'cresol',
    name: 'Cresol',
    shortName: 'Cresol',
    logoPath: bankLogos['cresol'],
    alternativeLogos: [],
    type: 'credit_union',
    isActive: true,
    website: 'https://cresol.com.br',
    description: 'Cooperativa de crédito'
  },

  'ailos': {
    id: 'ailos',
    name: 'Ailos',
    shortName: 'Ailos',
    logoPath: bankLogos['ailos'],
    alternativeLogos: [],
    type: 'credit_union',
    isActive: true,
    website: 'https://ailos.coop.br',
    description: 'Sistema de cooperativas'
  },

  'mufg': {
    id: 'mufg',
    name: 'MUFG Bank',
    shortName: 'MUFG',
    logoPath: bankLogos['mufg'],
    alternativeLogos: [],
    type: 'traditional',
    isActive: true,
    website: 'https://mufg.jp',
    description: 'Banco internacional'
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
