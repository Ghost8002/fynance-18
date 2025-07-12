
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
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const CardForm = () => {
  const { user } = useSupabaseAuth();
  const { insert } = useSupabaseData('cards', user?.id);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    expiryDate: "",
    type: "",
    limit: "",
    closingDay: "",
    dueDay: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.number || !formData.limit) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.number.length !== 4) {
      toast({
        title: "Erro",
        description: "Digite os 4 últimos dígitos do cartão",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const colors = ["bg-purple-600", "bg-blue-600", "bg-green-600", "bg-red-600", "bg-orange-600"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const cardData = {
        user_id: user?.id,
        name: formData.name,
        last_four_digits: formData.number,
        type: formData.type || "Visa",
        expiry_date: formData.expiryDate || null,
        credit_limit: parseFloat(formData.limit),
        color: randomColor,
        closing_day: parseInt(formData.closingDay) || 15,
        due_day: parseInt(formData.dueDay) || 22,
        used_amount: 0,
      };

      const { error } = await insert(cardData);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: "Cartão adicionado com sucesso!",
      });

      setFormData({
        name: "",
        number: "",
        expiryDate: "",
        type: "",
        limit: "",
        closingDay: "",
        dueDay: "",
      });
      setOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar cartão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o cartão. Tente novamente.",
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
        <Button className="bg-finance-blue hover:bg-blue-700">
          <CreditCard className="mr-2 h-4 w-4" /> Adicionar Cartão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Cadastre seu cartão para melhor controle de gastos
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
              onChange={(e) => handleInputChange("number", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expiry">Data de Validade</Label>
              <Input 
                id="expiry" 
                placeholder="MM/AA"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange("expiryDate", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Bandeira</Label>
              <Input 
                id="type" 
                placeholder="Ex: Visa, Mastercard"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="limit">Limite *</Label>
            <Input 
              id="limit" 
              type="number" 
              placeholder="5000"
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
                placeholder="Ex: 15" 
                min={1} 
                max={31}
                value={formData.closingDay}
                onChange={(e) => handleInputChange("closingDay", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDay">Dia de Vencimento</Label>
              <Input 
                id="dueDay" 
                type="number" 
                placeholder="Ex: 22" 
                min={1} 
                max={31}
                value={formData.dueDay}
                onChange={(e) => handleInputChange("dueDay", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CardForm;
