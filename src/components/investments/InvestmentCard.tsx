import { TrendingUp, TrendingDown, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Investment, INVESTMENT_TYPE_LABELS, INVESTMENT_TYPE_COLORS } from '@/types/investments';
import { formatCurrency, formatPercent } from '@/utils/investmentCalculations';
import { cn } from '@/lib/utils';

interface InvestmentCardProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
  onAddTransaction: (investment: Investment) => void;
}

export function InvestmentCard({ investment, onEdit, onDelete, onAddTransaction }: InvestmentCardProps) {
  const totalInvested = investment.quantity * investment.average_price;
  const currentValue = investment.quantity * investment.current_price;
  const profit = currentValue - totalInvested;
  const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
  const isPositive = profit >= 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{investment.name}</h3>
              {investment.ticker && (
                <Badge variant="outline" className="text-xs">
                  {investment.ticker}
                </Badge>
              )}
            </div>
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{ 
                backgroundColor: `${INVESTMENT_TYPE_COLORS[investment.type]}20`,
                color: INVESTMENT_TYPE_COLORS[investment.type]
              }}
            >
              {INVESTMENT_TYPE_LABELS[investment.type]}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddTransaction(investment)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Aporte
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(investment)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(investment.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Quantidade</p>
            <p className="font-medium">{investment.quantity.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Preço Médio</p>
            <p className="font-medium">{formatCurrency(investment.average_price)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Preço Atual</p>
            <p className="font-medium">{formatCurrency(investment.current_price)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="font-medium">{formatCurrency(currentValue)}</p>
          </div>
        </div>

        <div className={cn(
          'flex items-center justify-between p-2 rounded-lg',
          isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
        )}>
          <span className="text-sm text-muted-foreground">Rentabilidade</span>
          <div className={cn('flex items-center gap-1', isPositive ? 'text-green-500' : 'text-red-500')}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="font-semibold">
              {isPositive ? '+' : ''}{formatCurrency(profit)} ({formatPercent(profitPercent)})
            </span>
          </div>
        </div>

        {investment.institution && (
          <p className="text-xs text-muted-foreground mt-2">
            {investment.institution}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
