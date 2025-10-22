
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
  isMobile?: boolean;
}

const TransactionTypeSelector = ({
  formData,
  onSelectChange,
  isGoalTransaction = false,
  isMobile = false,
}: TransactionTypeSelectorProps) => {
  return (
    <div className={`${isMobile ? 'space-y-1 sm:space-y-1.5' : 'space-y-2'}`}>
      <Label htmlFor="type" className={`${isMobile ? 'text-xs' : ''}`}>Tipo *</Label>
      <Select
        value={formData.type}
        onValueChange={(value) => onSelectChange("type", value)}
        disabled={isGoalTransaction} // Force income for goals
      >
        <SelectTrigger className={`${isMobile ? 'h-8 text-xs' : ''}`}>
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="expense" className={`${isMobile ? 'text-xs' : ''}`}>Despesa</SelectItem>
          <SelectItem value="income" className={`${isMobile ? 'text-xs' : ''}`}>Receita</SelectItem>
        </SelectContent>
      </Select>
      {isGoalTransaction && (
        <p className={`text-xs text-muted-foreground ${isMobile ? 'text-[10px]' : ''}`}>
          Transações para metas são sempre receitas
        </p>
      )}
    </div>
  );
};

export default TransactionTypeSelector;
