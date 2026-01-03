import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { CardList } from "@/components/cards/CardList";
import { CardListMobile } from "@/components/cards/mobile/CardListMobile";
import { CardOverviewMobile } from "@/components/cards/mobile/CardOverviewMobile";
import { CardForm } from "@/components/cards/CardForm";
import { InstallmentPurchaseForm } from "@/components/cards/InstallmentPurchaseForm";
import { CardOverview } from "@/components/cards/CardOverview";
import { CardBill } from "@/components/cards/CardBill";
import { CardInstallments } from "@/components/cards/CardInstallments";
import { CardTransactions } from "@/components/cards/CardTransactions";
import { CardLimitManagement } from "@/components/cards/CardLimitManagement";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useCardDebtsIntegration } from "@/hooks/useCardDebtsIntegration";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw } from "lucide-react";

const Cards = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: cards, refetch: refetchCards } = useRealtimeData('cards');
  const { syncAllCardDebts, loadingBills } = useCardDebtsIntegration();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

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
      <div className={isMobile ? "space-y-3" : "space-y-6"}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className={isMobile ? "text-lg font-bold" : "text-2xl font-bold text-foreground mb-1"}>Cartões</h1>
            {!isMobile && (
              <p className="text-muted-foreground">Gerencie seus cartões de crédito e controle seus gastos</p>
            )}
          </div>
          
          <div className={isMobile ? "flex gap-1.5 w-full" : "flex gap-2"}>
            <Button 
              variant="outline" 
              onClick={() => syncAllCardDebts()}
              disabled={loadingBills}
              className={isMobile ? "flex items-center gap-1.5 text-xs h-8 flex-1" : "flex items-center gap-2"}
              size={isMobile ? "sm" : "default"}
            >
              <RefreshCw className={isMobile ? `w-3 h-3 ${loadingBills ? 'animate-spin' : ''}` : `w-4 h-4 ${loadingBills ? 'animate-spin' : ''}`} />
              {!isMobile && "Sincronizar Dívidas"}
            </Button>
            <InstallmentPurchaseForm onPurchaseAdded={handlePurchaseAdded} />
            <CardForm />
          </div>
        </div>

        {/* Cards Overview */}
        {isMobile ? (
          <CardListMobile onCardSelect={setSelectedCard} selectedCard={selectedCard} />
        ) : (
          <CardList onCardSelect={setSelectedCard} selectedCard={selectedCard} />
        )}

        {/* Selected Card Details */}
        {selectedCardData && (
          <Tabs defaultValue="overview" className={isMobile ? "space-y-3" : "space-y-4"}>
            <TabsList className={`grid w-full ${
              isMobile 
                ? (selectedCardData.type === 'credit' ? 'grid-cols-3 text-xs' : 'grid-cols-2 text-xs')
                : (selectedCardData.type === 'credit' ? 'grid-cols-5' : 'grid-cols-2')
            }`}>
              <TabsTrigger value="overview" className={isMobile ? "text-xs px-2" : ""}>
                {isMobile ? "Visão" : "Visão Geral"}
              </TabsTrigger>
              {selectedCardData.type === 'credit' && (
                <>
                  <TabsTrigger value="bill" className={isMobile ? "text-xs px-2" : ""}>Fatura</TabsTrigger>
                  {!isMobile && (
                    <>
                      <TabsTrigger value="limit">Limite</TabsTrigger>
                      <TabsTrigger value="installments">Parcelamentos</TabsTrigger>
                    </>
                  )}
                </>
              )}
              <TabsTrigger value="transactions" className={isMobile ? "text-xs px-2" : ""}>
                {isMobile ? "Trans." : "Transações"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className={isMobile ? "space-y-3" : "space-y-4"}>
              {isMobile ? (
                <CardOverviewMobile card={selectedCardData} />
              ) : (
                <CardOverview card={selectedCardData} />
              )}
            </TabsContent>

            {selectedCardData.type === 'credit' && (
              <>
                <TabsContent value="bill" className={isMobile ? "space-y-3" : "space-y-4"}>
                  <CardBill 
                    cardId={selectedCard!} 
                    onBillUpdate={handlePurchaseAdded}
                  />
                </TabsContent>

                {!isMobile && (
                  <>
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
              </>
            )}

            <TabsContent value="transactions" className={isMobile ? "space-y-3" : "space-y-4"}>
              <CardTransactions cardId={selectedCard!} />
            </TabsContent>
          </Tabs>
        )}

        {/* No cards message */}
        {(!cards || cards.length === 0) && (
          <Card>
            <CardContent className={isMobile ? "py-6" : "py-8"}>
              <div className="text-center">
                <CreditCard size={isMobile ? 40 : 48} className="mx-auto mb-4 opacity-50" />
                <h3 className={isMobile ? "text-base font-medium mb-2" : "text-lg font-medium mb-2"}>
                  Nenhum cartão cadastrado
                </h3>
                <p className={isMobile ? "text-sm text-muted-foreground mb-3" : "text-muted-foreground mb-4"}>
                  Adicione seu primeiro cartão
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
