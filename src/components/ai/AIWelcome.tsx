
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AIWelcomeProps {
  loading: boolean;
  onQuestionSelect: (question: string) => void;
}

const AIWelcome = ({ loading, onQuestionSelect }: AIWelcomeProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestedQuestions = [
    {
      question: "Como estão meus gastos este mês?",
      icon: "📊",
      category: "Análise"
    },
    {
      question: "Estou gastando demais em alguma categoria?",
      icon: "⚠️",
      category: "Análise"
    },
    {
      question: "Quanto preciso economizar para atingir minhas metas?",
      icon: "🎯",
      category: "Metas"
    },
    {
      question: "Quais são minhas maiores despesas recorrentes?",
      icon: "🔄",
      category: "Despesas"
    },
    {
      question: "Como posso melhorar minha taxa de poupança?",
      icon: "💰",
      category: "Economia"
    },
    {
      question: "Sugira um orçamento ideal baseado nos meus gastos",
      icon: "📈",
      category: "Planejamento"
    }
  ];

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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-12">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-2xl"></div>
          <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <Bot className="h-16 w-16 text-primary mx-auto" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Olá! Sou seu assistente financeiro inteligente
        </h3>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto mb-8">
          Posso analisar suas finanças, oferecer conselhos personalizados e ajudar a gerenciar seus dados.
        </p>

        {/* Suggestions Button */}
        <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 border-primary/20"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Sugestões de perguntas
              {showSuggestions ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-6">
            {/* Suggested Questions */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-center mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Perguntas Sugeridas
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestedQuestions.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="lg"
                    className="justify-start text-left h-auto py-4 px-4 hover:shadow-lg hover:border-primary/50 hover:scale-105 transition-all duration-200 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm group"
                    onClick={() => onQuestionSelect(item.question)}
                    disabled={loading}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm leading-relaxed block">{item.question}</span>
                        <span className="text-xs text-muted-foreground mt-1 block">{item.category}</span>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* CRUD Commands Section */}
            <div className="space-y-4 pt-6 border-t border-border/50">
              <h4 className="text-lg font-semibold text-center mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Comandos Avançados
              </h4>
              <p className="text-center text-sm text-muted-foreground mb-4">
                O assistente pode modificar seus dados com linguagem natural
              </p>
              <div className="grid gap-3">
                {crudCommands.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-3 px-4 hover:shadow-lg hover:border-green-500/50 hover:scale-105 transition-all duration-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50 group"
                    onClick={() => onQuestionSelect(item.command)}
                    disabled={loading}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="text-sm leading-relaxed text-green-700 dark:text-green-300 flex-1">{item.command}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default AIWelcome;
