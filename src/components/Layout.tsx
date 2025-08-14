
import { ReactNode } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from './shared/AppSidebar';
import Navbar from './shared/Navbar';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background w-full flex">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          
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
