
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentMethodSelectorProps {
  formData: {
    account_id: string;
    card_id: string;
  };
  accounts: any[];
  cards: any[];
  onSelectChange: (name: string, value: string) => void;
  defaultAccountId?: string;
  defaultCardId?: string;
}

const PaymentMethodSelector = ({
  formData,
  accounts,
  cards,
  onSelectChange,
  defaultAccountId,
  defaultCardId,
}: PaymentMethodSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="account">Conta</Label>
        <Select
          value={formData.account_id}
          onValueChange={(value) => onSelectChange("account_id", value)}
          disabled={!!defaultCardId}
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
      
      <div className="space-y-2">
        <Label htmlFor="card">Cartão</Label>
        <Select
          value={formData.card_id}
          onValueChange={(value) => onSelectChange("card_id", value)}
          disabled={!!defaultAccountId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cartão" />
          </SelectTrigger>
          <SelectContent>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.name} - *{card.last_four_digits}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
