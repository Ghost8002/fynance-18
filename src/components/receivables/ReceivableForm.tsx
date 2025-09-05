import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
 
import TagSelector from "@/components/shared/TagSelector";

interface Receivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'received' | 'overdue';
  notes?: string;
  account_id?: string;
  category_id?: string;
  is_recurring?: boolean;
  recurrence_type?: 'weekly' | 'monthly' | 'yearly';
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
    due_date: undefined as Date | undefined,
    status: 'pending' as 'pending' | 'received' | 'overdue',
    notes: '',
    account_id: '',
    category_id: '',
    is_recurring: false,
    recurrence_type: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    max_occurrences: '',
    recurrence_end_date: undefined as Date | undefined,
    selectedTags: [] as string[]
  });

  useEffect(() => {
    if (receivable) {
      console.log('Loading receivable data:', receivable);
      setFormData({
        description: receivable.description,
        amount: receivable.amount.toString(),
        due_date: new Date(receivable.due_date),
        status: receivable.status,
        notes: receivable.notes || '',
        account_id: receivable.account_id || '',
        category_id: receivable.category_id || '',
        is_recurring: receivable.is_recurring || false,
        recurrence_type: receivable.recurrence_type || 'monthly',
        max_occurrences: (receivable as any).max_occurrences?.toString() || '',
        recurrence_end_date: (receivable as any).recurrence_end_date ? new Date((receivable as any).recurrence_end_date) : undefined,
        selectedTags: []
      });
    }
  }, [receivable]);

  const handleTagsChange = (tags: string[]) => {
    setFormData({ ...formData, selectedTags: tags });
  };

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

    // Validação de data (não permitir datas muito antigas)
    const dueDate = new Date(formData.due_date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (dueDate < oneYearAgo) {
      toast({
        title: "Atenção",
        description: "Data de vencimento muito antiga. Isso pode afetar o histórico financeiro.",
        variant: "default",
      });
    }

    // Validação de recorrência
    if (formData.is_recurring) {
      if (!formData.recurrence_type) {
        toast({
          title: "Erro",
          description: "Selecione o tipo de recorrência",
          variant: "destructive",
        });
        return;
      }

      // Validação de limite de recorrência
      if (!formData.max_occurrences && !formData.recurrence_end_date) {
        toast({
          title: "Erro",
          description: "Para pagamentos recorrentes, defina um limite: número máximo de parcelas ou data de término",
          variant: "destructive",
        });
        return;
      }

      if (formData.max_occurrences && parseInt(formData.max_occurrences) <= 0) {
        toast({
          title: "Erro",
          description: "O número máximo de parcelas deve ser maior que zero",
          variant: "destructive",
        });
        return;
      }
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
      if (receivable) {
        // Update existing receivable
        const receivableData = {
          user_id: user.id,
          description: formData.description,
          amount: amount,
          due_date: format(formData.due_date, 'yyyy-MM-dd'),
          status: formData.status,
          notes: formData.notes || null,
          account_id: formData.account_id || null,
          category_id: formData.category_id || null,
          is_recurring: formData.is_recurring,
          recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
          max_occurrences: formData.is_recurring && formData.max_occurrences ? parseInt(formData.max_occurrences) : null,
          recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? format(formData.recurrence_end_date, 'yyyy-MM-dd') : null
        };

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
        // Create new receivable using validation function
        const { data, error } = await supabase.rpc('create_receivable_with_validation', {
          p_description: formData.description,
          p_amount: amount,
          p_due_date: format(formData.due_date, 'yyyy-MM-dd'),
          p_account_id: formData.account_id || null,
          p_category_id: formData.category_id || null,
          p_notes: formData.notes || null,
          p_is_recurring: formData.is_recurring,
          p_recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
          p_max_occurrences: formData.is_recurring && formData.max_occurrences ? parseInt(formData.max_occurrences) : null,
          p_recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? format(formData.recurrence_end_date, 'yyyy-MM-dd') : null
        });

        if (error) {
          console.error('Error creating receivable:', error);
          throw error;
        }

        if (!data.success) {
          if (data.error === 'DUPLICATE') {
            toast({
              title: "Erro",
              description: "Já existe um pagamento com essas características. Verifique os dados e tente novamente.",
              variant: "destructive",
            });
            return;
          } else {
            throw new Error(data.message || 'Erro ao criar pagamento');
          }
        }

        // If receivable is created as received, create a transaction
        if (formData.status === 'received' && formData.account_id) {
          const transactionData = {
            user_id: user.id,
            description: `Recebimento: ${formData.description}`,
            amount: Math.abs(amount),
            type: 'income',
            date: format(formData.due_date, 'yyyy-MM-dd'), // ✅ Usar data de vencimento
            account_id: formData.account_id,
            category_id: formData.category_id || null
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
    <div className="w-full max-w-2xl mx-auto">
      <ScrollArea className="h-[80vh] pr-4">
        <div className="space-y-6 p-1">
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {receivable ? 'Editar Pagamento' : 'Novo Pagamento a Receber'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {receivable ? 'Atualize os dados do pagamento' : 'Adicione um novo pagamento a receber'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Salário, Freelance, Aluguel"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
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

            <div className="space-y-2">
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
                    {formData.due_date ? format(formData.due_date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => setFormData({...formData, due_date: date})}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Conta de Recebimento</Label>
              <Select 
                value={formData.account_id || "none"} 
                onValueChange={(value) => setFormData({...formData, account_id: value === "none" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta onde será recebido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma conta</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} - {account.bank || 'Sem banco'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {!formData.account_id && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Selecione uma conta para permitir a criação automática de transações ao marcar como recebido.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category_id || "none"} 
                onValueChange={(value) => setFormData({...formData, category_id: value === "none" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma categoria</SelectItem>
                  {categories?.filter(cat => cat.type === 'income').map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TagSelector
              selectedTags={formData.selectedTags}
              onTagsChange={handleTagsChange}
            />

{receivable && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'pending' | 'received' | 'overdue') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="received">Recebido</SelectItem>
                    <SelectItem value="overdue">Em Atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <Label htmlFor="is_recurring">Pagamento Recorrente</Label>
              </div>

              {formData.is_recurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurrence_type">Tipo de Recorrência *</Label>
                  <Select 
                    value={formData.recurrence_type} 
                    onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => setFormData({...formData, recurrence_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a recorrência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Campos de limite de recorrência */}
                  <div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/20">
                    <Label className="text-sm font-medium">Limite da Recorrência</Label>
                    <p className="text-xs text-muted-foreground">
                      Defina quando a recorrência deve parar (obrigatório)
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="max_occurrences">Número Máximo de Parcelas</Label>
                        <Input
                          id="max_occurrences"
                          type="number"
                          min="1"
                          value={formData.max_occurrences}
                          onChange={(e) => setFormData({ ...formData, max_occurrences: e.target.value })}
                          placeholder="Ex: 12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Data de Término</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.recurrence_end_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.recurrence_end_date ? format(formData.recurrence_end_date, "dd/MM/yyyy", { locale: ptBR }) : "Data limite"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={formData.recurrence_end_date}
                              onSelect={(date) => setFormData({...formData, recurrence_end_date: date})}
                              initialFocus
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Você pode definir um ou ambos os limites. A recorrência parará quando o primeiro limite for atingido.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais (opcional)"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : receivable ? 'Atualizar' : 'Criar Pagamento'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReceivableForm; 