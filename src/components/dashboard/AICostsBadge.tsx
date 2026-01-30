import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAICosts } from "@/hooks/useAICosts";
import { useLocation } from "react-router-dom";

interface AICostsBadgeProps {
  isLoading?: boolean;
  forceEnabled?: boolean; // ✅ Permite forçar carregamento em páginas específicas
}

export const AICostsBadge = ({ isLoading = false, forceEnabled = false }: AICostsBadgeProps) => {
  const location = useLocation();
  
  // ✅ Só habilitar em rotas relevantes ou se forçado
  const isOnCostsPage = location.pathname === '/custos-ia';
  const shouldEnable = forceEnabled || isOnCostsPage;
  
  const { totals, isLoading: isLoadingCosts } = useAICosts({ enabled: shouldEnable });
  
  const loading = isLoading || (shouldEnable && isLoadingCosts);

  // ✅ Se não está habilitado, mostrar badge simplificado sem dados
  if (!shouldEnable) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full border font-medium transition-colors bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
              onClick={() => window.location.href = '/custos-ia'}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs">Ver custos</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-center">
            <p className="font-medium">Custos dos Agentes</p>
            <p className="text-xs text-muted-foreground">
              Clique para ver detalhes completos
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full animate-pulse">
        <div className="h-4 w-4 bg-gray-300 rounded-full" />
        <div className="h-4 w-16 bg-gray-300 rounded" />
      </div>
    );
  }

  const costBRL = totals?.totalCostBRL || 0;
  const costUSD = totals?.totalCostUSD || 0;
  const requests = totals?.totalRequests || 0;

  // Cores baseadas no custo
  const getBadgeStyles = () => {
    if (costBRL >= 10) return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
    if (costBRL >= 5) return "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200";
    return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full border font-medium transition-colors ${getBadgeStyles()}`}
            onClick={() => window.location.href = '/custos-ia'}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span className="font-bold">R$ {costBRL.toFixed(2)}</span>
            <span className="text-xs opacity-80">({requests} req)</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-center">
          <p className="font-medium">Custos dos Agentes</p>
          <p className="text-sm">
            R$ {costBRL.toFixed(4)} • ${costUSD.toFixed(4)} USD
          </p>
          <p className="text-xs text-muted-foreground">
            {totals?.byProvider?.gemini?.requests || 0} Gemini • {totals?.byProvider?.openai?.requests || 0} OpenAI
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique para ver detalhes completos
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
