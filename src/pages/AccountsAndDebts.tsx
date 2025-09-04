import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PeriodSummary } from "@/components/shared/PeriodSummary";
import { PeriodFilterProvider } from "@/context/PeriodFilterContext";
import { usePeriodFilter } from "@/hooks/usePeriodFilter";
import ReceivableList from "@/components/receivables/ReceivableList";
import ReceivableStats from "@/components/receivables/ReceivableStats";
import DebtList from "@/components/debts/DebtList";
import DebtStats from "@/components/debts/DebtStats";
import { AdvancedFilters } from "@/components/shared/AdvancedFilters";
import { useAdvancedFilters } from "@/hooks/useAdvancedFilters";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { isWithinInterval, startOfDay, parse } from "date-fns";

const AccountsAndDebts = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("receivables");

  // Period filter hook
  const { selectedPeriod, setSelectedPeriod, dateRange, goToPreviousMonth, goToNextMonth } = usePeriodFilter();

  // Advanced filters hooks
  const receivablesFilters = useAdvancedFilters('receivables');
  const debtsFilters = useAdvancedFilters('debts');

  const { data: payments, refetch: refetchPayments } = useSupabaseData('receivable_payments', user?.id);
  const { data: debts, refetch: refetchDebts } = useSupabaseData('debts', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);

  // Filter data by period and advanced filters
  const periodFilteredPayments = payments?.filter(payment => {
    const dueDate = startOfDay(parse(payment.due_date, 'yyyy-MM-dd', new Date()));
    return isWithinInterval(dueDate, {
      start: dateRange.startDate,
      end: dateRange.endDate
    });
  }) || [];

  const periodFilteredDebts = debts?.filter(debt => {
    const dueDate = startOfDay(parse(debt.due_date, 'yyyy-MM-dd', new Date()));
    return isWithinInterval(dueDate, {
      start: dateRange.startDate,
      end: dateRange.endDate
    });
  }) || [];

  // Apply advanced filters
  const filteredPayments = receivablesFilters.applyFilters(periodFilteredPayments);
  const filteredDebts = debtsFilters.applyFilters(periodFilteredDebts);

  // Calculate period totals for receivables (comparando com o fim do período selecionado)
  const receivablesTotals = filteredPayments.reduce((acc, payment) => {
    const amount = Number(payment.amount);
    if (payment.status === 'received') {
      acc.completed += amount;
    } else if (payment.status === 'pending') {
      const periodEnd = startOfDay(new Date(dateRange.endDate));
      const due = startOfDay(parse(payment.due_date, 'yyyy-MM-dd', new Date()));
      if (due < periodEnd) {
        acc.overdue += amount;
      } else {
        acc.pending += amount;
      }
    }
    return acc;
  }, { pending: 0, completed: 0, overdue: 0 });

  // Calculate period totals for debts (comparando com o fim do período selecionado)
  const debtsTotals = filteredDebts.reduce((acc, debt) => {
    const amount = Number(debt.amount);
    if (debt.status === 'paid') {
      acc.completed += amount;
    } else if (debt.status === 'pending') {
      const periodEnd = startOfDay(new Date(dateRange.endDate));
      const due = startOfDay(parse(debt.due_date, 'yyyy-MM-dd', new Date()));
      if (due < periodEnd) {
        acc.overdue += amount;
      } else {
        acc.pending += amount;
      }
    }
    return acc;
  }, { pending: 0, completed: 0, overdue: 0 });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contas e Dívidas</h1>
            <p className="text-muted-foreground">
              Gerencie suas contas a receber e dívidas a pagar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <PeriodFilter 
              value={selectedPeriod}
              onChange={setSelectedPeriod}
            />
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PeriodSummary
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              totalPending={receivablesTotals.pending}
              totalCompleted={receivablesTotals.completed}
              totalOverdue={receivablesTotals.overdue}
              type="receivables"
            />
            <PeriodSummary
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              totalPending={debtsTotals.pending}
              totalCompleted={debtsTotals.completed}
              totalOverdue={debtsTotals.overdue}
              type="debts"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
            <TabsTrigger value="debts">Dívidas a Pagar</TabsTrigger>
          </TabsList>

          <TabsContent value="receivables" className="space-y-4">
            <ReceivableStats payments={filteredPayments} />
            <ReceivableList
              filters={receivablesFilters.filters}
              onFiltersChange={receivablesFilters.updateFilters}
              categories={categories}
              accounts={accounts}
              presets={receivablesFilters.presets}
              onSavePreset={receivablesFilters.savePreset}
              onLoadPreset={receivablesFilters.loadPreset}
            />
          </TabsContent>

          <TabsContent value="debts" className="space-y-4">
            <DebtStats debts={filteredDebts} />
            <DebtList
              filters={debtsFilters.filters}
              onFiltersChange={debtsFilters.updateFilters}
              categories={categories}
              accounts={accounts}
              presets={debtsFilters.presets}
              onSavePreset={debtsFilters.savePreset}
              onLoadPreset={debtsFilters.loadPreset}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

const AccountsAndDebtsWithProvider = () => (
  <PeriodFilterProvider>
    <AccountsAndDebts />
  </PeriodFilterProvider>
);

export default AccountsAndDebtsWithProvider;