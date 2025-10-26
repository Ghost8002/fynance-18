import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Calendar, TrendingUp, Plus, Edit, Trash2, Award, Clock, AlertCircle, Search, Filter } from "lucide-react";
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
import { useState } from "react";
import AddMoneyToGoalModal from "./AddMoneyToGoalModal";
import WithdrawMoneyFromGoalModal from "./WithdrawMoneyFromGoalModal";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGoal, setSelectedGoal] = useState<{id: string, title: string, currentAmount: number} | null>(null);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showWithdrawMoneyModal, setShowWithdrawMoneyModal] = useState(false);

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

  const handleAddMoneyClick = (goalId: string, goalTitle: string, currentAmount: number) => {
    setSelectedGoal({ id: goalId, title: goalTitle, currentAmount });
    setShowAddMoneyModal(true);
  };

  const handleWithdrawMoneyClick = (goalId: string, goalTitle: string, currentAmount: number) => {
    setSelectedGoal({ id: goalId, title: goalTitle, currentAmount });
    setShowWithdrawMoneyModal(true);
  };

  const handleMoneyOperationSuccess = () => {
    window.dispatchEvent(new CustomEvent('goalProgressAdded'));
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
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">🎉 Concluída</Badge>;
    }
    
    const timeRemaining = getTimeRemaining(goal.deadline);
    if (timeRemaining?.urgent) {
      return <Badge variant="destructive" className="flex items-center">
        <AlertCircle className="w-3 h-3 mr-1" />
        {timeRemaining.text}
      </Badge>;
    }
    
    if (progress >= 75) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">Quase lá!</Badge>;
    }
    
    if (progress >= 50) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">No caminho</Badge>;
    }
    
    return <Badge variant="outline">Iniciando</Badge>;
  };

  // Filtrar metas com base nos filtros
  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (goal.category && goal.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === "all") return matchesSearch;
    
    if (statusFilter === "completed") return matchesSearch && goal.status === 'completed';
    
    if (statusFilter === "active") {
      const progress = calculateProgress(Number(goal.current_amount), Number(goal.target_amount));
      return matchesSearch && progress < 100;
    }
    
    if (statusFilter === "near_deadline") {
      const timeRemaining = getTimeRemaining(goal.deadline);
      return matchesSearch && timeRemaining?.urgent;
    }
    
    return matchesSearch;
  });

  const activeGoals = filteredGoals.filter(goal => {
    const progress = calculateProgress(Number(goal.current_amount), Number(goal.target_amount));
    return progress < 100;
  });
  
  const completedGoals = filteredGoals.filter(goal => goal.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Filtros e Busca */}
      <Card className="p-2 md:p-4">
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <input
                placeholder="Buscar metas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 md:pl-10 h-7 md:h-10 text-[10px] md:text-sm w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Filtro de Status */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-32 md:w-40 h-7 md:h-10 text-[10px] md:text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">Todos</option>
            <option value="active">Ativas</option>
            <option value="completed">Concluídas</option>
            <option value="near_deadline">Prazo Próximo</option>
          </select>
        </div>

        {/* Contagem de resultados */}
        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t">
          <p className="text-[9px] md:text-xs text-muted-foreground">
            {filteredGoals.length} de {goals.length} metas
          </p>
        </div>
      </Card>

      {/* Metas Ativas */}
      <div>
        <h3 className="text-base md:text-lg font-medium text-foreground mb-3 md:mb-4 flex items-center">
          <Target className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-500" />
          Metas Ativas ({activeGoals.length})
        </h3>
        
        {activeGoals.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-4 md:p-6 border-dashed">
            <Target size={32} className="text-gray-400 mb-3 md:mb-4" />
            <h3 className="text-sm md:text-lg font-medium text-gray-700 dark:text-gray-300 mb-1 md:mb-2">Criar Meta</h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 text-center mb-3 md:mb-4">
              Defina suas metas financeiras
            </p>
            <Button size="sm" className="text-xs md:text-sm" onClick={() => onEdit && onEdit('new')}>Criar Meta</Button>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(Number(goal.current_amount), Number(goal.target_amount));
              const remaining = Number(goal.target_amount) - Number(goal.current_amount);
              const timeRemaining = getTimeRemaining(goal.deadline);
              const isNearDeadline = timeRemaining?.urgent;

              return (
                <Card key={goal.id} className={`p-3 md:p-6 hover:shadow-md transition-shadow ${isNearDeadline ? 'border-red-300 bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  <CardHeader className="pb-2 px-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm md:text-base font-medium line-clamp-2 pr-2">{goal.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(goal)}
                        </div>
                        {goal.category && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {goal.category}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(goal.id)}
                          className="text-foreground hover:bg-accent h-8 w-8 p-0"
                        >
                          <Edit size={14} className="md:hidden" />
                          <Edit size={16} className="hidden md:block" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0"
                            >
                              <Trash2 size={14} className="md:hidden" />
                              <Trash2 size={16} className="hidden md:block" />
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
                  </CardHeader>
                  
                  <CardContent className="px-0">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs md:text-sm text-muted-foreground">Progresso</span>
                          <span className="text-xs md:text-sm font-medium">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 md:h-2" />
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(Number(goal.current_amount))}</span>
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency(Number(goal.target_amount))}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 md:p-3 rounded-lg">
                        <div className="flex items-center">
                          <Target className="h-3 w-3 md:h-4 md:w-4 mr-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Faltam:</span>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency(remaining)}</span>
                      </div>

                      {goal.deadline && (
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 md:p-3 rounded-lg">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(goal.deadline), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          {timeRemaining && (
                            <span className={`text-xs font-medium flex items-center ${timeRemaining.color}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {timeRemaining.text}
                            </span>
                          )}
                        </div>
                      )}

                      {progress < 100 && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs md:text-sm text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleAddMoneyClick(goal.id, goal.title, Number(goal.current_amount))}
                          >
                            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Adicionar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs md:text-sm text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleWithdrawMoneyClick(goal.id, goal.title, Number(goal.current_amount))}
                            disabled={Number(goal.current_amount) <= 0}
                          >
                            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 rotate-180" />
                            Retirar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Metas Concluídas */}
      {completedGoals.length > 0 && (
        <div>
          <h3 className="text-base md:text-lg font-medium text-foreground mb-3 md:mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2 text-green-500" />
            Metas Concluídas ({completedGoals.length})
          </h3>
          
          <div className="grid gap-3 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="p-3 md:p-6 hover:shadow-md transition-shadow border-green-200 bg-green-50/50 dark:bg-green-900/10">
                <CardHeader className="pb-2 px-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm md:text-base font-medium line-clamp-2 pr-2">{goal.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          🎉 Concluída
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(goal.id)}
                        className="text-foreground hover:bg-accent h-8 w-8 p-0"
                      >
                        <Edit size={14} className="md:hidden" />
                        <Edit size={16} className="hidden md:block" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-88 w-8 p-0"
                          >
                            <Trash2 size={14} className="md:hidden" />
                            <Trash2 size={16} className="hidden md:block" />
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
                </CardHeader>
                
                <CardContent className="px-0">
                  <div className="space-y-3">
                    <Progress value={100} className="h-1.5 md:h-2" indicatorClassName="bg-green-600 dark:bg-green-500" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Valor alcançado</p>
                      <p className="text-base md:text-lg font-bold text-green-600 dark:text-green-500">
                        {formatCurrency(Number(goal.target_amount))}
                      </p>
                    </div>
                    <div className="text-center bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200 flex items-center justify-center">
                        <Award className="h-3 w-3 mr-1" />
                        Parabéns! Meta atingida!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedGoal && (
        <>
          <AddMoneyToGoalModal
            goalId={selectedGoal.id}
            goalTitle={selectedGoal.title}
            open={showAddMoneyModal}
            onOpenChange={setShowAddMoneyModal}
            onSuccess={handleMoneyOperationSuccess}
          />
          
          <WithdrawMoneyFromGoalModal
            goalId={selectedGoal.id}
            goalTitle={selectedGoal.title}
            currentAmount={selectedGoal.currentAmount}
            open={showWithdrawMoneyModal}
            onOpenChange={setShowWithdrawMoneyModal}
            onSuccess={handleMoneyOperationSuccess}
          />
        </>
      )}
    </div>
  );
};

export default GoalProgress;