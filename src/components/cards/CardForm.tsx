
import { useState, useEffect } from "react";
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
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { 
  validateCardName, 
  validateCardNumber, 
  validateCardLimit, 
  validateCardDays, 
  isDuplicateCard, 
  generateCardColor 
} from "@/utils/cardUtils";

interface CardFormProps {
  card?: any;
  onSave?: () => void;
  triggerButton?: React.ReactNode;
}

const CardForm = ({ card, onSave, triggerButton }: CardFormProps) => {
  const { user } = useSupabaseAuth();
  const { insert, update, data: cards } = useSupabaseData('cards', user?.id);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: card?.name || "",
    number: card?.last_four_digits || "",
    expiryDate: card?.expiry_date || "",
    type: card?.type || "Visa",
    limit: card?.credit_limit?.toString() || "",
    closingDay: card?.closing_day?.toString() || "15",
    dueDay: card?.due_day?.toString() || "22",
  });

  useEffect(() => {
    setFormData({
      name: card?.name || "",
      number: card?.last_four_digits || "",
      expiryDate: card?.expiry_date || "",
      type: card?.type || "Visa",
      limit: card?.credit_limit?.toString() || "",
      closingDay: card?.closing_day?.toString() || "15",
      dueDay: card?.due_day?.toString() || "22",
    });
  }, [card]);

  const validateForm = () => {
    if (!validateCardName(formData.name)) {
      toast({
        title: "Erro",
        description: "Nome do cartão é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!validateCardNumber(formData.number)) {
      toast({
        title: "Erro",
        description: "Digite os 4 últimos dígitos do cartão",
        variant: "destructive",
      });
      return false;
    }

    if (!validateCardLimit(formData.limit)) {
      toast({
        title: "Erro",
        description: "O limite deve ser um número positivo válido",
        variant: "destructive",
      });
      return false;
    }

    if (!validateCardDays(formData.closingDay)) {
      toast({
        title: "Erro",
        description: "O dia de fechamento deve ser entre 1 e 31",
        variant: "destructive",
      });
      return false;
    }

    if (!validateCardDays(formData.dueDay)) {
      toast({
        title: "Erro",
        description: "O dia de vencimento deve ser entre 1 e 31",
        variant: "destructive",
      });
      return false;
    }

    // Checagem de duplicidade apenas para novos cartões
    if (!card && cards && isDuplicateCard(cards, formData.name, formData.number)) {
      toast({
        title: "Erro",
        description: "Já existe um cartão com esse nome e final.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

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

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const cardData = {
        user_id: user.id,
        name: formData.name.trim(),
        last_four_digits: formData.number,
        type: formData.type,
        expiry_date: formData.expiryDate || null,
        credit_limit: parseFloat(formData.limit),
        color: card?.color || generateCardColor(),
        closing_day: parseInt(formData.closingDay),
        due_day: parseInt(formData.dueDay),
        used_amount: card?.used_amount || 0,
      };

      let error;
      if (card) {
        ({ error } = await update(card.id, cardData));
      } else {
        ({ error } = await insert(cardData));
      }

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: card ? "Cartão atualizado com sucesso!" : "Cartão adicionado com sucesso!",
      });

      // Reset form
      setFormData({
        name: "",
        number: "",
        expiryDate: "",
        type: "Visa",
        limit: "",
        closingDay: "15",
        dueDay: "22",
      });
      
      setOpen(false);
      onSave?.();
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      
      let errorMessage = "Não foi possível salvar o cartão. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes('duplicate')) {
          errorMessage = "Já existe um cartão com esses dados.";
        } else if (error.message.includes('invalid')) {
          errorMessage = "Dados inválidos fornecidos.";
        } else if (error.message.includes('permission')) {
          errorMessage = "Você não tem permissão para realizar esta operação.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="bg-finance-blue hover:bg-blue-700">
            <CreditCard className="mr-2 h-4 w-4" /> 
            {card ? "Editar Cartão" : "Adicionar Cartão"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {card ? "Editar Cartão de Crédito" : "Adicionar Cartão de Crédito"}
          </DialogTitle>
          <DialogDescription>
            {card 
              ? "Altere os dados do cartão conforme necessário." 
              : "Cadastre seu cartão para melhor controle de gastos"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Cartão *</Label>
            <Input 
              id="name" 
              placeholder="Ex: Nubank" 
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="number">Número (últimos 4 dígitos) *</Label>
            <Input 
              id="number" 
              placeholder="Ex: 1234" 
              maxLength={4}
              value={formData.number}
              onChange={(e) => handleInputChange("number", e.target.value.replace(/\D/g, ''))}
              required
              disabled={!!card} // Não permitir editar final do cartão
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Bandeira</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a bandeira" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Visa">Visa</SelectItem>
                <SelectItem value="Mastercard">Mastercard</SelectItem>
                <SelectItem value="American Express">American Express</SelectItem>
                <SelectItem value="Elo">Elo</SelectItem>
                <SelectItem value="Hipercard">Hipercard</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="expiryDate">Data de Validade</Label>
            <Input 
              id="expiryDate" 
              placeholder="MM/AA" 
              maxLength={5}
              value={formData.expiryDate}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                  value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                handleInputChange("expiryDate", value);
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="limit">Limite de Crédito (R$) *</Label>
            <Input 
              id="limit" 
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00" 
              value={formData.limit}
              onChange={(e) => handleInputChange("limit", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="closingDay">Dia de Fechamento</Label>
              <Input 
                id="closingDay" 
                type="number"
                min="1"
                max="31"
                placeholder="15" 
                value={formData.closingDay}
                onChange={(e) => handleInputChange("closingDay", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dueDay">Dia de Vencimento</Label>
              <Input 
                id="dueDay" 
                type="number"
                min="1"
                max="31"
                placeholder="22" 
                value={formData.dueDay}
                onChange={(e) => handleInputChange("dueDay", e.target.value)}
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {card ? "Atualizar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CardForm;
