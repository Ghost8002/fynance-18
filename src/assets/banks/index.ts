/**
 * Caminhos dos logos dos bancos
 * Usa caminhos locais da pasta public/banco-logos-temp/
 */

// Logos dos bancos - usando caminhos locais
export const bankLogos: Record<string, string> = {
  // Bancos Digitais
  'nubank': '/banco-logos-temp/nubank.svg',
  'inter': '/banco-logos-temp/inter.svg',
  'c6': '/banco-logos-temp/c6.svg',
  'neon': '/banco-logos-temp/neon.svg',
  'original': '/banco-logos-temp/original.svg',
  
  // Bancos Tradicionais
  'itau': '/banco-logos-temp/itau.svg',
  'bradesco': '/banco-logos-temp/bradesco.svg',
  'santander': '/banco-logos-temp/santander.svg',
  'banco-do-brasil': '/banco-logos-temp/banco-do-brasil.svg',
  'caixa': '/banco-logos-temp/caixa.svg',
  
  // Bancos de Investimento
  'btg-pactual': '/banco-logos-temp/btg-pactual.svg',
  'xp': '/banco-logos-temp/xp.svg',
  
  // Fintechs
  'picpay': '/banco-logos-temp/picpay.svg',
  'mercado-pago': '/banco-logos-temp/mercado-pago.svg',
  'pagseguro': '/banco-logos-temp/pagseguro.svg',
  'stone': '/banco-logos-temp/stone.svg',
  
  // Cooperativas
  'sicredi': '/banco-logos-temp/sicredi.svg',
  'sicoob': '/banco-logos-temp/sicoob.svg',
  
  // Outros
  'safra': '/banco-logos-temp/safra.svg',
  'banrisul': '/banco-logos-temp/banrisul.svg',
  'daycoval': '/banco-logos-temp/daycoval.svg',
  'votorantim': '/banco-logos-temp/votorantim.svg',
  'mercantil': '/banco-logos-temp/mercantil.svg',
  'sofisa': '/banco-logos-temp/sofisa.svg',
  'modo': '/banco-logos-temp/modo.svg',
  'omie': '/banco-logos-temp/omie.svg',
  'omni': '/banco-logos-temp/omni.svg',
  'pinbank': '/banco-logos-temp/pinbank.svg',
  'magalupay': '/banco-logos-temp/magalupay.svg',
  
  // Bancos adicionais
  'bs2': '/banco-logos-temp/bs2.svg',
  'cora': '/banco-logos-temp/cora.svg',
  'letsbank': '/banco-logos-temp/letsbank.svg',
  'bmg': '/banco-logos-temp/bmg.svg',
  'pine': '/banco-logos-temp/pine.svg',
  'abc': '/banco-logos-temp/abc.svg',
  'bmp': '/banco-logos-temp/bmp.svg',
  'arbi': '/banco-logos-temp/arbi.svg',
  'industrial': '/banco-logos-temp/industrial.svg',
  'paulista': '/banco-logos-temp/paulista.svg',
  'rendimento': '/banco-logos-temp/rendimento.svg',
  'topazio': '/banco-logos-temp/topazio.svg',
  'tribanco': '/banco-logos-temp/tribanco.svg',
  'conta-simples': '/banco-logos-temp/conta-simples.svg',
  'efi': '/banco-logos-temp/efi.svg',
  'duepay': '/banco-logos-temp/duepay.svg',
  'ifood-pago': '/banco-logos-temp/ifood-pago.svg',
  'recargapay': '/banco-logos-temp/recargapay.svg',
  'squid': '/banco-logos-temp/squid.svg',
  'transfeera': '/banco-logos-temp/transfeera.svg',
  'asaas': '/banco-logos-temp/asaas.svg',
  'unicred': '/banco-logos-temp/unicred.svg',
  'uniprime': '/banco-logos-temp/uniprime.svg',
  'sulcredi': '/banco-logos-temp/sulcredi.svg',
  'sisprime': '/banco-logos-temp/sisprime.svg',
  'brb': '/banco-logos-temp/brb.svg',
  'banpara': '/banco-logos-temp/banpara.svg',
  'banese': '/banco-logos-temp/banese.svg',
  'banestes': '/banco-logos-temp/banestes.svg',
  'bnb': '/banco-logos-temp/bnb.svg',
  'banco-amazonia': '/banco-logos-temp/banco-amazonia.svg',
  'multiplo': '/banco-logos-temp/multiplo.svg',
  'bees': '/banco-logos-temp/bees.svg',
  'capitual': '/banco-logos-temp/capitual.svg',
  'quality': '/banco-logos-temp/quality.svg',
  'starbank': '/banco-logos-temp/starbank.svg',
  'zemo': '/banco-logos-temp/zemo.svg',
  'bk': '/banco-logos-temp/bk.svg',
  'bnp': '/banco-logos-temp/bnp.svg',
  'bofa': '/banco-logos-temp/bofa.svg',
  'citibank': '/banco-logos-temp/citibank.svg',
  'credit-suisse': '/banco-logos-temp/credit-suisse.svg',
  'jpmorgan': '/banco-logos-temp/jpmorgan.svg',
  'mizuho': '/banco-logos-temp/mizuho.svg',
  'morgan-stanley': '/banco-logos-temp/morgan-stanley.svg',
  'hsbc': '/banco-logos-temp/hsbc.svg',
  'rabobank': '/banco-logos-temp/rabobank.svg',
  'sumitomo': '/banco-logos-temp/sumitomo.svg',
  'linker': '/banco-logos-temp/linker.svg',
  'grafeno': '/banco-logos-temp/grafeno.svg',
  'infinitepay': '/banco-logos-temp/infinitepay.svg',
  'ip4y': '/banco-logos-temp/ip4y.svg',
  'iugo': '/banco-logos-temp/iugo.svg',
  'paycash': '/banco-logos-temp/paycash.svg',
  'contbank': '/banco-logos-temp/contbank.svg',
  'credisis': '/banco-logos-temp/credisis.svg',
  'cresol': '/banco-logos-temp/cresol.svg',
  'ailos': '/banco-logos-temp/ailos.svg',
  'mufg': '/banco-logos-temp/mufg.svg'
};

/**
 * Função auxiliar para obter o logo de um banco
 */
export function getBankLogo(bankId: string): string | null {
  return bankLogos[bankId] || null;
}
