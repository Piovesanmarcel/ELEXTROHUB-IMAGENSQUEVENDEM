
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp } from "lucide-react";

interface EnhancedProductsCardProps {
  count: number;
  onClick: () => void;
}

export const EnhancedProductsCard = ({ count, onClick }: EnhancedProductsCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-purple-700">
          Produtos com DeepAI
        </CardTitle>
        <Zap className="h-4 w-4 text-purple-600" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-purple-900">{count}</div>
          <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-100">
            <TrendingUp className="h-3 w-3 mr-1" />
            Melhorados
          </Badge>
        </div>
        <p className="text-xs text-purple-600 mt-1">
          SKUs com imagens melhoradas
        </p>
      </CardContent>
    </Card>
  );
};
