
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string | ReactNode;
  isLoading?: boolean;
}

export function DashboardCard({
  title,
  value,
  icon,
  description,
  isLoading = false,
}: DashboardCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-20 data-loading rounded" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </CardContent>
    </Card>
  );
}
