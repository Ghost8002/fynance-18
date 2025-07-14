
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, Save, Star, Package } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ControlFormProps {
  onClose: () => void;
  onSave: (product: any) => void;
  importedTransactions?: any[];
}

export const ControlForm = ({ onClose, onSave, importedTransactions = [] }: ControlFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    purchaseDate: undefined as Date | undefined,
    warrantyEnd: undefined as Date | undefined,
    liveloPoints: '',
  });

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Se há transações importadas, pré-seleciona a primeira
  useEffect(() => {
    if (importedTransactions.length > 0 && !selectedTransaction) {
      setSelectedTransaction(importedTransactions[0]);
      setFormData(prev => ({
        ...prev,
        name: importedTransactions[0].description,
        category: importedTransactions[0].category?.name || '',
        description: `Produto importado da transação: ${importedTransactions[0].description}`,
        purchaseDate: new Date(importedTransactions[0].date),
      }));
    }
  }, [importedTransactions, selectedTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      id: Date.now().toString(),
      status: 'Dentro da garantia',
      liveloPoints: parseInt(formData.liveloPoints) || 0,
      importedFrom: selectedTransaction?.id || null,
    };

    onSave(productData);
  };

  const handleTransactionSelect = (transaction: any) => {
    setSelectedTransaction(transaction);
    setFormData(prev => ({
      ...prev,
      name: transaction.description,
      category: transaction.category?.name || '',
      description: `Produto importado da transação: ${transaction.description}`,
      purchaseDate: new Date(transaction.date),
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {importedTransactions.length > 0 ? 'Configurar Produto Importado' : 'Adicionar Produto'}
          </DialogTitle>
        </DialogHeader>

        {/* Seleção de Transação Importada */}
        {importedTransactions.length > 0 && (
          <div className="space-y-4 p-4 bg-finance-background-secondary rounded-lg">
            <Label className="text-finance-text-primary font-medium">
              Transações Importadas ({importedTransactions.length})
            </Label>
            <div className="grid gap-2">
              {importedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedTransaction?.id === transaction.id
                      ? "border-finance-primary bg-finance-primary/10"
                      : "border-finance-border hover:border-finance-primary/50"
                  )}
                  onClick={() => handleTransactionSelect(transaction)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-finance-text-primary">
                        {transaction.description}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-finance-text-secondary">
                          R$ {Math.abs(transaction.amount).toFixed(2)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(transaction.date), 'dd/MM/yyyy')}
                        </Badge>
                      </div>
                    </div>
                    {selectedTransaction?.id === transaction.id && (
                      <Badge className="bg-finance-primary">Selecionado</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: iPhone 14 Pro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ex: Eletrônicos"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do produto..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Compra</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchaseDate ? (
                      format(formData.purchaseDate, "dd/MM/yyyy")
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.purchaseDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, purchaseDate: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data do Fim da Garantia</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.warrantyEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.warrantyEnd ? (
                      format(formData.warrantyEnd, "dd/MM/yyyy")
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.warrantyEnd}
                    onSelect={(date) => setFormData(prev => ({ ...prev, warrantyEnd: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="liveloPoints" className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Pontos Livelo
            </Label>
            <Input
              id="liveloPoints"
              type="number"
              value={formData.liveloPoints}
              onChange={(e) => setFormData(prev => ({ ...prev, liveloPoints: e.target.value }))}
              placeholder="Ex: 1200"
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" className="bg-finance-primary hover:bg-finance-primary/90">
              <Save className="mr-2 h-4 w-4" />
              Salvar Produto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
