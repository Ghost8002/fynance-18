import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { INVESTMENT_TYPE_LABELS, INVESTMENT_TYPE_COLORS, InvestmentType } from '@/types/investments';
import { formatCurrency } from '@/utils/investmentCalculations';

interface PortfolioDistributionChartProps {
  investmentsByType: Record<string, number>;
}

export function PortfolioDistributionChart({ investmentsByType }: PortfolioDistributionChartProps) {
  const data = Object.entries(investmentsByType)
    .filter(([_, value]) => value > 0)
    .map(([type, value]) => ({
      name: INVESTMENT_TYPE_LABELS[type as InvestmentType] || type,
      value,
      color: INVESTMENT_TYPE_COLORS[type as InvestmentType] || '#6B7280'
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Distribuição da Carteira</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhum investimento cadastrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Distribuição da Carteira</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Valor']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend 
              formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">Total da Carteira</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
