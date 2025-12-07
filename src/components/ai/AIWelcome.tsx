import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

interface AIWelcomeProps {
  loading: boolean;
  onQuestionSelect: (question: string) => void;
}

const AIWelcome = ({ loading, onQuestionSelect }: AIWelcomeProps) => {
  const crudCommands = [
    {
      command: "Altere todas as transações do Uber para categoria Transporte",
      icon: "✏️"
    },
    {
      command: "Crie uma categoria nova chamada Investimentos",
      icon: "➕"
    },
    {
      command: "Exclua transações duplicadas do mês passado",
      icon: "🗑️"
    }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
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
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground text-center mb-4">
          Experimente um comando:
        </h4>
        <div className="grid gap-2 sm:gap-3">
          {crudCommands.map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="justify-start text-left h-auto py-3 px-4 hover:border-primary/50 transition-all duration-200 bg-card/50 group w-full"
              onClick={() => onQuestionSelect(item.command)}
              disabled={loading}
            >
              <div className="flex items-center gap-3 w-full">
                <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-sm leading-relaxed flex-1 text-foreground/80">
                  {item.command}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIWelcome;
