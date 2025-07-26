
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Trash2, CreditCard, Edit, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CardForm from "./CardForm";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, parseCardData } from "@/utils/cardUtils";

interface CardListProps {
  onCardSelect?: (cardId: string) => void;
  selectedCard?: string | null;
}

const CardList = ({ onCardSelect, selectedCard }: CardListProps) => {
  const { user } = useAuth();
  const { data: cards, loading, error, remove, refetch } = useSupabaseData('cards', user?.id);
  const { toast } = useToast();
  const [editingCard, setEditingCard] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [checkingDependencies, setCheckingDependencies] = useState(false);

  // Otimizar filtro com useMemo
  const filteredCards = useMemo(() => {
    if (!cards) return [];
    const searchLower = search.toLowerCase();
    return cards.filter(card => 
      card.name.toLowerCase().includes(searchLower) ||
      (card.type && card.type.toLowerCase().includes(searchLower))
    );
  }, [cards, search]);

  // Função para checar dependências antes de excluir
  const hasDependencies = async (cardId: string) => {
    setCheckingDependencies(true);
    try {
      const { count: txCount } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('card_id', cardId);
      const { count: billCount } = await supabase
        .from('card_bills')
        .select('id', { count: 'exact', head: true })
        .eq('card_id', cardId);
      return (txCount > 0 || billCount > 0);
    } catch (e) {
      console.error('Erro ao verificar dependências:', e);
      return true; // Por segurança, bloqueia exclusão se erro
    } finally {
      setCheckingDependencies(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      if (await hasDependencies(id)) {
        toast({
          title: "Não é possível excluir",
          description: "Este cartão possui transações ou faturas vinculadas. Exclua-as antes de remover o cartão.",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await remove(id);
      if (error) {
        throw new Error(error);
      }
      
      toast({
        title: "Cartão removido",
        description: "Cartão removido com sucesso.",
      });
      await refetch();
    } catch (error) {
      console.error('Erro ao remover cartão:', error);
      toast({
        title: "Erro",
        description: `Erro ao remover cartão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (card: any) => {
    setEditingCard(card);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="animate-spin inline-block mr-2 h-4 w-4" />
        Carregando cartões...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Erro ao carregar cartões: {error}
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return null; // Will be handled by parent component
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full max-w-xs"
          placeholder="Buscar cartão por nome ou bandeira..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            Nenhum cartão encontrado.
          </div>
        )}
        {filteredCards.map((card) => {
          const { creditLimit, usedAmount, availableAmount, usagePercentage } = parseCardData(card);

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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(card);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          disabled={deleting === card.id || checkingDependencies}
                        >
                          {deleting === card.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o cartão "{card.name}"? 
                            Esta ação não pode ser desfeita.
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
      
      {editingCard && (
        <CardForm
          card={editingCard}
          onSave={() => { 
            setEditingCard(null); 
            refetch(); 
          }}
          triggerButton={null}
        />
      )}
    </>
  );
};

export default CardList;
