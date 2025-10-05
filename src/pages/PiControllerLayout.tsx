import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Activity } from "lucide-react";

const PiControllerLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Pi Controller
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Hardware & Cluster Management
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-6 py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default PiControllerLayout;
