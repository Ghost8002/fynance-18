
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Calendar, TrendingUp, Plus, Edit, Trash2 } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  status?: string;
  category?: string;
}

interface GoalProgressProps {
  goals: Goal[];
  onAddProgress?: (goalId: string) => void;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
}

const GoalProgress = ({ goals, onAddProgress, onEdit, onDelete }: GoalProgressProps) => {
  const { user } = useSupabaseAuth();
  const { remove } = useSupabaseData('goals', user?.id);
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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getTimeRemaining = (deadline?: string) => {
    if (!deadline) return null;
    
    const daysRemaining = differenceInDays(new Date(deadline), new Date());
    
    if (daysRemaining < 0) {
      return { text: 'Prazo vencido', color: 'text-red-600', urgent: true };
    } else if (daysRemaining === 0) {
      return { text: 'Vence hoje', color: 'text-red-600', urgent: true };
    } else if (daysRemaining <= 7) {
      return { text: `${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}`, color: 'text-orange-600', urgent: true };
    } else if (daysRemaining <= 30) {
      return { text: `${daysRemaining} dias`, color: 'text-yellow-600', urgent: false };
    } else {
      return { text: `${daysRemaining} dias`, color: 'text-green-600', urgent: false };
    }
  };

  const getStatusBadge = (goal: Goal) => {
    const progress = calculateProgress(Number(goal.current_amount), Number(goal.target_amount));
    
    if (progress >= 100) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">🎉 Concluída</Badge>;
    }
    
    const timeRemaining = getTimeRemaining(goal.deadline);
    if (timeRemaining?.urgent) {
      return <Badge variant="destructive">{timeRemaining.text}</Badge>;
    }
    
    if (progress >= 75) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Quase lá!</Badge>;
    }
    
    if (progress >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">No caminho</Badge>;
    }
    
    return <Badge variant="outline">Iniciando</Badge>;
  };

  const activeGoals = goals.filter(goal => goal.status !== 'completed');
  const completedGoals = goals.filter(goal => goal.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Metas Ativas */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-blue-600" />
          Metas Ativas ({activeGoals.length})
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeGoals.map((goal) => {
            const progress = calculateProgress(Number(goal.current_amount), Number(goal.target_amount));
            const remaining = Number(goal.target_amount) - Number(goal.current_amount);
            const timeRemaining = getTimeRemaining(goal.deadline);

            return (
              <Card key={goal.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base line-clamp-2">{goal.title}</CardTitle>
                    <div className="flex items-center space-x-1">
                      {getStatusBadge(goal)}
                      <div className="flex space-x-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit?.(goal.id)}>
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
                  </div>
                  {goal.category && (
                    <p className="text-sm text-muted-foreground">{goal.category}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Progresso</span>
                      <span className="text-sm font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(Number(goal.current_amount))}</span>
                      <span>{formatCurrency(Number(goal.target_amount))}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Faltam:</span>
                    <span className="font-medium">{formatCurrency(remaining)}</span>
                  </div>

                  {goal.deadline && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {format(new Date(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      {timeRemaining && (
                        <span className={`font-medium ${timeRemaining.color}`}>
                          {timeRemaining.text}
                        </span>
                      )}
                    </div>
                  )}

                  {progress < 100 && onAddProgress && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => onAddProgress(goal.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Progresso
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Metas Concluídas */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
            Metas Concluídas ({completedGoals.length})
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base line-clamp-2">{goal.title}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        🎉 Concluída
                      </Badge>
                      <div className="flex space-x-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit?.(goal.id)}>
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
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={100} className="h-2" />
                    <div className="text-center text-sm font-medium text-green-800">
                      {formatCurrency(Number(goal.target_amount))} alcançado!
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalProgress;
