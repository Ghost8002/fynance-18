
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinancialPeriod } from "@/hooks/useFinancialPeriod";
import { formatFinancialPeriod } from "@/utils/financialPeriod";

interface TransactionFormFieldsProps {
  formData: {
    description: string;
    amount: string;
    category_id: string;
    date: string;
    notes: string;
    type: string;
  };
  categories: any[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const TransactionFormFields = ({
  formData,
  categories,
  onInputChange,
  onSelectChange,
}: TransactionFormFieldsProps) => {
  const { getCurrentFinancialPeriod } = useFinancialPeriod();
  
  // Filter categories by transaction type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  // Obter período financeiro atual para exibir informação ao usuário
  const currentPeriod = getCurrentFinancialPeriod();

  return (
    <>
      {/* Description & Amount */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input
          id="description"
          name="description"
          placeholder="Ex: Compras no supermercado"
          value={formData.description}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$) *</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={formData.amount}
          onChange={onInputChange}
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Categoria *</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => onSelectChange("category_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date with financial period info */}
      <div className="space-y-2">
        <Label htmlFor="date">Data *</Label>
        <Input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={onInputChange}
          required
        />
        <p className="text-xs text-muted-foreground">
          Período financeiro atual: {formatFinancialPeriod(currentPeriod)}
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Adicione detalhes sobre esta transação"
          value={formData.notes}
          onChange={onInputChange}
        />
      </div>
    </>
  );
};

export default TransactionFormFields;
