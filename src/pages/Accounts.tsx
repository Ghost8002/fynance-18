import AppLayout from "@/components/shared/AppLayout";
import AccountList from "@/components/accounts/AccountList";
import AccountForm from "@/components/accounts/AccountForm";

const Accounts = () => {

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Contas</h1>
            <p className="text-muted-foreground">Gerencie suas contas bancárias e acompanhe seus saldos</p>
          </div>
          
          <AccountForm />
        </div>
        
        <AccountList />
      </div>
    </AppLayout>
  );
};

export default Accounts;
