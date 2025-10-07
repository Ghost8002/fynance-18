
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
import { CalendarIcon, AlertCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import TagSelector from "@/components/shared/TagSelector";
import CategorySelector from "@/components/shared/CategorySelector";
 

interface Debt {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  notes?: string;
  account_id?: string;
  category_id?: string;
  is_recurring?: boolean;
  recurrence_type?: 'weekly' | 'monthly' | 'yearly';
  card_id?: string;
  is_card_bill?: boolean;
  bill_month?: number;
  bill_year?: number;
  installment_id?: string;
  installment_number?: number;
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
  const { data: categories } = useSupabaseData('categories', user?.id);
  const { data: cards } = useSupabaseData('cards', user?.id);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: undefined as Date | undefined,
    status: 'pending' as 'pending' | 'paid' | 'overdue',
    notes: '',
    account_id: '',
    category_id: '',
    is_recurring: false,
    recurrence_type: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    max_occurrences: '',
    recurrence_end_date: undefined as Date | undefined,
    selectedTags: [] as string[],
    card_id: '',
    is_card_bill: false,
    bill_month: '',
    bill_year: '',
    installment_id: '',
    installment_number: ''
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
        category_id: debt.category_id || '',
        is_recurring: debt.is_recurring || false,
        recurrence_type: debt.recurrence_type || 'monthly',
        max_occurrences: (debt as any).max_occurrences?.toString() || '',
        recurrence_end_date: (debt as any).recurrence_end_date ? new Date((debt as any).recurrence_end_date) : undefined,
        selectedTags: [],
        card_id: debt.card_id || '',
        is_card_bill: debt.is_card_bill || false,
        bill_month: debt.bill_month?.toString() || '',
        bill_year: debt.bill_year?.toString() || '',
        installment_id: debt.installment_id || '',
        installment_number: debt.installment_number?.toString() || ''
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
          description: "Para dívidas recorrentes, defina um limite: número máximo de parcelas ou data de término",
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
        description: "Recomendamos selecionar uma conta para permitir a geração automática de transações ao marcar como paga.",
        variant: "default",
      });
    }

    setLoading(true);
    try {
      if (debt) {
        // Update existing debt
        const debtData = {
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
          recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? format(formData.recurrence_end_date, 'yyyy-MM-dd') : null,
          card_id: formData.card_id || null,
          is_card_bill: formData.is_card_bill,
          bill_month: formData.is_card_bill && formData.bill_month ? parseInt(formData.bill_month) : null,
          bill_year: formData.is_card_bill && formData.bill_year ? parseInt(formData.bill_year) : null,
          installment_id: formData.installment_id || null,
          installment_number: formData.installment_id && formData.installment_number ? parseInt(formData.installment_number) : null
        };

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
        // Create new debt directly using insert
        const { data, error } = await supabase
          .from('debts')
          .insert({
            user_id: user.id,
            description: formData.description,
            amount: amount,
            due_date: format(formData.due_date, 'yyyy-MM-dd'),
            account_id: formData.account_id || null,
            category_id: formData.category_id || null,
            notes: formData.notes || null,
            is_recurring: formData.is_recurring,
            recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
            max_occurrences: formData.is_recurring && formData.max_occurrences ? parseInt(formData.max_occurrences) : null,
            recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? format(formData.recurrence_end_date, 'yyyy-MM-dd') : null,
            status: 'pending'
          })
          .select();

        if (error) {
          console.error('Error creating debt:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          throw new Error('Erro ao criar dívida');
        }

        // If debt is created as paid, create a transaction
        if (formData.status === 'paid' && formData.account_id) {
          const transactionData = {
            user_id: user.id,
            description: `Pagamento: ${formData.description}`,
            amount: -Math.abs(amount),
            type: 'expense',
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

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <CategorySelector
                value={formData.category_id || ""}
                onChange={(value) => setFormData({...formData, category_id: value})}
                categories={categories || []}
                type="expense"
                placeholder="Selecione uma categoria"
              />
            </div>

            <TagSelector
              selectedTags={formData.selectedTags}
              onTagsChange={handleTagsChange}
            />

            {/* Card Integration Fields */}
            <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-lg">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <Label className="text-sm font-medium">Integração com Cartão (Opcional)</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="card">Cartão Relacionado</Label>
                <Select 
                  value={formData.card_id || "none"} 
                  onValueChange={(value) => setFormData({...formData, card_id: value === "none" ? "" : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cartão (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum cartão</SelectItem>
                    {cards?.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name} - {card.last_four_digits}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.card_id && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_card_bill"
                        checked={formData.is_card_bill}
                        onCheckedChange={(checked) => setFormData({...formData, is_card_bill: checked})}
                      />
                      <Label htmlFor="is_card_bill">Esta dívida representa uma fatura de cartão</Label>
                    </div>
                  </div>

                  {formData.is_card_bill && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bill_month">Mês da Fatura</Label>
                        <Select 
                          value={formData.bill_month || ""} 
                          onValueChange={(value) => setFormData({...formData, bill_month: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Mês" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 12}, (_, i) => i + 1).map((month) => (
                              <SelectItem key={month} value={month.toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bill_year">Ano da Fatura</Label>
                        <Select 
                          value={formData.bill_year || ""} 
                          onValueChange={(value) => setFormData({...formData, bill_year: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ano" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_installment"
                        checked={!!formData.installment_id}
                        onCheckedChange={(checked) => {
                          if (!checked) {
                            setFormData({...formData, installment_id: '', installment_number: ''});
                          }
                        }}
                      />
                      <Label htmlFor="is_installment">Esta dívida representa uma parcela de cartão</Label>
                    </div>
                  </div>

                  {formData.installment_id && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="installment_id">ID do Parcelamento</Label>
                        <Input
                          id="installment_id"
                          value={formData.installment_id}
                          onChange={(e) => setFormData({...formData, installment_id: e.target.value})}
                          placeholder="UUID do parcelamento"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="installment_number">Número da Parcela</Label>
                        <Input
                          id="installment_number"
                          type="number"
                          value={formData.installment_number}
                          onChange={(e) => setFormData({...formData, installment_number: e.target.value})}
                          placeholder="1, 2, 3..."
                          min="1"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

{debt && (
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
            )}

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
