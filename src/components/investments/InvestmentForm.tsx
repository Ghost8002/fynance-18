import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Investment, InvestmentFormData, InvestmentType, IndexType, INVESTMENT_TYPE_LABELS, INDEX_TYPE_LABELS } from '@/types/investments';
import { Loader2 } from 'lucide-react';

interface InvestmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: Investment | null;
  onSubmit: (data: InvestmentFormData) => Promise<{ error: string | null }>;
}

export function InvestmentForm({ open, onOpenChange, investment, onSubmit }: InvestmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InvestmentFormData>({
    name: '',
    type: 'renda_fixa',
    ticker: '',
    institution: '',
    quantity: 1,
    average_price: 0,
    current_price: 0,
    purchase_date: '',
    maturity_date: '',
    interest_rate: undefined,
    index_type: null,
    notes: ''
  });

  useEffect(() => {
    if (investment) {
      setFormData({
        name: investment.name,
        type: investment.type,
        ticker: investment.ticker || '',
        institution: investment.institution || '',
        quantity: investment.quantity,
        average_price: investment.average_price,
        current_price: investment.current_price,
        purchase_date: investment.purchase_date || '',
        maturity_date: investment.maturity_date || '',
        interest_rate: investment.interest_rate || undefined,
        index_type: investment.index_type,
        notes: investment.notes || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'renda_fixa',
        ticker: '',
        institution: '',
        quantity: 1,
        average_price: 0,
        current_price: 0,
        purchase_date: '',
        maturity_date: '',
        interest_rate: undefined,
        index_type: null,
        notes: ''
      });
    }
  }, [investment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await onSubmit({
      ...formData,
      ticker: formData.ticker || undefined,
      institution: formData.institution || undefined,
      purchase_date: formData.purchase_date || undefined,
      maturity_date: formData.maturity_date || undefined,
      notes: formData.notes || undefined
    });
    
    setLoading(false);
    if (!result.error) {
      onOpenChange(false);
    }
  };

  const isRendaFixa = formData.type === 'renda_fixa' || formData.type === 'previdencia';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {investment ? 'Editar Investimento' : 'Novo Investimento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Ativo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Tesouro IPCA+ 2029"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: InvestmentType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INVESTMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker</Label>
              <Input
                id="ticker"
                value={formData.ticker}
                onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                placeholder="Ex: PETR4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution">Instituição</Label>
            <Input
              id="institution"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="Ex: XP Investimentos"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.000001"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="average_price">Preço Médio *</Label>
              <Input
                id="average_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.average_price}
                onChange={(e) => setFormData({ ...formData, average_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_price">Preço Atual *</Label>
              <Input
                id="current_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.current_price}
                onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          {isRendaFixa && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="index_type">Indexador</Label>
                  <Select
                    value={formData.index_type || ''}
                    onValueChange={(value: string) => setFormData({ ...formData, index_type: value as IndexType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INDEX_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest_rate">Taxa (% a.a.)</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    value={formData.interest_rate || ''}
                    onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || undefined })}
                    placeholder="Ex: 5.5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maturity_date">Data de Vencimento</Label>
                <Input
                  id="maturity_date"
                  type="date"
                  value={formData.maturity_date}
                  onChange={(e) => setFormData({ ...formData, maturity_date: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="purchase_date">Data da Compra</Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anotações sobre o investimento..."
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
              {investment ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
