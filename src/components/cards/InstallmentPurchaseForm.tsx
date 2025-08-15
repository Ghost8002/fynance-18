import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Calendar, CreditCard } from "lucide-react";

interface InstallmentPurchaseFormProps {
  onPurchaseAdded?: () => void;
}

interface FormData {
  description: string;
  total_amount: string;
  installments_count: string;
  first_installment_date: string;
  card_id: string;
  category_id: string;
  notes: string;
}

export const InstallmentPurchaseForm = ({ onPurchaseAdded }: InstallmentPurchaseFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: cards } = useSupabaseData('cards', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    description: "",
    total_amount: "",
    installments_count: "2",
    first_installment_date: "",
    card_id: "",
    category_id: "",
    notes: ""
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const selectedCard = cards?.find(card => card.id === formData.card_id);
  const installmentAmount = formData.total_amount ? parseFloat(formData.total_amount) / parseInt(formData.installments_count || "1") : 0;

  const validateForm = () => {
    if (!formData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Descrição é obrigatória"
      });
      return false;
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Valor total deve ser maior que zero"
      });
      return false;
    }

    if (!formData.card_id) {
      toast({
        variant: "destructive",
        title: "Selecione um cartão"
      });
      return false;
    }

    if (!formData.category_id) {
      toast({
        variant: "destructive",
        title: "Selecione uma categoria"
      });
      return false;
    }

    const installmentsCount = parseInt(formData.installments_count);
    if (installmentsCount < 1 || installmentsCount > 24) {
      toast({
        variant: "destructive",
        title: "Número de parcelas deve ser entre 1 e 24"
      });
      return false;
    }

    if (!formData.first_installment_date) {
      toast({
        variant: "destructive",
        title: "Data da primeira parcela é obrigatória"
      });
      return false;
    }

    // Verificar se a compra não excede o limite disponível do cartão
    if (selectedCard && selectedCard.type === "credit") {
      const availableLimit = selectedCard.credit_limit - selectedCard.used_amount;
      const totalAmount = parseFloat(formData.total_amount);
      
      if (totalAmount > availableLimit) {
        toast({
          variant: "destructive",
          title: "Limite insuficiente",
          description: `Esta compra excede o limite disponível. Limite disponível: ${formatCurrency(availableLimit)}`
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // Usar RPC para criar compra parcelada atomicamente
      const { data, error } = await supabase.rpc('create_installment_purchase', {
        p_user_id: user?.id,
        p_card_id: formData.card_id,
        p_category_id: formData.category_id,
        p_description: formData.description.trim(),
        p_total_amount: parseFloat(formData.total_amount),
        p_installments_count: parseInt(formData.installments_count),
        p_first_installment_date: formData.first_installment_date,
        p_notes: formData.notes.trim() || null
      });

      if (error) {
        console.error('RPC Error:', error);
        toast({
          variant: "destructive",
          title: "Erro ao criar compra parcelada",
          description: "Tente novamente em alguns instantes"
        });
        return;
      }

      toast({
        title: "Compra parcelada criada com sucesso!",
        description: `${formData.installments_count} parcelas de ${formatCurrency(installmentAmount)}`
      });

      // Reset form
      setFormData({
        description: "",
        total_amount: "",
        installments_count: "2",
        first_installment_date: "",
        card_id: "",
        category_id: "",
        notes: ""
      });

      setOpen(false);
      onPurchaseAdded?.();

    } catch (error) {
      console.error('Error creating installment purchase:', error);
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Não foi possível criar a compra parcelada"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar apenas cartões de crédito
  const creditCards = cards?.filter(card => card.type === "credit") || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Nova Compra
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Compra Parcelada</DialogTitle>
          <DialogDescription>
            Registre uma compra parcelada no cartão de crédito
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição da Compra *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Ex: Smartphone Samsung Galaxy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Valor Total *</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installments_count">Número de Parcelas *</Label>
              <Select value={formData.installments_count} onValueChange={(value) => handleInputChange('installments_count', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}x {formData.total_amount && `de ${formatCurrency(parseFloat(formData.total_amount) / num)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="first_installment_date">Data da Primeira Parcela *</Label>
            <Input
              id="first_installment_date"
              type="date"
              value={formData.first_installment_date}
              onChange={(e) => handleInputChange('first_installment_date', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card_id">Cartão de Crédito *</Label>
              <Select value={formData.card_id} onValueChange={(value) => handleInputChange('card_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: card.color }}
                        />
                        {card.name} - {card.bank}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria *</Label>
              <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.filter(cat => cat.type === 'expense').map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Informações adicionais sobre a compra..."
              rows={3}
            />
          </div>

          {/* Preview */}
          {formData.total_amount && formData.installments_count && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Resumo da Compra
              </h4>
              <div className="space-y-1 text-sm">
                <p>Valor total: <span className="font-medium">{formatCurrency(parseFloat(formData.total_amount))}</span></p>
                <p>Parcelas: <span className="font-medium">{formData.installments_count}x de {formatCurrency(installmentAmount)}</span></p>
                {selectedCard && (
                  <p>Cartão: <span className="font-medium">{selectedCard.name}</span></p>
                )}
                {selectedCard?.type === "credit" && (
                  <p>Limite disponível: <span className="font-medium">
                    {formatCurrency(selectedCard.credit_limit - selectedCard.used_amount)}
                  </span></p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Compra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};