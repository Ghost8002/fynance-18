
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Command, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="glass-nav border-b border-border sticky top-0 z-50">
      <div className="container mx-auto section-padding py-4 flex items-center justify-between">
        {/* Logo - Hidden on larger screens when sidebar is visible */}
        <Link to="/" className="md:hidden flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-finance-primary to-finance-secondary text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M12 1v22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-finance-primary to-finance-secondary bg-clip-text text-transparent">
            Fynance
          </span>
        </Link>

        {/* Navigation - Hidden when sidebar is present */}
        <nav className="hidden lg:flex items-center space-x-8">
          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
              >
                Dashboard
              </Link>
              <Link 
                to="/transacoes" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
              >
                Transações
              </Link>
              <Link 
                to="/metas" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
              >
                Metas
              </Link>
              <Link 
                to="/relatorios" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
              >
                Relatórios
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
              >
                Início
              </Link>
              <Link 
                to="/recursos" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
              >
                Recursos
              </Link>
              <Link 
                to="/precos" 
                className="text-muted-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105"
              >
                Preços
              </Link>
            </>
          )}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-primary/5 rounded-full border border-border">
                <div className="p-1 bg-primary/10 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm">
                  <span className="block text-muted-foreground text-xs">Bem-vindo,</span>
                  <span className="font-semibold text-foreground">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                  </span>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={logout}
                className="border-2 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary
                         transition-all duration-300 hover:shadow-lg hover:scale-105 rounded-full px-6"
              >
                Sair
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button className="button-gradient text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 rounded-full px-6">
                <Command className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
