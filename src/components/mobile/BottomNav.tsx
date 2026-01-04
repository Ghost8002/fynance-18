import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, CreditCard, Menu, PiggyBank } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { PrefetchLink } from '@/components/shared/PrefetchLink';

const primaryNavItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    title: 'Transações',
    icon: Receipt,
    href: '/transacoes'
  },
  {
    title: 'Cartões',
    icon: CreditCard,
    href: '/cartoes'
  },
  {
    title: 'Orçamentos',
    icon: PiggyBank,
    href: '/orcamentos'
  }
];

const menuItems = [
  { title: 'Calendário', href: '/calendario', icon: '📅' },
  { title: 'A Receber e Pagar', href: '/contas-dividas', icon: '📄' },
  { title: 'Contas Bancárias', href: '/contas', icon: '💳' },
  { title: 'Metas', href: '/metas', icon: '🎯' },
  { title: 'Investimentos', href: '/investimentos', icon: '📈' },
  { title: 'Relatórios', href: '/relatorios', icon: '📊' },
  { title: 'Assistente IA', href: '/assistente-ia', icon: '🤖' },
  { title: 'Importações', href: '/importacoes', icon: '📥' },
  { title: 'Configurações', href: '/configuracoes', icon: '⚙️' },
  { title: 'Ajuda', href: '/ajuda', icon: '❓' }
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-14 px-1">
        {primaryNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <PrefetchLink
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-0.5 transition-all duration-300 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <item.icon className={`h-4.5 w-4.5 transition-all duration-300 ${
                isActive ? 'scale-110' : ''
              }`} />
              <span className="text-[10px] font-medium truncate max-w-[60px]">{item.title}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-t-full" />
              )}
            </PrefetchLink>
          );
        })}
        
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full space-y-0.5 text-muted-foreground hover:text-primary transition-colors">
              <Menu className="h-4.5 w-4.5" />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[65vh] rounded-t-2xl">
            <SheetHeader className="mb-3">
              <SheetTitle className="text-lg font-bold">Menu</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-50px)]">
              <div className="space-y-0.5 pb-4">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <PrefetchLink
                      key={item.href}
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm">{item.title}</span>
                    </PrefetchLink>
                  );
                })}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
