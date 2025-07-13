
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Building2 } from 'lucide-react';

interface AssetStatsProps {
  totalValue: number;
  totalGainLoss: number;
  assetsCount: number;
}

export const AssetStats = ({ totalValue, totalGainLoss, assetsCount }: AssetStatsProps) => {
  const isPositive = totalGainLoss >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-finance-primary/5 to-finance-primary/10 border-finance-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-finance-text-secondary">
            Valor Total do Patrimônio
          </CardTitle>
          <Building2 className="h-4 w-4 text-finance-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-finance-text-primary">
            R$ {totalValue.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-finance-text-tertiary mt-1">
            Valor atual de mercado
          </p>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${isPositive ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-finance-text-secondary">
            Valorização/Desvalorização
          </CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {isPositive ? '+' : ''}R$ {totalGainLoss.toLocaleString('pt-BR')}
          </div>
          <Badge 
            variant={isPositive ? "default" : "destructive"}
            className="mt-2"
          >
            {isPositive ? 'Valorização' : 'Desvalorização'}
          </Badge>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-finance-secondary/5 to-finance-secondary/10 border-finance-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-finance-text-secondary">
            Total de Bens
          </CardTitle>
          <div className="h-4 w-4 rounded-full bg-finance-secondary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-finance-secondary">{assetsCount}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-finance-text-primary">
            {assetsCount}
          </div>
          <p className="text-xs text-finance-text-tertiary mt-1">
            Itens cadastrados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
