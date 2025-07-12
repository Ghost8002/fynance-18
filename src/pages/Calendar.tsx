
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import TransactionForm from "@/components/shared/TransactionForm";
import FinancialCalendar from "@/components/calendar/FinancialCalendar";

const Calendar = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Calendário Financeiro</h1>
            <p className="text-muted-foreground">Visualize suas receitas e despesas em um calendário</p>
          </div>
          
          <TransactionForm />
        </div>
        
        <FinancialCalendar />
      </div>
    </AppLayout>
  );
};

export default Calendar;
