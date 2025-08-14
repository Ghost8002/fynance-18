
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  PiggyBank, 
  BarChart3, 
  Target, 
  Settings, 
  Calendar, 
  Wallet, 
  HelpCircle, 
  FileText, 
  Bot, 
  Shield, 
  FileDown 
} from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

const navigationItems = [{
  title: 'Dashboard',
  icon: LayoutDashboard,
  href: '/dashboard'
}, {
  title: 'Transações',
  icon: Receipt,
  href: '/transacoes'
}, {
  title: 'Importações',
  icon: FileDown,
  href: '/importacoes'
}, {
  title: 'Contas e Dívidas',
  icon: FileText,
  href: '/contas-dividas'
}, {
  title: 'Cartões',
  icon: CreditCard,
  href: '/cartoes'
}, {
  title: 'Contas',
  icon: Wallet,
  href: '/contas'
}, {
  title: 'Controle',
  icon: Shield,
  href: '/controle'
}, {
  title: 'Orçamentos',
  icon: PiggyBank,
  href: '/orcamentos'
}, {
  title: 'Metas',
  icon: Target,
  href: '/metas'
}, {
  title: 'Relatórios',
  icon: BarChart3,
  href: '/relatorios'
}, {
  title: 'Calendário',
  icon: Calendar,
  href: '/calendario'
}, {
  title: 'Assistente IA',
  icon: Bot,
  href: '/assistente-ia'
}, {
  title: 'Configurações',
  icon: Settings,
  href: '/configuracoes'
}, {
  title: 'Ajuda',
  icon: HelpCircle,
  href: '/ajuda'
}];

export function AppSidebar() {
  const location = useLocation();
  return <Sidebar className="border-r border-border glass backdrop-blur-xl">
      <SidebarContent className="bg-background/95 backdrop-blur-xl">
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                <path d="M12 1v22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="space-y-1">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent group-hover:from-primary/80 group-hover:to-primary transition-all duration-500">
                Fynance
              </span>
              <div className="flex items-center gap-1">
                
                <span className="text-xs text-muted-foreground font-medium">
                  Controle Inteligente
                </span>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Navigation Section */}
        <div className="flex-1 py-6">
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground font-semibold px-6 mb-4 text-xs uppercase tracking-wider">
              Navegação Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2 px-4">
                {navigationItems.map((item, index) => <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href} className="w-full h-12 px-4 rounded-xl transition-all duration-300 group
                               hover:bg-primary/10 hover:text-primary hover:shadow-md hover:scale-[1.02]
                               data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary data-[active=true]:to-primary/80 
                               data-[active=true]:text-primary-foreground data-[active=true]:shadow-lg data-[active=true]:font-semibold" style={{
                  animationDelay: `${index * 0.05}s`
                }}>
                      <Link to={item.href} className="flex items-center space-x-3 w-full">
                        <item.icon className="h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                        <span className="truncate font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Footer Section */}
        <div className="p-6 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              © 2024 Fynance
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Versão 2.0
            </p>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>;
}
