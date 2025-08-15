import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, AlertTriangle, CheckCircle, Settings } from "lucide-react";

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

interface CardLimitManagementProps {
  card: CardData;
  onUpdate?: () => void;
}

export const CardLimitManagement = ({ card, onUpdate }: CardLimitManagementProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (card.type !== "credit") {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Gerenciamento de Limite</h3>
            <p className="text-muted-foreground">
              Esta funcionalidade está disponível apenas para cartões de crédito.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (card.used_amount / card.credit_limit) * 100;
  const availableAmount = card.credit_limit - card.used_amount;

  const getUsageStatus = () => {
    if (usagePercentage >= 90) {
      return {
        variant: "destructive" as const,
        icon: AlertTriangle,
        label: "Crítico",
        message: "Limite quase esgotado",
        description: "Considere fazer um pagamento ou aumentar o limite"
      };
    } else if (usagePercentage >= 75) {
      return {
        variant: "default" as const,
        icon: AlertTriangle,
        label: "Atenção",
        message: "Uso elevado do limite",
        description: "Monitore seus gastos para não ultrapassar o limite"
      };
    } else {
      return {
        variant: "default" as const,
        icon: CheckCircle,
        label: "Normal",
        message: "Limite sob controle",
        description: "Uso dentro do recomendado"
      };
    }
  };

  const usageStatus = getUsageStatus();
  const StatusIcon = usageStatus.icon;

  return (
    <div className="space-y-6">
      {/* Status do Limite */}
      <Card style={{ borderColor: card.color, borderWidth: 2 }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Gerenciamento de Limite
            </CardTitle>
            <Badge variant={usageStatus.variant === "destructive" ? "destructive" : "outline"}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {usageStatus.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Uso do Limite</span>
              <span className="text-sm font-bold">{usagePercentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>R$ 0</span>
              <span>{formatCurrency(card.credit_limit)}</span>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Limite Total</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(card.credit_limit)}</p>
            </div>
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor Usado</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(card.used_amount)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Disponível</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(availableAmount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert de Status */}
      {usagePercentage >= 75 && (
        <Alert variant={usageStatus.variant}>
          <StatusIcon className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">{usageStatus.message}</p>
              <p className="text-sm">{usageStatus.description}</p>
              <div className="mt-2 text-sm">
                <p>• Valor usado: {formatCurrency(card.used_amount)} ({usagePercentage.toFixed(1)}%)</p>
                <p>• Valor disponível: {formatCurrency(availableAmount)}</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Análise Detalhada */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Percentual usado:</span>
                <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Percentual disponível:</span>
                <span className="font-medium">{(100 - usagePercentage).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status do limite:</span>
                <Badge variant={usageStatus.variant === "destructive" ? "destructive" : "outline"}>
                  {usageStatus.label}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Recomendações:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {usagePercentage >= 90 && (
                  <>
                    <li>• Faça um pagamento imediatamente</li>
                    <li>• Evite novas compras até reduzir o uso</li>
                    <li>• Considere solicitar aumento de limite</li>
                  </>
                )}
                {usagePercentage >= 75 && usagePercentage < 90 && (
                  <>
                    <li>• Monitore seus gastos com atenção</li>
                    <li>• Planeje um pagamento antecipado</li>
                    <li>• Evite compras desnecessárias</li>
                  </>
                )}
                {usagePercentage < 75 && (
                  <>
                    <li>• Limite está sendo usado adequadamente</li>
                    <li>• Continue monitorando os gastos</li>
                    <li>• Mantenha o controle financeiro</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações do Cartão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Nome do cartão:</span>
                <span className="font-medium">{card.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Banco emissor:</span>
                <span className="font-medium">{card.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Final do cartão:</span>
                <span className="font-medium">•••• {card.last_four_digits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Dia de fechamento:</span>
                <span className="font-medium">Dia {card.closing_day}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Dia de vencimento:</span>
                <span className="font-medium">Dia {card.due_day}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Próximas datas importantes:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Fechamento: Dia {card.closing_day} de cada mês</p>
                <p>• Vencimento: Dia {card.due_day} de cada mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};