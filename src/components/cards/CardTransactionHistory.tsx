
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, ArrowUpDown } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CardTransactionHistoryProps {
  cardId: string;
  cardName: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const CardTransactionHistory = ({ cardId, cardName }: CardTransactionHistoryProps) => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading } = useSupabaseData('transactions', user?.id);
  const [cardTransactions, setCardTransactions] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (transactions) {
      const filtered = transactions
        .filter(t => t.card_id === cardId)
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });
      setCardTransactions(filtered);
    }
  }, [transactions, cardId, sortOrder]);

  const totalAmount = cardTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle className="text-lg">Histórico - {cardName}</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigas'}
          </Button>
        </div>
        <CardDescription>
          {cardTransactions.length} transações • Total: {formatCurrency(totalAmount)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cardTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma transação registrada para este cartão</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {cardTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{transaction.description}</h4>
                    <span className="font-bold text-red-600">
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {format(new Date(transaction.date), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    {transaction.category_id && (
                      <Badge variant="outline" className="text-xs">
                        Categoria
                      </Badge>
                    )}
                  </div>
                  {transaction.notes && (
                    <p className="text-xs text-gray-600 mt-1">{transaction.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
