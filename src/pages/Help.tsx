import AppLayout from "@/components/shared/AppLayout";
import FrequentlyAskedQuestions from "@/components/help/FrequentlyAskedQuestions";

const Help = () => {

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
