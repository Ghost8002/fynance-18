
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Calendar, Edit, Trash2, Plus } from "lucide-react";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import TransactionForm from "@/components/shared/TransactionForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper function to format Brazilian currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Calculate percentage
const calculatePercentage = (current: number, target: number) => {
  return Math.min(Math.round((current / target) * 100), 100);
};

const GoalList = () => {
  const { user } = useSupabaseAuth();
  const { data: goals, loading, error, remove, refetch } = useRealtimeData('goals');
  const { toast } = useToast();

  const handleDelete = async (id: string, title: string) => {
    try {
      const { error } = await remove(id);
      
      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Sucesso",
        description: `Meta "${title}" removida com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao remover meta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a meta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleTransactionAdded = () => {
    refetch(); // Refresh goals data
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-8 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erro ao carregar metas: {error}</p>
        <Button onClick={() => refetch()} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma meta cadastrada</h3>
        <p className="text-muted-foreground mb-6">Comece definindo sua primeira meta financeira.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => {
        const currentAmount = Number(goal.current_amount) || 0;
        const targetAmount = Number(goal.target_amount);
        const percentage = calculatePercentage(currentAmount, targetAmount);
        const isCompleted = percentage >= 100;

        return (
          <Card key={goal.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-finance-blue" />
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover meta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover a meta "{goal.title}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(goal.id, goal.title)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {goal.description && (
                <CardDescription>{goal.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Progresso</span>
                  <span className="text-sm font-medium">{percentage}%</span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(currentAmount)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(targetAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(goal.status || 'active')}>
                  {goal.status === 'completed' ? 'Concluída' : 
                   goal.status === 'paused' ? 'Pausada' : 'Ativa'}
                </Badge>
                {goal.deadline && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(goal.deadline)}
                  </div>
                )}
              </div>

              {goal.category && (
                <div>
                  <span className="text-sm text-muted-foreground">Categoria: </span>
                  <span className="text-sm font-medium">{goal.category}</span>
                </div>
              )}

              {!isCompleted && (
                <div className="pt-2">
                  <TransactionForm 
                    defaultGoalId={goal.id}
                    onTransactionAdded={handleTransactionAdded}
                  />
                </div>
              )}

              {isCompleted && (
                <div className="text-center py-2">
                  <Badge className="bg-green-100 text-green-800">
                    🎉 Meta Atingida!
                  </Badge>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Faltam {formatCurrency(Math.max(0, targetAmount - currentAmount))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default GoalList;
