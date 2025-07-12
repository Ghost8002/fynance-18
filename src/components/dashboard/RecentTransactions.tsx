
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, ArrowDownIcon, MoreHorizontal, Plus } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useNavigate } from "react-router-dom";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Helper function to format date
const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date));
};

const RecentTransactions = () => {
  const { user } = useSupabaseAuth();
  const { data: transactions, loading, error } = useSupabaseData('transactions', user?.id);
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate('/transacoes');
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Transações Recentes</CardTitle>
          <CardDescription>Carregando transações...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Transações Recentes</CardTitle>
          <CardDescription>Erro ao carregar transações: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get the 5 most recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-card-foreground">Transações Recentes</CardTitle>
          <CardDescription>Suas últimas movimentações financeiras</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={handleViewAll} className="text-card-foreground hover:bg-accent">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {transaction.type === 'income' ? (
                      <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{transaction.description}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        Transação
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`font-bold ${
                  transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Plus size={48} className="text-muted-foreground mb-4 mx-auto" />
              <p className="text-muted-foreground mb-4">Nenhuma transação encontrada</p>
              <Button onClick={() => navigate('/transacoes')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Adicionar Transação
              </Button>
            </div>
          )}
          
          {recentTransactions.length > 0 && (
            <div className="pt-4 border-t border-border">
              <Button variant="outline" className="w-full border-border text-card-foreground hover:bg-accent" onClick={handleViewAll}>
                Ver todas as transações
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
