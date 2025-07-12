
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, Plus } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const GoalTracker = () => {
  const { user } = useSupabaseAuth();
  const { data: goals, loading, error } = useSupabaseData('goals', user?.id);
  const navigate = useNavigate();
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  // Calculate percentage
  const calculatePercentage = (current: number, target: number) => {
    return Math.round((current / target) * 100);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="animate-fade-in bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Suas Metas</CardTitle>
          <CardDescription>Carregando metas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-fade-in bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Suas Metas</CardTitle>
          <CardDescription>Erro ao carregar metas: {error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="animate-fade-in bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-card-foreground">Suas Metas</CardTitle>
          <CardDescription>Acompanhe o progresso das suas metas financeiras</CardDescription>
        </div>
        <Target className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Plus size={48} className="text-muted-foreground mb-4 mx-auto" />
            <p className="text-muted-foreground mb-4">Você ainda não tem metas definidas</p>
            <Button 
              variant="outline"
              onClick={() => navigate('/metas')}
            >
              Adicionar nova meta
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {goals.slice(0, 3).map((goal) => {
              const percentage = calculatePercentage(Number(goal.current_amount), Number(goal.target_amount));
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-card-foreground">{goal.title}</span>
                    <div className="text-sm flex items-center">
                      <Calendar className="w-4 h-4 text-muted-foreground mr-1" />
                      <span className="text-muted-foreground">
                        {goal.deadline ? formatDate(goal.deadline) : 'Sem prazo'}
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(Number(goal.current_amount) || 0)} de {formatCurrency(Number(goal.target_amount))}
                    </span>
                    <span className="text-sm font-medium text-card-foreground">
                      {percentage}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Faltam {formatCurrency(Number(goal.target_amount) - Number(goal.current_amount || 0))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-border text-center">
          <Button 
            variant="ghost" 
            className="text-primary hover:text-primary/80 text-sm font-medium"
            onClick={() => navigate('/metas')}
          >
            + Adicionar nova meta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalTracker;
