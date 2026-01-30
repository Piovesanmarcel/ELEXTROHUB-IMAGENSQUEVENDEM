
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Plus, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface CreditsSummaryCardProps {
  enhancements_used: number;
  enhancements_available: number;
  isLoading?: boolean;
}

export const CreditsSummaryCard = ({ 
  enhancements_used, 
  enhancements_available, 
  isLoading = false 
}: CreditsSummaryCardProps) => {
  const getStatusColor = () => {
    if (enhancements_available === 0) return "text-red-600 bg-red-50 border-red-200";
    if (enhancements_available <= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getStatusIcon = () => {
    if (enhancements_available === 0) return <AlertTriangle className="h-6 w-6" />;
    if (enhancements_available <= 50) return <AlertTriangle className="h-6 w-6" />;
    return <Zap className="h-6 w-6" />;
  };

  if (isLoading) {
    return (
      <Card className="border-2 h-[400px]">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 h-[400px] ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          {getStatusIcon()}
          Créditos de Melhoria
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold">
              {enhancements_available}
            </div>
            <p className="text-sm text-muted-foreground">
              créditos disponíveis
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-lg px-3 py-1">
            {enhancements_used} usados
          </Badge>
        </div>
        
        {enhancements_available <= 50 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              {enhancements_available === 0 
                ? "⚠️ Créditos esgotados! Adquira mais para continuar melhorando suas imagens."
                : "⚠️ Poucos créditos restantes. Considere adquirir mais créditos."
              }
            </p>
          </div>
        )}

        <div className="mt-auto space-y-3">
          <Button asChild className="w-full" variant={enhancements_available === 0 ? "default" : "outline"}>
            <Link to="/comprar-creditos">
              <Plus className="h-4 w-4 mr-2" />
              Comprar Mais Créditos
            </Link>
          </Button>
          
          <Button asChild className="w-full" variant="outline">
            <Link to="/comprar-creditos">
              <Plus className="h-4 w-4 mr-2" />
              Adquirir Créditos Extras
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
