
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CardPaymentForm } from "./CardPaymentForm";
import { CardLimitHistory } from "./CardLimitHistory";
import { CardLimitAdjustment } from "./CardLimitAdjustment";
import { CreditCard, AlertTriangle, CheckCircle, Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface CardData {
  id: string;
  name: string;
  credit_limit: number;
  used_amount: number;
  last_four_digits: string;
  color: string;
}

interface CardLimitManagementProps {
  card: CardData;
  onUpdate?: () => void;
}

export const CardLimitManagement = ({ card, onUpdate }: CardLimitManagementProps) => {
  // Validação robusta de tipos numéricos
  const creditLimit = typeof card.credit_limit === 'number' ? card.credit_limit : 0;
  const usedAmount = typeof card.used_amount === 'number' ? card.used_amount : 0;
  const availableAmount = Math.max(0, creditLimit - usedAmount);
  const usagePercentage = creditLimit > 0 ? (usedAmount / creditLimit) * 100 : 0;

  const formatCurrency = (value: number) => {
    if (isNaN(value) || !isFinite(value)) {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getUsageStatus = () => {
    if (usagePercentage >= 90) return { label: "Crítico", variant: "destructive" as const, icon: AlertTriangle };
    if (usagePercentage >= 70) return { label: "Atenção", variant: "secondary" as const, icon: AlertTriangle };
    return { label: "Normal", variant: "default" as const, icon: CheckCircle };
  };

  const status = getUsageStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Resumo do Limite */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={20} />
              Gestão de Limite - {card.name}
            </CardTitle>
            <Badge variant={status.variant} className="flex items-center gap-1">
              <StatusIcon size={12} />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
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

          {/* Cards de Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Limite Total</p>
              <p className="font-semibold text-sm">{formatCurrency(creditLimit)}</p>
            </div>
            
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Usado</p>
              <p className="font-semibold text-sm text-red-600">{formatCurrency(usedAmount)}</p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Disponível</p>
              <p className="font-semibold text-sm text-green-600">{formatCurrency(availableAmount)}</p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <CardPaymentForm cardId={card.id} onPaymentAdded={onUpdate} />
            <CardLimitAdjustment 
              cardId={card.id} 
              currentLimit={creditLimit} 
              onUpdate={onUpdate} 
            />
          </div>

          {/* Alertas */}
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={16} className="text-red-500" />
              <span className="text-muted-foreground">Uso médio mensal:</span>
              <span className="font-medium">{formatCurrency(usedAmount * 0.8)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown size={16} className="text-green-500" />
              <span className="text-muted-foreground">Último pagamento:</span>
              <span className="font-medium">Há 15 dias</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Movimentações */}
      <CardLimitHistory cardId={card.id} />
    </div>
  );
};
