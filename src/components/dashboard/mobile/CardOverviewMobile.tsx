import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const toNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const CardOverviewMobile = () => {
  const { user } = useSupabaseAuth();
  const { data: cards, loading } = useSupabaseData('cards', user?.id);

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Cartões</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const totalLimit = cards.reduce((sum, card) => sum + toNumber(card.credit_limit), 0);
  const totalUsed = cards.reduce((sum, card) => sum + toNumber(card.used_amount), 0);
  const totalAvailable = totalLimit - totalUsed;
  const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  if (cards.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Cartões</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum cartão cadastrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Cartões</CardTitle>
        <CreditCard className="h-3.5 w-3.5 text-primary" />
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">Limite</p>
            <p className="text-xs font-semibold text-foreground">
              {formatCurrency(totalLimit)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Disponível</p>
            <p className="text-xs font-semibold text-green-600">
              {formatCurrency(totalAvailable)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Utilizado</p>
            <p className="text-xs font-semibold text-red-600">
              {formatCurrency(totalUsed)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">% Uso</p>
            <p className={`text-xs font-semibold ${usagePercentage > 80 ? 'text-red-600' : 'text-blue-600'}`}>
              {usagePercentage.toFixed(0)}%
            </p>
          </div>
        </div>
        
        <div className="space-y-1.5 pt-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            {cards.length} cartão{cards.length !== 1 ? 'es' : ''}
          </p>
          {cards.slice(0, 2).map((card) => (
            <div key={card.id} className="flex justify-between items-center p-1.5 bg-muted/50 rounded text-xs">
              <span className="font-medium truncate">{card.name}</span>
              <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                {formatCurrency(toNumber(card.used_amount))}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CardOverviewMobile;
