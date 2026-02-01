
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  X,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { navigationItems, adminSection } from "./NavigationItems";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ElectroHubLogo } from "@/components/ElectroHubLogo";

interface SidebarNavigationProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
}

export const SidebarNavigation = ({
  isSidebarOpen,
  onToggleSidebar,
  isDesktopCollapsed = false,
  onToggleDesktopSidebar
}: SidebarNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isPricingOpen, setIsPricingOpen] = useState(false);
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
    // Exact match for dashboard root
    if (href === "/painel") {
      return location.pathname === href;
    }
    // Prefix match for others
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const isPricingActive = () => {
    return location.pathname.startsWith("/precificacao");
  };

  const togglePricing = () => {
    if (isDesktopCollapsed && onToggleDesktopSidebar) {
      onToggleDesktopSidebar();
      setTimeout(() => setIsPricingOpen(true), 150);
    } else {
      setIsPricingOpen(!isPricingOpen);
    }
  };

  return (
    <div className={cn(
      "fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-lg",
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:translate-x-0',
      isDesktopCollapsed ? 'w-20' : 'w-64'
    )}>
      <div className="flex flex-col h-full bg-white">
        {/* Logo Section */}
        <div className={cn(
          "relative flex items-center justify-center h-24 border-b border-gray-100",
          isDesktopCollapsed ? "px-2" : "px-4"
        )}>
          <Link to="/painel" className="flex items-center justify-center w-full">
            <div className={cn(
              "relative flex items-center justify-center transition-all duration-300",
              isDesktopCollapsed ? "w-14 h-14" : "w-20 h-20"
            )}>
              <ElectroHubLogo size={isDesktopCollapsed ? "sm" : "md"} showText={false} />
            </div>
          </Link>

          {/* Botão de Fechar (Mobile) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {navigationItems.map((item) => (
            <div key={item.name} className="relative">
              {item.submenu ? (
                <div className="space-y-1">
                  {isDesktopCollapsed ? (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={togglePricing}
                            className={cn(
                              "w-full flex items-center justify-center p-2 rounded-xl transition-all duration-200",
                              isPricingActive() ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          {item.name}
                          <ChevronRight className="w-3 h-3" />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <>
                      <button
                        onClick={togglePricing}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                          isPricingActive()
                            ? "bg-primary/10 text-primary"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", isPricingActive() ? "text-primary" : "text-gray-500 group-hover:text-gray-900")} />
                        <span className="flex-1 text-left">{item.name}</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isPricingOpen && "rotate-180")} />
                      </button>

                      <div className={cn(
                        "overflow-hidden transition-all duration-300 space-y-1",
                        isPricingOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                      )}>
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 pl-10 rounded-lg text-sm transition-colors relative",
                              isActiveRoute(subItem.href)
                                ? "text-primary font-medium bg-primary/10"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            )}
                          >
                            {isActiveRoute(subItem.href) && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                            )}
                            <span>{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                isDesktopCollapsed ? (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center justify-center p-2 rounded-xl transition-all duration-200 my-1",
                            isActiveRoute(item.href)
                              ? "bg-primary text-white shadow-md shadow-primary/20"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative",
                      isActiveRoute(item.href)
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActiveRoute(item.href) ? "text-white" : "text-gray-500 group-hover:text-gray-900")} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge className="ml-auto bg-primary hover:bg-primary/90 text-white border-0 text-[10px] px-1.5 py-0 h-5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              )}
            </div>
          ))}

          {/* Admin Section */}
          {isAdmin && !isAdminLoading && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              {isDesktopCollapsed ? (
                <div className="flex justify-center text-[10px] font-bold text-gray-400 uppercase mb-2">ADM</div>
              ) : (
                <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Administração
                </div>
              )}

              <div className="space-y-1">
                {adminSection.items.map((item) => (
                  isDesktopCollapsed ? (
                    <TooltipProvider key={item.name} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              "flex items-center justify-center p-2 rounded-xl transition-all duration-200 my-1 relative",
                              isActiveRoute(item.href)
                                ? "bg-[hsl(var(--teal))] text-white shadow-md shadow-[hsl(var(--teal)/0.2)]"
                                : "text-gray-500 hover:text-[hsl(var(--teal))] hover:bg-[hsl(var(--teal)/0.1)]"
                            )}
                          >
                            <item.icon className="h-5 w-5" />
                            {item.badge && (
                              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary border border-white" />
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-[hsl(var(--teal))] text-white border-[hsl(var(--teal))]">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActiveRoute(item.href)
                          ? "bg-[hsl(var(--teal))] text-white shadow-md shadow-[hsl(var(--teal)/0.2)]"
                          : "text-gray-600 hover:text-[hsl(var(--teal))] hover:bg-[hsl(var(--teal)/0.1)]"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActiveRoute(item.href) ? "text-white" : "text-gray-500 group-hover:text-[hsl(var(--teal))]")} />
                      <span>{item.name}</span>
                      {item.badge && (
                        <Badge className="ml-auto bg-primary text-white border-0 text-[10px] px-1.5 py-0 h-5">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer / Toggle Button */}
        <div className="border-t border-gray-200 p-3">
          {!isDesktopCollapsed && (
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-500 hover:text-red-600 hover:bg-red-50 mb-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da conta</span>
            </Button>
          )}

          {isDesktopCollapsed && (
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="icon"
              className="w-full flex justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 mb-2"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}

          {/* DESKTOP TOGGLE */}
          {onToggleDesktopSidebar && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDesktopSidebar}
              className="hidden lg:flex w-full items-center justify-center border-dashed border-gray-300 text-gray-500 hover:text-primary hover:bg-primary/5 hover:border-primary"
            >
              {isDesktopCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 mr-2" />
                  <span className="text-xs">Ocultar Menu</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
