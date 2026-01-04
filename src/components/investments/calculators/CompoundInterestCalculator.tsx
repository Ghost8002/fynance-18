import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { calculateCompoundInterest, formatCurrency, formatPercent } from '@/utils/investmentCalculations';
import { Calculator, TrendingUp } from 'lucide-react';

export function CompoundInterestCalculator() {
  const [initialCapital, setInitialCapital] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualRate, setAnnualRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(() => {
    return calculateCompoundInterest(initialCapital, monthlyContribution, annualRate, years * 12);
  }, [initialCapital, monthlyContribution, annualRate, years]);

  // Sample data points for chart (every 12 months)
  const chartData = result.monthlyData.filter((_, i) => i % 12 === 11 || i === 0);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de Juros Compostos</CardTitle>
        </div>
        <CardDescription>
          Simule quanto seu dinheiro pode crescer ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Capital Inicial</Label>
                <span className="text-sm font-medium">{formatCurrency(initialCapital)}</span>
              </div>
              <Input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mb-2"
              />
              <Slider
                value={[initialCapital]}
                onValueChange={([v]) => setInitialCapital(v)}
                max={500000}
                step={1000}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Aporte Mensal</Label>
                <span className="text-sm font-medium">{formatCurrency(monthlyContribution)}</span>
              </div>
              <Input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mb-2"
              />
              <Slider
                value={[monthlyContribution]}
                onValueChange={([v]) => setMonthlyContribution(v)}
                max={20000}
                step={100}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Taxa Anual</Label>
                <span className="text-sm font-medium">{formatPercent(annualRate)}</span>
              </div>
              <Slider
                value={[annualRate]}
                onValueChange={([v]) => setAnnualRate(v)}
                max={30}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Período</Label>
                <span className="text-sm font-medium">{years} anos</span>
              </div>
              <Slider
                value={[years]}
                onValueChange={([v]) => setYears(v)}
                min={1}
                max={40}
                step={1}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Valor Final</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(result.finalAmount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Investido</p>
                  <p className="font-semibold">{formatCurrency(result.totalInvested)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <p className="text-xs text-muted-foreground">Total em Juros</p>
                  <p className="font-semibold text-green-500">{formatCurrency(result.totalInterest)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="month" 
                tickFormatter={(v) => `${Math.floor(v/12)}a`}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                className="text-xs"
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'balance' ? 'Saldo Total' : 'Investido'
                ]}
                labelFormatter={(v) => `Ano ${Math.floor(v/12)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="invested" 
                stackId="1"
                stroke="hsl(var(--muted-foreground))" 
                fill="hsl(var(--muted))" 
                name="Investido"
              />
              <Area 
                type="monotone" 
                dataKey="interest" 
                stackId="1"
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary) / 0.3)" 
                name="Juros"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
