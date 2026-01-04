import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/utils/investmentCalculations';
import { cn } from '@/lib/utils';

interface InvestmentSummaryProps {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfit: number;
  totalProfitPercent: number;
}

export function InvestmentSummary({
  totalInvested,
  totalCurrentValue,
  totalProfit,
  totalProfitPercent
}: InvestmentSummaryProps) {
  const isPositive = totalProfit >= 0;

  const cards = [
    {
      title: 'Total Investido',
      value: formatCurrency(totalInvested),
      icon: PiggyBank,
      color: 'text-primary'
    },
    {
      title: 'Valor Atual',
      value: formatCurrency(totalCurrentValue),
      icon: Wallet,
      color: 'text-primary'
    },
    {
      title: 'Rentabilidade',
      value: formatCurrency(Math.abs(totalProfit)),
      subtitle: formatPercent(Math.abs(totalProfitPercent)),
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-500' : 'text-red-500',
      prefix: isPositive ? '+' : '-'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={cn('text-xl font-bold', card.color)}>
                  {card.prefix && <span>{card.prefix}</span>}
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className={cn('text-sm', card.color)}>
                    {card.prefix}{card.subtitle}
                  </p>
                )}
              </div>
              <div className={cn('p-3 rounded-full bg-muted/50', card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
