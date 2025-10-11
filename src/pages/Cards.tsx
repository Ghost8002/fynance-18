
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { CardList } from "@/components/cards/CardList";
import { CardForm } from "@/components/cards/CardForm";
import { InstallmentPurchaseForm } from "@/components/cards/InstallmentPurchaseForm";
import { CardOverview } from "@/components/cards/CardOverview";
import { CardBill } from "@/components/cards/CardBill";
import { CardInstallments } from "@/components/cards/CardInstallments";
import { CardTransactions } from "@/components/cards/CardTransactions";
import { CardLimitManagement } from "@/components/cards/CardLimitManagement";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useCardDebtsIntegration } from "@/hooks/useCardDebtsIntegration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw } from "lucide-react";

const Cards = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { data: cards, refetch: refetchCards } = useSupabaseData('cards', user?.id);
  const { syncAllCardDebts, loadingBills } = useCardDebtsIntegration();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Auto-select first card if none selected
  useEffect(() => {
    if (cards && cards.length > 0 && !selectedCard) {
      setSelectedCard(cards[0].id);
    }
  }, [cards, selectedCard]);

  const handlePurchaseAdded = () => {
    refetchCards();
  };

  const selectedCardData = cards?.find(card => card.id === selectedCard);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Cartões</h1>
            <p className="text-muted-foreground">Gerencie seus cartões de crédito e controle seus gastos</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => syncAllCardDebts()}
              disabled={loadingBills}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loadingBills ? 'animate-spin' : ''}`} />
              Sincronizar Dívidas
            </Button>
            <InstallmentPurchaseForm onPurchaseAdded={handlePurchaseAdded} />
            <CardForm />
          </div>
        </div>

        {/* Cards Overview */}
        <CardList onCardSelect={setSelectedCard} selectedCard={selectedCard} />

        {/* Selected Card Details */}
        {selectedCardData && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className={`grid w-full ${selectedCardData.type === 'credit' ? 'grid-cols-5' : 'grid-cols-2'}`}>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              {selectedCardData.type === 'credit' && (
                <>
                  <TabsTrigger value="bill">Fatura</TabsTrigger>
                  <TabsTrigger value="limit">Limite</TabsTrigger>
                  <TabsTrigger value="installments">Parcelamentos</TabsTrigger>
                </>
              )}
              <TabsTrigger value="transactions">Transações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <CardOverview card={selectedCardData} />
            </TabsContent>

            {selectedCardData.type === 'credit' && (
              <>
                <TabsContent value="bill" className="space-y-4">
                  <CardBill 
                    cardId={selectedCard!} 
                    onBillUpdate={handlePurchaseAdded}
                  />
                </TabsContent>

                <TabsContent value="limit" className="space-y-4">
                  <CardLimitManagement 
                    card={selectedCardData} 
                    onUpdate={handlePurchaseAdded}
                  />
                </TabsContent>

                <TabsContent value="installments" className="space-y-4">
                  <CardInstallments 
                    cardId={selectedCard!} 
                    onInstallmentPaid={handlePurchaseAdded}
                  />
                </TabsContent>
              </>
            )}

            <TabsContent value="transactions" className="space-y-4">
              <CardTransactions cardId={selectedCard!} />
            </TabsContent>
          </Tabs>
        )}

        {/* No cards message */}
        {(!cards || cards.length === 0) && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Nenhum cartão cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione seu primeiro cartão para começar a controlar seus gastos
                </p>
                <CardForm />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Cards;
