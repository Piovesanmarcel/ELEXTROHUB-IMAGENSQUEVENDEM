import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafePieChart, SafeBarChart } from "@/components/charts/SafeChart";
import { Image, Eye, Calendar } from "lucide-react";
import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEnhancedProductsData } from "@/hooks/useEnhancedProductsData";

interface EnhancementStatsChartProps {
  enhancements_used: number;
  enhancements_available: number;
  isLoading?: boolean;
}

export const EnhancementStatsChart = ({ 
  enhancements_used, 
  enhancements_available, 
  isLoading = false 
}: EnhancementStatsChartProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { enhancedProducts, isLoadingEnhanced } = useEnhancedProductsData();
  
  const chartData = useMemo(() => [
    { name: "Melhoradas", value: enhancements_used, color: "#8B5CF6" },
    { name: "Disponíveis", value: enhancements_available, color: "#E5E7EB" }
  ], [enhancements_used, enhancements_available]);

  // Gerar dados de atividade semanal baseado nos produtos realmente melhorados
  const generateWeeklyData = () => {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weeklyData = weekDays.map(day => ({ day, count: 0 }));
    
    enhancedProducts.forEach(product => {
      if (product.enhanced_at) {
        const date = new Date(product.enhanced_at);
        const dayIndex = date.getDay();
        weeklyData[dayIndex].count += product.total_enhanced_images;
      }
    });
    
    return weeklyData;
  };

  const dailyData = generateWeeklyData();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Status das Melhorias de Imagem
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de Pizza - Status Geral */}
          <div className="space-y-4">
            <h4 className="font-medium">Créditos Utilizados</h4>
            <div className="relative">
             <SafePieChart 
                data={chartData}
                dataKey="value"
                height={200}
                innerRadius={40}
                outerRadius={80}
                formatter={(value) => `${value} créditos`}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">{enhancements_used}</div>
                  <div className="text-sm text-muted-foreground">melhoradas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras - Atividade Semanal */}
          <div className="space-y-4">
            <h4 className="font-medium">Atividade Semanal</h4>
            <SafeBarChart 
              data={dailyData}
              dataKey="count"
              xAxisKey="day"
              height={200}
              formatter={(value) => `${value} imagens`}
              fill="#8B5CF6"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Ver SKUs Melhorados ({enhancedProducts.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Produtos com Imagens Melhoradas ({enhancedProducts.length} SKUs)
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-96">
                {isLoadingEnhanced ? (
                  <div className="text-center py-4">Carregando...</div>
                ) : enhancedProducts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum produto com imagens melhoradas encontrado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enhancedProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{product.nome}</p>
                            <p className="text-sm text-muted-foreground font-mono">SKU: {product.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">
                            {product.total_enhanced_images} imagem(ns)
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(product.enhanced_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
