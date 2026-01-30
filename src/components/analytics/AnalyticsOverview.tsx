
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { 
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";
import { SafeBarChart, SafePieChart } from "@/components/charts/SafeChart";
import { useMemo } from "react";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";

export function AnalyticsOverview() {
  // Dados fictícios para o painel
  const salesData = [
    { date: '01/12', vendas: 125000, pedidos: 45, clientes: 32 },
    { date: '02/12', vendas: 142000, pedidos: 52, clientes: 38 },
    { date: '03/12', vendas: 168000, pedidos: 68, clientes: 45 },
    { date: '04/12', vendas: 155000, pedidos: 59, clientes: 41 },
    { date: '05/12', vendas: 189000, pedidos: 72, clientes: 56 },
    { date: '06/12', vendas: 210000, pedidos: 85, clientes: 62 },
    { date: '07/12', vendas: 195000, pedidos: 78, clientes: 58 },
  ];

  const topProducts = [
    { name: 'iPhone 15 Pro Max', vendas: 89000, unidades: 45 },
    { name: 'Samsung Galaxy S24 Ultra', vendas: 76000, unidades: 38 },
    { name: 'MacBook Pro M3', vendas: 156000, unidades: 24 },
    { name: 'iPad Air M2', vendas: 45000, unidades: 32 },
    { name: 'AirPods Pro 2ª Gen', vendas: 38000, unidades: 95 },
  ];

  const channelData = useMemo(() => [
    { name: 'Loja Online', value: 45, vendas: 450000, color: '#8B5CF6' },
    { name: 'Shopee', value: 30, vendas: 300000, color: '#EE4D2D' },
    { name: 'WhatsApp Business', value: 15, vendas: 150000, color: '#10B981' },
    { name: 'Instagram Shop', value: 10, vendas: 100000, color: '#F59E0B' },
  ], []);

  const monthlyTrend = [
    { month: 'Jul', vendas: 1250000, meta: 1200000 },
    { month: 'Ago', vendas: 1420000, meta: 1300000 },
    { month: 'Set', vendas: 1680000, meta: 1450000 },
    { month: 'Out', vendas: 1550000, meta: 1500000 },
    { month: 'Nov', vendas: 1890000, meta: 1650000 },
    { month: 'Dez', vendas: 2100000, meta: 1800000 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateGrowth = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Faturamento Hoje"
          value={formatCurrency(210000)}
          icon={<DollarSign className="h-4 w-4" />}
          description={
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+{calculateGrowth(210000, 195000)}% vs ontem</span>
            </div>
          }
        />
        
        <DashboardCard
          title="Pedidos Hoje"
          value="85"
          icon={<ShoppingCart className="h-4 w-4" />}
          description={
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+{calculateGrowth(85, 78)}% vs ontem</span>
            </div>
          }
        />
        
        <DashboardCard
          title="Novos Clientes"
          value="62"
          icon={<Users className="h-4 w-4" />}
          description={
            <div className="flex items-center gap-1 text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+{calculateGrowth(62, 58)}% vs ontem</span>
            </div>
          }
        />
        
        <DashboardCard
          title="Produtos Ativos"
          value="2.547"
          icon={<Package className="h-4 w-4" />}
          description={
            <div className="flex items-center gap-1 text-blue-600">
              <Activity className="h-3 w-3" />
              <span>98% com estoque</span>
            </div>
          }
        />
      </div>

      {/* Gráficos Principais */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendas Últimos 7 Dias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Vendas - Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.2}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Meta vs Realizado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Meta vs Realizado (Mensal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SafeBarChart 
              data={monthlyTrend}
              dataKey="vendas"
              xAxisKey="month"
              formatter={(value) => formatCurrency(Number(value))}
              fill="#8B5CF6"
            />
          </CardContent>
        </Card>
      </div>

      {/* Análises Detalhadas */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top 5 Produtos do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.unidades} unidades vendidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{formatCurrency(product.vendas)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Canais de Venda */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Performance por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <SafePieChart 
                data={channelData}
                dataKey="value"
                height={200}
                innerRadius={40}
                outerRadius={80}
              />
              
              <div className="space-y-3">
                {channelData.map((channel, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: channel.color }}
                      />
                      <span className="font-medium">{channel.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{channel.value}%</p>
                      <p className="text-sm text-gray-500">{formatCurrency(channel.vendas)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
