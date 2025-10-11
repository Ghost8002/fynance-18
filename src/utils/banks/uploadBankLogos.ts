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
  { id: 'nubank', name: 'Nubank', logoPath: '/Bancos-em-SVG-main/Nu Pagamentos S.A/nubank-logo-2021.svg' },
  { id: 'inter', name: 'Inter', logoPath: '/Bancos-em-SVG-main/Banco Inter S.A/inter.svg' },
  { id: 'c6', name: 'C6 Bank', logoPath: '/Bancos-em-SVG-main/Banco C6 S.A/c6 bank.svg' },
  { id: 'neon', name: 'Neon', logoPath: '/Bancos-em-SVG-main/Neon/header-logo-neon.svg' },
  { id: 'original', name: 'Original', logoPath: '/Bancos-em-SVG-main/Banco Original S.A/banco-original-logo-verde.svg' },
  
  // Bancos Tradicionais
  { id: 'itau', name: 'Itaú', logoPath: '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau-fundo-azul.svg' },
  { id: 'bradesco', name: 'Bradesco', logoPath: '/Bancos-em-SVG-main/Bradesco S.A/bradesco.svg' },
  { id: 'santander', name: 'Santander', logoPath: '/Bancos-em-SVG-main/Banco Santander Brasil S.A/banco-santander-logo.svg' },
  { id: 'banco-do-brasil', name: 'Banco do Brasil', logoPath: '/Bancos-em-SVG-main/Banco do Brasil S.A/banco-do-brasil-sem-fundo.svg' },
  { id: 'caixa', name: 'Caixa', logoPath: '/Bancos-em-SVG-main/Caixa Econômica Federal/caixa-economica-federal.svg' },
  
  // Bancos de Investimento
  { id: 'btg-pactual', name: 'BTG Pactual', logoPath: '/Bancos-em-SVG-main/Banco BTG Pacutal/btg-pactual.svg' },
  { id: 'xp', name: 'XP', logoPath: '/Bancos-em-SVG-main/XP Investimentos/xp-investimentos.svg' },
  
  // Fintechs
  { id: 'picpay', name: 'PicPay', logoPath: '/Bancos-em-SVG-main/PicPay/Logo-PicPay.svg' },
  { id: 'mercado-pago', name: 'Mercado Pago', logoPath: '/Bancos-em-SVG-main/Mercado Pago/mercado-pago.svg' },
  { id: 'pagseguro', name: 'PagSeguro', logoPath: '/Bancos-em-SVG-main/PagSeguro Internet S.A/logo.svg' },
  { id: 'stone', name: 'Stone', logoPath: '/Bancos-em-SVG-main/Stone Pagamentos S.A/stone.svg' },
  
  // Cooperativas
  { id: 'sicredi', name: 'Sicredi', logoPath: '/Bancos-em-SVG-main/Sicredi/logo-svg2.svg' },
  { id: 'sicoob', name: 'Sicoob', logoPath: '/Bancos-em-SVG-main/Sicoob/sicoob-vector-logo.svg' },
  
  // Outros
  { id: 'safra', name: 'Safra', logoPath: '/Bancos-em-SVG-main/Banco Safra S.A/logo-safra.svg' },
  { id: 'banrisul', name: 'Banrisul', logoPath: '/Bancos-em-SVG-main/Banrisul/banrisul-logo-2023.svg' },
  { id: 'daycoval', name: 'Daycoval', logoPath: '/Bancos-em-SVG-main/Banco Daycoval/logo-Daycoval.svg' },
  { id: 'votorantim', name: 'BV', logoPath: '/Bancos-em-SVG-main/Banco Votorantim/banco-bv-logo.svg' },
  { id: 'mercantil', name: 'Mercantil', logoPath: '/Bancos-em-SVG-main/Banco Mercantil do Brasil S.A/banco-mercantil-novo-azul.svg' },
  { id: 'sofisa', name: 'Sofisa', logoPath: '/Bancos-em-SVG-main/Banco Sofisa/logo-sofisa.svg' },
  { id: 'modo', name: 'Modo', logoPath: '/Bancos-em-SVG-main/ModoBank/logo.svg' },
  { id: 'omie', name: 'Omie', logoPath: '/Bancos-em-SVG-main/Omie.Cash/omie.svg' },
  { id: 'omni', name: 'Omni', logoPath: '/Bancos-em-SVG-main/Omni/logo-omni.svg' },
  { id: 'pinbank', name: 'PinBank', logoPath: '/Bancos-em-SVG-main/PinBank/pinBank.svg' },
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
