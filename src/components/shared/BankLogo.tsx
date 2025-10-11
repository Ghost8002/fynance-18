import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface BankLogoProps {
  logoPath?: string;
  bankName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFallback?: boolean;
}

/**
 * Função para obter a URL pública do logo no Supabase Storage
 * Se o logoPath começar com '/', assume que é um caminho local e converte para Storage
 */
function getBankLogoUrl(logoPath?: string, bankName?: string): string | null {
  if (!logoPath) return null;
  
  // Se já é uma URL completa, retornar como está
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath;
  }
  
  // Se é um caminho do banco de dados antigo, extrair o ID do banco
  if (logoPath.includes('Bancos-em-SVG-main/')) {
    // Tentar extrair o ID do banco do nome do arquivo ou pasta
    const parts = logoPath.split('/');
    const fileName = parts[parts.length - 1]; // Nome do arquivo SVG
    
    // Tentar gerar um ID baseado no nome do banco
    const bankId = bankName?.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui espaços e caracteres especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
    
    if (bankId) {
      // Gerar URL do Supabase Storage
      const { data } = supabase.storage
        .from('bank-logos')
        .getPublicUrl(`${bankId}.svg`);
      
      return data.publicUrl;
    }
  }
  
  return logoPath;
}

export const BankLogo = ({ 
  logoPath, 
  bankName, 
  className,
  size = 'md',
  showFallback = true 
}: BankLogoProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Obter URL correta do logo
  const logoUrl = getBankLogoUrl(logoPath, bankName);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Se não há logo, mostrar ícone padrão
  if (!logoUrl) {
    if (!showFallback) return null;
    
    return (
      <div className={cn(
        "flex items-center justify-center rounded bg-muted",
        sizeClasses[size],
        className
      )}>
        <Building2 className={cn(
          "text-muted-foreground",
          size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
        )} />
      </div>
    );
  }

  // Se houve erro ao carregar, mostrar fallback
  if (imageError) {
    if (!showFallback) return null;
    
    return (
      <div className={cn(
        "flex items-center justify-center rounded bg-muted",
        sizeClasses[size],
        className
      )}>
        <Building2 className={cn(
          "text-muted-foreground",
          size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
        )} />
      </div>
    );
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-muted">
          <Building2 className={cn(
            "text-muted-foreground animate-pulse",
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
          )} />
        </div>
      )}
      
      <img
        src={logoUrl}
        alt={`Logo do ${bankName}`}
        className={cn(
          "rounded object-contain",
          sizeClasses[size],
          imageLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

export default BankLogo;
