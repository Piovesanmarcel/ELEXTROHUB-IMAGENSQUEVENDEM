
import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, ShoppingCart, Images, ImageIcon, Eye, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductsStatsCardsProps {
  stats: {
    total: number;
    lowStock: number;
    outOfStock: number;
    inStock: number;
    fewImages: number;
    smallImages: number;
    poorQualityImages: number;
    noImages: number;
  };
  isAnalyzing: boolean;
  totalImagesNeedingImprovement: number;
  onCardClick: (filter: "total" | "low" | "empty" | "fewImages" | "smallImages" | "poorQualityImages" | "noImages") => void;
}

export function ProductsStatsCards({ stats, isAnalyzing, totalImagesNeedingImprovement, onCardClick }: ProductsStatsCardsProps) {
  const cards = [
    {
      title: "Total de Produtos",
      value: stats.total,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      borderColor: "border-blue-200",
      onClick: () => onCardClick("total")
    },
    {
      title: "Estoque Baixo",
      value: stats.lowStock,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 hover:bg-yellow-100",
      borderColor: "border-yellow-200",
      onClick: () => onCardClick("low")
    },
    {
      title: "Sem Estoque",
      value: stats.outOfStock,
      icon: ShoppingCart,
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
      borderColor: "border-red-200",
      onClick: () => onCardClick("empty")
    },
    {
      title: "Poucas Imagens",
      value: stats.fewImages,
      icon: Images,
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
      borderColor: "border-orange-200",
      onClick: () => onCardClick("fewImages")
    },
    {
      title: "Sem Imagens",
      value: stats.noImages,
      icon: ImageIcon,
      color: "text-gray-600",
      bgColor: "bg-gray-50 hover:bg-gray-100",
      borderColor: "border-gray-200",
      onClick: () => onCardClick("noImages")
    },
    {
      title: "Imagens Pequenas",
      value: stats.smallImages,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      borderColor: "border-purple-200",
      onClick: () => onCardClick("smallImages")
    },
    {
      title: "Qualidade Inadequada",
      value: isAnalyzing ? null : stats.poorQualityImages,
      icon: Zap,
      color: "text-pink-600",
      bgColor: "bg-pink-50 hover:bg-pink-100",
      borderColor: "border-pink-200",
      onClick: () => onCardClick("poorQualityImages"),
      isAnalyzing
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className={`${card.bgColor} ${card.borderColor} border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 glass-effect`}
          onClick={card.onClick}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <card.icon className={`h-5 w-5 ${card.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {card.title}
                </p>
                <div className="flex items-center space-x-1">
                  {card.isAnalyzing ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    <p className={`text-lg font-bold ${card.color}`}>
                      {card.value?.toLocaleString() || '0'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
