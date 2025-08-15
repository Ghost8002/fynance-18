import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Search, MoreVertical, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CardListProps {
  onCardSelect?: (cardId: string) => void;
  selectedCard?: string | null;
}

interface CardData {
  id: string;
  name: string;
  type: string;
  bank: string;
  credit_limit: number;
  used_amount: number;
  last_four_digits: string;
  color: string;
  closing_day: number;
  due_day: number;
}

export const CardList = ({ onCardSelect, selectedCard }: CardListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: cards, loading, error, remove, refetch } = useSupabaseData('cards', user?.id);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCardTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      credit: "Crédito",
      debit: "Débito", 
      food: "Alimentação",
      meal: "Refeição",
      transportation: "Transporte"
    };
    return types[type] || type;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-orange-500";
    return "text-green-500";
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { label: "Crítico", variant: "destructive" as const };
    if (percentage >= 75) return { label: "Atenção", variant: "secondary" as const };
    return { label: "Normal", variant: "outline" as const };
  };

  const filteredCards = cards?.filter((card: CardData) =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.last_four_digits.includes(searchTerm)
  ) || [];

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await remove(cardId);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao excluir cartão",
          description: error
        });
        return;
      }

      toast({
        title: "Cartão excluído com sucesso"
      });

      if (selectedCard === cardId) {
        onCardSelect?.(filteredCards[0]?.id || "");
      }

    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        variant: "destructive",
        title: "Erro inesperado ao excluir cartão"
      });
    } finally {
      setDeleteCardId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>Carregando cartões...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive">Erro ao carregar cartões</p>
            <Button onClick={refetch} variant="outline" className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cards || cards.length === 0) {
    return null; // O componente pai vai mostrar a mensagem de "nenhum cartão"
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cartões..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCards.map((card: CardData) => {
          const usagePercentage = card.type === "credit" ? (card.used_amount / card.credit_limit) * 100 : 0;
          const availableAmount = card.type === "credit" ? card.credit_limit - card.used_amount : 0;
          const usageStatus = getUsageStatus(usagePercentage);
          
          return (
            <Card 
              key={card.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCard === card.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onCardSelect?.(card.id)}
              style={{ borderColor: card.color }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: card.color }}
                    >
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{card.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {card.bank} •••• {card.last_four_digits}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCardId(card.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getCardTypeLabel(card.type)}</Badge>
                  {card.type === "credit" && usagePercentage >= 75 && (
                    <Badge variant={usageStatus.variant}>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {usageStatus.label}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {card.type === "credit" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Limite usado</span>
                        <span className={getUsageColor(usagePercentage)}>
                          {usagePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={usagePercentage} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Usado</p>
                        <p className="font-medium">{formatCurrency(card.used_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Disponível</p>
                        <p className="font-medium">{formatCurrency(availableAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Limite total</span>
                        <span className="font-medium">{formatCurrency(card.credit_limit)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fechamento</span>
                        <span>Dia {card.closing_day}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vencimento</span>
                        <span>Dia {card.due_day}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {card.type !== "credit" && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Cartão de {getCardTypeLabel(card.type)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCardId} onOpenChange={() => setDeleteCardId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCardId && handleDeleteCard(deleteCardId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};