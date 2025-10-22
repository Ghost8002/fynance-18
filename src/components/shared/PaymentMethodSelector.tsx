
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
  isMobile?: boolean;
}

const PaymentMethodSelector = ({
  formData,
  accounts,
  cards,
  onSelectChange,
  defaultAccountId,
  defaultCardId,
  isMobile = false,
}: PaymentMethodSelectorProps) => {
  return (
    <div className={`${isMobile ? 'grid grid-cols-1 gap-2 sm:gap-3' : 'grid grid-cols-2 gap-4'}`}>
      <div className={`${isMobile ? 'space-y-1.5' : 'space-y-2'}`}>
        <Label htmlFor="account" className={`${isMobile ? 'text-xs' : ''}`}>Conta</Label>
        <Select
          value={formData.account_id}
          onValueChange={(value) => onSelectChange("account_id", value)}
          disabled={!!defaultCardId}
        >
          <SelectTrigger className={`${isMobile ? 'h-8 text-xs' : ''}`}>
            <SelectValue placeholder="Selecione uma conta" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id} className={`${isMobile ? 'text-xs' : ''}`}>
                {account.name} - {account.bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className={`${isMobile ? 'space-y-1.5' : 'space-y-2'}`}>
        <Label htmlFor="card" className={`${isMobile ? 'text-xs' : ''}`}>Cartão</Label>
        <Select
          value={formData.card_id}
          onValueChange={(value) => onSelectChange("card_id", value)}
          disabled={!!defaultAccountId}
        >
          <SelectTrigger className={`${isMobile ? 'h-8 text-xs' : ''}`}>
            <SelectValue placeholder="Selecione um cartão" />
          </SelectTrigger>
          <SelectContent>
            {cards.map((card) => (
              <SelectItem key={card.id} value={card.id} className={`${isMobile ? 'text-xs' : ''}`}>
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
