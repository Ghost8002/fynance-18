import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { calculateInvestmentComparison, formatCurrency, formatPercent } from '@/utils/investmentCalculations';
import { GitCompare, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#6B7280', '#3B82F6', '#10B981', '#8B5CF6'];

export function InvestmentComparisonCalculator() {
  const [initialAmount, setInitialAmount] = useState(10000);
  const [months, setMonths] = useState(24);
  const [cdiRate, setCdiRate] = useState(13.65);

  const results = useMemo(() => {
    return calculateInvestmentComparison(initialAmount, months, cdiRate);
  }, [initialAmount, months, cdiRate]);

  const chartData = results.map((r, i) => ({
    name: r.name,
    valor: r.netReturn,
    color: CHART_COLORS[i]
  }));

  const bestOption = results.reduce((best, current) => 
    current.netReturn > best.netReturn ? current : best
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Comparador de Investimentos</CardTitle>
        </div>
        <CardDescription>
          Compare o rendimento líquido entre diferentes opções de renda fixa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Valor Inicial</Label>
              <span className="text-sm font-medium">{formatCurrency(initialAmount)}</span>
            </div>
            <Input
              type="number"
              value={initialAmount}
              onChange={(e) => setInitialAmount(Math.max(100, parseFloat(e.target.value) || 0))}
              className="mb-2"
            />
            <Slider
              value={[initialAmount]}
              onValueChange={([v]) => setInitialAmount(v)}
              min={100}
              max={500000}
              step={1000}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Prazo</Label>
              <span className="text-sm font-medium">{months} meses</span>
            </div>
            <Slider
              value={[months]}
              onValueChange={([v]) => setMonths(v)}
              min={1}
              max={60}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              IR: {months <= 6 ? '22.5%' : months <= 12 ? '20%' : months <= 24 ? '17.5%' : '15%'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Taxa CDI (a.a.)</Label>
              <span className="text-sm font-medium">{formatPercent(cdiRate)}</span>
            </div>
            <Slider
              value={[cdiRate]}
              onValueChange={([v]) => setCdiRate(v)}
              min={5}
              max={20}
              step={0.25}
            />
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
              <XAxis 
                type="number" 
                tickFormatter={(v) => `R$ ${(v/1000).toFixed(1)}k`}
                className="text-xs"
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                className="text-xs"
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Valor Líquido']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {results.map((result, index) => (
            <div 
              key={result.name}
              className={cn(
                "p-3 rounded-lg border",
                result.name === bestOption.name 
                  ? "bg-green-500/10 border-green-500/30" 
                  : "bg-muted/30 border-border/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: CHART_COLORS[index] }}
                />
                <p className="text-xs font-medium truncate">{result.name}</p>
              </div>
              <p className="font-semibold text-sm">{formatCurrency(result.netReturn)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">+{formatPercent(result.effectiveRate)}</span>
              </div>
              {result.irAmount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  IR: {formatCurrency(result.irAmount)}
                </p>
              )}
              {result.name === bestOption.name && (
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded">
                  Melhor opção
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ <strong>Aviso:</strong> Simulação baseada em taxas atuais. Rendimentos passados não garantem retornos futuros.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
