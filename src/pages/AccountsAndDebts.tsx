import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PeriodSummary } from "@/components/shared/PeriodSummary";
import ReceivableList from "@/components/receivables/ReceivableList";
import ReceivableStats from "@/components/receivables/ReceivableStats";
import DebtList from "@/components/debts/DebtList";
import DebtStats from "@/components/debts/DebtStats";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

const AccountsAndDebts = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("receivables");
  
  // Simple month navigation state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: payments, refetch: refetchPayments } = useRealtimeData('receivable_payments');
  const { data: debts, refetch: refetchDebts } = useRealtimeData('debts');
  const { data: categories } = useRealtimeData('categories');
  const { data: accounts } = useRealtimeData('accounts');

  // Calculate current month date range
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Filter data by current month (no other filters)
  const filteredPayments = (payments || []).filter(payment => {
    const dueDate = new Date(payment.due_date);
    return dueDate >= monthStart && dueDate <= monthEnd;
  });

  const filteredDebts = (debts || []).filter(debt => {
    const dueDate = new Date(debt.due_date);
    return dueDate >= monthStart && dueDate <= monthEnd;
  });

  // Calculate totals for current month
  const receivablesTotals = filteredPayments.reduce((acc, payment) => {
    const amount = Number(payment.amount);
    if (payment.status === 'received') {
      acc.completed += amount;
    } else if (payment.status === 'pending') {
      const due = new Date(payment.due_date);
      if (due < new Date()) {
        acc.overdue += amount;
      } else {
        acc.pending += amount;
      }
    }
    return acc;
  }, { pending: 0, completed: 0, overdue: 0 });

  const debtsTotals = filteredDebts.reduce((acc, debt) => {
    const amount = Number(debt.amount);
    if (debt.status === 'paid') {
      acc.completed += amount;
    } else if (debt.status === 'pending') {
      const due = new Date(debt.due_date);
      if (due < new Date()) {
        acc.overdue += amount;
      } else {
        acc.pending += amount;
      }
    }
    return acc;
  }, { pending: 0, completed: 0, overdue: 0 });

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">A Receber e Pagar</h1>
            <p className="text-muted-foreground">
              Gerencie seus valores a receber e compromissos a pagar
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PeriodSummary
              startDate={monthStart}
              endDate={monthEnd}
              totalPending={receivablesTotals.pending}
              totalCompleted={receivablesTotals.completed}
              totalOverdue={receivablesTotals.overdue}
              type="receivables"
            />
            <PeriodSummary
              startDate={monthStart}
              endDate={monthEnd}
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
              categories={categories}
              accounts={accounts}
              currentMonth={currentMonth}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
            />
          </TabsContent>

          <TabsContent value="debts" className="space-y-4">
            <DebtStats debts={filteredDebts} />
            <DebtList
              categories={categories}
              accounts={accounts}
              currentMonth={currentMonth}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AccountsAndDebts;