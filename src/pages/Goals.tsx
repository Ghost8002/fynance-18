
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import GoalList from "@/components/goals/GoalList";
import GoalForm from "@/components/goals/GoalForm";
import GoalProgress from "@/components/goals/GoalProgress";
import TransactionForm from "@/components/shared/TransactionForm";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Goals = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { data: goals, refetch } = useSupabaseData('goals', user?.id);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

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
        
        <GoalProgress goals={goals} onAddProgress={handleAddProgress} />
        
        <div className="mt-8">
          <GoalList />
        </div>
      </div>

      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Progresso à Meta</DialogTitle>
          </DialogHeader>
          <TransactionForm 
            defaultGoalId={selectedGoalId}
            onTransactionAdded={handleTransactionAdded}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Goals;
