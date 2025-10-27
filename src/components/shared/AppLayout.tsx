
import { ReactNode } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import Navbar from './Navbar';
import { BottomNav } from '../mobile/BottomNav';
import { MobileHeader } from '../mobile/MobileHeader';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full flex">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Desktop Navbar - Hidden on mobile */}
          <div className="hidden md:block">
            <Navbar />
          </div>

          {/* Mobile Header - Visible only on mobile */}
          <MobileHeader />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="section-padding">
              <div className="max-w-7xl mx-auto py-3 md:py-8">
                <div className="animate-fade-in">
                  {children}
                </div>
              </div>
            </div>
          </main>

          {/* Mobile Bottom Navigation - Visible only on mobile */}
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
