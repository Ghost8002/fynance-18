import AppLayout from "@/components/shared/AppLayout";
import TransactionListAdvanced from "@/components/transactions/TransactionListAdvanced";
import TransactionListMobile from "@/components/transactions/mobile/TransactionListMobile";
import { Tabs, TabsContent } from "@/components/ui/tabs";

const Transactions = () => {
  return <AppLayout>
      {/* Desktop version */}
      <div className="hidden md:block space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Transações</h1>
            <p className="text-muted-foreground">Gerencie todas as suas movimentações financeiras</p>
          </div>
        </div>

        <Tabs defaultValue="lista" className="space-y-6">
          <TabsContent value="lista">
            <TransactionListAdvanced />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile version */}
      <div className="md:hidden">
        <TransactionListMobile />
      </div>
    </AppLayout>;
};
export default Transactions;