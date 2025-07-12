
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Target, Calendar, DollarSign } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useMemo } from "react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const GoalsProgressReport = () => {
  const { user } = useSupabaseAuth();
  const { data: goals, loading } = useSupabaseData('goals', user?.id);

  const goalsAnalysis = useMemo(() => {
    if (!goals) return [];

    return goals.map(goal => {
      const percentage = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
      const remaining = Number(goal.target_amount) - Number(goal.current_amount);
      const daysRemaining = goal.deadline ? 
        Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

      return {
        ...goal,
        percentage: Math.round(percentage),
        remaining,
        daysRemaining,
        status: percentage >= 100 ? 'completed' : 
                daysRemaining && daysRemaining < 0 ? 'overdue' :
                daysRemaining && daysRemaining < 30 ? 'urgent' : 'active'
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [goals]);

  const summary = useMemo(() => {
    const totalGoals = goalsAnalysis.length;
    const completedGoals = goalsAnalysis.filter(g => g.status === 'completed').length;
    const activeGoals = goalsAnalysis.filter(g => g.status === 'active').length;
    const urgentGoals = goalsAnalysis.filter(g => g.status === 'urgent').length;
    const overdueGoals = goalsAnalysis.filter(g => g.status === 'overdue').length;
    const totalTarget = goalsAnalysis.reduce((sum, g) => sum + Number(g.target_amount), 0);
    const totalProgress = goalsAnalysis.reduce((sum, g) => sum + Number(g.current_amount), 0);

    return { totalGoals, completedGoals, activeGoals, urgentGoals, overdueGoals, totalTarget, totalProgress };
  }, [goalsAnalysis]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando relatório de metas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Progresso das Metas</CardTitle>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {goalsAnalysis.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma meta encontrada
          </div>
        ) : (
          <>
            {/* Resumo das Metas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total de Metas</p>
                    <p className="text-2xl font-bold text-blue-600">{summary.totalGoals}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-700">Progresso Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalProgress)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-700">Meta Total</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.totalTarget)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Status das Metas</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Concluídas: {summary.completedGoals}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Ativas: {summary.activeGoals}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Urgentes: {summary.urgentGoals}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Atrasadas: {summary.overdueGoals}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista Detalhada das Metas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalhamento das Metas</h3>
              {goalsAnalysis.map((goal) => (
                <Card key={goal.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{goal.title}</h4>
                          <Badge 
                            variant={
                              goal.status === 'completed' ? 'default' :
                              goal.status === 'overdue' ? 'destructive' :
                              goal.status === 'urgent' ? 'secondary' : 'outline'
                            }
                          >
                            {goal.status === 'completed' ? 'Concluída' :
                             goal.status === 'overdue' ? 'Atrasada' :
                             goal.status === 'urgent' ? 'Urgente' : 'Ativa'}
                          </Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                        )}
                        {goal.category && (
                          <p className="text-sm text-gray-500">Categoria: {goal.category}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{goal.percentage}%</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}
                        </p>
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.min(goal.percentage, 100)} 
                      className="h-3 mb-3"
                    />
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex gap-4">
                        <span className="text-gray-600">
                          Faltam: <span className="font-medium text-blue-600">
                            {formatCurrency(goal.remaining)}
                          </span>
                        </span>
                        {goal.deadline && (
                          <span className="text-gray-600">
                            Prazo: <span className={`font-medium ${
                              goal.daysRemaining && goal.daysRemaining < 0 ? 'text-red-600' :
                              goal.daysRemaining && goal.daysRemaining < 30 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {goal.daysRemaining !== null ? 
                                goal.daysRemaining < 0 ? 
                                  `${Math.abs(goal.daysRemaining)} dias atrasado` :
                                  `${goal.daysRemaining} dias restantes` :
                                'Sem prazo'
                              }
                            </span>
                          </span>
                        )}
                      </div>
                      {goal.deadline && (
                        <span className="text-gray-500">
                          {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalsProgressReport;
