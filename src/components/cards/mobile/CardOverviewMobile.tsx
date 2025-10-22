import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertTriangle, CheckCircle, Calendar, TrendingUp } from "lucide-react";
import BankLogo from "@/components/shared/BankLogo";
import { getBankById } from "@/utils/banks/bankDatabase";
import { useCustomBanks } from "@/hooks/useCustomBanks";

interface CardData {
  id: string;
  name: string;
  type: string;
  bank: string;
  credit_limit: number;
  used_amount: number;
  last_four_digits: string;
  color: string;
  closing_day: number;
  due_day: number;
}

interface CardOverviewMobileProps {
  card: CardData;
}

export const CardOverviewMobile = ({ card }: CardOverviewMobileProps) => {
  const { customBanks } = useCustomBanks();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBankInfo = (bankId: string) => {
    if (bankId.startsWith('custom_')) {
      const customBankId = bankId.replace('custom_', '');
      const customBank = customBanks.find(cb => cb.id === customBankId);
      if (customBank) {
        return {
          name: customBank.name,
          shortName: customBank.short_name,
          logoPath: '',
          primaryColor: customBank.primary_color,
          secondaryColor: customBank.secondary_color
        };
      }
    }
    
    const bank = getBankById(bankId);
    if (bank) {
      return {
        name: bank.name,
        shortName: bank.shortName,
        logoPath: bank.logoPath,
        primaryColor: bank.primaryColor,
        secondaryColor: bank.secondaryColor
      };
    }
    
    return {
      name: bankId,
      shortName: bankId,
      logoPath: '',
      primaryColor: undefined,
      secondaryColor: undefined
    };
  };

  const getCardTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      credit: "Cartão de Crédito",
      debit: "Cartão de Débito", 
      food: "Vale Alimentação",
      meal: "Vale Refeição",
      transportation: "Vale Transporte"
    };
    return types[type] || type;
  };

  const usagePercentage = card.type === "credit" ? (card.used_amount / card.credit_limit) * 100 : 0;
  const availableAmount = card.type === "credit" ? card.credit_limit - card.used_amount : 0;

  const getUsageStatus = () => {
    if (usagePercentage >= 90) {
      return {
        variant: "destructive" as const,
        icon: AlertTriangle,
        message: "Limite crítico",
        description: "Você está próximo do limite"
      };
    } else if (usagePercentage >= 75) {
      return {
        variant: "default" as const,
        icon: AlertTriangle,
        message: "Atenção ao limite",
        description: "Controle seus gastos"
      };
    } else {
      return {
        variant: "default" as const,
        icon: CheckCircle,
        message: "Limite sob controle",
        description: "Uso adequado"
      };
    }
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, card.due_day);
    
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, card.due_day);
    }
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDaysUntilClosing = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let closingDate = new Date(currentYear, currentMonth, card.closing_day);
    
    if (closingDate < today) {
      closingDate = new Date(currentYear, currentMonth + 1, card.closing_day);
    }
    
    const diffTime = closingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const usageStatus = getUsageStatus();
  const daysUntilDue = getDaysUntilDue();
  const daysUntilClosing = getDaysUntilClosing();
  const StatusIcon = usageStatus.icon;
  const bankInfo = getBankInfo(card.bank);

  return (
    <div className="space-y-3">
      {/* Card Visual */}
      <Card style={{ borderColor: card.color, borderWidth: 2 }}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: card.color }}
            >
              {bankInfo.logoPath ? (
                <BankLogo 
                  logoPath={bankInfo.logoPath} 
                  bankName={bankInfo.name}
                  size="sm"
                  className="text-white"
                />
              ) : (
                <CreditCard className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate">{card.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {bankInfo.shortName} •••• {card.last_four_digits}
              </p>
              <Badge variant="outline" className="mt-1 text-xs px-1.5 py-0">
                {getCardTypeLabel(card.type)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Alert for Credit Cards */}
      {card.type === "credit" && usagePercentage >= 50 && (
        <Alert variant={usageStatus.variant} className="py-2.5">
          <StatusIcon className="h-3.5 w-3.5" />
          <AlertDescription>
            <div className="space-y-0.5">
              <p className="text-xs font-medium">{usageStatus.message}</p>
              <p className="text-xs">{usageStatus.description}</p>
              <p className="text-xs">
                Usado {usagePercentage.toFixed(1)}%. 
                Disponível: {formatCurrency(availableAmount)}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      {card.type === "credit" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Limite Total</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-base font-bold text-primary">
                  {formatCurrency(card.credit_limit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Valor Usado</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-base font-bold text-destructive">
                  {formatCurrency(card.used_amount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usagePercentage.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Disponível</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-base font-bold text-green-600">
                  {formatCurrency(availableAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(100 - usagePercentage).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">Vencimento</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-base font-bold">
                  {daysUntilDue} dias
                </div>
                <p className="text-xs text-muted-foreground">
                  Dia {card.due_day}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Credit Card Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Uso do Limite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <p className="text-muted-foreground">Usado</p>
                  <p className="font-medium text-destructive">{formatCurrency(card.used_amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Disponível</p>
                  <p className="font-medium text-green-600">{formatCurrency(availableAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Datas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-medium">Fechamento</p>
                    <p className="text-xs text-muted-foreground">Dia {card.closing_day}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {daysUntilClosing} dias
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-medium">Vencimento</p>
                    <p className="text-xs text-muted-foreground">Dia {card.due_day}</p>
                  </div>
                  <Badge variant={daysUntilDue <= 7 ? "destructive" : "outline"} className="text-xs">
                    {daysUntilDue} dias
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {getCardTypeLabel(card.type)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Este é um cartão de {card.type}. Use para registrar transações específicas deste tipo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};