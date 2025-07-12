
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";

const AccountForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    bank: '',
    account_number: '',
    balance: ''
  });

  const { user } = useSupabaseAuth();
  const { insert } = useSupabaseData('accounts', user?.id);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type || !formData.name) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const accountData = {
        user_id: user.id,
        type: formData.type,
        name: formData.name,
        bank: formData.bank || null,
        account_number: formData.account_number || null,
        balance: formData.balance ? Number(formData.balance) : 0,
      };

      const { error } = await insert(accountData);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: "Conta adicionada com sucesso!",
      });

      // Reset form
      setFormData({
        type: '',
        name: '',
        bank: '',
        account_number: '',
        balance: ''
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-finance-blue hover:bg-blue-700">
          <Wallet className="mr-2 h-4 w-4" /> Adicionar Conta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Conta</DialogTitle>
          <DialogDescription>
            Cadastre sua conta para gerenciar suas finanças
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Conta *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Conta Corrente</SelectItem>
                <SelectItem value="savings">Poupança</SelectItem>
                <SelectItem value="investment">Investimento</SelectItem>
                <SelectItem value="wallet">Carteira (Dinheiro)</SelectItem>
                <SelectItem value="other">Outra</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Conta *</Label>
            <Input 
              id="name" 
              placeholder="Ex: Conta Principal" 
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank">Banco ou Instituição</Label>
            <Input 
              id="bank" 
              placeholder="Ex: Banco X" 
              value={formData.bank}
              onChange={(e) => handleInputChange('bank', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="number">Número (últimos 4 dígitos)</Label>
            <Input 
              id="number" 
              placeholder="Ex: 1234" 
              maxLength={4} 
              value={formData.account_number}
              onChange={(e) => handleInputChange('account_number', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="initialBalance">Saldo Inicial</Label>
            <Input 
              id="initialBalance" 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={formData.balance}
              onChange={(e) => handleInputChange('balance', e.target.value)}
            />
          </div>
        </form>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccountForm;
