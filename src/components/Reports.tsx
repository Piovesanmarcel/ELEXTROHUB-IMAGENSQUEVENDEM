
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Users,
  Star
} from "lucide-react";
import { getReports } from "@/lib/supabase";
import { toast } from "sonner";

type ReportData = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  lowStockProducts: any[];
  salesByMonth: Record<string, number>;
};

export function Reports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await getReports();
      setReportData(data);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Calcular métricas importantes
  const metrics = reportData ? {
    stockHealth: reportData.lowStockProducts.length === 0 ? 100 : Math.max(0, 100 - (reportData.lowStockProducts.length / reportData.totalProducts) * 100),
    averageProductValue: reportData.totalProducts > 0 ? reportData.totalRevenue / reportData.totalProducts : 0,
    conversionRate: reportData.totalProducts > 0 ? (reportData.totalOrders / reportData.totalProducts) * 100 : 0,
    revenueGrowth: 15.3, // Simulado - seria calculado com dados históricos
  } : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Relatórios & Analytics</h2>
            <p className="text-muted-foreground">Insights inteligentes para seu negócio</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="glass-effect">
              <CardHeader className="pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Relatórios & Analytics</h2>
            <p className="text-muted-foreground">Insights inteligentes para seu negócio</p>
          </div>
          <Button onClick={loadReports} variant="outline" className="gradient-primary">
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar
          </Button>
        </div>
        <Card className="glass-effect">
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Erro ao carregar dados dos relatórios</p>
              <p className="text-sm text-muted-foreground mt-2">Tente novamente em alguns minutos</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Relatórios & Analytics
          </h2>
          <p className="text-lg text-muted-foreground mt-2">
            Insights inteligentes para impulsionar seu negócio
          </p>
        </div>
        <Button onClick={loadReports} variant="outline" className="gradient-primary shadow-lg">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar Dados
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-effect border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-green-700">Receita Total</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{formatCurrency(reportData.totalRevenue)}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">+{metrics?.revenueGrowth}% este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-blue-700">Total de Produtos</CardTitle>
            <Package className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">{reportData.totalProducts}</div>
            <p className="text-sm text-blue-600 mt-2">
              Valor médio: {formatCurrency(metrics?.averageProductValue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-purple-700">Pedidos Realizados</CardTitle>
            <ShoppingCart className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">{reportData.totalOrders}</div>
            <div className="flex items-center mt-2">
              <Star className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-sm text-purple-600">Taxa: {metrics?.conversionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-orange-700">Ticket Médio</CardTitle>
            <BarChart3 className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">{formatCurrency(reportData.avgOrderValue)}</div>
            <p className="text-sm text-orange-600 mt-2">Por pedido realizado</p>
          </CardContent>
        </Card>
      </div>

      {/* Saúde do Estoque */}
      <Card className="glass-effect shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="h-6 w-6 text-blue-600" />
                Saúde do Estoque
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Monitoramento inteligente dos seus produtos
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-700">{metrics?.stockHealth.toFixed(0)}%</div>
              <p className="text-sm text-muted-foreground">Saúde Geral</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nível de Estoque Saudável</span>
              <span className="text-sm text-muted-foreground">{metrics?.stockHealth.toFixed(0)}%</span>
            </div>
            <Progress value={metrics?.stockHealth} className="h-3" />
            
            {reportData.lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Excelente! Todos os produtos têm estoque adequado</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">{reportData.lowStockProducts.length} produto(s) com estoque baixo</span>
                </div>
                
                <div className="grid gap-2">
                  {reportData.lowStockProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                      <div>
                        <span className="font-medium">{product.nome}</span>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">
                        {product.estoque} unidades
                      </Badge>
                    </div>
                  ))}
                  {reportData.lowStockProducts.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      E mais {reportData.lowStockProducts.length - 5} produtos com estoque baixo...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance de Vendas */}
      <Card className="glass-effect shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-6 w-6 text-green-600" />
            Performance de Vendas
          </CardTitle>
          <CardDescription className="text-base">
            Histórico de receita dos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Object.entries(reportData.salesByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([month, revenue], index) => {
                const maxRevenue = Math.max(...Object.values(reportData.salesByMonth));
                const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={month} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {new Date(month + '-01').toLocaleDateString('pt-BR', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            Mais Recente
                          </Badge>
                        )}
                      </div>
                      <span className="font-bold text-green-700">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Insights Resumo */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-effect border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Users className="h-5 w-5" />
              Insights do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Portfólio Robusto</p>
                  <p className="text-sm text-muted-foreground">
                    Você possui {reportData.totalProducts} produtos cadastrados
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                {reportData.totalOrders > 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">Atividade de Vendas</p>
                  <p className="text-sm text-muted-foreground">
                    {reportData.totalOrders > 0 
                      ? `${reportData.totalOrders} pedidos realizados até agora`
                      : "Nenhum pedido registrado ainda"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                {reportData.lowStockProducts.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">Gestão de Estoque</p>
                  <p className="text-sm text-muted-foreground">
                    {reportData.lowStockProducts.length === 0
                      ? "Todos os produtos com estoque adequado"
                      : `${reportData.lowStockProducts.length} produto(s) precisam de reposição`
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Star className="h-5 w-5" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.lowStockProducts.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Reabastecer Estoque</p>
                    <p className="text-sm text-muted-foreground">
                      Repor produtos com baixo estoque para evitar rupturas
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Otimizar Precificação</p>
                  <p className="text-sm text-muted-foreground">
                    Use as ferramentas de precificação para maximizar lucros
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Melhorar Imagens</p>
                  <p className="text-sm text-muted-foreground">
                    Use as ferramentas de IA para otimizar imagens dos produtos
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
