
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, AlertTriangle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnhancementUsageDisplayProps {
  enhancements_used: number;
  enhancements_available: number;
  isLoading?: boolean;
}

export const EnhancementUsageDisplay = ({ 
  enhancements_used, 
  enhancements_available, 
  isLoading = false 
}: EnhancementUsageDisplayProps) => {
  const totalUsed = enhancements_used;
  const available = enhancements_available;
  const usagePercentage = totalUsed > 0 ? (totalUsed / (totalUsed + available)) * 100 : 0;

  const getStatusColor = () => {
    if (available === 0) return "text-red-600 bg-red-50 border-red-200";
    if (available <= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getStatusIcon = () => {
    if (available === 0) return <AlertTriangle className="h-4 w-4" />;
    if (available <= 50) return <AlertTriangle className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  const getStatusMessage = () => {
    if (available === 0) return "Créditos esgotados";
    if (available <= 50) return "Poucos créditos restantes";
    return "Créditos disponíveis";
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium text-sm">
              {getStatusMessage()}
            </span>
          </div>
          <Badge variant="outline" className="font-mono">
            {available} restantes
          </Badge>
        </div>
        
        <div className="text-xs text-gray-600 mb-3">
          {totalUsed} melhorias utilizadas • {available} disponíveis
        </div>

        {available === 0 && (
          <div className="space-y-2">
            <div className="text-xs text-red-700 bg-red-100 p-2 rounded border border-red-300">
              <strong>⚠️ Sem créditos!</strong> Você não pode usar a automação até comprar mais créditos.
            </div>
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              onClick={() => window.location.href = '/comprar-creditos'}
            >
              <ShoppingCart className="h-3 w-3 mr-2" />
              Comprar Mais Créditos
            </Button>
          </div>
        )}

        {available > 0 && available <= 50 && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
            <strong>Aviso:</strong> Seus créditos estão acabando. Considere adquirir mais créditos.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
