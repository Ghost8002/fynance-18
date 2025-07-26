import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import TagSelector from "@/components/shared/TagSelector";
import { CreditCard, Loader2 } from "lucide-react";

interface InstallmentPurchaseFormProps {
  onPurchaseAdded?: () => void;
}

export const InstallmentPurchaseForm = ({ onPurchaseAdded }: InstallmentPurchaseFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: cards } = useSupabaseData('cards', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: tags } = useSupabaseData('tags', user?.id);

  const [formData, setFormData] = useState({
    description: "",
    totalAmount: "",
    installments: "1",
    firstInstallmentDate: new Date().toISOString().split('T')[0],
    categoryId: "",
    cardId: "",
    notes: ""
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const validateForm = () => {
    if (!formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      toast({
        title: "Erro",
        description: "Valor total deve ser maior que zero",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.categoryId) {
      toast({
        title: "Erro",
        description: "Categoria é obrigatória",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.cardId) {
      toast({
        title: "Erro",
        description: "Cartão é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    const installmentCount = parseInt(formData.installments);
    if (installmentCount < 1 || installmentCount > 24) {
      toast({
        title: "Erro",
        description: "Número de parcelas deve ser entre 1 e 24",
        variant: "destructive",
      });
      return false;
    }

    // Validate card limit
    const selectedCard = cards?.find(card => card.id === formData.cardId);
    if (selectedCard) {
      const totalAmount = parseFloat(formData.totalAmount);
      const currentUsed = selectedCard.used_amount || 0;
      const creditLimit = selectedCard.credit_limit || 0;
      
      if (currentUsed + totalAmount > creditLimit) {
        toast({
          title: "Erro",
          description: `Compra excederia o limite do cartão. Limite: R$ ${creditLimit.toFixed(2)}, Usado: R$ ${currentUsed.toFixed(2)}, Disponível: R$ ${(creditLimit - currentUsed).toFixed(2)}`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const createInstallmentPurchase = async () => {
    try {
      const totalAmount = parseFloat(formData.totalAmount);
      const installmentCount = parseInt(formData.installments);
      const installmentAmount = totalAmount / installmentCount;
      const firstDate = new Date(formData.firstInstallmentDate);

      // Prepare tags data
      const transactionTags = selectedTags.length > 0 
        ? selectedTags
            .map(tagId => tags?.find(tag => tag.id === tagId))
            .filter(tag => tag)
            .map(tag => ({
              id: tag!.id,
              name: tag!.name,
              color: tag!.color
            }))
        : [];

      // Create main installment record
      const { data: installment, error: installmentError } = await supabase
        .from('card_installments' as any)
        .insert({
          user_id: user.id,
          card_id: formData.cardId,
          category_id: formData.categoryId,
          description: formData.description,
          total_amount: totalAmount,
          installments_count: installmentCount,
          first_installment_date: formData.firstInstallmentDate,
          notes: formData.notes || null,
          tags: transactionTags
        })
        .select()
        .single();

      if (installmentError) throw installmentError;
      if (!installment) throw new Error('Falha ao criar compra parcelada');

      // Create installment items
      const installmentItems = [];
      for (let i = 0; i < installmentCount; i++) {
        const installmentDate = new Date(firstDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        
        installmentItems.push({
          installment_id: (installment as any).id,
          installment_number: i + 1,
          amount: installmentAmount,
          due_date: installmentDate.toISOString().split('T')[0],
          status: 'pending'
        });
      }

      const { error: itemsError } = await supabase
        .from('card_installment_items' as any)
        .insert(installmentItems);

      if (itemsError) throw itemsError;

      // Update card used amount
      const selectedCard = cards?.find(card => card.id === formData.cardId);
      if (selectedCard) {
        const currentUsed = selectedCard.used_amount || 0;
        const newUsed = currentUsed + totalAmount;

        const { error: updateError } = await supabase
          .from('cards')
          .update({ 
            used_amount: newUsed,
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.cardId);

        if (updateError) {
          console.error('Erro ao atualizar limite do cartão:', updateError);
        }

        // Register in history
        await supabase
          .from('card_limit_history')
          .insert({
            user_id: user.id,
            card_id: formData.cardId,
            movement_type: 'charge',
            amount: totalAmount,
            previous_used_amount: currentUsed,
            new_used_amount: newUsed,
            description: 'Compra parcelada'
          });
      }

              return (installment as any).id;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await createInstallmentPurchase();

      toast({
        title: "Sucesso",
        description: `Compra parcelada em ${formData.installments}x criada com sucesso!`,
      });

      // Reset form
      setFormData({
        description: "",
        totalAmount: "",
        installments: "1",
        firstInstallmentDate: new Date().toISOString().split('T')[0],
        categoryId: "",
        cardId: "",
        notes: ""
      });
      setSelectedTags([]);

      setOpen(false);
      onPurchaseAdded?.();

    } catch (error: any) {
      console.error('Error creating installment purchase:', error);
      
      let errorMessage = "Não foi possível criar a compra parcelada";
      
      if (error?.message) {
        if (error.message.includes('insufficient')) {
          errorMessage = "Limite insuficiente no cartão selecionado";
        } else if (error.message.includes('card not found')) {
          errorMessage = "Cartão não encontrado";
        } else if (error.message.includes('invalid amount')) {
          errorMessage = "Valor inválido para compra";
        } else if (error.message.includes('access denied')) {
          errorMessage = "Você não tem permissão para realizar esta operação";
        } else if (error.message.includes('not authenticated')) {
          errorMessage = "Usuário não autenticado";
        } else if (error.message.includes('duplicate')) {
          errorMessage = "Compra duplicada detectada";
        } else if (error.message.includes('network')) {
          errorMessage = "Erro de conexão. Verifique sua internet.";
        } else if (error.message.includes('function')) {
          errorMessage = "Função de parcelamento não disponível. Contate o suporte.";
        } else if (error.message.includes('foreign key')) {
          errorMessage = "Categoria ou cartão inválido";
        } else if (error.message.includes('check constraint')) {
          errorMessage = "Dados inválidos fornecidos";
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

  const selectedCard = cards?.find(card => card.id === formData.cardId);
  const availableCategories = categories?.filter(cat => cat.type === 'expense') || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CreditCard size={16} />
          Compra Parcelada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Compra Parcelada</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Ex: Notebook Dell"
              required
            />
          </div>

          <div>
            <Label htmlFor="totalAmount">Valor Total *</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.totalAmount}
              onChange={(e) => handleInputChange("totalAmount", e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="categoryId">Categoria *</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => handleInputChange("categoryId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="installments">Número de Parcelas *</Label>
            <Select 
              value={formData.installments} 
              onValueChange={(value) => handleInputChange("installments", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="firstInstallmentDate">Data da Primeira Parcela *</Label>
            <Input
              id="firstInstallmentDate"
              type="date"
              value={formData.firstInstallmentDate}
              onChange={(e) => handleInputChange("firstInstallmentDate", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="cardId">Cartão *</Label>
            <Select 
              value={formData.cardId} 
              onValueChange={(value) => handleInputChange("cardId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cartão" />
              </SelectTrigger>
              <SelectContent>
                {cards?.map(card => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name} (•••• {card.last_four_digits})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Observações opcionais..."
              rows={3}
            />
          </div>

          <div>
            <Label>Tags</Label>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </div>

          {selectedCard && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Limite do cartão:</strong> R$ {selectedCard.credit_limit?.toFixed(2)}<br />
                <strong>Limite usado:</strong> R$ {selectedCard.used_amount?.toFixed(2)}<br />
                <strong>Limite disponível:</strong> R$ {(selectedCard.credit_limit - selectedCard.used_amount)?.toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Compra Parcelada"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};