
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ElectroHubLogo } from "@/components/ElectroHubLogo";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { navigationItems, adminSection, NavigationItem } from "./NavigationItems";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface SidebarNavigationProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const SidebarNavigation = ({ isSidebarOpen, onToggleSidebar }: SidebarNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const { isAdmin, isLoading: isAdminLoading } = useAdminAuth();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === "/painel") {
      return location.pathname === href;
    }
    return location.pathname === href;
  };

  const isPricingActive = () => {
    return location.pathname.startsWith("/precificacao");
  };

  const togglePricing = () => {
    setIsPricingOpen(!isPricingOpen);
  };

  return (
    <div className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 shadow-xl transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="relative flex items-center justify-center p-6 border-b border-gray-200">
          <div className="text-purple-600">
            <ElectroHubLogo />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                <div className="space-y-1">
                  <button
                    onClick={togglePricing}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${isPricingActive()
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                      }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium flex-1 text-left">{item.name}</span>
                    {isPricingOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isPricingOpen && (
                    <div className="ml-8 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${isActiveRoute(subItem.href)
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                              : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
                            }`}
                          onClick={() => onToggleSidebar()}
                        >
                          <span>{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${isActiveRoute(item.href)
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                    }`}
                  onClick={() => onToggleSidebar()}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto bg-purple-600 text-white">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )}
            </div>
          ))}

          {/* Admin Section - Only visible to admins */}
          {isAdmin && !isAdminLoading && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 text-amber-700 hover:bg-amber-50"
              >
                <ShieldCheck className="h-5 w-5" />
                <span className="font-medium flex-1 text-left">{adminSection.title}</span>
                {isAdminOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              {isAdminOpen && (
                <div className="mt-1 space-y-1">
                  {adminSection.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${isActiveRoute(item.href)
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                          : "text-gray-700 hover:bg-amber-50 hover:text-amber-600"
                        }`}
                      onClick={() => onToggleSidebar()}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto bg-amber-600 text-white">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Sair</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
