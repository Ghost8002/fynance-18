import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Eye, EyeOff, Calculator } from "lucide-react";
import { formatFinancialPeriod } from "@/utils/financialPeriod";
import { calculatePeriodSummary, validateFinancialData } from "@/utils/financialCalculations";
interface FinancialDebugPanelProps {
  transactions: any[];
  accounts: any[];
  currentPeriod: {
    startDate: Date;
    endDate: Date;
  };
  selectedPeriod: string;
}
export const FinancialDebugPanel = ({
  transactions,
  accounts,
  currentPeriod,
  selectedPeriod
}: FinancialDebugPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  if (!isVisible) {
    return;
  }
  const validation = validateFinancialData(transactions || [], accounts || []);
  const summary = calculatePeriodSummary(transactions || [], currentPeriod, accounts || []);
  const periodTransactions = (transactions || []).filter(t => {
    const d = new Date(t.date);
    return d >= currentPeriod.startDate && d <= currentPeriod.endDate;
  });
  const incomeTransactions = periodTransactions.filter(t => t.type === 'income');
  const expenseTransactions = periodTransactions.filter(t => t.type === 'expense');
  return <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Debug Financeiro
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? 'Ocultar' : 'Detalhes'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
              <EyeOff className="h-4 w-4" />
              Fechar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo dos Cálculos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              R$ {summary.totalIncome.toFixed(2)}
            </div>
            <div className="text-sm text-green-700">Receitas</div>
          </div>
          <div className="text-center p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              R$ {summary.totalExpenses.toFixed(2)}
            </div>
            <div className="text-sm text-red-700">Despesas</div>
          </div>
          <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              R$ {summary.periodBalance.toFixed(2)}
            </div>
            <div className="text-sm text-blue-700">Saldo Período</div>
          </div>
          <div className="text-center p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              R$ {summary.totalAccountBalance.toFixed(2)}
            </div>
            <div className="text-sm text-purple-700">Saldo Contas</div>
          </div>
        </div>

        {/* Informações do Período */}
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <h4 className="font-semibold mb-2">Período Selecionado:</h4>
          <p className="text-sm">
            <strong>Tipo:</strong> {selectedPeriod}<br />
            <strong>Período:</strong> {formatFinancialPeriod(currentPeriod)}<br />
            <strong>Transações no período:</strong> {summary.transactionCount}
          </p>
        </div>

        {/* Validação */}
        {!validation.isValid && <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-lg">
            <h4 className="font-semibold text-red-700 mb-2">⚠️ Problemas Encontrados:</h4>
            <ul className="text-sm text-red-600 space-y-1">
              {validation.errors.map((error, index) => <li key={index}>• {error}</li>)}
            </ul>
          </div>}

        {/* Detalhes das Transações */}
        {showDetails && <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Receitas */}
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                <h4 className="font-semibold text-green-700 mb-2">
                  Receitas ({incomeTransactions.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {incomeTransactions.map(t => <div key={t.id} className="text-sm flex justify-between">
                      <span className="truncate">{t.description}</span>
                      <span className="font-mono">R$ {Number(t.amount).toFixed(2)}</span>
                    </div>)}
                  {incomeTransactions.length === 0 && <p className="text-sm text-gray-500">Nenhuma receita no período</p>}
                </div>
              </div>

              {/* Despesas */}
              <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                <h4 className="font-semibold text-red-700 mb-2">
                  Despesas ({expenseTransactions.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {expenseTransactions.map(t => <div key={t.id} className="text-sm flex justify-between">
                      <span className="truncate">{t.description}</span>
                      <span className="font-mono">R$ {Number(t.amount).toFixed(2)}</span>
                    </div>)}
                  {expenseTransactions.length === 0 && <p className="text-sm text-gray-500">Nenhuma despesa no período</p>}
                </div>
              </div>
            </div>

            {/* Contas */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">
                Contas ({accounts?.length || 0})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {accounts?.map(account => <div key={account.id} className="text-sm flex justify-between">
                    <span>{account.name}</span>
                    <span className="font-mono">R$ {Number(account.balance).toFixed(2)}</span>
                  </div>) || <p className="text-sm text-gray-500">Nenhuma conta encontrada</p>}
              </div>
            </div>
          </div>}
      </CardContent>
    </Card>;
};