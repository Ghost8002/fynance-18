
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Plus } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CardOverviewWidget = () => {
  const { user } = useSupabaseAuth();
  const { data: cards, loading, error } = useSupabaseData('cards', user?.id);
  const navigate = useNavigate();
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Safe number conversion
  const toNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  if (loading) {
    return (
      <Card className="animate-fade-in bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Visão Geral dos Cartões</CardTitle>
          <CardDescription>Carregando cartões...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-fade-in bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Visão Geral dos Cartões</CardTitle>
          <CardDescription>Erro ao carregar cartões: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalLimit = cards.reduce((sum, card) => sum + toNumber(card.credit_limit), 0);
  const totalUsed = cards.reduce((sum, card) => sum + toNumber(card.used_amount), 0);
  const totalAvailable = totalLimit - totalUsed;
  const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  
  return (
    <Card className="animate-fade-in bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-card-foreground">Visão Geral dos Cartões</CardTitle>
          <CardDescription>Resumo dos seus cartões de crédito</CardDescription>
        </div>
        <CreditCard className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {cards.length === 0 ? (
          <div className="text-center py-8">
            <Plus size={48} className="text-muted-foreground mb-4 mx-auto" />
            <p className="text-muted-foreground mb-4">Você ainda não tem cartões cadastrados</p>
            <Button 
              variant="outline"
              onClick={() => navigate('/cartoes')}
            >
              Adicionar cartão
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Limite Total</p>
                <p className="text-lg font-semibold text-card-foreground">
                  {formatCurrency(totalLimit)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Disponível</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(totalAvailable)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Utilizado</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(totalUsed)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">% Utilizado</p>
                <p className={`text-lg font-semibold ${usagePercentage > 80 ? 'text-red-600' : 'text-blue-600'}`}>
                  {usagePercentage.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">
                {cards.length} cartão{cards.length !== 1 ? 'es' : ''} cadastrado{cards.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {cards.slice(0, 3).map((card) => (
                  <div key={card.id} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{card.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(toNumber(card.used_amount))} / {formatCurrency(toNumber(card.credit_limit))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-border text-center">
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 text-sm font-medium"
            onClick={() => navigate('/cartoes')}
          >
            Ver todos os cartões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CardOverviewWidget;
