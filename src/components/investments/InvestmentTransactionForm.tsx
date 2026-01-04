import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Investment, InvestmentTransactionFormData, InvestmentTransactionType, TRANSACTION_TYPE_LABELS } from '@/types/investments';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface InvestmentTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment | null;
  onSubmit: (data: InvestmentTransactionFormData) => Promise<{ error: string | null }>;
}

export function InvestmentTransactionForm({ open, onOpenChange, investment, onSubmit }: InvestmentTransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'aporte' as InvestmentTransactionType,
    quantity: 0,
    price: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investment) return;
    
    setLoading(true);
    
    const result = await onSubmit({
      investment_id: investment.id,
      type: formData.type,
      quantity: formData.quantity,
      price: formData.price,
      total_amount: formData.quantity * formData.price,
      date: formData.date,
      notes: formData.notes || undefined
    });
    
    setLoading(false);
    if (!result.error) {
      onOpenChange(false);
      setFormData({
        type: 'aporte',
        quantity: 0,
        price: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
    }
  };

  const totalAmount = formData.quantity * formData.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Nova Movimentação - {investment?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Movimentação *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: InvestmentTransactionType) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.000001"
                min="0"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço Unitário *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações sobre a movimentação..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
