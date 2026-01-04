import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, ChevronDown, ChevronUp, Sparkles, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AIWelcomeProps {
  loading: boolean;
  onQuestionSelect: (question: string) => void;
}

const AIWelcome = ({ loading, onQuestionSelect }: AIWelcomeProps) => {
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const suggestedQuestions = [
    { question: "Como estão meus gastos este mês?", icon: "📊", category: "Análise" },
    { question: "Estou gastando demais em alguma categoria?", icon: "⚠️", category: "Análise" },
    { question: "Quanto preciso economizar para atingir minhas metas?", icon: "🎯", category: "Metas" },
    { question: "Quais são minhas maiores despesas recorrentes?", icon: "🔄", category: "Despesas" },
    { question: "Como posso melhorar minha taxa de poupança?", icon: "💰", category: "Economia" },
    { question: "Sugira um orçamento ideal baseado nos meus gastos", icon: "📈", category: "Planejamento" }
  ];

  const crudExamples = [
    { 
      command: "Comprei um café por R$ 15 hoje", 
      icon: <PlusCircle className="h-4 w-4" />,
      description: "Criar transação"
    },
    { 
      command: "Mude todas as transações do Uber para Transporte", 
      icon: <RefreshCw className="h-4 w-4" />,
      description: "Atualizar transações"
    },
    { 
      command: "Quero juntar R$ 5000 para viagem até dezembro", 
      icon: <Sparkles className="h-4 w-4" />,
      description: "Criar meta"
    },
    { 
      command: "Crie uma categoria chamada Freelance", 
      icon: <PlusCircle className="h-4 w-4" />,
      description: "Criar categoria"
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-8 px-1">
      {/* Welcome Section */}
      <div className="text-center py-4 sm:py-8">
        <div className="relative mb-4 sm:mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-2xl"></div>
          <div className="relative p-4 sm:p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 inline-block mx-auto">
            <Bot className="h-10 w-10 sm:h-16 sm:w-16 text-primary" />
          </div>
        </div>
        <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent px-2">
          Olá! Sou seu assistente financeiro
        </h3>
        <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed max-w-md mx-auto px-4">
          Analiso suas finanças, crio transações e gerencio metas — tudo por linguagem natural.
        </p>
      </div>

      {/* CRUD Examples - Show first on mobile */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 px-2 sm:px-4">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
          <span className="font-medium text-xs sm:text-sm text-muted-foreground">Comandos inteligentes</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 px-1 sm:px-4">
          {crudExamples.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-2 sm:p-3 justify-start text-left bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10 hover:from-emerald-100 hover:to-emerald-50 dark:hover:from-emerald-950/50 dark:hover:to-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 transition-all"
              onClick={() => onQuestionSelect(item.command)}
              disabled={loading}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 w-full">
                <div className="p-1 sm:p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">{item.description}</p>
                  <p className="text-xs sm:text-sm line-clamp-2 sm:truncate">{item.command}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between p-3 sm:p-4 h-auto">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-medium text-sm sm:text-base">Perguntas sugeridas</span>
            </div>
            {showSuggestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 sm:space-y-4 pt-1 sm:pt-2">
          <div className="grid grid-cols-1 gap-1.5 sm:gap-2 px-1 sm:px-0">
            {suggestedQuestions.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-2.5 sm:p-3 justify-start text-left hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => onQuestionSelect(item.question)}
                disabled={loading}
              >
                <span className="mr-2 text-base sm:text-lg">{item.icon}</span>
                <span className="text-xs sm:text-sm">{item.question}</span>
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AIWelcome;