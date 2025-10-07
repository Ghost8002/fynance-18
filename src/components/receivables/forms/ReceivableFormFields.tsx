
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CategorySelector from "@/components/shared/CategorySelector";

interface ReceivableFormFieldsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  accounts: any[];
  incomeCategories: any[];
}

const ReceivableFormFields: React.FC<ReceivableFormFieldsProps> = ({
  formData,
  setFormData,
  accounts,
  incomeCategories,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev: any) => ({ ...prev, due_date: date }));
  };

  const handleRecurringChange = (checked: boolean) => {
    setFormData((prev: any) => ({ 
      ...prev, 
      is_recurring: checked,
      recurrence_type: checked ? 'monthly' : ''
    }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input
          id="description"
          name="description"
          type="text"
          placeholder="Ex: Venda de produto, Serviço prestado"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor *</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={formData.amount}
          onChange={handleInputChange}
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
                "justify-start text-left font-normal w-full",
                !formData.due_date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.due_date ? (
                format(formData.due_date, "dd/MM/yyyy")
              ) : (
                <span>Selecione a data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={formData.due_date}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {incomeCategories && incomeCategories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="category_id">Categoria</Label>
          <CategorySelector
            value={formData.category_id}
            onChange={(value) => handleSelectChange("category_id", value)}
            categories={incomeCategories}
            type="income"
            placeholder="Selecione uma categoria"
          />
        </div>
      )}

      {accounts && accounts.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="account_id">Conta</Label>
          <Select
            value={formData.account_id}
            onValueChange={(value) => handleSelectChange("account_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} - {account.bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Observações adicionais (opcional)"
          value={formData.notes}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_recurring"
          checked={formData.is_recurring}
          onCheckedChange={handleRecurringChange}
        />
        <Label htmlFor="is_recurring">Pagamento recorrente</Label>
      </div>

      {formData.is_recurring && (
        <div className="space-y-2">
          <Label htmlFor="recurrence_type">Tipo de Recorrência</Label>
          <Select
            value={formData.recurrence_type}
            onValueChange={(value) => handleSelectChange("recurrence_type", value)}
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
  );
};

export default ReceivableFormFields;
