import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ControlFormProps {
  onClose: () => void;
  onSave: (product: any) => void;
}

export const ControlForm = ({ onClose, onSave }: ControlFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    purchaseDate: null as Date | null,
    warrantyEnd: null as Date | null,
    liveloPoints: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      id: Date.now().toString(),
      status: formData.warrantyEnd && formData.warrantyEnd > new Date() 
        ? 'Dentro da garantia' 
        : 'Garantia vencida',
    };
    
    onSave(productData);
  };

  const categories = [
    'Eletrônicos',
    'Eletrodomésticos',
    'Móveis',
    'Informática',
    'Casa e Jardim',
    'Esporte e Lazer',
    'Outros'
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-finance-card border-finance-border">
        <DialogHeader>
          <DialogTitle className="text-finance-text-primary">Adicionar Produto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-finance-text-secondary">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: iPhone 14 Pro"
                required
                className="bg-finance-background border-finance-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-finance-text-secondary">Categoria</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="bg-finance-background border-finance-border">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-finance-text-secondary">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o produto..."
              className="bg-finance-background border-finance-border"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-finance-text-secondary">Data da Compra</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-finance-background border-finance-border",
                      !formData.purchaseDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchaseDate ? format(formData.purchaseDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.purchaseDate || undefined}
                    onSelect={(date) => setFormData({ ...formData, purchaseDate: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-finance-text-secondary">Fim da Garantia</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-finance-background border-finance-border",
                      !formData.warrantyEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.warrantyEnd ? format(formData.warrantyEnd, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.warrantyEnd || undefined}
                    onSelect={(date) => setFormData({ ...formData, warrantyEnd: date || null })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="liveloPoints" className="text-finance-text-secondary">Pontos Livelo</Label>
            <Input
              id="liveloPoints"
              type="number"
              value={formData.liveloPoints}
              onChange={(e) => setFormData({ ...formData, liveloPoints: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="bg-finance-background border-finance-border"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-finance-border"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-finance-primary hover:bg-finance-primary/90"
            >
              Salvar Produto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};