import { useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BankLogoProps {
  logoPath?: string;
  bankName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showFallback?: boolean;
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

  // Se não há logo ou houve erro, mostrar ícone padrão
  if (!logoPath || imageError || !showFallback) {
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
        src={logoPath}
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
