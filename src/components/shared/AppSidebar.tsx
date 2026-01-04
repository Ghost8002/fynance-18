import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, CreditCard, PiggyBank, BarChart3, Target, Settings, Calendar, Wallet, HelpCircle, FileText, Bot, Shield, FileDown, TrendingUp } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { FynanceLogo } from './FynanceLogo';

// Estrutura organizada por categorias
const navigationSections = [{
  title: "Visão Geral",
  items: [{
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard'
  }, {
    title: 'Calendário',
    icon: Calendar,
    href: '/calendario'
  }]
}, {
  title: "Movimentações",
  items: [{
    title: 'Transações',
    icon: Receipt,
    href: '/transacoes'
  }, {
    title: 'Cartões',
    icon: CreditCard,
    href: '/cartoes'
  }, {
    title: 'A Receber e Pagar',
    icon: FileText,
    href: '/contas-dividas'
  }, {
    title: 'Contas Bancárias',
    icon: Wallet,
    href: '/contas'
  }]
}, {
  title: "Planejamento/Análises",
  items: [{
    title: 'Orçamentos',
    icon: PiggyBank,
    href: '/orcamentos'
  }, {
    title: 'Metas',
    icon: Target,
    href: '/metas'
  }, {
    title: 'Investimentos',
    icon: TrendingUp,
    href: '/investimentos'
  }, {
    title: 'Relatórios',
    icon: BarChart3,
    href: '/relatorios'
  }, {
    title: 'Assistente IA',
    icon: Bot,
    href: '/assistente-ia'
  }]
}, {
  title: "Sistema",
  items: [{
    title: 'Importações',
    icon: FileDown,
    href: '/importacoes'
  }, {
    title: 'Configurações',
    icon: Settings,
    href: '/configuracoes'
  }, {
    title: 'Ajuda',
    icon: HelpCircle,
    href: '/ajuda'
  }]
}];
export function AppSidebar() {
  const location = useLocation();
  return <Sidebar className="glass backdrop-blur-xl">
      <SidebarContent className="bg-background/95 backdrop-blur-xl">
        {/* Logo Section */}
        <div className="px-6 py-4 border-b border-border flex items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg overflow-hidden">
              <FynanceLogo size="md" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent group-hover:from-primary/80 group-hover:to-primary transition-all duration-500">
              Fynance
            </span>
          </Link>
        </div>
        
        {/* Navigation Section */}
        <div className="flex-1 py-6 space-y-6">
          {navigationSections.map((section, sectionIndex) => <SidebarGroup key={section.title}>
              <SidebarGroupLabel className="text-muted-foreground font-semibold px-6 mb-3 text-xs uppercase tracking-wider">
                {section.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 px-4">
                  {section.items.map((item, itemIndex) => {
                const globalIndex = navigationSections.slice(0, sectionIndex).reduce((acc, s) => acc + s.items.length, 0) + itemIndex;
                return <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={location.pathname === item.href} className="w-full h-11 px-4 rounded-xl transition-all duration-300 group
                                     hover:bg-primary/10 hover:text-primary hover:shadow-md hover:scale-[1.02]
                                     data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary data-[active=true]:to-primary/80 
                                     data-[active=true]:text-primary-foreground data-[active=true]:shadow-lg data-[active=true]:font-semibold" style={{
                    animationDelay: `${globalIndex * 0.03}s`
                  }}>
                          <Link to={item.href} className="flex items-center space-x-3 w-full">
                            <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                            <span className="truncate font-medium text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>;
              })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>)}
        </div>

        {/* Footer Section */}
        <div className="p-6 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">© 2025 Fynance</p>
            <p className="text-xs text-muted-foreground mt-1">Versão 2.0.1</p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>;
}