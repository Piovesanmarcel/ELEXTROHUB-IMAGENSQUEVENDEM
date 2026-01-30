import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarNavigation } from "./SidebarNavigation";
import { MobileHeader } from "./MobileHeader";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 transition-colors duration-300">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <SidebarNavigation
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Content */}
      <div className="lg:ml-64 relative">
        {/* Desktop Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 hidden lg:flex gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 z-50"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>

        {/* Mobile Header */}
        <MobileHeader onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
