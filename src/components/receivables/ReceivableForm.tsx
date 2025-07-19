import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { isBefore } from "date-fns";

interface Receivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  notes?: string;
  account_id?: string;
  category_id?: string;
  is_recurring: boolean;
  recurrence_type?: string;
}

interface ReceivableFormProps {
  receivable?: Receivable | null;
  onClose: () => void;
  onSave: () => void;
}

const ReceivableForm: React.FC<ReceivableFormProps> = ({ receivable, onClose, onSave }) => {
  const { user } = useSupabaseAuth();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: new Date(),
    status: 'pending',
    notes: '',
    account_id: '',
    category_id: '',
    is_recurring: false,
    recurrence_type: ''
  });

  // Find default income category
  const defaultIncomeCategory = categories.find(cat => 
    cat.type === 'income' && (cat.name.toLowerCase().includes('outros') || cat.name.toLowerCase().includes('receita'))
  ) || categories.find(cat => cat.type === 'income');

  useEffect(() => {
    if (receivable) {
      setFormData({
        description: receivable.description,
        amount: receivable.amount.toString(),
        due_date: new Date(receivable.due_date),
        status: receivable.status,
        notes: receivable.notes || '',
        account_id: receivable.account_id || '',
        category_id: receivable.category_id || '',
        is_recurring: receivable.is_recurring,
        recurrence_type: receivable.recurrence_type || ''
      });
    }
  }, [receivable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    console.log('Form data before validation:', formData);

    if (!formData.description || !formData.amount || !formData.due_date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validação de data de vencimento
    if (formData.due_date && isBefore(formData.due_date, new Date())) {
      toast({
        title: "Erro",
        description: "A data de vencimento deve ser futura",
        variant: "destructive",
      });
      return;
    }

    // Validação de valor
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
      toast({
        title: "Erro",
        description: "O valor deve ser um número positivo válido",
        variant: "destructive",
      });
      return;
    }

    if (formData.is_recurring && !formData.recurrence_type) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de recorrência",
        variant: "destructive",
      });
      return;
    }

    if (!formData.account_id) {
      toast({
        title: "Atenção",
        description: "Recomendamos selecionar uma conta para permitir a geração automática de transações ao marcar como recebido.",
        variant: "default",
      });
    }

    setLoading(true);
    try {
      const receivableData = {
        user_id: user.id,
        description: formData.description,
        amount: amount, // Usar o valor validado
        due_date: format(formData.due_date, 'yyyy-MM-dd'),
        status: formData.status,
        notes: formData.notes || null,
        account_id: formData.account_id || null,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null
      };

      console.log('Receivable data to be saved:', receivableData);

      if (receivable) {
        // Update existing receivable
        const { error } = await supabase
          .from('receivable_payments')
          .update(receivableData)
          .eq('id', receivable.id);

        if (error) {
          console.error('Error updating receivable:', error);
          throw error;
        }
        toast({
          title: "Sucesso",
          description: "Pagamento atualizado com sucesso",
        });
      } else {
        // Create new receivable
        const { error } = await supabase
          .from('receivable_payments')
          .insert(receivableData);

        if (error) {
          console.error('Error creating receivable:', error);
          throw error;
        }

        // If receivable is created as received, create a transaction
        if (formData.status === 'received' && formData.account_id) {
          const transactionData = {
            user_id: user.id,
            description: `Recebimento: ${formData.description}`,
            amount: Math.abs(amount), // Usar o valor validado
            type: 'income',
            date: format(formData.due_date, 'yyyy-MM-dd'),
            account_id: formData.account_id
          };

          console.log('Creating transaction:', transactionData);

          const { error: transactionError } = await supabase
            .from('transactions')
            .insert(transactionData);

          if (transactionError) {
            console.error('Error creating transaction:', transactionError);
          }
        }

        toast({
          title: "Sucesso",
          description: "Pagamento cadastrado com sucesso",
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving receivable:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Descrição *</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ex: Salário, Freelance, Aluguel"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <Label htmlFor="amount">Valor *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0,00"
            required
          />
        </div>

        {/* Due Date */}
        <div>
          <Label>Data de Vencimento *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.due_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.due_date ? format(formData.due_date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione uma data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.due_date}
                onSelect={(date) => date && setFormData({ ...formData, due_date: date })}
                initialFocus
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Account */}
        <div>
          <Label htmlFor="account">Conta</Label>
          <Select
            value={formData.account_id}
            onValueChange={(value) => setFormData({ ...formData, account_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts?.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} - {account.bank || 'Sem banco'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories?.filter(cat => cat.type === 'income').map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="received">Recebido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recurring */}
        <div className="flex items-center space-x-2">
          <Switch
            id="recurring"
            checked={formData.is_recurring}
            onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
          />
          <Label htmlFor="recurring">Pagamento Recorrente</Label>
        </div>

        {/* Recurrence Type */}
        {formData.is_recurring && (
          <div>
            <Label htmlFor="recurrence_type">Tipo de Recorrência</Label>
            <Select
              value={formData.recurrence_type}
              onValueChange={(value) => setFormData({ ...formData, recurrence_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Informações adicionais sobre o pagamento..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {receivable ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};

export default ReceivableForm; 