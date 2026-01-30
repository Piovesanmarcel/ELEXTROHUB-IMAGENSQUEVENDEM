import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { ElectroHubLogo } from "@/components/ElectroHubLogo";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  onToggleSidebar: () => void;
}

export const MobileHeader = ({ onToggleSidebar }: MobileHeaderProps) => {
  const navigate = useNavigate();

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
    <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-purple-100">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleSidebar}
        className="text-gray-600"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <ElectroHubLogo />
      <Button variant="ghost" size="icon" onClick={handleSignOut}>
        <LogOut className="w-5 h-5 text-red-600" />
      </Button>
    </div>
  );
};
