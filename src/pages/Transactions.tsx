
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import TransactionListAdvanced from "@/components/transactions/TransactionListAdvanced";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Transactions = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Transações</h1>
            <p className="text-muted-foreground">Gerencie todas as suas movimentações financeiras</p>
          </div>
        </div>

        <Tabs defaultValue="lista" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="lista">Lista de Transações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lista">
            <TransactionListAdvanced />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Transactions;
