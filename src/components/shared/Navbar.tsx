
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { FynanceLogo } from './FynanceLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { profile, getDisplayName, getInitials, loading: profileLoading, fetchProfile, onProfileUpdated } = useUserProfile();

  useEffect(() => {
    // Listen for profile updates and force refetch to bypass cache
    const unsubscribe = onProfileUpdated(() => {
      fetchProfile(true);
    });
    return unsubscribe;
  }, [onProfileUpdated, fetchProfile]);

  return (
    <header className="bg-background/80 backdrop-blur-xl border-b border-border fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
              <FynanceLogo size="md" className="h-10 w-10" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Fynance
              </span>
              <div className="hidden sm:block">
                <span className="text-xs text-muted-foreground font-medium">
                  Controle Inteligente
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Mobile Logo - Kept for backward compatibility but hidden */}
        <Link to="/" className="hidden flex items-center space-x-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
            <FynanceLogo size="md" className="h-10 w-10" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
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
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <span className="block text-muted-foreground text-xs">Bem-vindo,</span>
                  <span className="font-semibold text-foreground">
                    {getDisplayName()}
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
                <FynanceLogo size="sm" className="h-4 w-4 mr-2" />
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
