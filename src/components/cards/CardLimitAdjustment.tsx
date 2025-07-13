
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

interface CardLimitAdjustmentProps {
  cardId: string;
  currentLimit: number;
  onUpdate?: () => void;
}

export const CardLimitAdjustment = ({ cardId, currentLimit, onUpdate }: CardLimitAdjustmentProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newLimit: currentLimit.toString(),
    reason: ""
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    const newLimit = parseFloat(formData.newLimit);
    if (newLimit <= 0) {
      toast({
        title: "Erro",
        description: "O limite deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('adjust_card_limit', {
        p_card_id: cardId,
        p_new_limit: newLimit,
        p_reason: formData.reason || 'Ajuste de limite'
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Limite ajustado para ${formatCurrency(newLimit)}`,
      });

      // Reset form
      setFormData({
        newLimit: newLimit.toString(),
        reason: ""
      });

      setOpen(false);
      onUpdate?.();

    } catch (error: any) {
      console.error('Error adjusting limit:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível ajustar o limite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings size={16} />
          Ajustar Limite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Limite do Cartão</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Limite atual</p>
            <p className="font-semibold text-lg">{formatCurrency(currentLimit)}</p>
          </div>

          <div>
            <Label htmlFor="newLimit">Novo Limite *</Label>
            <Input
              id="newLimit"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.newLimit}
              onChange={(e) => setFormData({ ...formData, newLimit: e.target.value })}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Motivo do Ajuste</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Descreva o motivo do ajuste (opcional)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Ajustando..." : "Ajustar Limite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
