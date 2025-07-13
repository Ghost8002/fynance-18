
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  // Filter categories based on transaction type
  const filteredCategories = categories.filter(category => {
    if (formData.type === 'income') {
      return category.type === 'income';
    } else if (formData.type === 'expense') {
      return category.type === 'expense';
    }
    return true; // Show all if type is not set
  });

  // Sort categories: default categories first, then by sort_order, then by name
  const sortedCategories = filteredCategories.sort((a, b) => {
    // Default categories first
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    
    // Then by sort_order
    const sortOrderA = a.sort_order || 0;
    const sortOrderB = b.sort_order || 0;
    if (sortOrderA !== sortOrderB) return sortOrderA - sortOrderB;
    
    // Finally by name
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Input
          id="description"
          name="description"
          type="text"
          placeholder="Ex: Compra no supermercado"
          value={formData.description}
          onChange={onInputChange}
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
          onChange={onInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria *</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => onSelectChange("category_id", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {sortedCategories.length > 0 ? (
              sortedCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                    {category.is_default && (
                      <span className="text-xs text-muted-foreground">(Padrão)</span>
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                {formData.type === 'income' 
                  ? 'Nenhuma categoria de receita encontrada'
                  : formData.type === 'expense'
                  ? 'Nenhuma categoria de despesa encontrada'
                  : 'Selecione o tipo de transação primeiro'
                }
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

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
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Observações adicionais (opcional)"
          value={formData.notes}
          onChange={onInputChange}
          rows={3}
        />
      </div>
    </>
  );
};

export default TransactionFormFields;
