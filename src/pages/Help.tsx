
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import FrequentlyAskedQuestions from "@/components/help/FrequentlyAskedQuestions";

const Help = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Ajuda</h1>
          <p className="text-muted-foreground">Encontre respostas para suas dúvidas</p>
        </div>
        
        <FrequentlyAskedQuestions />
      </div>
    </AppLayout>
  );
};

export default Help;
