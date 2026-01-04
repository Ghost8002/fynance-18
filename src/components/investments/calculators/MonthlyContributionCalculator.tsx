import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { calculateMonthlyContribution, formatCurrency, formatPercent } from '@/utils/investmentCalculations';
import { PiggyBank, Target, Calendar, TrendingUp } from 'lucide-react';

export function MonthlyContributionCalculator() {
  const [targetAmount, setTargetAmount] = useState(100000);
  const [currentAmount, setCurrentAmount] = useState(10000);
  const [years, setYears] = useState(5);
  const [annualRate, setAnnualRate] = useState(12);

  const result = useMemo(() => {
    return calculateMonthlyContribution(targetAmount, currentAmount, years * 12, annualRate);
  }, [targetAmount, currentAmount, years, annualRate]);

  const contributionWithoutInterest = (targetAmount - currentAmount) / (years * 12);
  const savings = contributionWithoutInterest - result.monthlyContribution;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de Aporte Ideal</CardTitle>
        </div>
        <CardDescription>
          Descubra quanto você precisa investir por mês para alcançar sua meta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Meta de Patrimônio</Label>
                <span className="text-sm font-medium">{formatCurrency(targetAmount)}</span>
              </div>
              <Input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mb-2"
              />
              <Slider
                value={[targetAmount]}
                onValueChange={([v]) => setTargetAmount(v)}
                min={1000}
                max={5000000}
                step={10000}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Patrimônio Atual</Label>
                <span className="text-sm font-medium">{formatCurrency(currentAmount)}</span>
              </div>
              <Input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mb-2"
              />
              <Slider
                value={[currentAmount]}
                onValueChange={([v]) => setCurrentAmount(v)}
                max={targetAmount}
                step={1000}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Prazo</Label>
                <span className="text-sm font-medium">{years} anos ({years * 12} meses)</span>
              </div>
              <Slider
                value={[years]}
                onValueChange={([v]) => setYears(v)}
                min={1}
                max={30}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Rentabilidade Anual</Label>
                <span className="text-sm font-medium">{formatPercent(annualRate)}</span>
              </div>
              <Slider
                value={[annualRate]}
                onValueChange={([v]) => setAnnualRate(v)}
                min={1}
                max={25}
                step={0.5}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Aporte Mensal Necessário</p>
              </div>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(result.monthlyContribution)}
              </p>
              {result.monthlyContribution === 0 && currentAmount >= targetAmount && (
                <p className="text-sm text-green-500 mt-1">
                  Você já atingiu sua meta! 🎉
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total a Investir</p>
                </div>
                <p className="font-semibold">{formatCurrency(result.totalInvested)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <p className="text-xs text-muted-foreground">Ganho em Juros</p>
                </div>
                <p className="font-semibold text-green-500">{formatCurrency(result.totalInterest)}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Valor Final</p>
              </div>
              <p className="font-semibold">{formatCurrency(result.finalAmount)}</p>
            </div>

            {savings > 0 && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 <strong>Economia com juros compostos:</strong> Você economiza{' '}
                  {formatCurrency(savings)}/mês comparado a guardar sem rendimento!
                </p>
              </div>
            )}

            {result.monthlyContribution > 0 && (
              <div className="text-xs text-muted-foreground">
                <p>
                  Sem rendimento, você precisaria de{' '}
                  <strong>{formatCurrency(contributionWithoutInterest)}/mês</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
