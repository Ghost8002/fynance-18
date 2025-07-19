
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import TagSelector from "@/components/shared/TagSelector";
import { isBefore } from "date-fns";

interface Debt {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  account_id?: string;
  is_recurring?: boolean;
  recurrence_type?: 'weekly' | 'monthly' | 'yearly';
}

interface DebtFormProps {
  debt?: Debt | null;
  onClose: () => void;
  onSave: () => void;
}

const DebtForm = ({ debt, onClose, onSave }: DebtFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: accounts } = useSupabaseData('accounts', user?.id);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: undefined as Date | undefined,
    status: 'pending' as 'pending' | 'paid' | 'overdue',
    notes: '',
    account_id: '',
    is_recurring: false,
    recurrence_type: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    selectedTags: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (debt) {
      console.log('Loading debt data:', debt);
      setFormData({
        description: debt.description,
        amount: debt.amount.toString(),
        due_date: new Date(debt.due_date),
        status: debt.status,
        notes: debt.notes || '',
        account_id: debt.account_id || '',
        is_recurring: debt.is_recurring || false,
        recurrence_type: debt.recurrence_type || 'monthly',
        selectedTags: []
      });
    }
  }, [debt]);

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
        description: "Recomendamos selecionar uma conta para permitir a geração automática de transações ao marcar como paga.",
        variant: "default",
      });
    }

    setLoading(true);
    try {
      const debtData = {
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

      console.log('Debt data to be saved:', debtData);

      if (debt) {
        // Update existing debt
        const { error } = await supabase
          .from('debts')
          .update(debtData)
          .eq('id', debt.id);

        if (error) {
          console.error('Error updating debt:', error);
          throw error;
        }
        toast({
          title: "Sucesso",
          description: "Dívida atualizada com sucesso",
        });
      } else {
        // Create new debt
        const { error } = await supabase
          .from('debts')
          .insert(debtData);

        if (error) {
          console.error('Error creating debt:', error);
          throw error;
        }

        // If debt is created as paid, create a transaction
        if (formData.status === 'paid' && formData.account_id) {
          const transactionData = {
            user_id: user.id,
            description: `Pagamento: ${formData.description}`,
            amount: -Math.abs(amount), // Usar o valor validado
            type: 'expense',
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
          description: "Dívida cadastrada com sucesso",
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving debt:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar dívida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
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
              {debt ? 'Editar Dívida' : 'Nova Dívida a Pagar'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {debt ? 'Atualize os dados da dívida' : 'Adicione uma nova dívida a ser paga'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Pagamento do cartão de crédito"
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
              <Label htmlFor="account">Conta de Pagamento</Label>
              <Select 
                value={formData.account_id || "none"} 
                onValueChange={(value) => setFormData({...formData, account_id: value === "none" ? "" : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta de onde será pago" />
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
                    Selecione uma conta para permitir a criação automática de transações ao marcar como paga.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <TagSelector
              selectedTags={formData.selectedTags}
              onTagsChange={handleTagsChange}
            />

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'pending' | 'paid' | 'overdue') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Paga</SelectItem>
                  <SelectItem value="overdue">Em Atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <Label htmlFor="is_recurring">Dívida Recorrente</Label>
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
                {loading ? 'Salvando...' : debt ? 'Atualizar' : 'Criar Dívida'}
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

export default DebtForm;
