import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
interface AIWelcomeProps {
  loading: boolean;
  onQuestionSelect: (question: string) => void;
}
const AIWelcome = ({
  loading,
  onQuestionSelect
}: AIWelcomeProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestedQuestions = [{
    question: "Como estão meus gastos este mês?",
    icon: "📊",
    category: "Análise"
  }, {
    question: "Estou gastando demais em alguma categoria?",
    icon: "⚠️",
    category: "Análise"
  }, {
    question: "Quanto preciso economizar para atingir minhas metas?",
    icon: "🎯",
    category: "Metas"
  }, {
    question: "Quais são minhas maiores despesas recorrentes?",
    icon: "🔄",
    category: "Despesas"
  }, {
    question: "Como posso melhorar minha taxa de poupança?",
    icon: "💰",
    category: "Economia"
  }, {
    question: "Sugira um orçamento ideal baseado nos meus gastos",
    icon: "📈",
    category: "Planejamento"
  }];
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
  return <div className="max-w-2xl mx-auto space-y-8">
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
        
      </div>
    </div>;
};
export default AIWelcome;