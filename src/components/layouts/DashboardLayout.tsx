import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarNavigation } from "./SidebarNavigation";
import { MobileHeader } from "./MobileHeader";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopCollapsed(!isDesktopCollapsed);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <SidebarNavigation
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleDesktopSidebar={toggleDesktopSidebar}
      />

      {/* Main Content */}
      <div className={cn(
        "relative transition-all duration-300 ease-in-out pb-20 pt-4", // Added pb-20 for safety
        isDesktopCollapsed ? "lg:ml-20" : "lg:ml-64"
      )}>
        {/* Desktop Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 hidden lg:flex gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 z-50"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>

        {/* Mobile Header */}
        <MobileHeader onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
