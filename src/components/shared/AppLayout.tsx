import { ReactNode } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import Navbar from './Navbar';
import { BottomNav } from '../mobile/BottomNav';
import { MobileHeader } from '../mobile/MobileHeader';
import { TopProgressBar } from './TopProgressBar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <TopProgressBar />
      <div className="min-h-screen bg-background w-full flex">
        {/* Desktop Sidebar - Hidden on mobile + tablet */}
        <div className="hidden lg:block">
          <AppSidebar />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Desktop Navbar - Hidden on mobile + tablet */}
          <div className="hidden lg:block">
            <Navbar />
          </div>

          {/* Mobile/Tablet Header */}
          <MobileHeader />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto pb-16 lg:pb-0 pt-[49px] lg:pt-[73px]">
            <div className="section-padding">
              <div className="max-w-7xl mx-auto py-3 lg:py-8">
                <div className="animate-fade-in">
                  {children}
                </div>
              </div>
            </div>
          </main>

          {/* Mobile/Tablet Bottom Navigation */}
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
