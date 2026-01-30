
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SafeLineChart, SafeBarChart } from "@/components/charts/SafeChart";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle,
  Activity,
  BarChart3
} from "lucide-react";
import { getAnalyticsData, AnalyticsData } from "@/lib/analytics";

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const analyticsData = await getAnalyticsData();
      setData(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pedidos registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSoldProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Unidades vendidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.averageTicket)}</div>
            <p className="text-xs text-muted-foreground">Por pedido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Valor total</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendas por Período */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Vendas por Período
            </CardTitle>
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
              <TabsList>
                <TabsTrigger value="daily">Diário</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
                <TabsTrigger value="monthly">Mensal</TabsTrigger>
                <TabsTrigger value="yearly">Anual</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <SafeLineChart 
              data={data.salesByPeriod[selectedPeriod]}
              dataKey="value"
              xAxisKey={selectedPeriod === 'daily' ? 'date' : selectedPeriod === 'weekly' ? 'week' : selectedPeriod === 'monthly' ? 'month' : 'year'}
              formatter={(value) => formatCurrency(Number(value))}
              stroke="#8884d8"
            />
          </CardContent>
        </Card>

        {/* Curva ABC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Curva ABC - Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SafeBarChart 
              data={data.abcCurve.slice(0, 10)}
              dataKey="valor"
              xAxisKey="sku"
              formatter={(value) => formatCurrency(Number(value))}
              fill="#8884d8"
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabelas Detalhadas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 10 SKUs */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 SKUs Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topSkus.map((sku, index) => (
                <div key={sku.sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{sku.nome}</p>
                      <p className="text-sm text-muted-foreground">SKU: {sku.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{sku.quantidadeVendida} unidades</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(sku.valor)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Produtos com Estoque Baixo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowStockProducts.slice(0, 10).map((product) => (
                <div key={product.sku} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium">{product.nome}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    {product.categoria && (
                      <Badge variant="secondary" className="mt-1">{product.categoria}</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{product.estoque} unidades</p>
                    <Progress value={(product.estoque / 10) * 100} className="w-16 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Giro de Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Giro de Estoque e Previsão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Produto</th>
                  <th className="text-right p-2">Estoque Atual</th>
                  <th className="text-right p-2">Venda Mensal</th>
                  <th className="text-right p-2">Giro Mensal</th>
                  <th className="text-right p-2">Previsão Estoque</th>
                </tr>
              </thead>
              <tbody>
                {data.stockTurnover.slice(0, 15).map((item) => (
                  <tr key={item.sku} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-sm">{item.sku}</td>
                    <td className="p-2">{item.nome}</td>
                    <td className="p-2 text-right">{item.estoque}</td>
                    <td className="p-2 text-right">{item.vendaMensal}</td>
                    <td className="p-2 text-right">{item.giroMensal.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      <Badge variant={item.estoque < item.previsaoEstoque ? "destructive" : "default"}>
                        {item.previsaoEstoque}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
