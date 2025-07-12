
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface CardLimitAlertProps {
  creditLimit: number;
  usedAmount: number;
  cardName: string;
}

export const CardLimitAlert = ({ creditLimit, usedAmount, cardName }: CardLimitAlertProps) => {
  const percentUsed = (usedAmount / creditLimit) * 100;
  const availableLimit = creditLimit - usedAmount;

  const getAlertConfig = () => {
    if (percentUsed >= 90) {
      return {
        variant: "destructive" as const,
        icon: XCircle,
        message: `Limite do cartão ${cardName} quase esgotado!`,
        description: `Você já utilizou ${percentUsed.toFixed(0)}% do seu limite. Disponível: R$ ${availableLimit.toFixed(2)}`
      };
    } else if (percentUsed >= 75) {
      return {
        variant: "default" as const,
        icon: AlertTriangle,
        message: `Atenção ao limite do cartão ${cardName}`,
        description: `Você já utilizou ${percentUsed.toFixed(0)}% do seu limite. Disponível: R$ ${availableLimit.toFixed(2)}`
      };
    } else {
      return {
        variant: "default" as const,
        icon: CheckCircle,
        message: `Limite do cartão ${cardName} sob controle`,
        description: `Você utilizou ${percentUsed.toFixed(0)}% do seu limite. Disponível: R$ ${availableLimit.toFixed(2)}`
      };
    }
  };

  const config = getAlertConfig();
  const Icon = config.icon;

  if (percentUsed < 50) return null; // Só mostra alertas quando usar mais de 50%

  return (
    <Alert variant={config.variant} className="mb-4">
      <Icon className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">{config.message}</p>
          <p className="text-sm">{config.description}</p>
          <Progress 
            value={percentUsed} 
            className={`h-2 ${percentUsed >= 90 ? 'bg-red-100' : percentUsed >= 75 ? 'bg-yellow-100' : 'bg-green-100'}`}
          />
        </div>
      </AlertDescription>
    </Alert>
  );
};
