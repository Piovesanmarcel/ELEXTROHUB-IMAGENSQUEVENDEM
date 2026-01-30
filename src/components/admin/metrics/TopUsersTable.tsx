import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Trophy } from 'lucide-react';

interface TopUser {
  userId: string;
  email: string;
  jobCount: number;
  totalCost: number;
}

interface TopUsersTableProps {
  users: TopUser[];
  isLoading?: boolean;
}

export function TopUsersTable({ users, isLoading = false }: TopUsersTableProps) {
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
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Sem dados de usuários
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Usuários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead className="text-right">Jobs</TableHead>
              <TableHead className="text-right">Custo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user.userId}>
                <TableCell>
                  {index < 3 ? (
                    <Badge 
                      variant={index === 0 ? 'default' : 'secondary'}
                      className={index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'}
                    >
                      {index + 1}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">{index + 1}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium truncate max-w-[200px]">
                      {user.email || user.userId.slice(0, 8)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {user.jobCount.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(user.totalCost)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
