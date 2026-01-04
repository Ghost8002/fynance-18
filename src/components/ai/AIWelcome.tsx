import { Bot } from 'lucide-react';

const AIWelcome = () => {
  return (
    <div className="max-w-2xl mx-auto px-1">
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
    </div>
  );
};

export default AIWelcome;