
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/shared/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FrequentlyAskedQuestions from "@/components/help/FrequentlyAskedQuestions";
import ContactSupport from "@/components/help/ContactSupport";
import TutorialVideos from "@/components/help/TutorialVideos";
import Documentation from "@/components/help/Documentation";

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
        
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-6 bg-card border-border">
            <TabsTrigger value="faq" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Perguntas Frequentes</TabsTrigger>
            <TabsTrigger value="tutorials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tutoriais</TabsTrigger>
            <TabsTrigger value="documentation" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Documentação</TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Contato</TabsTrigger>
          </TabsList>
          <TabsContent value="faq">
            <FrequentlyAskedQuestions />
          </TabsContent>
          <TabsContent value="tutorials">
            <TutorialVideos />
          </TabsContent>
          <TabsContent value="documentation">
            <Documentation />
          </TabsContent>
          <TabsContent value="contact">
            <ContactSupport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Help;
