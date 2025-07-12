
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionTypeSelectorProps {
  formData: {
    type: string;
  };
  onSelectChange: (name: string, value: string) => void;
  isGoalTransaction?: boolean;
}

const TransactionTypeSelector = ({
  formData,
  onSelectChange,
  isGoalTransaction = false,
}: TransactionTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="type">Tipo *</Label>
      <Select
        value={formData.type}
        onValueChange={(value) => onSelectChange("type", value)}
        disabled={isGoalTransaction} // Force income for goals
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="expense">Despesa</SelectItem>
          <SelectItem value="income">Receita</SelectItem>
        </SelectContent>
      </Select>
      {isGoalTransaction && (
        <p className="text-xs text-muted-foreground">
          Transações para metas são sempre receitas
        </p>
      )}
    </div>
  );
};

export default TransactionTypeSelector;
