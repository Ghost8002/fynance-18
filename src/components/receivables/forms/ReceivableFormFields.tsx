
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TagSelector from "@/components/shared/TagSelector";

interface ReceivableFormFieldsProps {
  formData: any;
  setFormData: (data: any) => void;
  accounts: any[];
  incomeCategories: any[];
}

const ReceivableFormFields: React.FC<ReceivableFormFieldsProps> = ({
  formData,
  setFormData,
  accounts,
  incomeCategories
}) => {
  const handleTagsChange = (tags: string[]) => {
    setFormData({ ...formData, selectedTags: tags });
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Ex: Pagamento do cliente João"
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
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
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
            <SelectValue placeholder="Selecione a conta onde receberá" />
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
            {incomeCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TagSelector
        selectedTags={formData.selectedTags || []}
        onTagsChange={handleTagsChange}
      />

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_recurring"
            checked={formData.is_recurring}
            onCheckedChange={(checked) => 
              setFormData({
                ...formData, 
                is_recurring: checked as boolean,
                recurrence_type: checked ? formData.recurrence_type : ''
              })
            }
          />
          <Label htmlFor="is_recurring">Pagamento Recorrente</Label>
        </div>

        {formData.is_recurring && (
          <div className="space-y-2">
            <Label htmlFor="recurrence_type">Tipo de Recorrência *</Label>
            <Select 
              value={formData.recurrence_type} 
              onValueChange={(value) => setFormData({...formData, recurrence_type: value})}
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
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          placeholder="Observações adicionais (opcional)"
          rows={3}
        />
      </div>
    </>
  );
};

export default ReceivableFormFields;
