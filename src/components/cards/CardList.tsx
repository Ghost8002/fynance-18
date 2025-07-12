
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Trash2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface CardListProps {
  onCardSelect?: (cardId: string) => void;
  selectedCard?: string | null;
}

const CardList = ({ onCardSelect, selectedCard }: CardListProps) => {
  const { user } = useAuth();
  const { data: cards, loading, error, remove } = useSupabaseData('cards', user?.id);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const { error } = await remove(id);
    if (error) {
      toast({
        title: "Erro",
        description: `Erro ao remover cartão: ${error}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cartão removido",
        description: "Cartão removido com sucesso.",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">Carregando cartões...</div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">Erro ao carregar cartões: {error}</div>
    );
  }

  if (!cards || cards.length === 0) {
    return null; // Will be handled by parent component
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const creditLimit = parseFloat(card.credit_limit);
        const usedAmount = parseFloat(card.used_amount || '0');
        const availableAmount = creditLimit - usedAmount;
        const usagePercentage = (usedAmount / creditLimit) * 100;

        return (
          <Card
            key={card.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedCard === card.id && "ring-2 ring-primary"
            )}
            onClick={() => onCardSelect?.(card.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{card.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    •••• •••• •••• {card.last_four_digits}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-red-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Cartão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o cartão "{card.name}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(card.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usado</span>
                  <span className={usagePercentage > 80 ? "text-red-600 font-medium" : ""}>
                    {formatCurrency(usedAmount)}
                  </span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      usagePercentage > 90 ? "bg-red-500" : 
                      usagePercentage > 70 ? "bg-yellow-500" : "bg-green-500"
                    )}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Disponível: {formatCurrency(availableAmount)}</span>
                  <span>Limite: {formatCurrency(creditLimit)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Badge variant="outline">{card.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Vence dia {card.due_day}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CardList;
