import { useState } from "react";
import AppLayout from "@/components/shared/AppLayout";
import FinancialSummary from "@/components/dashboard/FinancialSummary";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ExpensePieChart from "@/components/dashboard/ExpensePieChart";
import IncomePieChart from "@/components/dashboard/IncomePieChart";
import BudgetProgress from "@/components/dashboard/BudgetProgress";
import GoalTracker from "@/components/dashboard/GoalTracker";
import CardOverviewWidget from "@/components/dashboard/CardOverviewWidget";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { usePeriodFilter } from "@/hooks/usePeriodFilter";
import { useDashboardCustomization } from "@/hooks/useDashboardCustomization";
import { FinancialDebugPanel } from "@/components/dashboard/FinancialDebugPanel";
import { useFinancialPeriod } from "@/hooks/useFinancialPeriod";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import FinancialSummaryMobile from "@/components/dashboard/mobile/FinancialSummaryMobile";
import ChartMobile from "@/components/dashboard/mobile/ChartMobile";
import BudgetProgressMobile from "@/components/dashboard/mobile/BudgetProgressMobile";
import GoalTrackerMobile from "@/components/dashboard/mobile/GoalTrackerMobile";
import CardOverviewMobile from "@/components/dashboard/mobile/CardOverviewMobile";
import RecentTransactionsMobile from "@/components/dashboard/mobile/RecentTransactionsMobile";

const Dashboard = () => {
  const isMobile = useIsMobile();
  const { selectedPeriod, setSelectedPeriod } = usePeriodFilter();
  const { isWidgetVisible } = useDashboardCustomization();
  const { user } = useSupabaseAuth();
  const { getFinancialPeriod, filterTransactionsByPeriod } = useFinancialPeriod();
  const { data: transactions } = useRealtimeData('transactions');
  const { data: accounts } = useRealtimeData('accounts');
  const { data: categories } = useRealtimeData('categories');
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });

  // Mapeamento dos widgets do FinancialSummary que podem ser ocultados individualmente
  const getHiddenFinancialSummaryWidgets = () => {
    const hiddenWidgets = [];
    
    if (!isWidgetVisible('financial-summary')) {
      // Se o widget inteiro está oculto, ocultar todos
      return ['income', 'expenses', 'balance', 'account-balance', 'credit-limit', 'budgets', 'goals', 'transactions'];
    }
    
    // Verificar widgets específicos que podem ser ocultados individualmente
    if (!isWidgetVisible('credit-limit')) hiddenWidgets.push('credit-limit');
    if (!isWidgetVisible('budgets')) hiddenWidgets.push('budgets');
    if (!isWidgetVisible('goals')) hiddenWidgets.push('goals');
    if (!isWidgetVisible('transactions')) hiddenWidgets.push('transactions');
    
    return hiddenWidgets;
  };

  // Prepare chart data for mobile
  const getChartData = (type: 'income' | 'expense'): Array<{ name: string; value: number; color: string }> => {
    const filteredTx = (selectedPeriod === 'custom' && dateRange?.from && dateRange?.to && dateRange.from <= dateRange.to)
      ? transactions.filter(t => {
          const [year, month, day] = t.date.split('-').map(Number);
          const d = new Date(year, month - 1, day);
          d.setHours(0, 0, 0, 0);
          return d >= (dateRange.from as Date) && d <= (dateRange.to as Date) && t.type === type;
        })
      : filterTransactionsByPeriod(transactions.filter(t => t.type === type), selectedPeriod);

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat.id] = { name: cat.name, color: cat.color };
      return acc;
    }, {} as Record<string, { name: string; color: string }>);

    const byCategory = filteredTx.reduce((acc, t) => {
      const categoryId = t.category_id;
      if (categoryId && categoryMap[categoryId]) {
        const categoryName = categoryMap[categoryId].name;
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            color: categoryMap[categoryId].color,
          };
        }
        acc[categoryName].value += Math.abs(Number(t.amount));
      } else {
        if (!acc['Sem categoria']) {
          acc['Sem categoria'] = { name: 'Sem categoria', value: 0, color: '#9CA3AF' };
        }
        acc['Sem categoria'].value += Math.abs(Number(t.amount));
      }
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>);

    return (Object.values(byCategory) as Array<{ name: string; value: number; color: string }>).sort((a, b) => b.value - a.value);
  };

  return (
    <AppLayout>
      <div className={isMobile ? "space-y-3" : "space-y-6"}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`font-bold text-foreground ${isMobile ? 'text-lg mb-0.5' : 'text-2xl mb-1'}`}>
              Dashboard
            </h1>
            {!isMobile && <p className="text-muted-foreground">Visão geral das suas finanças</p>}
          </div>
          <div className="flex gap-4">
            <DashboardFilters
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>

        {isMobile ? (
          <>
            {/* Mobile Layout */}
            {isWidgetVisible('financial-summary') && (
              <FinancialSummaryMobile 
                hiddenWidgets={getHiddenFinancialSummaryWidgets()} 
                selectedPeriod={selectedPeriod} 
                customDateRange={dateRange} 
              />
            )}

            {/* Charts Row Mobile */}
            {(isWidgetVisible('expense-chart') || isWidgetVisible('income-chart')) && (
              <div className="grid grid-cols-1 gap-3">
                {isWidgetVisible('expense-chart') && (
                  <ChartMobile 
                    title="Despesas" 
                    data={getChartData('expense')}
                    emptyMessage="Nenhuma despesa no período"
                  />
                )}
                {isWidgetVisible('income-chart') && (
                  <ChartMobile 
                    title="Receitas" 
                    data={getChartData('income')}
                    emptyMessage="Nenhuma receita no período"
                  />
                )}
              </div>
            )}

            {/* Progress and Goals Row Mobile */}
            {(isWidgetVisible('budget-progress') || isWidgetVisible('goal-tracker')) && (
              <div className="grid grid-cols-1 gap-3">
                {isWidgetVisible('budget-progress') && <BudgetProgressMobile />}
                {isWidgetVisible('goal-tracker') && <GoalTrackerMobile />}
              </div>
            )}

            {/* Card Overview Mobile */}
            {isWidgetVisible('card-overview') && <CardOverviewMobile />}
            
            {/* Recent Transactions Mobile */}
            {isWidgetVisible('recent-transactions') && <RecentTransactionsMobile />}
          </>
        ) : (
          <>
            {/* Desktop Layout */}
            {isWidgetVisible('financial-summary') && (
              <FinancialSummary 
                hiddenWidgets={getHiddenFinancialSummaryWidgets()} 
                selectedPeriod={selectedPeriod} 
                customDateRange={dateRange} 
              />
            )}

            {/* Debug Panel - apenas em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <FinancialDebugPanel
                transactions={transactions || []}
                accounts={accounts || []}
                currentPeriod={selectedPeriod === 'custom' && dateRange.from && dateRange.to 
                  ? { startDate: dateRange.from, endDate: dateRange.to }
                  : getFinancialPeriod(selectedPeriod)
                }
                selectedPeriod={selectedPeriod}
              />
            )}

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {isWidgetVisible('expense-chart') && <ExpensePieChart selectedPeriod={selectedPeriod} customDateRange={dateRange} />}
              {isWidgetVisible('income-chart') && <IncomePieChart selectedPeriod={selectedPeriod} customDateRange={dateRange} />}
            </div>

            {/* Progress and Goals Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {isWidgetVisible('budget-progress') && <BudgetProgress />}
              {isWidgetVisible('goal-tracker') && <GoalTracker />}
            </div>

            {/* Card Overview */}
            {isWidgetVisible('card-overview') && (
              <div className="grid gap-6 md:grid-cols-1">
                <CardOverviewWidget />
              </div>
            )}
            
            {/* Recent Transactions */}
            {isWidgetVisible('recent-transactions') && (
              <div className="grid gap-6 md:grid-cols-1">
                <RecentTransactions />
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
