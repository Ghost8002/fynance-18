import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useTags } from "@/hooks/useTags";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import TagSelector from "@/components/shared/TagSelector";

interface InstallmentPurchaseFormProps {
  onPurchaseAdded?: () => void;
}

export const InstallmentPurchaseForm = ({ onPurchaseAdded }: InstallmentPurchaseFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: cards } = useSupabaseData('cards', user?.id);
  const { tags } = useTags();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    description: "",
    totalAmount: "",
    installments: "1",
    firstInstallmentDate: new Date().toISOString().split('T')[0],
    categoryId: "",
    cardId: "",
    notes: ""
  });

  const expenseCategories = categories?.filter(cat => cat.type === 'expense') || [];

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

    if (!formData.description || !formData.totalAmount || !formData.categoryId || !formData.cardId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = parseFloat(formData.totalAmount);
    const installmentCount = parseInt(formData.installments);
    
    if (totalAmount <= 0 || installmentCount <= 0) {
      toast({
        title: "Erro",
        description: "Valores devem ser maiores que zero",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const installmentAmount = totalAmount / installmentCount;
      const firstDate = new Date(formData.firstInstallmentDate);

      // Prepare tags data - store directly in the tags column as JSONB
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

      // Create all installment transactions
      const transactions = [];
      
      for (let i = 0; i < installmentCount; i++) {
        const installmentDate = new Date(firstDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);
        
        const transaction = {
          user_id: user.id,
          type: 'expense' as const,
          description: installmentCount > 1 
            ? `${formData.description} (${i + 1}/${installmentCount})`
            : formData.description,
          amount: installmentAmount,
          category_id: formData.categoryId,
          card_id: formData.cardId,
          date: installmentDate.toISOString().split('T')[0],
          notes: formData.notes || null,
          installments_count: installmentCount,
          installment_number: i + 1,
          parent_transaction_id: i === 0 ? null : undefined, // Will be set for subsequent installments
          tags: transactionTags // Store tags directly in the JSONB column
        };

        transactions.push(transaction);
      }

      // Insert the first transaction (parent)
      const { data: parentTransaction, error: parentError } = await supabase
        .from('transactions')
        .insert(transactions[0])
        .select()
        .single();

      if (parentError) throw parentError;

      // Insert remaining transactions with parent reference
      if (transactions.length > 1) {
        const childTransactions = transactions.slice(1).map(transaction => ({
          ...transaction,
          parent_transaction_id: parentTransaction.id
        }));

        const { error: childError } = await supabase
          .from('transactions')
          .insert(childTransactions);

        if (childError) throw childError;
      }

      // Update card used amount
      const selectedCard = cards?.find(c => c.id === formData.cardId);
      if (selectedCard) {
        const newUsedAmount = parseFloat(selectedCard.used_amount || '0') + totalAmount;
        
        await supabase
          .from('cards')
          .update({ used_amount: newUsedAmount })
          .eq('id', formData.cardId);
      }

      toast({
        title: "Sucesso",
        description: `Compra parcelada em ${installmentCount}x criada com sucesso!`,
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

    } catch (error) {
      console.error('Error creating installment purchase:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a compra parcelada",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Nova Compra Parcelada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Nova Compra Parcelada</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: iPhone 15"
            />
          </div>

          <div>
            <Label htmlFor="totalAmount">Valor Total *</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label htmlFor="installments">Número de Parcelas *</Label>
            <Select value={formData.installments} onValueChange={(value) => setFormData({ ...formData, installments: value })}>
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
              onChange={(e) => setFormData({ ...formData, firstInstallmentDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="cardId">Cartão *</Label>
            <Select value={formData.cardId} onValueChange={(value) => setFormData({ ...formData, cardId: value })}>
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
            <Label htmlFor="categoryId">Categoria *</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações opcionais"
            />
          </div>

          <TagSelector
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Criando..." : "Criar Compra"}
            </Button>
          </div>
        </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};