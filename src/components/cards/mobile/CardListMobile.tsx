import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import BankLogo from "@/components/shared/BankLogo";
import { getBankById } from "@/utils/banks/bankDatabase";
import { useCustomBanks } from "@/hooks/useCustomBanks";

interface CardListMobileProps {
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

export const CardListMobile = ({ onCardSelect, selectedCard }: CardListMobileProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: cards, loading, error, remove, refetch } = useSupabaseData('cards', user?.id);
  const { customBanks } = useCustomBanks();
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

  const getBankInfo = (bankId: string) => {
    if (bankId.startsWith('custom_')) {
      const customBankId = bankId.replace('custom_', '');
      const customBank = customBanks.find(cb => cb.id === customBankId);
      if (customBank) {
        return {
          name: customBank.name,
          shortName: customBank.short_name,
          logoPath: '',
          primaryColor: customBank.primary_color,
          secondaryColor: customBank.secondary_color
        };
      }
    }
    
    const bank = getBankById(bankId);
    if (bank) {
      return {
        name: bank.name,
        shortName: bank.shortName,
        logoPath: bank.logoPath,
        primaryColor: bank.primaryColor,
        secondaryColor: bank.secondaryColor
      };
    }
    
    return {
      name: bankId,
      shortName: bankId,
      logoPath: '',
      primaryColor: undefined,
      secondaryColor: undefined
    };
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
        title: "Cartão excluído"
      });

      if (selectedCard === cardId) {
        onCardSelect?.(filteredCards[0]?.id || "");
      }

    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir cartão"
      });
    } finally {
      setDeleteCardId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="text-center">
            <p className="text-sm">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-3">
          <div className="text-center">
            <p className="text-sm text-destructive">Erro ao carregar</p>
            <Button onClick={refetch} variant="outline" size="sm" className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar cartões..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Cards List */}
      <div className="space-y-2">
        {filteredCards.map((card: CardData) => {
          const usagePercentage = card.type === "credit" ? (card.used_amount / card.credit_limit) * 100 : 0;
          const availableAmount = card.type === "credit" ? card.credit_limit - card.used_amount : 0;
          const usageStatus = getUsageStatus(usagePercentage);
          const bankInfo = getBankInfo(card.bank);
          
          return (
            <Card 
              key={card.id}
              className={`cursor-pointer transition-all ${
                selectedCard === card.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onCardSelect?.(card.id)}
              style={{ borderColor: card.color }}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-8 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: card.color }}
                    >
                      {bankInfo.logoPath ? (
                        <BankLogo 
                          logoPath={bankInfo.logoPath} 
                          bankName={bankInfo.name}
                          size="sm"
                          className="text-white"
                        />
                      ) : (
                        <CreditCard className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{card.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {bankInfo.shortName} •••• {card.last_four_digits}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit2 className="w-3.5 h-3.5 mr-2" />
                        <span className="text-sm">Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCardId(card.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        <span className="text-sm">Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center gap-1.5 mb-2">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">{getCardTypeLabel(card.type)}</Badge>
                  {card.type === "credit" && usagePercentage >= 75 && (
                    <Badge variant={usageStatus.variant} className="text-xs px-1.5 py-0">
                      <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                      {usageStatus.label}
                    </Badge>
                  )}
                </div>

                {card.type === "credit" && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Usado</span>
                        <span className={getUsageColor(usagePercentage)}>
                          {usagePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={usagePercentage} className="h-1.5" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Usado</p>
                        <p className="font-medium">{formatCurrency(card.used_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Disponível</p>
                        <p className="font-medium">{formatCurrency(availableAmount)}</p>
                      </div>
                    </div>
                    
                    <div className="pt-1.5 border-t text-xs space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Limite</span>
                        <span className="font-medium">{formatCurrency(card.credit_limit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fechamento</span>
                        <span>Dia {card.closing_day}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vencimento</span>
                        <span>Dia {card.due_day}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {card.type !== "credit" && (
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground">
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
        <AlertDialogContent className="max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCardId && handleDeleteCard(deleteCardId)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};