import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OptimizedPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  showLabels?: boolean;
  tooltipFormatter?: (value: any) => [string, string];
}

export function OptimizedPieChart({
  data,
  height = 200,
  innerRadius = 0,
  outerRadius = 80,
  paddingAngle = 0,
  showLabels = false,
  tooltipFormatter
}: OptimizedPieChartProps) {
  // Memorizar os dados para evitar re-renderizações desnecessárias
  const memoizedData = useMemo(() => data, [JSON.stringify(data)]);
  
  // Memorizar as células para evitar re-criações
  const cells = useMemo(() => 
    memoizedData.map((entry) => (
      <Cell key={`cell-${entry.name}`} fill={entry.color} />
    )), [memoizedData]
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={memoizedData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          dataKey="value"
          labelLine={false}
          label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
        >
          {cells}
        </Pie>
        <Tooltip formatter={tooltipFormatter} />
      </PieChart>
    </ResponsiveContainer>
  );
}