/**
 * Imports centralizados dos logos dos bancos
 * Os SVGs são importados como módulos para garantir que funcionem corretamente
 */

// Logos dos bancos - usando os arquivos SVG disponíveis
export const bankLogos: Record<string, string> = {
  // Bancos Digitais
  'nubank': '/Bancos-em-SVG-main/Nu Pagamentos S.A/nubank-logo-2021.svg',
  'inter': '/Bancos-em-SVG-main/Banco Inter S.A/inter.svg',
  'c6': '/Bancos-em-SVG-main/Banco C6 S.A/c6 bank.svg',
  'neon': '/Bancos-em-SVG-main/Neon/header-logo-neon.svg',
  'original': '/Bancos-em-SVG-main/Banco Original S.A/banco-original-logo-verde.svg',
  
  // Bancos Tradicionais
  'itau': '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau-fundo-azul.svg',
  'bradesco': '/Bancos-em-SVG-main/Bradesco S.A/bradesco.svg',
  'santander': '/Bancos-em-SVG-main/Banco Santander Brasil S.A/banco-santander-logo.svg',
  'banco-do-brasil': '/Bancos-em-SVG-main/Banco do Brasil S.A/banco-do-brasil-sem-fundo.svg',
  'caixa': '/Bancos-em-SVG-main/Caixa Econômica Federal/caixa-economica-federal.svg',
  
  // Bancos de Investimento
  'btg-pactual': '/Bancos-em-SVG-main/Banco BTG Pacutal/btg-pactual.svg',
  'xp': '/Bancos-em-SVG-main/XP Investimentos/xp-investimentos.svg',
  
  // Fintechs
  'picpay': '/Bancos-em-SVG-main/PicPay/Logo-PicPay.svg',
  'mercado-pago': '/Bancos-em-SVG-main/Mercado Pago/mercado-pago.svg',
  'pagseguro': '/Bancos-em-SVG-main/PagSeguro Internet S.A/logo.svg',
  'stone': '/Bancos-em-SVG-main/Stone Pagamentos S.A/stone.svg',
  
  // Cooperativas
  'sicredi': '/Bancos-em-SVG-main/Sicredi/logo-svg2.svg',
  'sicoob': '/Bancos-em-SVG-main/Sicoob/sicoob-vector-logo.svg',
  
  // Outros
  'safra': '/Bancos-em-SVG-main/Banco Safra S.A/logo-safra.svg',
  'banrisul': '/Bancos-em-SVG-main/Banrisul/banrisul-logo-2023.svg',
  'daycoval': '/Bancos-em-SVG-main/Banco Daycoval/logo-Daycoval.svg',
  'votorantim': '/Bancos-em-SVG-main/Banco Votorantim/banco-bv-logo.svg',
  'mercantil': '/Bancos-em-SVG-main/Banco Mercantil do Brasil S.A/banco-mercantil-novo-azul.svg',
  'sofisa': '/Bancos-em-SVG-main/Banco Sofisa/logo-sofisa.svg',
  'modo': '/Bancos-em-SVG-main/ModoBank/logo.svg',
  'omie': '/Bancos-em-SVG-main/Omie.Cash/omie.svg',
  'omni': '/Bancos-em-SVG-main/Omni/logo-omni.svg',
  'pinbank': '/Bancos-em-SVG-main/PinBank/pinBank.svg',
  'magalupay': '/Bancos-em-SVG-main/MagaluPay/logo-magalupay_white.svg'
};

/**
 * Função auxiliar para obter o logo de um banco
 */
export function getBankLogo(bankId: string): string | null {
  return bankLogos[bankId] || null;
}
