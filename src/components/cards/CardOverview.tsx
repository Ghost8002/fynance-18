import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { 
  formatCurrency, 
  parseCardData, 
  calculateDaysUntilDue, 
  getUsageStatus, 
  getDueDateStatus 
} from "@/utils/cardUtils";

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
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Usar função centralizada para parse dos dados
  const { creditLimit, usedAmount, availableAmount, usagePercentage } = parseCardData(card);

  // Usar funções centralizadas para status
  const status = getUsageStatus(usagePercentage);
  const StatusIcon = status.icon === "AlertTriangle" ? AlertTriangle : CheckCircle;

  // Calculate days until due date using utility function
  const daysUntilDue = calculateDaysUntilDue(card.due_day);
  const dueDateStatus = getDueDateStatus(daysUntilDue);

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
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Próximo Vencimento</p>
              <p className="font-semibold text-sm">Dia {card.due_day}</p>
            </div>
            <Badge variant={dueDateStatus.variant}>
              {dueDateStatus.label}
            </Badge>
          </div>
        </div>

        {/* Alerts */}
        {usagePercentage >= 80 && (
          <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={14} />
              <p className="text-xs font-medium">
                {usagePercentage >= 90 
                  ? "Limite quase esgotado! Considere fazer um pagamento."
                  : "Você está se aproximando do limite do cartão."
                }
              </p>
            </div>
          </div>
        )}

        {daysUntilDue <= 3 && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle size={14} />
              <p className="text-xs font-medium">
                {daysUntilDue === 0 
                  ? "Fatura vence hoje!"
                  : `Fatura vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}!`
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};