import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import AIAssistant from "@/components/ai/AIAssistant";
const AIAssistantPage = () => {
  const {
    isAuthenticated
  } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  return <AppLayout>
      <div className="space-y-6">
        
        
        <AIAssistant />
      </div>
    </AppLayout>;
};
export default AIAssistantPage;