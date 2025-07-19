
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReceivableList from "@/components/receivables/ReceivableList";
import ReceivableStats from "@/components/receivables/ReceivableStats";
import DebtList from "@/components/debts/DebtList";
import DebtStats from "@/components/debts/DebtStats";
import { useSupabaseData } from "@/hooks/useSupabaseData";

const AccountsAndDebts = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("receivables");
  
  const { data: payments, refetch: refetchPayments } = useSupabaseData('receivable_payments', user?.id);
  const { data: debts, refetch: refetchDebts } = useSupabaseData('debts', user?.id);

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Contas e Dívidas</h1>
          <p className="text-muted-foreground">Gerencie seus pagamentos a receber e dívidas a pagar</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="receivables">Pagamentos a Receber</TabsTrigger>
            <TabsTrigger value="debts">Dívidas a Pagar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="receivables" className="space-y-6">
            <ReceivableStats payments={payments || []} />
            <ReceivableList />
          </TabsContent>
          
          <TabsContent value="debts" className="space-y-6">
            <DebtStats debts={debts || []} />
            <DebtList />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AccountsAndDebts;
