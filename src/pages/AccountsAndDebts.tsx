import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
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
import { isWithinInterval, startOfDay } from "date-fns";

const AccountsAndDebts = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("receivables");

  // Period filter hook
  const { selectedPeriod, setSelectedPeriod, dateRange } = usePeriodFilter();

  // Advanced filters hooks
  const receivablesFilters = useAdvancedFilters('receivables');
  const debtsFilters = useAdvancedFilters('debts');

  const { data: payments, refetch: refetchPayments } = useSupabaseData('receivable_payments', user?.id);
  const { data: debts, refetch: refetchDebts } = useSupabaseData('debts', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: accounts } = useSupabaseData('accounts', user?.id);

  // Filter data by period and advanced filters
  const periodFilteredPayments = payments?.filter(payment => {
    const dueDate = startOfDay(new Date(payment.due_date));
    return isWithinInterval(dueDate, {
      start: dateRange.startDate,
      end: dateRange.endDate
    });
  }) || [];

  const periodFilteredDebts = debts?.filter(debt => {
    const dueDate = startOfDay(new Date(debt.due_date));
    return isWithinInterval(dueDate, {
      start: dateRange.startDate,
      end: dateRange.endDate
    });
  }) || [];

  // Apply advanced filters
  const filteredPayments = receivablesFilters.applyFilters(periodFilteredPayments);
  const filteredDebts = debtsFilters.applyFilters(periodFilteredDebts);

  // Calculate period totals for receivables
  const receivablesTotals = filteredPayments.reduce((acc, payment) => {
    const amount = Number(payment.amount);
    if (payment.status === 'received') {
      acc.completed += amount;
    } else if (payment.status === 'pending') {
      const today = startOfDay(new Date());
      const due = startOfDay(new Date(payment.due_date));
      if (due < today) {
        acc.overdue += amount;
      } else {
        acc.pending += amount;
      }
    }
    return acc;
  }, { pending: 0, completed: 0, overdue: 0 });

  // Calculate period totals for debts
  const debtsTotals = filteredDebts.reduce((acc, debt) => {
    const amount = Number(debt.amount);
    if (debt.status === 'paid') {
      acc.completed += amount;
    } else if (debt.status === 'pending') {
      const today = startOfDay(new Date());
      const due = startOfDay(new Date(debt.due_date));
      if (due < today) {
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

          <PeriodFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />

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