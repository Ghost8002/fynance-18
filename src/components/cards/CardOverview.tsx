import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

interface CardData {
  id: string;
  name: string;
  credit_limit: number;
  used_amount: number;
  last_four_digits: string;
  color: string;
  due_day: number;
  closing_day: number;
}

interface CardOverviewProps {
  card: CardData;
}

export const CardOverview = ({ card }: CardOverviewProps) => {
  const creditLimit = parseFloat(card.credit_limit.toString());
  const usedAmount = parseFloat(card.used_amount?.toString() || '0');
  const availableAmount = creditLimit - usedAmount;
  const usagePercentage = (usedAmount / creditLimit) * 100;

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Helper function to get usage status
  const getUsageStatus = () => {
    if (usagePercentage >= 90) return { label: "Limite Crítico", variant: "destructive" as const, icon: AlertTriangle };
    if (usagePercentage >= 70) return { label: "Atenção", variant: "secondary" as const, icon: AlertTriangle };
    return { label: "Normal", variant: "default" as const, icon: CheckCircle };
  };

  const status = getUsageStatus();
  const StatusIcon = status.icon;

  // Calculate days until due date
  const today = new Date();
  const currentDay = today.getDate();
  const daysUntilDue = card.due_day > currentDay 
    ? card.due_day - currentDay 
    : (new Date(today.getFullYear(), today.getMonth() + 1, card.due_day).getDate() - currentDay);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard size={20} />
            {card.name}
          </CardTitle>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon size={12} />
            {status.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          •••• •••• •••• {card.last_four_digits}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Limit Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Limite Utilizado</span>
            <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={usagePercentage} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(usedAmount)} usado</span>
            <span>{formatCurrency(availableAmount)} disponível</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Limite Total</p>
            <p className="font-semibold text-sm">{formatCurrency(creditLimit)}</p>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Disponível</p>
            <p className="font-semibold text-sm text-green-600">{formatCurrency(availableAmount)}</p>
          </div>
        </div>

        {/* Due Date Info */}
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Próximo Vencimento</p>
              <p className="font-medium text-sm">Dia {card.due_day}</p>
            </div>
            <Badge variant={daysUntilDue <= 5 ? "destructive" : "outline"}>
              {daysUntilDue} dias
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fechamento: Dia {card.closing_day}
          </p>
        </div>

        {/* Alerts */}
        {usagePercentage >= 80 && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={14} />
              <p className="text-xs font-medium">
                {usagePercentage >= 90 
                  ? "Limite quase esgotado! Cuidado com novas compras."
                  : "Você está se aproximando do limite do cartão."
                }
              </p>
            </div>
          </div>
        )}

        {daysUntilDue <= 5 && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={14} />
              <p className="text-xs font-medium">
                Fatura vence em {daysUntilDue} dias!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};