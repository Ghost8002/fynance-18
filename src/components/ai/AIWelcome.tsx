
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
    "Como estão meus gastos este mês?",
    "Qual minha categoria de maior gasto?",
    "Como posso economizar mais dinheiro?",
    "Estou progredindo bem nas minhas metas?"
  ];

  const crudCommands = [
    "Mude a categoria das transações que contém 'uber' para Transporte",
    "Mostre todas as transações de alimentação deste mês"
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
              <h4 className="text-lg font-semibold text-center mb-6">
                Perguntas gerais:
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="lg"
                    className="justify-start text-left h-auto py-4 px-4 hover:shadow-md hover:border-primary/50 transition-all duration-200 bg-card/50 backdrop-blur-sm"
                    onClick={() => onQuestionSelect(question)}
                    disabled={loading}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-primary"></div>
                      <span className="text-sm leading-relaxed">{question}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* CRUD Commands Section */}
            <div className="space-y-4 pt-6 border-t border-border/50">
              <h4 className="text-lg font-semibold text-center mb-4 text-green-600">
                Comandos para alterar dados:
              </h4>
              <div className="grid gap-2">
                {crudCommands.map((command, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-3 px-3 hover:shadow-md hover:border-green-500/50 transition-all duration-200 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50"
                    onClick={() => onQuestionSelect(command)}
                    disabled={loading}
                  >
                    <div className="flex items-start gap-2">
                      <div className="h-3 w-3 bg-green-600 rounded-full mt-1 flex-shrink-0" />
                      <span className="text-xs leading-relaxed text-green-700 dark:text-green-300">{command}</span>
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
