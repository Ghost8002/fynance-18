
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import GoalForm from "@/components/goals/GoalForm";
import GoalProgress from "@/components/goals/GoalProgress";
import GoalEditForm from "@/components/goals/GoalEditForm";
import TransactionForm from "@/components/shared/TransactionForm";
import { useSupabaseData } from "@/hooks/useSupabaseData";

const Goals = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { data: goals, refetch } = useSupabaseData('goals', user?.id);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleAddProgress = (goalId: string) => {
    setSelectedGoalId(goalId);
    setShowTransactionForm(true);
  };

  const handleTransactionAdded = () => {
    setShowTransactionForm(false);
    setSelectedGoalId(null);
    refetch();
  };

  const handleFormCancel = () => {
    setShowTransactionForm(false);
    setSelectedGoalId(null);
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Metas</h1>
            <p className="text-muted-foreground">Crie e acompanhe suas metas financeiras</p>
          </div>
          
          <GoalForm />
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

      {showTransactionForm && selectedGoalId && (
        <TransactionForm 
          defaultGoalId={selectedGoalId}
          onTransactionAdded={handleTransactionAdded}
          onCancel={handleFormCancel}
          forceOpen={true}
        />
      )}

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
