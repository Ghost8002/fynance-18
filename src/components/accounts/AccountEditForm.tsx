import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useToast } from "@/hooks/use-toast";
import ColorPicker from "@/components/shared/ColorPicker";

interface AccountEditFormProps {
  account: {
    id: string;
    type: string;
    name: string;
    bank: string;
    account_number: string;
    balance: number;
    color?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AccountEditForm = ({ account, isOpen, onClose, onSuccess }: AccountEditFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    bank: '',
    balance: '',
    color: '#3B82F6'
  });

  const { user } = useSupabaseAuth();
  const { update } = useRealtimeData('accounts');
  const { toast } = useToast();


  // Preencher formulário com dados da conta quando abrir
  useEffect(() => {
    if (account && isOpen) {
      setFormData({
        type: account.type,
        name: account.name,
        bank: account.bank || '',
        balance: account.balance.toString(),
        color: account.color || '#3B82F6'
      });
    }
  }, [account, isOpen]);

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
        type: formData.type,
        name: formData.name,
        bank: formData.bank || null,
        balance: formData.balance ? Number(formData.balance) : 0,
        // Só salvar cor se for diferente da padrão (usuário escolheu uma cor)
        color: formData.color !== '#3B82F6' ? formData.color : null,
      };

      const { error } = await update(account.id, accountData);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso!",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta. Tente novamente.",
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta</DialogTitle>
          <DialogDescription>
            Atualize os dados da sua conta
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
            <Label htmlFor="balance">Saldo Atual</Label>
            <Input 
              id="balance" 
              type="number"
              step="0.01"
              placeholder="0,00" 
              value={formData.balance}
              onChange={(e) => handleInputChange('balance', e.target.value)}
            />
          </div>

          <ColorPicker
            value={formData.color}
            onChange={(color) => handleInputChange('color', color)}
            label="Cor da Conta"
          />
        </form>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
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

export default AccountEditForm;
