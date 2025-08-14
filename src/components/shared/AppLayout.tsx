
import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import Navbar from './Navbar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full flex">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          
          <div className="md:hidden p-4 border-b bg-background/90 backdrop-blur-lg shadow-sm">
            <SidebarTrigger className="h-9 w-9 text-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-300 hover:scale-105" />
          </div>
          
          <main className="flex-1 section-padding overflow-auto">
            <div className="max-w-7xl mx-auto py-8">
              <div className="animate-fade-in">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
