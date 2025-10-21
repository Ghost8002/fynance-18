import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, CreditCard, Menu, Bot, PiggyBank } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
  { title: 'Relatórios', href: '/relatorios', icon: '📊' },
  { title: 'Assistente IA', href: '/assistente-ia', icon: '🤖' },
  { title: 'Importações', href: '/importacoes', icon: '📥' },
  { title: 'Configurações', href: '/configuracoes', icon: '⚙️' },
  { title: 'Ajuda', href: '/ajuda', icon: '❓' }
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-300 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <item.icon className={`h-5 w-5 transition-all duration-300 ${
                isActive ? 'scale-110' : ''
              }`} />
              <span className="text-xs font-medium truncate">{item.title}</span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
        
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-muted-foreground hover:text-primary transition-colors">
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="space-y-1 pb-6">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-base">{item.title}</span>
                    </Link>
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
