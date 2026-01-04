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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-2xl"></div>
          <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 inline-block mx-auto">
            <Bot className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Olá! Sou seu assistente financeiro inteligente
        </h3>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
          Posso analisar suas finanças, criar transações, gerenciar metas e muito mais — tudo por linguagem natural.
        </p>
      </div>

      {/* Suggestions */}
      <Collapsible open={showSuggestions} onOpenChange={setShowSuggestions}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-medium">Perguntas sugeridas</span>
            </div>
            {showSuggestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 justify-start text-left hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => onQuestionSelect(item.question)}
                disabled={loading}
              >
                <span className="mr-2 text-lg">{item.icon}</span>
                <span className="text-sm">{item.question}</span>
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* CRUD Examples */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-4">
          <Sparkles className="h-5 w-5 text-emerald-500" />
          <span className="font-medium text-sm text-muted-foreground">Comandos inteligentes</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-4">
          {crudExamples.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-auto p-3 justify-start text-left bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10 hover:from-emerald-100 hover:to-emerald-50 dark:hover:from-emerald-950/50 dark:hover:to-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 transition-all"
              onClick={() => onQuestionSelect(item.command)}
              disabled={loading}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">{item.description}</p>
                  <p className="text-sm truncate">{item.command}</p>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIWelcome;