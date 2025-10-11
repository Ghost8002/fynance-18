import React from 'react';
import { Database, Building2, Wallet, CreditCard, CheckCircle2, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  name: string;
  bank?: string;
  type?: string;
  balance?: number;
}

interface AccountSelectorProps {
  accounts: Account[] | null | undefined;
  selectedAccountId: string;
  onSelect: (accountId: string) => void;
  disabled?: boolean;
  colorScheme?: 'green' | 'blue' | 'purple';
}

const bankLogos: Record<string, string> = {
  'itau': '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau.svg',
  'itaú': '/Bancos-em-SVG-main/Itaú Unibanco S.A/itau.svg',
  'bb': '/Bancos-em-SVG-main/Banco do Brasil S.A/banco-do-brasil-sem-fundo.svg',
  'banco do brasil': '/Bancos-em-SVG-main/Banco do Brasil S.A/banco-do-brasil-sem-fundo.svg',
  'caixa': '/Bancos-em-SVG-main/Caixa Econômica Federal/caixa-economica-federal-1.svg',
  'cef': '/Bancos-em-SVG-main/Caixa Econômica Federal/caixa-economica-federal-1.svg',
  'efi': '/Bancos-em-SVG-main/Efí - Gerencianet/logo-efi-bank-laranja.svg',
  'gerencianet': '/Bancos-em-SVG-main/Efí - Gerencianet/logo-efi-bank-laranja.svg',
  'bk': '/Bancos-em-SVG-main/BK Bank/bkBank.svg',
  'zemo': '/Bancos-em-SVG-main/Zemo Bank/logowhite.svg',
};

const getAccountIcon = (account: Account) => {
  if (account.type?.toLowerCase().includes('credito') || account.type?.toLowerCase().includes('crédito')) {
    return CreditCard;
  }
  if (account.type?.toLowerCase().includes('poupanca') || account.type?.toLowerCase().includes('poupança')) {
    return Wallet;
  }
  return Landmark;
};

const getBankLogo = (bankName?: string): string | null => {
  if (!bankName) return null;
  const normalized = bankName.toLowerCase().trim();
  return bankLogos[normalized] || null;
};

const colorSchemes = {
  green: {
    border: 'border-green-500',
    bg: 'bg-green-500/5',
    ring: 'ring-green-500',
    text: 'text-green-600',
    hover: 'hover:border-green-400 hover:bg-green-500/10',
  },
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-500/5',
    ring: 'ring-blue-500',
    text: 'text-blue-600',
    hover: 'hover:border-blue-400 hover:bg-blue-500/10',
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-500/5',
    ring: 'ring-purple-500',
    text: 'text-purple-600',
    hover: 'hover:border-purple-400 hover:bg-purple-500/10',
  },
};

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  selectedAccountId,
  onSelect,
  disabled = false,
  colorScheme = 'blue',
}) => {
  const colors = colorSchemes[colorScheme];

  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center py-8 px-4 border-2 border-dashed border-muted rounded-lg">
        <Database className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground font-medium">Nenhuma conta disponível</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Crie uma conta primeiro para importar transações
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Database className="h-4 w-4 text-foreground" />
        <h3 className="text-base font-semibold text-foreground">Selecione a Conta de Destino</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {accounts.map((account) => {
          const isSelected = selectedAccountId === account.id;
          const AccountIcon = getAccountIcon(account);
          const bankLogo = getBankLogo(account.bank);

          return (
            <button
              key={account.id}
              type="button"
              onClick={() => !disabled && onSelect(account.id)}
              disabled={disabled}
              className={cn(
                "relative p-3 rounded-lg border-2 text-left transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isSelected
                  ? `${colors.border} ${colors.bg} ring-2 ${colors.ring} shadow-lg scale-[1.02]`
                  : `border-border hover:shadow-md ${colors.hover}`,
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {bankLogo ? (
                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center p-1 overflow-hidden">
                      <img 
                        src={bankLogo} 
                        alt={account.bank} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isSelected ? colors.bg : "bg-muted"
                    )}>
                      <AccountIcon className={cn(
                        "h-4 w-4",
                        isSelected ? colors.text : "text-muted-foreground"
                      )} />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-foreground leading-tight">
                      {account.name}
                    </h4>
                    {account.bank && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {account.bank}
                      </p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full",
                    colors.bg
                  )}>
                    <CheckCircle2 className={cn("h-4 w-4", colors.text)} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {account.type && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      isSelected && `${colors.border} ${colors.text}`
                    )}
                  >
                    {account.type}
                  </Badge>
                )}
                {account.balance !== undefined && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(account.balance)}
                  </Badge>
                )}
              </div>

              {isSelected && (
                <div 
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-1 rounded-b-xl",
                    colors.bg
                  )}
                  style={{
                    background: `linear-gradient(90deg, ${colorScheme === 'green' ? 'rgb(34 197 94)' : colorScheme === 'blue' ? 'rgb(59 130 246)' : 'rgb(168 85 247)'} 0%, transparent 100%)`
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {!selectedAccountId && (
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
          <Database className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Clique em uma conta acima para selecionar onde as transações serão importadas
          </p>
        </div>
      )}
    </div>
  );
};
