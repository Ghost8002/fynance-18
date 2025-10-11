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

interface CardOverviewProps {
  card: CardData;
}

export const CardOverview = ({ card }: CardOverviewProps) => {
  const { customBanks } = useCustomBanks();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getBankInfo = (bankId: string) => {
    // Verificar se é um banco customizado
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
    
    // Buscar banco padrão
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
    
    // Fallback se não encontrar
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
        description: "Você está próximo do limite do cartão"
      };
    } else if (usagePercentage >= 75) {
      return {
        variant: "default" as const,
        icon: AlertTriangle,
        message: "Atenção ao limite",
        description: "Considere controlar os gastos"
      };
    } else {
      return {
        variant: "default" as const,
        icon: CheckCircle,
        message: "Limite sob controle",
        description: "Uso dentro do recomendado"
      };
    }
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDate = new Date(currentYear, currentMonth, card.due_day);
    
    // Se a data de vencimento já passou este mês, calcular para o próximo mês
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
    
    // Se a data de fechamento já passou este mês, calcular para o próximo mês
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
    <div className="space-y-6">
      {/* Card Visual */}
      <Card style={{ borderColor: card.color, borderWidth: 2 }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: card.color }}
            >
              {bankInfo.logoPath ? (
                <BankLogo 
                  logoPath={bankInfo.logoPath} 
                  bankName={bankInfo.name}
                  size="md"
                  className="text-white"
                />
              ) : (
                <CreditCard className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{card.name}</h3>
              <p className="text-muted-foreground">
                {bankInfo.shortName} •••• {card.last_four_digits}
              </p>
              <Badge variant="outline" className="mt-1">
                {getCardTypeLabel(card.type)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Alert for Credit Cards */}
      {card.type === "credit" && usagePercentage >= 50 && (
        <Alert variant={usageStatus.variant}>
          <StatusIcon className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">{usageStatus.message}</p>
              <p className="text-sm">{usageStatus.description}</p>
              <p className="text-sm">
                Você utilizou {usagePercentage.toFixed(1)}% do seu limite. 
                Disponível: {formatCurrency(availableAmount)}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {card.type === "credit" && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Limite Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(card.credit_limit)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Valor Usado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(card.used_amount)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {usagePercentage.toFixed(1)}% do limite
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Disponível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(availableAmount)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {(100 - usagePercentage).toFixed(1)}% disponível
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Próximo Vencimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {daysUntilDue} dias
                </div>
                <p className="text-sm text-muted-foreground">
                  Dia {card.due_day}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {card.type !== "credit" && (
          <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {getCardTypeLabel(card.type)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Este é um cartão de {card.type}. Use para registrar transações específicas deste tipo.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Credit Card Details */}
      {card.type === "credit" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Uso do Limite
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso do uso</span>
                  <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={usagePercentage} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Datas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Fechamento da Fatura</p>
                    <p className="text-xs text-muted-foreground">Dia {card.closing_day} de cada mês</p>
                  </div>
                  <Badge variant="outline">
                    {daysUntilClosing} dias
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">Vencimento da Fatura</p>
                    <p className="text-xs text-muted-foreground">Dia {card.due_day} de cada mês</p>
                  </div>
                  <Badge variant={daysUntilDue <= 7 ? "destructive" : "outline"}>
                    {daysUntilDue} dias
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};