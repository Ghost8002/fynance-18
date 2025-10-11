
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getCurrentLocalDateString } from "@/utils/dateValidation";

interface AccountTransferProps {
  fromAccountId: string;
  fromAccountName: string;
  fromAccountBalance: number;
  onTransferComplete: () => void;
}

export const AccountTransfer = ({ fromAccountId, fromAccountName, fromAccountBalance, onTransferComplete }: AccountTransferProps) => {
  const { user } = useSupabaseAuth();
  const { data: accounts, update: updateAccount, insert: insertTransaction } = useSupabaseData('accounts', user?.id);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    toAccountId: "",
    amount: "",
    description: "Transferência entre contas"
  });

  const availableAccounts = accounts?.filter(acc => acc.id !== fromAccountId) || [];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.toAccountId || !formData.amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "Erro",
        description: "O valor deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (amount > fromAccountBalance) {
      toast({
        title: "Erro",
        description: "Saldo insuficiente para a transferência",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      const toAccount = accounts?.find(acc => acc.id === formData.toAccountId);
      if (!toAccount) {
        throw new Error('Conta de destino não encontrada');
      }

      // Atualiza saldo da conta origem (debita)
      const { error: fromError } = await updateAccount(fromAccountId, {
        balance: fromAccountBalance - amount
      });

      if (fromError) throw new Error(fromError);

      // Atualiza saldo da conta destino (credita)
      const { error: toError } = await updateAccount(formData.toAccountId, {
        balance: Number(toAccount.balance) + amount
      });

      if (toError) {
        // Rollback da conta origem
        await updateAccount(fromAccountId, { balance: fromAccountBalance });
        throw new Error(toError);
      }

      // Cria transação de saída
      await insertTransaction({
        user_id: user?.id,
        account_id: fromAccountId,
        type: 'expense',
        amount: amount,
        description: `${formData.description} - para ${toAccount.name}`,
        date: getCurrentLocalDateString(),
        notes: `Transferência para conta ${toAccount.name}`
      });

      // Cria transação de entrada
      await insertTransaction({
        user_id: user?.id,
        account_id: formData.toAccountId,
        type: 'income',
        amount: amount,
        description: `${formData.description} - de ${fromAccountName}`,
        date: getCurrentLocalDateString(),
        notes: `Transferência da conta ${fromAccountName}`
      });

      toast({
        title: "Sucesso",
        description: `Transferência de R$ ${amount.toFixed(2)} realizada com sucesso!`,
      });

      setFormData({
        toAccountId: "",
        amount: "",
        description: "Transferência entre contas"
      });
      setOpen(false);
      onTransferComplete();
    } catch (error) {
      console.error('Erro na transferência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a transferência. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightLeft className="h-4 w-4 mr-1" />
          Transferir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transferir de {fromAccountName}</DialogTitle>
          <DialogDescription>
            Saldo disponível: R$ {fromAccountBalance.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleTransfer} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="toAccount">Conta de destino *</Label>
            <Select value={formData.toAccountId} onValueChange={(value) => setFormData(prev => ({ ...prev, toAccountId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - {account.bank} (R$ {Number(account.balance).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Descrição da transferência"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transferir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
