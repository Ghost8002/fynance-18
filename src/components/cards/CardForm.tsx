import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus } from "lucide-react";
import TagSelector from "@/components/shared/TagSelector";

interface CardFormProps {
  onCardAdded?: () => void;
}

interface CardFormData {
  name: string;
  type: string;
  bank: string;
  credit_limit: string;
  closing_day: string;
  due_day: string;
  last_four_digits: string;
  color: string;
  selectedTags: string[];
}

export const CardForm = ({ onCardAdded }: CardFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { insert } = useSupabaseData('cards', user?.id);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CardFormData>({
    name: "",
    type: "credit",
    bank: "",
    credit_limit: "",
    closing_day: "1",
    due_day: "10",
    last_four_digits: "",
    color: "#3B82F6",
    selectedTags: []
  });

  const cardTypes = [
    { value: "credit", label: "Cartão de Crédito" },
    { value: "debit", label: "Cartão de Débito" },
    { value: "food", label: "Vale Alimentação" },
    { value: "meal", label: "Vale Refeição" },
    { value: "transportation", label: "Vale Transporte" }
  ];

  const cardColors = [
    { value: "#3B82F6", label: "Azul" },
    { value: "#EF4444", label: "Vermelho" },
    { value: "#10B981", label: "Verde" },
    { value: "#F59E0B", label: "Laranja" },
    { value: "#8B5CF6", label: "Roxo" },
    { value: "#6B7280", label: "Cinza" }
  ];

  const handleInputChange = (field: keyof CardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, selectedTags: tags }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome do cartão é obrigatório",
        description: "Por favor, informe o nome do cartão"
      });
      return false;
    }

    if (!formData.bank.trim()) {
      toast({
        variant: "destructive", 
        title: "Banco é obrigatório",
        description: "Por favor, informe o banco emissor do cartão"
      });
      return false;
    }

    if (formData.type === "credit") {
      if (!formData.credit_limit || parseFloat(formData.credit_limit) <= 0) {
        toast({
          variant: "destructive",
          title: "Limite de crédito deve ser maior que zero",
          description: "Por favor, informe um valor válido para o limite"
        });
        return false;
      }

      const closingDay = parseInt(formData.closing_day);
      const dueDay = parseInt(formData.due_day);
      
      if (closingDay < 1 || closingDay > 31) {
        toast({
          variant: "destructive",
          title: "Dia de fechamento deve ser entre 1 e 31",
          description: "Por favor, selecione um dia válido"
        });
        return false;
      }

      if (dueDay < 1 || dueDay > 31) {
        toast({
          variant: "destructive",
          title: "Dia de vencimento deve ser entre 1 e 31",
          description: "Por favor, selecione um dia válido"
        });
        return false;
      }
    }

    // Validate last four digits if provided
    if (formData.last_four_digits && !/^\d{4}$/.test(formData.last_four_digits)) {
      toast({
        variant: "destructive",
        title: "Últimos 4 dígitos inválidos",
        description: "Deve conter exatamente 4 números"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const cardData = {
        user_id: user?.id,
        name: formData.name.trim(),
        type: formData.type,
        bank: formData.bank.trim(),
        credit_limit: formData.type === "credit" ? parseFloat(formData.credit_limit) : 0,
        used_amount: 0,
        closing_day: formData.type === "credit" ? parseInt(formData.closing_day) : 1,
        due_day: formData.type === "credit" ? parseInt(formData.due_day) : 10,
        last_four_digits: formData.last_four_digits.trim(),
        color: formData.color,
        tags: formData.selectedTags
      };

      const { error } = await insert(cardData);

      if (error) {
        console.error('Insert error:', error);
        toast({
          variant: "destructive",
          title: "Erro ao adicionar cartão",
          description: error
        });
        return;
      }

      toast({
        title: "Cartão adicionado com sucesso!"
      });

      // Reset form
      setFormData({
        name: "",
        type: "credit",
        bank: "",
        credit_limit: "",
        closing_day: "1",
        due_day: "10",
        last_four_digits: "",
        color: "#3B82F6",
        selectedTags: []
      });

      setOpen(false);
      onCardAdded?.();

    } catch (error: any) {
      console.error('Error adding card:', error);
      
      let errorMessage = "Erro inesperado ao adicionar cartão";
      
      if (error.message?.includes('duplicate key')) {
        errorMessage = "Já existe um cartão com esses dados";
      } else if (error.message?.includes('invalid input')) {
        errorMessage = "Dados inválidos fornecidos";
      } else if (error.message?.includes('permission denied')) {
        errorMessage = "Você não tem permissão para realizar esta operação";
      } else if (error.message?.includes('network')) {
        errorMessage = "Erro de conexão. Verifique sua internet";
      } else if (error.message?.includes('bank')) {
        errorMessage = "Campo banco é obrigatório";
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao adicionar cartão",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cartão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cartão</DialogTitle>
          <DialogDescription>
            Cadastre um novo cartão para controlar seus gastos
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cartão *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Nubank Roxinho"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cardTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Banco *</Label>
              <Input
                id="bank"
                value={formData.bank}
                onChange={(e) => handleInputChange('bank', e.target.value)}
                placeholder="Ex: Nubank"
              />
            </div>
          </div>

          {formData.type === "credit" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Limite de Crédito *</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.credit_limit}
                  onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="closing_day">Dia de Fechamento</Label>
                  <Select value={formData.closing_day} onValueChange={(value) => handleInputChange('closing_day', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_day">Dia de Vencimento</Label>
                  <Select value={formData.due_day} onValueChange={(value) => handleInputChange('due_day', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Dia {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last_four_digits">Últimos 4 dígitos</Label>
              <Input
                id="last_four_digits"
                type="text"
                value={formData.last_four_digits}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  handleInputChange('last_four_digits', value);
                }}
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Select value={formData.color} onValueChange={(value) => handleInputChange('color', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cardColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TagSelector
            selectedTags={formData.selectedTags}
            onTagsChange={handleTagsChange}
          />

          {/* Preview */}
          <Card className="border-2" style={{ borderColor: formData.color }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: formData.color }}
                >
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">{formData.name || "Nome do Cartão"}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.bank || "Banco"} •••• {formData.last_four_digits || "0000"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar Cartão"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};