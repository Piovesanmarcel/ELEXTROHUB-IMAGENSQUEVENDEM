import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend 
} from 'recharts';

interface TypeMetric {
  type: string;
  count: number;
  cost: number;
  avgTime: number;
}

interface GenerationTypeChartProps {
  data: TypeMetric[];
  isLoading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(280 87% 65%)',
];

const TYPE_LABELS: Record<string, string> = {
  'background_removal': 'Remoção de Fundo',
  'image_enhancement': 'Melhoria de Imagem',
  'marketing_image': 'Imagem Marketing',
  'logo_generation': 'Geração de Logo',
  'ad_creation': 'Criação de Anúncio',
};

export function GenerationTypeChart({ data, isLoading = false }: GenerationTypeChartProps) {
  const chartData = data.map(item => ({
    ...item,
    name: TYPE_LABELS[item.type] || item.type,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Por Tipo de Geração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-muted rounded-full w-48 h-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Por Tipo de Geração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Por Tipo de Geração</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => [
                  `${value} jobs (${formatCurrency(props.payload.cost)})`,
                  name
                ]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
