import { Link } from 'react-router-dom';
import ThemeToggle from '../shared/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

export function MobileHeader() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 1v22" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Fynance
          </span>
        </Link>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={logout}
              className="h-9 w-9 rounded-full"
            >
              <User className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
