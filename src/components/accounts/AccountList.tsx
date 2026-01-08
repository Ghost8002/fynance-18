import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowUpIcon, ArrowDownIcon, Edit, Trash2, TrendingUp } from "lucide-react";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useBalanceUpdates } from "@/hooks/useBalanceUpdates";
import TransactionForm from "@/components/shared/TransactionForm";
import { AccountBalanceHistory } from "./AccountBalanceHistory";
import { AccountTransfer } from "./AccountTransfer";
import AccountEditForm from "./AccountEditForm";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BankLogo from "@/components/shared/BankLogo";
import { getBankById } from "@/utils/banks/bankDatabase";
import { useCustomBanks } from "@/hooks/useCustomBanks";
import { devLog, devError } from "@/utils/logger";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
const AccountList = () => {
  const {
    user
  } = useSupabaseAuth();
  const {
    data: accounts,
    loading,
    error,
    remove,
    refetch
  } = useRealtimeData('accounts');
  const {
    data: transactions
  } = useRealtimeData('transactions');
  const {
    updateAccountBalance
  } = useBalanceUpdates();
  const {
    toast
  } = useToast();
  const { customBanks } = useCustomBanks();
  const [selectedAccountForHistory, setSelectedAccountForHistory] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedAccountForEdit, setSelectedAccountForEdit] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Get the account balance directly from stored value
  // The balance is already updated automatically when transactions are added via useBalanceUpdates
  const getAccountBalance = (accountId: string) => {
    const account = accounts?.find(acc => acc.id === accountId);
    return Number(account?.balance) || 0;
  };
  const handleDelete = async (id: string, name: string) => {
    try {
      const {
        error
      } = await remove(id);
      if (error) {
        throw new Error(error);
      }
      toast({
        title: "Sucesso",
        description: `Conta "${name}" removida com sucesso!`
      });
    } catch (error) {
      devError('Erro ao remover conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a conta. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const handleTransactionAdded = () => {
    refetch(); // Refresh accounts data to get updated balances
  };
  const handleViewHistory = (accountId: string) => {
    setSelectedAccountForHistory(accountId);
    setHistoryDialogOpen(true);
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccountForEdit(account);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    refetch();
  };

  const getBankInfo = (bankId: string | null) => {
    // Retornar fallback se bankId for nulo
    if (!bankId) {
      return {
        name: 'Sem banco',
        shortName: 'N/A',
        logoPath: '',
        primaryColor: undefined,
        secondaryColor: undefined
      };
    }
    
    // Verificar se é um banco customizado
    if (bankId.startsWith('custom_')) {
      const customBankId = bankId.replace('custom_', '');
      const customBank = customBanks.find(cb => cb.id === customBankId);
      if (customBank) {
        return {
          name: customBank.name,
          shortName: customBank.short_name,
          logoPath: '',
          primaryColor: customBank.primary_color,
          secondaryColor: customBank.secondary_color
        };
      }
    }
    
    // Buscar banco padrão
    const bank = getBankById(bankId);
    if (bank) {
      return {
        name: bank.name,
        shortName: bank.shortName,
        logoPath: bank.logoPath,
        primaryColor: bank.primaryColor,
        secondaryColor: bank.secondaryColor
      };
    }
    
    // Fallback se não encontrar
    return {
      name: bankId,
      shortName: bankId,
      logoPath: '',
      primaryColor: undefined,
      secondaryColor: undefined
    };
  };
  if (loading) {
    return <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded"></div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  if (error) {
    return <div className="text-center py-8">
        <p className="text-red-500">Erro ao carregar contas: {error}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Tentar novamente
        </Button>
      </div>;
  }
  if (accounts?.length === 0) {
    return <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma conta cadastrada</h3>
        <p className="text-muted-foreground mb-6">Comece adicionando sua primeira conta bancária.</p>
      </div>;
  }
  const selectedAccount = accounts?.find(account => account.id === selectedAccountForHistory);
  return <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map(account => {
        // Calculate the real balance based on transactions
        const calculatedBalance = getAccountBalance(account.id);
        // Use calculated balance instead of stored balance for display
        const displayBalance = calculatedBalance;
        const bankInfo = getBankInfo(account.bank);
        // Usar cor personalizada se definida, senão usar cor do banco, senão padrão
        const accountColor = account.color || bankInfo.primaryColor || '#e5e7eb';
        
        return <Card 
          key={account.id} 
          className="relative overflow-hidden"
          style={{ 
            borderColor: accountColor,
            borderWidth: accountColor !== '#e5e7eb' ? '2px' : '1px'
          }}
        >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-2">
                      {bankInfo.logoPath ? (
                        <BankLogo 
                          logoPath={bankInfo.logoPath} 
                          bankName={bankInfo.name}
                          size="sm"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-blue-600" />
                      )}
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                    </div>
                    {accountColor !== '#e5e7eb' && (
                      <div 
                        className="w-3 h-3 rounded-full border border-border"
                        style={{ backgroundColor: accountColor }}
                        title={`Cor: ${accountColor}`}
                      />
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleViewHistory(account.id)}>
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditAccount(account)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover conta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover a conta "{account.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(account.id, account.name)} className="bg-red-600 hover:bg-red-700">
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardDescription>{bankInfo.shortName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saldo atual</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-2xl font-bold ${displayBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(displayBalance)}
                    </p>
                    {Math.abs(displayBalance - (Number(account.balance) || 0)) > 0.01}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">
                    {account.type}
                  </Badge>
                </div>

                <div className="flex space-x-2">
                  <TransactionForm defaultAccountId={account.id} onTransactionAdded={handleTransactionAdded} />
                  <AccountTransfer fromAccountId={account.id} fromAccountName={account.name} fromAccountBalance={displayBalance} onTransferComplete={handleTransactionAdded} />
                </div>
              </CardContent>
            </Card>;
      })}
      </div>

      {/* Dialog para histórico de saldo */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Histórico de Saldo</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            {selectedAccount && <AccountBalanceHistory accountId={selectedAccount.id} accountName={selectedAccount.name} currentBalance={getAccountBalance(selectedAccount.id)} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para edição de conta */}
      {selectedAccountForEdit && (
        <AccountEditForm
          account={selectedAccountForEdit}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>;
};
export default AccountList;