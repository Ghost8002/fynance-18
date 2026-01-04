import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { calculateFinancialIndependence, formatCurrency, formatPercent } from '@/utils/investmentCalculations';
import { Target, Calendar, Wallet } from 'lucide-react';

export function FinancialIndependenceCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = useState(5000);
  const [currentPatrimony, setCurrentPatrimony] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(2000);
  const [annualRate, setAnnualRate] = useState(10);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(4);

  const result = useMemo(() => {
    return calculateFinancialIndependence(
      monthlyExpenses,
      currentPatrimony,
      monthlyContribution,
      annualRate,
      safeWithdrawalRate
    );
  }, [monthlyExpenses, currentPatrimony, monthlyContribution, annualRate, safeWithdrawalRate]);

  const progressPercent = Math.min(100, (currentPatrimony / result.requiredPatrimony) * 100);
  const isGoalReached = result.monthsToGoal === 0;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Independência Financeira</CardTitle>
        </div>
        <CardDescription>
          Descubra quanto você precisa acumular para viver de renda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Gastos Mensais Desejados</Label>
                <span className="text-sm font-medium">{formatCurrency(monthlyExpenses)}</span>
              </div>
              <Input
                type="number"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mb-2"
              />
              <Slider
                value={[monthlyExpenses]}
                onValueChange={([v]) => setMonthlyExpenses(v)}
                max={50000}
                step={500}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Patrimônio Atual</Label>
                <span className="text-sm font-medium">{formatCurrency(currentPatrimony)}</span>
              </div>
              <Input
                type="number"
                value={currentPatrimony}
                onChange={(e) => setCurrentPatrimony(Math.max(0, parseFloat(e.target.value) || 0))}
                className="mb-2"
              />
              <Slider
                value={[currentPatrimony]}
                onValueChange={([v]) => setCurrentPatrimony(v)}
                max={5000000}
                step={10000}
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
                max={30000}
                step={500}
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
                max={20}
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Taxa de Retirada Segura</Label>
                <span className="text-sm font-medium">{formatPercent(safeWithdrawalRate)}</span>
              </div>
              <Slider
                value={[safeWithdrawalRate]}
                onValueChange={([v]) => setSafeWithdrawalRate(v)}
                min={2}
                max={6}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">
                A regra dos 4% é considerada segura para aposentadoria de longo prazo
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-primary" />
                <p className="text-sm text-muted-foreground">Patrimônio Necessário</p>
              </div>
              <p className="text-2xl font-bold text-primary">{formatCurrency(result.requiredPatrimony)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Para retirar {formatCurrency(monthlyExpenses)}/mês
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progressPercent.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(currentPatrimony)} de {formatCurrency(result.requiredPatrimony)}
              </p>
            </div>

            {isGoalReached ? (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <p className="font-semibold text-green-500">Meta Alcançada! 🎉</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Você já tem patrimônio suficiente para sua independência financeira!
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tempo até a meta</p>
                </div>
                <p className="text-2xl font-bold">
                  {result.yearsToGoal > 0 ? (
                    <>
                      {Math.floor(result.yearsToGoal)} anos
                      {result.yearsToGoal % 1 > 0 && (
                        <span className="text-lg font-normal text-muted-foreground">
                          {' '}e {Math.round((result.yearsToGoal % 1) * 12)} meses
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Calcule com valores válidos</span>
                  )}
                </p>
                {result.yearsToGoal >= 100 && (
                  <p className="text-xs text-destructive mt-1">
                    Considere aumentar seus aportes ou reduzir gastos
                  </p>
                )}
              </div>
            )}

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 <strong>Dica:</strong> Aumentar seus aportes mensais é geralmente mais efetivo do que buscar rentabilidades maiores
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
