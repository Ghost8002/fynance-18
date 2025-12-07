import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
interface AIWelcomeProps {
  loading: boolean;
  onQuestionSelect: (question: string) => void;
}
const AIWelcome = ({
  loading,
  onQuestionSelect
}: AIWelcomeProps) => {
  const crudCommands = [{
    command: "Altere todas as transações do Uber para categoria Transporte",
    icon: "✏️"
  }, {
    command: "Crie uma categoria nova chamada Investimentos",
    icon: "➕"
  }, {
    command: "Exclua transações duplicadas do mês passado",
    icon: "🗑️"
  }];
  return <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Welcome Section */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-2xl"></div>
          <div className="relative p-4 sm:p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 w-fit mx-auto">
            <Bot className="h-10 w-10 sm:h-14 sm:w-14 text-primary" />
          </div>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Assistente Financeiro IA
        </h3>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          Posso analisar suas finanças e ajudar a gerenciar seus dados com linguagem natural.
        </p>
      </div>

      {/* Advanced Commands Section */}
      
    </div>;
};
export default AIWelcome;