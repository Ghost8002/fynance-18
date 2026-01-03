import { Link } from 'react-router-dom';
import ThemeToggle from '../shared/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { FynanceLogo } from '../shared/FynanceLogo';
import InstallPWAButton from '../shared/InstallPWAButton';

export function MobileHeader() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-3 py-2">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
            <FynanceLogo size="sm" />
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Fynance
          </span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-1">
          <InstallPWAButton />
          <ThemeToggle />
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              className="h-8 w-8 rounded-full"
            >
              <User className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
