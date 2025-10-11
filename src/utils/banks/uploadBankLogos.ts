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
  
  // Bancos Tradicionais
  { id: 'itau', name: 'Itaú', logoPath: '/banco-logos-temp/itau.svg' },
  { id: 'bradesco', name: 'Bradesco', logoPath: '/banco-logos-temp/bradesco.svg' },
  { id: 'santander', name: 'Santander', logoPath: '/banco-logos-temp/santander.svg' },
  { id: 'banco-do-brasil', name: 'Banco do Brasil', logoPath: '/banco-logos-temp/banco-do-brasil.svg' },
  { id: 'caixa', name: 'Caixa', logoPath: '/banco-logos-temp/caixa.svg' },
  
  // Bancos de Investimento
  { id: 'btg-pactual', name: 'BTG Pactual', logoPath: '/banco-logos-temp/btg-pactual.svg' },
  { id: 'xp', name: 'XP', logoPath: '/banco-logos-temp/xp.svg' },
  
  // Fintechs
  { id: 'picpay', name: 'PicPay', logoPath: '/banco-logos-temp/picpay.svg' },
  { id: 'mercado-pago', name: 'Mercado Pago', logoPath: '/banco-logos-temp/mercado-pago.svg' },
  { id: 'pagseguro', name: 'PagSeguro', logoPath: '/banco-logos-temp/pagseguro.svg' },
  { id: 'stone', name: 'Stone', logoPath: '/banco-logos-temp/stone.svg' },
  
  // Cooperativas
  { id: 'sicredi', name: 'Sicredi', logoPath: '/banco-logos-temp/sicredi.svg' },
  { id: 'sicoob', name: 'Sicoob', logoPath: '/banco-logos-temp/sicoob.svg' },
  
  // Outros
  { id: 'safra', name: 'Safra', logoPath: '/banco-logos-temp/safra.svg' },
  { id: 'banrisul', name: 'Banrisul', logoPath: '/banco-logos-temp/banrisul.svg' },
  { id: 'daycoval', name: 'Daycoval', logoPath: '/banco-logos-temp/daycoval.svg' },
  { id: 'votorantim', name: 'BV', logoPath: '/banco-logos-temp/votorantim.svg' },
  { id: 'mercantil', name: 'Mercantil', logoPath: '/banco-logos-temp/mercantil.svg' },
  { id: 'sofisa', name: 'Sofisa', logoPath: '/banco-logos-temp/sofisa.svg' },
  { id: 'modo', name: 'Modo', logoPath: '/banco-logos-temp/modo.svg' },
  { id: 'omie', name: 'Omie', logoPath: '/banco-logos-temp/omie.svg' },
  { id: 'omni', name: 'Omni', logoPath: '/banco-logos-temp/omni.svg' },
  { id: 'pinbank', name: 'PinBank', logoPath: '/banco-logos-temp/pinbank.svg' },
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
