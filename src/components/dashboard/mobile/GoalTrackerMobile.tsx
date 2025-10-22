import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const GoalTrackerMobile = () => {
  const { user } = useSupabaseAuth();
  const { data: goals, loading } = useSupabaseData('goals', user?.id);

  const calculatePercentage = (current: number, target: number) => {
    return Math.round((current / target) * 100);
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">Metas</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const topGoals = goals.slice(0, 3);

  if (goals.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm">Metas</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma meta definida
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Metas</CardTitle>
        <Target className="h-3.5 w-3.5 text-primary" />
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {topGoals.map(goal => {
          const percentage = calculatePercentage(Number(goal.current_amount), Number(goal.target_amount));
          return (
            <div key={goal.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-foreground truncate">
                  {goal.title}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground flex-shrink-0 ml-2">
                  {percentage}%
                </span>
              </div>
              <Progress value={percentage} className="h-1" />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground">
                  {formatCurrency(Number(goal.current_amount) || 0)} / {formatCurrency(Number(goal.target_amount))}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default GoalTrackerMobile;
