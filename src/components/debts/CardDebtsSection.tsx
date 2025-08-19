import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, RefreshCw, AlertTriangle, Info, Loader2, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { useCardDebtsIntegration } from "@/hooks/useCardDebtsIntegration";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Helper function to get card name
const getCardName = (cards: any[], cardId: string) => {
  const card = cards.find(c => c.id === cardId);
  return card ? card.name : 'Cartão não encontrado';
};

interface CardDebtsSectionProps {
  onDebtCreated?: () => void;
}

export const CardDebtsSection: React.FC<CardDebtsSectionProps> = ({ onDebtCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: cards } = useSupabaseData('cards', user?.id);
  const {
    cardBills,
    cardInstallments,
    loadingBills,
    loadingInstallments,
    createDebtFromCardBill,
    createDebtsFromInstallments,
    syncAllCardDebts,
    syncExistingInstallments,
    fetchCardBills,
    fetchCardInstallments
  } = useCardDebtsIntegration();

  const [syncing, setSyncing] = useState(false);
  const [creatingDebt, setCreatingDebt] = useState<string | null>(null);

  // Função para sincronizar todas as dívidas de cartão
  const handleSyncAllCardDebts = async () => {
    setSyncing(true);
    try {
      console.log('Iniciando sincronização de dívidas de cartão...');
      await syncAllCardDebts();
      console.log('Sincronização concluída com sucesso');
      toast({
        title: "Sincronização Concluída",
        description: "Dívidas de cartão foram sincronizadas com sucesso",
      });
      if (onDebtCreated) {
        onDebtCreated();
      }
    } catch (error) {
      console.error('Erro ao sincronizar dívidas:', error);
      toast({
        title: "Erro",
        description: "Erro ao sincronizar dívidas de cartão",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  // Função para criar dívida a partir de uma fatura
  const handleCreateDebtFromBill = async (cardId: string, billMonth: number, billYear: number) => {
    const key = `${cardId}-${billMonth}-${billYear}`;
    setCreatingDebt(key);
    
    try {
      console.log('Criando dívida para fatura:', { cardId, billMonth, billYear });
      const debtId = await createDebtFromCardBill(cardId, billMonth, billYear);
      console.log('Resultado da criação de dívida:', debtId);
      if (debtId) {
        toast({
          title: "Dívida Criada",
          description: "Dívida da fatura foi criada com sucesso",
        });
        if (onDebtCreated) {
          onDebtCreated();
        }
        // Recarregar dados
        await fetchCardBills();
      }
    } catch (error) {
      console.error('Erro ao criar dívida:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar dívida da fatura",
        variant: "destructive",
      });
    } finally {
      setCreatingDebt(null);
    }
  };

  // Função para criar dívidas a partir de parcelamentos
  const handleCreateDebtsFromInstallments = async (installmentId: string) => {
    setCreatingDebt(installmentId);
    
    try {
      console.log('Criando dívidas para parcelamento:', installmentId);
      const debtIds = await createDebtsFromInstallments(installmentId);
      console.log('Resultado da criação de dívidas:', debtIds);
      if (debtIds.length > 0) {
        toast({
          title: "Dívidas Criadas",
          description: `${debtIds.length} dívidas de parcelamento foram criadas`,
        });
        if (onDebtCreated) {
          onDebtCreated();
        }
        // Recarregar dados
        await fetchCardInstallments();
      }
    } catch (error) {
      console.error('Erro ao criar dívidas:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar dívidas de parcelamento",
        variant: "destructive",
      });
    } finally {
      setCreatingDebt(null);
    }
  };

  // Filtrar faturas pendentes (não pagas)
  const pendingBills = cardBills.filter(bill => 
    bill.status === 'open' || bill.status === 'partial'
  );

  // Filtrar parcelamentos ativos
  const activeInstallments = cardInstallments.filter(installment => 
    installment.status === 'active'
  );

  const hasCardData = pendingBills.length > 0 || activeInstallments.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Dívidas de Cartão
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Estado atual:', { cardBills, cardInstallments, loadingBills, loadingInstallments });
                console.log('Usuário:', user?.id);
                console.log('Cartões disponíveis:', cards);
              }}
              className="text-xs"
            >
              Debug
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAllCardDebts}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sincronizar Tudo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setSyncing(true);
                try {
                  await syncExistingInstallments();
                  if (onDebtCreated) {
                    onDebtCreated();
                  }
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Sinc. Parcelamentos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingBills || loadingInstallments ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p>Carregando dados de cartão...</p>
          </div>
        ) : !hasCardData ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma dívida de cartão pendente</p>
            <p className="text-sm">Faturas e parcelamentos aparecerão aqui quando houver valores pendentes</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Faturas Pendentes */}
            {pendingBills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Faturas Pendentes
                </h3>
                <div className="space-y-2">
                  {pendingBills.map((bill) => {
                    const cardName = getCardName(cards || [], bill.card_id);
                    const key = `${bill.card_id}-${bill.bill_month}-${bill.bill_year}`;
                    const isCreating = creatingDebt === key;
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{cardName}</span>
                            <Badge variant="outline">
                              {bill.bill_month}/{bill.bill_year}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Vencimento: {format(new Date(bill.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(bill.remaining_amount)}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCreateDebtFromBill(bill.card_id, bill.bill_month, bill.bill_year)}
                          disabled={isCreating}
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Criar Dívida
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Parcelamentos Ativos */}
            {activeInstallments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Parcelamentos Ativos
                </h3>
                <div className="space-y-2">
                  {activeInstallments.map((installment) => {
                    const cardName = getCardName(cards || [], installment.card_id);
                    const isCreating = creatingDebt === installment.id;
                    
                    return (
                      <div key={installment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{installment.description}</span>
                            <Badge variant="outline">
                              {installment.installments_count} parcelas
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{cardName}</span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(installment.total_amount)}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCreateDebtsFromInstallments(installment.id)}
                          disabled={isCreating}
                        >
                          {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Criar Dívidas
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Informações adicionais */}
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Como funciona:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Faturas:</strong> Clique em "Criar Dívida" para gerar uma dívida a pagar da fatura</li>
                    <li>• <strong>Parcelamentos:</strong> Clique em "Criar Dívidas" para gerar dívidas para cada parcela pendente</li>
                    <li>• <strong>Sincronizar Tudo:</strong> Cria automaticamente todas as dívidas pendentes de uma vez</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
