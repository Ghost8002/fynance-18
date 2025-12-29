import logoDark from '@/assets/logo-dark.svg';
import logoLight from '@/assets/logo-light.svg';

interface FynanceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export function FynanceLogo({ size = 'md', className = '' }: FynanceLogoProps) {
  return (
    <>
      {/* Logo escura para tema claro */}
      <img
        src={logoDark}
        alt="Fynance"
        className={`${sizeClasses[size]} ${className} dark:hidden rounded-xl`}
      />
      {/* Logo clara para tema escuro */}
      <img
        src={logoLight}
        alt="Fynance"
        className={`${sizeClasses[size]} ${className} hidden dark:block rounded-xl`}
      />
    </>
  );
}
