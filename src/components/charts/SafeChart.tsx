import React, { memo, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  BarChart, 
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface SafeLineChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  stroke?: string;
  formatter?: (value: any) => string;
}

interface SafeBarChartProps {
  data: any[];
  dataKey: string;
  xAxisKey: string;
  height?: number;
  fill?: string;
  formatter?: (value: any) => string;
}

interface SafePieChartProps {
  data: any[];
  dataKey: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  formatter?: (value: any) => string;
}

// Componente de LineChart memoizado
export const SafeLineChart = memo(({ 
  data, 
  dataKey, 
  xAxisKey, 
  height = 300, 
  stroke = "#8B5CF6",
  formatter 
}: SafeLineChartProps) => {
  // Memoizar configurações do gráfico
  const chartConfig = useMemo(() => ({
    strokeDasharray: "3 3",
    fontSize: 12,
    strokeWidth: 2
  }), []);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray={chartConfig.strokeDasharray} />
        <XAxis dataKey={xAxisKey} tick={{ fontSize: chartConfig.fontSize }} />
        <YAxis tick={{ fontSize: chartConfig.fontSize }} />
        <Tooltip formatter={formatter} />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={stroke} 
          strokeWidth={chartConfig.strokeWidth}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

SafeLineChart.displayName = 'SafeLineChart';

// Componente de BarChart memoizado
export const SafeBarChart = memo(({ 
  data, 
  dataKey, 
  xAxisKey, 
  height = 300, 
  fill = "#10B981",
  formatter 
}: SafeBarChartProps) => {
  // Memoizar configurações do gráfico
  const chartConfig = useMemo(() => ({
    strokeDasharray: "3 3",
    fontSize: 12,
    radius: [4, 4, 0, 0] as [number, number, number, number]
  }), []);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray={chartConfig.strokeDasharray} />
        <XAxis dataKey={xAxisKey} tick={{ fontSize: chartConfig.fontSize }} />
        <YAxis tick={{ fontSize: chartConfig.fontSize }} />
        <Tooltip formatter={formatter} />
        <Bar dataKey={dataKey} fill={fill} radius={chartConfig.radius} />
      </BarChart>
    </ResponsiveContainer>
  );
});

SafeBarChart.displayName = 'SafeBarChart';

// Componente de PieChart memoizado
export const SafePieChart = memo(({ 
  data, 
  dataKey, 
  height = 300, 
  innerRadius = 0,
  outerRadius = 80,
  formatter 
}: SafePieChartProps) => {
  // Memoizar cores e configurações
  const chartConfig = useMemo(() => ({
    colors: ["#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"],
    paddingAngle: 5
  }), []);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={chartConfig.paddingAngle}
          dataKey={dataKey}
        >
          {data.map((entry, index) => (
            <Cell 
              key={entry.name || `cell-${index}`} 
              fill={entry.color || chartConfig.colors[index % chartConfig.colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip formatter={formatter} />
      </PieChart>
    </ResponsiveContainer>
  );
});

SafePieChart.displayName = 'SafePieChart';