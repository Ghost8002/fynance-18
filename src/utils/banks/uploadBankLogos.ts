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
  { id: 'nubank', name: 'Nubank', logoPath: '/banco-logos-temp/nubank.svg' },
  { id: 'inter', name: 'Inter', logoPath: '/banco-logos-temp/inter.svg' },
  { id: 'c6', name: 'C6 Bank', logoPath: '/banco-logos-temp/c6.svg' },
  { id: 'neon', name: 'Neon', logoPath: '/banco-logos-temp/neon.svg' },
  { id: 'original', name: 'Original', logoPath: '/banco-logos-temp/original.svg' },
  { id: 'bs2', name: 'BS2', logoPath: '/banco-logos-temp/bs2.svg' },
  { id: 'cora', name: 'Cora', logoPath: '/banco-logos-temp/cora.svg' },
  { id: 'letsbank', name: 'Lets Bank', logoPath: '/banco-logos-temp/letsbank.svg' },
  
  // Bancos Tradicionais
  { id: 'itau', name: 'Itaú', logoPath: '/banco-logos-temp/itau.svg' },
  { id: 'bradesco', name: 'Bradesco', logoPath: '/banco-logos-temp/bradesco.svg' },
  { id: 'santander', name: 'Santander', logoPath: '/banco-logos-temp/santander.svg' },
  { id: 'banco-do-brasil', name: 'Banco do Brasil', logoPath: '/banco-logos-temp/banco-do-brasil.svg' },
  { id: 'caixa', name: 'Caixa', logoPath: '/banco-logos-temp/caixa.svg' },
  { id: 'safra', name: 'Safra', logoPath: '/banco-logos-temp/safra.svg' },
  { id: 'bmg', name: 'BMG', logoPath: '/banco-logos-temp/bmg.svg' },
  { id: 'pine', name: 'Pine', logoPath: '/banco-logos-temp/pine.svg' },
  { id: 'abc', name: 'ABC Brasil', logoPath: '/banco-logos-temp/abc.svg' },
  { id: 'bmp', name: 'BMP', logoPath: '/banco-logos-temp/bmp.svg' },
  { id: 'arbi', name: 'Arbi', logoPath: '/banco-logos-temp/arbi.svg' },
  { id: 'industrial', name: 'Industrial', logoPath: '/banco-logos-temp/industrial.svg' },
  { id: 'paulista', name: 'Paulista', logoPath: '/banco-logos-temp/paulista.svg' },
  { id: 'rendimento', name: 'Rendimento', logoPath: '/banco-logos-temp/rendimento.svg' },
  { id: 'topazio', name: 'Topázio', logoPath: '/banco-logos-temp/topazio.svg' },
  { id: 'tribanco', name: 'Tribanco', logoPath: '/banco-logos-temp/tribanco.svg' },
  
  // Bancos de Investimento
  { id: 'btg-pactual', name: 'BTG Pactual', logoPath: '/banco-logos-temp/btg-pactual.svg' },
  { id: 'xp', name: 'XP', logoPath: '/banco-logos-temp/xp.svg' },
  
  // Fintechs
  { id: 'picpay', name: 'PicPay', logoPath: '/banco-logos-temp/picpay.svg' },
  { id: 'mercado-pago', name: 'Mercado Pago', logoPath: '/banco-logos-temp/mercado-pago.svg' },
  { id: 'pagseguro', name: 'PagSeguro', logoPath: '/banco-logos-temp/pagseguro.svg' },
  { id: 'stone', name: 'Stone', logoPath: '/banco-logos-temp/stone.svg' },
  { id: 'infinitepay', name: 'InfinitePay', logoPath: '/banco-logos-temp/infinitepay.svg' },
  { id: 'conta-simples', name: 'Conta Simples', logoPath: '/banco-logos-temp/conta-simples.svg' },
  { id: 'efi', name: 'Efí', logoPath: '/banco-logos-temp/efi.svg' },
  { id: 'duepay', name: 'DuePay', logoPath: '/banco-logos-temp/duepay.svg' },
  { id: 'grafeno', name: 'Grafeno', logoPath: '/banco-logos-temp/grafeno.svg' },
  { id: 'linker', name: 'Linker', logoPath: '/banco-logos-temp/linker.svg' },
  { id: 'iugo', name: 'Iugo', logoPath: '/banco-logos-temp/iugo.svg' },
  { id: 'ip4y', name: 'Ip4y', logoPath: '/banco-logos-temp/ip4y.svg' },
  { id: 'ifood-pago', name: 'iFood Pago', logoPath: '/banco-logos-temp/ifood-pago.svg' },
  { id: 'magalupay', name: 'MagaluPay', logoPath: '/banco-logos-temp/magalupay.svg' },
  { id: 'recargapay', name: 'RecargaPay', logoPath: '/banco-logos-temp/recargapay.svg' },
  { id: 'squid', name: 'Squid', logoPath: '/banco-logos-temp/squid.svg' },
  { id: 'transfeera', name: 'Transfeera', logoPath: '/banco-logos-temp/transfeera.svg' },
  { id: 'paycash', name: 'PayCash', logoPath: '/banco-logos-temp/paycash.svg' },
  { id: 'asaas', name: 'Asaas', logoPath: '/banco-logos-temp/asaas.svg' },
  { id: 'contbank', name: 'Contbank', logoPath: '/banco-logos-temp/contbank.svg' },
  
  // Cooperativas
  { id: 'sicredi', name: 'Sicredi', logoPath: '/banco-logos-temp/sicredi.svg' },
  { id: 'sicoob', name: 'Sicoob', logoPath: '/banco-logos-temp/sicoob.svg' },
  { id: 'unicred', name: 'Unicred', logoPath: '/banco-logos-temp/unicred.svg' },
  { id: 'ailos', name: 'Ailos', logoPath: '/banco-logos-temp/ailos.svg' },
  { id: 'credisis', name: 'Credisis', logoPath: '/banco-logos-temp/credisis.svg' },
  { id: 'cresol', name: 'Cresol', logoPath: '/banco-logos-temp/cresol.svg' },
  { id: 'uniprime', name: 'Uniprime', logoPath: '/banco-logos-temp/uniprime.svg' },
  { id: 'sulcredi', name: 'Sulcredi', logoPath: '/banco-logos-temp/sulcredi.svg' },
  { id: 'sisprime', name: 'Sisprime', logoPath: '/banco-logos-temp/sisprime.svg' },
  
  // Bancos Regionais
  { id: 'banrisul', name: 'Banrisul', logoPath: '/banco-logos-temp/banrisul.svg' },
  { id: 'brb', name: 'BRB', logoPath: '/banco-logos-temp/brb.svg' },
  { id: 'banpara', name: 'Banpará', logoPath: '/banco-logos-temp/banpara.svg' },
  { id: 'banese', name: 'Banese', logoPath: '/banco-logos-temp/banese.svg' },
  { id: 'banestes', name: 'Banestes', logoPath: '/banco-logos-temp/banestes.svg' },
  { id: 'bnb', name: 'Banco do Nordeste', logoPath: '/banco-logos-temp/bnb.svg' },
  { id: 'banco-amazonia', name: 'Banco da Amazônia', logoPath: '/banco-logos-temp/banco-amazonia.svg' },
  
  // Outros
  { id: 'daycoval', name: 'Daycoval', logoPath: '/banco-logos-temp/daycoval.svg' },
  { id: 'votorantim', name: 'BV', logoPath: '/banco-logos-temp/votorantim.svg' },
  { id: 'mercantil', name: 'Mercantil', logoPath: '/banco-logos-temp/mercantil.svg' },
  { id: 'sofisa', name: 'Sofisa', logoPath: '/banco-logos-temp/sofisa.svg' },
  { id: 'modo', name: 'Modo', logoPath: '/banco-logos-temp/modo.svg' },
  { id: 'omie', name: 'Omie', logoPath: '/banco-logos-temp/omie.svg' },
  { id: 'omni', name: 'Omni', logoPath: '/banco-logos-temp/omni.svg' },
  { id: 'pinbank', name: 'PinBank', logoPath: '/banco-logos-temp/pinbank.svg' },
  { id: 'multiplo', name: 'Múltiplo', logoPath: '/banco-logos-temp/multiplo.svg' },
  { id: 'bees', name: 'Bees Bank', logoPath: '/banco-logos-temp/bees.svg' },
  { id: 'capitual', name: 'Capitual', logoPath: '/banco-logos-temp/capitual.svg' },
  { id: 'quality', name: 'Quality', logoPath: '/banco-logos-temp/quality.svg' },
  { id: 'starbank', name: 'StarBank', logoPath: '/banco-logos-temp/starbank.svg' },
  { id: 'zemo', name: 'Zemo', logoPath: '/banco-logos-temp/zemo.svg' },
  { id: 'bk', name: 'BK Bank', logoPath: '/banco-logos-temp/bk.svg' },
  { id: 'bnp', name: 'BNP Paribas', logoPath: '/banco-logos-temp/bnp.svg' },
  { id: 'bofa', name: 'Bank of America', logoPath: '/banco-logos-temp/bofa.svg' },
  { id: 'mufg', name: 'MUFG', logoPath: '/banco-logos-temp/mufg.svg' },
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
