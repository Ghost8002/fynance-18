
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { selectedPeriod, setSelectedPeriod } = usePeriodFilter();
  const { isWidgetVisible } = useDashboardCustomization();
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral das suas finanças</p>
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

        {/* Financial Summary - sempre visível, mas com widgets internos configuráveis */}
          {isWidgetVisible('financial-summary') && (
            <FinancialSummary hiddenWidgets={getHiddenFinancialSummaryWidgets()} selectedPeriod={selectedPeriod} customDateRange={dateRange} />
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
      </div>
    </AppLayout>
  );
};

export default Dashboard;
