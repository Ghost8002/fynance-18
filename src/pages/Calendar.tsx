import AppLayout from "@/components/shared/AppLayout";
import TransactionForm from "@/components/shared/TransactionForm";
import FinancialCalendar from "@/components/calendar/FinancialCalendar";

const Calendar = () => {

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-0.5 sm:mb-1">Calendário Financeiro</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Visualize suas receitas e despesas</p>
          </div>
          
          <TransactionForm />
        </div>
        
        <FinancialCalendar />
      </div>
    </AppLayout>
  );
};

export default Calendar;
