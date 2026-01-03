import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import GoalForm from "@/components/goals/GoalForm";
import GoalProgress from "@/components/goals/GoalProgress";
import GoalEditForm from "@/components/goals/GoalEditForm";
import { useRealtimeData } from "@/context/RealtimeDataContext";
import { Target } from "lucide-react";

const Goals = () => {
  const { user } = useAuth();
  const { data: goals, refetch } = useRealtimeData('goals');
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Recarregar dados quando um progresso for adicionado
  useEffect(() => {
    const handleProgressAdded = () => {
      refetch();
    };

    window.addEventListener('goalProgressAdded', handleProgressAdded);
    
    return () => {
      window.removeEventListener('goalProgressAdded', handleProgressAdded);
    };
  }, [refetch]);

  const handleAddProgress = () => {
    // Esta função será passada para o componente GoalProgress
    // mas a lógica real está no próprio componente agora
  };

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setEditingGoal(goal);
      setShowEditForm(true);
    }
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
    setEditingGoal(null);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingGoal(null);
    refetch();
  };

  return (
    <AppLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 flex items-center">
              <Target className="h-5 w-5 md:h-6 md:w-6 mr-2" />
              Metas
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Crie e acompanhe suas metas financeiras</p>
          </div>
          
          <div className="flex justify-end">
            <GoalForm />
          </div>
        </div>
        
        <GoalProgress 
          goals={goals} 
          onAddProgress={handleAddProgress}
          onEdit={handleEditGoal}
          onDelete={(goalId) => {
            // TODO: Implementar exclusão de meta
            console.log('Excluir meta:', goalId);
          }}
        />
      </div>

      {showEditForm && editingGoal && (
        <GoalEditForm 
          goal={editingGoal}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      )}
    </AppLayout>
  );
};

export default Goals;