
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
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { isWithinInterval, startOfDay } from "date-fns";

const AccountsAndDebts = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("receivables");
  
  // Period filter hook
  const { selectedPeriod, setSelectedPeriod, dateRange } = usePeriodFilter();
  
  const { data: payments, refetch: refetchPayments } = useSupabaseData('receivable_payments', user?.id);
  const { data: debts, refetch: refetchDebts } = useSupabaseData('debts', user?.id);

  // Filter data by period
  const filteredPayments = payments?.filter(payment => {
    const dueDate = startOfDay(new Date(payment.due_date));
    return isWithinInterval(dueDate, {
      start: dateRange.startDate,
      end: dateRange.endDate
    });
  }) || [];

  const filteredDebts = debts?.filter(debt => {
    const dueDate = startOfDay(new Date(debt.due_date));
    return isWithinInterval(dueDate, {
      start: dateRange.startDate,
      end: dateRange.endDate
    });
  }) || [];

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "receivables") {
        refetchPayments();
      } else {
        refetchDebts();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, refetchPayments, refetchDebts]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout>
      <PeriodFilterProvider>
        <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Contas e Dívidas</h1>
            <p className="text-muted-foreground">Gerencie seus pagamentos a receber e dívidas a pagar com foco no planejamento mensal</p>
          </div>
          
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <PeriodFilter 
              value={selectedPeriod} 
              onChange={setSelectedPeriod}
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receivables">Pagamentos a Receber</TabsTrigger>
            <TabsTrigger value="debts">Dívidas a Pagar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="receivables" className="space-y-6">
            <PeriodSummary 
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              totalPending={receivablesTotals.pending}
              totalCompleted={receivablesTotals.completed}
              totalOverdue={receivablesTotals.overdue}
              type="receivables"
            />
            <ReceivableStats payments={filteredPayments} />
            <ReceivableList />
          </TabsContent>
          
          <TabsContent value="debts" className="space-y-6">
            <PeriodSummary 
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              totalPending={debtsTotals.pending}
              totalCompleted={debtsTotals.completed}
              totalOverdue={debtsTotals.overdue}
              type="debts"
            />
            <DebtStats debts={filteredDebts} />
            <DebtList />
          </TabsContent>
        </Tabs>
        </div>
      </PeriodFilterProvider>
    </AppLayout>
  );
};

export default AccountsAndDebts;
