import { Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface CreditsCompactBadgeProps {
  creditsAvailable: number;
  creditsUsed: number;
  isLoading?: boolean;
  showAICosts?: boolean;
}

export const CreditsCompactBadge = ({
  creditsAvailable,
  creditsUsed,
  isLoading = false,
  showAICosts = true
}: CreditsCompactBadgeProps) => {
  const isLow = creditsAvailable > 0 && creditsAvailable <= 10;
  const isEmpty = creditsAvailable === 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full animate-pulse">
          <div className="h-4 w-4 bg-gray-300 rounded-full" />
          <div className="h-4 w-12 bg-gray-300 rounded" />
        </div>
        {showAICosts && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full animate-pulse">
            <div className="h-4 w-4 bg-gray-300 rounded-full" />
            <div className="h-4 w-16 bg-gray-300 rounded" />
          </div>
        )}
      </div>
    );
  }

  const getBadgeStyles = () => {
    if (isEmpty) return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
    if (isLow) return "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200";
    return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200";
  };

  const getIcon = () => {
    if (isEmpty || isLow) return <AlertTriangle className="h-3.5 w-3.5" />;
    return <Zap className="h-3.5 w-3.5" />;
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-full border font-medium transition-colors ${getBadgeStyles()}`}
              onClick={() => window.location.href = '/comprar-creditos'}
            >
              {getIcon()}
              <span className="font-bold">{creditsAvailable}</span>
              <span className="text-xs opacity-80">créditos</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-center">
            <p className="font-medium">
              {isEmpty ? "Sem créditos disponíveis" : `${creditsAvailable} créditos disponíveis`}
            </p>
            <p className="text-xs text-muted-foreground">
              {creditsUsed} já utilizados • Clique para comprar mais
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

    </div>
  );
};
