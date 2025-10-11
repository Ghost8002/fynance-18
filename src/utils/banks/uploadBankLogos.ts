/**
 * Script para fazer upload dos logos dos bancos para o Supabase Storage
 * Execute este arquivo uma vez para popular o storage com os logos
 */

import { supabase } from "@/integrations/supabase/client";

interface BankLogoUpload {
  id: string;
  name: string;
  logoPath: string;
}

const bankLogosToUpload: BankLogoUpload[] = [
  // Bancos Digitais
  { id: 'nubank', name: 'Nubank', logoPath: 'Bancos-em-SVG-main/Nu Pagamentos S.A/nubank-logo-2021.svg' },
  { id: 'inter', name: 'Inter', logoPath: 'Bancos-em-SVG-main/Banco Inter S.A/inter.svg' },
  { id: 'c6', name: 'C6 Bank', logoPath: 'Bancos-em-SVG-main/Banco C6 S.A/c6 bank.svg' },
  { id: 'neon', name: 'Neon', logoPath: 'Bancos-em-SVG-main/Neon/header-logo-neon.svg' },
  { id: 'original', name: 'Original', logoPath: 'Bancos-em-SVG-main/Banco Original S.A/banco-original-logo-verde.svg' },
  { id: 'bs2', name: 'BS2', logoPath: 'Bancos-em-SVG-main/Banco BS2 S.A/Banco_BS2.svg' },
  { id: 'cora', name: 'Cora', logoPath: 'Bancos-em-SVG-main/Cora Sociedade Credito Direto S.A/icone-cora-rosa-2500px.svg' },
  { id: 'letsbank', name: 'Lets Bank', logoPath: 'Bancos-em-SVG-main/Lets Bank S.A/Logo Letsbank.svg' },
  { id: 'next', name: 'Next', logoPath: 'Bancos-em-SVG-main/Bradesco S.A/bradesco.svg' },
  
  // Bancos Tradicionais
  { id: 'itau', name: 'Itaú', logoPath: 'Bancos-em-SVG-main/Itaú Unibanco S.A/itau-fundo-azul.svg' },
  { id: 'bradesco', name: 'Bradesco', logoPath: 'Bancos-em-SVG-main/Bradesco S.A/bradesco.svg' },
  { id: 'santander', name: 'Santander', logoPath: 'Bancos-em-SVG-main/Banco Santander Brasil S.A/banco-santander-logo.svg' },
  { id: 'banco-do-brasil', name: 'Banco do Brasil', logoPath: 'Bancos-em-SVG-main/Banco do Brasil S.A/banco-do-brasil-sem-fundo.svg' },
  { id: 'caixa', name: 'Caixa', logoPath: 'Bancos-em-SVG-main/Caixa Econômica Federal/caixa-economica-federal-1.svg' },
  { id: 'safra', name: 'Safra', logoPath: 'Bancos-em-SVG-main/Banco Safra S.A/logo-safra.svg' },
  { id: 'bmg', name: 'BMG', logoPath: 'Bancos-em-SVG-main/Banco BMG/banco-bmg-logo.svg' },
  { id: 'pine', name: 'Pine', logoPath: 'Bancos-em-SVG-main/Banco Pine/banco-pine.svg' },
  { id: 'abc', name: 'ABC Brasil', logoPath: 'Bancos-em-SVG-main/ABC Brasil/logoabc.svg' },
  { id: 'bmp', name: 'BMP', logoPath: 'Bancos-em-SVG-main/Banco BMP/logo_bmp.svg' },
  { id: 'arbi', name: 'Arbi', logoPath: 'Bancos-em-SVG-main/Banco Arbi/Banco_Arbi .svg' },
  { id: 'industrial', name: 'Industrial', logoPath: 'Bancos-em-SVG-main/Banco Industrial do Brasil S.A/BIB-logo.svg' },
  { id: 'paulista', name: 'Paulista', logoPath: 'Bancos-em-SVG-main/Banco Paulista/banco-paulista.svg' },
  { id: 'rendimento', name: 'Rendimento', logoPath: 'Bancos-em-SVG-main/Banco Rendimento/banco rendimento logo nova .svg' },
  { id: 'topazio', name: 'Topázio', logoPath: 'Bancos-em-SVG-main/Banco Topazio/logo-banco-topazio.svg' },
  { id: 'tribanco', name: 'Tribanco', logoPath: 'Bancos-em-SVG-main/Banco Triângulo - Tribanco/logotribanco.svg' },
  
  // Bancos de Investimento
  { id: 'btg-pactual', name: 'BTG Pactual', logoPath: 'Bancos-em-SVG-main/Banco BTG Pacutal/btg-pactual.svg' },
  { id: 'xp', name: 'XP', logoPath: 'Bancos-em-SVG-main/XP Investimentos/xp-investimentos-logo.svg' },
  
  // Fintechs
  { id: 'picpay', name: 'PicPay', logoPath: 'Bancos-em-SVG-main/PicPay/Logo-PicPay.svg' },
  { id: 'mercado-pago', name: 'Mercado Pago', logoPath: 'Bancos-em-SVG-main/Mercado Pago/mercado-pago.svg' },
  { id: 'pagseguro', name: 'PagSeguro', logoPath: 'Bancos-em-SVG-main/PagSeguro Internet S.A/logo.svg' },
  { id: 'stone', name: 'Stone', logoPath: 'Bancos-em-SVG-main/Stone Pagamentos S.A/stone.svg' },
  { id: 'infinitepay', name: 'InfinitePay', logoPath: 'Bancos-em-SVG-main/InfinitePay/InfitePay.svg' },
  { id: 'conta-simples', name: 'Conta Simples', logoPath: 'Bancos-em-SVG-main/Conta Simples Soluções em Pagamentos/conta-simples_logo-novo.svg' },
  { id: 'efi', name: 'Efí', logoPath: 'Bancos-em-SVG-main/Efí - Gerencianet/logo-efi-bank-laranja.svg' },
  { id: 'duepay', name: 'DuePay', logoPath: 'Bancos-em-SVG-main/DuePay/Duepay.svg' },
  { id: 'grafeno', name: 'Grafeno', logoPath: 'Bancos-em-SVG-main/Grafeno/grafeno.svg' },
  { id: 'linker', name: 'Linker', logoPath: 'Bancos-em-SVG-main/Linker/logo.svg' },
  { id: 'iugo', name: 'Iugo', logoPath: 'Bancos-em-SVG-main/Iugo/Iugo.svg' },
  { id: 'ip4y', name: 'Ip4y', logoPath: 'Bancos-em-SVG-main/Ip4y/logo-blue.svg' },
  { id: 'ifood-pago', name: 'iFood Pago', logoPath: 'Bancos-em-SVG-main/Ifood Pago/LOGO-IFOOD-PAGO-BRANCO.svg' },
  { id: 'magalupay', name: 'MagaluPay', logoPath: 'Bancos-em-SVG-main/MagaluPay/logo-magalupay.svg' },
  { id: 'recargapay', name: 'RecargaPay', logoPath: 'Bancos-em-SVG-main/RecargaPay/RecargaPay.svg' },
  { id: 'squid', name: 'Squid', logoPath: 'Bancos-em-SVG-main/Squid Soluções Financeiras/logo.svg' },
  { id: 'transfeera', name: 'Transfeera', logoPath: 'Bancos-em-SVG-main/Transfera/transfeera-logo-verde-nova.svg' },
  { id: 'paycash', name: 'PayCash', logoPath: 'Bancos-em-SVG-main/PayCash/logo.svg' },
  { id: 'asaas', name: 'Asaas', logoPath: 'Bancos-em-SVG-main/Asaas IP S.A/header-logo-azul.svg' },
  { id: 'contbank', name: 'Contbank', logoPath: 'Bancos-em-SVG-main/Contbank/logo-contbank.svg' },
  
  // Cooperativas
  { id: 'sicredi', name: 'Sicredi', logoPath: 'Bancos-em-SVG-main/Sicredi/logo-svg2.svg' },
  { id: 'sicoob', name: 'Sicoob', logoPath: 'Bancos-em-SVG-main/Sicoob/sicoob-vector-logo.svg' },
  { id: 'unicred', name: 'Unicred', logoPath: 'Bancos-em-SVG-main/Unicred/verde.svg' },
  { id: 'ailos', name: 'Ailos', logoPath: 'Bancos-em-SVG-main/Ailos/logo-ailos.svg' },
  { id: 'credisis', name: 'Credisis', logoPath: 'Bancos-em-SVG-main/Credisis/credisis.svg' },
  { id: 'cresol', name: 'Cresol', logoPath: 'Bancos-em-SVG-main/Cresol/Logo-horizontal-original.svg' },
  { id: 'uniprime', name: 'Uniprime', logoPath: 'Bancos-em-SVG-main/Uniprime/uniprime.svg' },
  { id: 'sulcredi', name: 'Sulcredi', logoPath: 'Bancos-em-SVG-main/Sulcredi/marca.svg' },
  { id: 'sisprime', name: 'Sisprime', logoPath: 'Bancos-em-SVG-main/Sisprime/logo.svg' },
  
  // Bancos Regionais
  { id: 'banrisul', name: 'Banrisul', logoPath: 'Bancos-em-SVG-main/Banrisul/banrisul-logo-2023.svg' },
  { id: 'brb', name: 'BRB', logoPath: 'Bancos-em-SVG-main/BRB - Banco de Brasilia/brb-logo.svg' },
  { id: 'banpara', name: 'Banpará', logoPath: 'Bancos-em-SVG-main/Banco do Estado do Para/banpara-logo-sem-fundo.svg' },
  { id: 'banese', name: 'Banese', logoPath: 'Bancos-em-SVG-main/Banco do Estado do Sergipe/logo banese.svg' },
  { id: 'banestes', name: 'Banestes', logoPath: 'Bancos-em-SVG-main/Banco do Estado do Espirito Santo/banestes.svg' },
  { id: 'bnb', name: 'Banco do Nordeste', logoPath: 'Bancos-em-SVG-main/Banco do Nordeste do Brasil S.A/Logo_BNB.svg' },
  { id: 'banco-amazonia', name: 'Banco da Amazônia', logoPath: 'Bancos-em-SVG-main/Banco da Amazônia S.A/banco-da-amazonia.svg' },
  
  // Outros
  { id: 'daycoval', name: 'Daycoval', logoPath: 'Bancos-em-SVG-main/Banco Daycoval/logo-Daycoval.svg' },
  { id: 'votorantim', name: 'BV', logoPath: 'Bancos-em-SVG-main/Banco Votorantim/banco-bv-logo.svg' },
  { id: 'mercantil', name: 'Mercantil', logoPath: 'Bancos-em-SVG-main/Banco Mercantil do Brasil S.A/banco-mercantil-novo-azul.svg' },
  { id: 'sofisa', name: 'Sofisa', logoPath: 'Bancos-em-SVG-main/Banco Sofisa/logo-sofisa.svg' },
  { id: 'modo', name: 'Modo', logoPath: 'Bancos-em-SVG-main/ModoBank/logo.svg' },
  { id: 'omie', name: 'Omie', logoPath: 'Bancos-em-SVG-main/Omie.Cash/omie.svg' },
  { id: 'omni', name: 'Omni', logoPath: 'Bancos-em-SVG-main/Omni/logo-omni.svg' },
  { id: 'pinbank', name: 'PinBank', logoPath: 'Bancos-em-SVG-main/PinBank/pinBank.svg' },
  { id: 'multiplo', name: 'Múltiplo', logoPath: 'Bancos-em-SVG-main/Multiplo Bank/logotipo.svg' },
  { id: 'bees', name: 'Bees Bank', logoPath: 'Bancos-em-SVG-main/Bees Bank/BEESBank_Horizontal.svg' },
  { id: 'capitual', name: 'Capitual', logoPath: 'Bancos-em-SVG-main/Capitual/logo capitual.svg' },
  { id: 'quality', name: 'Quality', logoPath: 'Bancos-em-SVG-main/Quality Digital Bank/quality-logo-cinza.svg' },
  { id: 'starbank', name: 'StarBank', logoPath: 'Bancos-em-SVG-main/StarBank/logo.svg' },
  { id: 'zemo', name: 'Zemo', logoPath: 'Bancos-em-SVG-main/Zemo Bank/logowhite.svg' },
  { id: 'bk', name: 'BK Bank', logoPath: 'Bancos-em-SVG-main/BK Bank/bkBank.svg' },
  { id: 'bnp', name: 'BNP Paribas', logoPath: 'Bancos-em-SVG-main/BNP Paripas/logo-bnp.svg' },
  { id: 'bofa', name: 'Bank of America', logoPath: 'Bancos-em-SVG-main/Bank of America/bankofamerica-logo.svg' },
  { id: 'mufg', name: 'MUFG', logoPath: 'Bancos-em-SVG-main/MUFG/mufg-seeklogo.svg' },
];

/**
 * Função para fazer upload de um logo para o Supabase Storage
 */
async function uploadLogo(bankId: string, logoPath: string): Promise<string | null> {
  try {
    // Buscar o arquivo SVG
    const response = await fetch(logoPath);
    if (!response.ok) {
      console.error(`Erro ao buscar ${logoPath}: ${response.statusText}`);
      return null;
    }

    const blob = await response.blob();
    const fileName = `${bankId}.svg`;

    // Fazer upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('bank-logos')
      .upload(fileName, blob, {
        contentType: 'image/svg+xml',
        upsert: true // Substitui se já existir
      });

    if (error) {
      console.error(`Erro ao fazer upload de ${bankId}:`, error);
      return null;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('bank-logos')
      .getPublicUrl(fileName);

    console.log(`✓ Logo ${bankId} uploaded com sucesso`);
    return publicUrl;
  } catch (error) {
    console.error(`Exceção ao fazer upload de ${bankId}:`, error);
    return null;
  }
}

/**
 * Função principal para fazer upload de todos os logos
 */
export async function uploadAllBankLogos() {
  console.log('🚀 Iniciando upload dos logos dos bancos...');
  
  const results: Record<string, string> = {};
  let successCount = 0;
  let errorCount = 0;

  for (const bank of bankLogosToUpload) {
    const publicUrl = await uploadLogo(bank.id, bank.logoPath);
    
    if (publicUrl) {
      results[bank.id] = publicUrl;
      successCount++;
    } else {
      errorCount++;
    }
  }

  console.log('\n📊 Resultados:');
  console.log(`✓ Sucesso: ${successCount}`);
  console.log(`✗ Erros: ${errorCount}`);
  console.log('\n📋 URLs geradas:');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Para executar diretamente no console do navegador:
// import { uploadAllBankLogos } from '@/utils/banks/uploadBankLogos';
// uploadAllBankLogos().then(results => console.log('Upload completo!', results));
