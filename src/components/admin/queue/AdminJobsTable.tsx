import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { List, Search, RotateCcw, XCircle, Eye, Loader2 } from 'lucide-react';
import type { AdminJob } from '@/hooks/useAdminQueueMonitor';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminJobsTableProps {
  jobs: AdminJob[];
  onCancelJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
  onViewJob: (job: AdminJob) => void;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  processing: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-500 border-green-500/30',
  failed: 'bg-red-500/20 text-red-500 border-red-500/30'
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou'
};

export function AdminJobsTable({
  jobs,
  onCancelJob,
  onRetryJob,
  onViewJob,
  isLoading
}: AdminJobsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const types = [...new Set(jobs.map(j => j.generation_type))];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesType = typeFilter === 'all' || job.generation_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatTime = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <List className="h-5 w-5 text-primary" />
            Todos os Jobs
            <Badge variant="secondary" className="ml-2">
              {filteredJobs.length} de {jobs.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[200px]"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                {types.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border max-h-[500px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Retry</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum job encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.slice(0, 100).map((job) => (
                  <TableRow key={job.id} className="group">
                    <TableCell className="font-mono text-xs">
                      {job.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px] truncate text-sm">
                        {job.user_email || job.user_id.slice(0, 12) + '...'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {job.generation_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[job.status]} border text-xs`}>
                        {job.status === 'processing' && (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        {statusLabels[job.status] || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.created_at && formatDistanceToNow(new Date(job.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {formatTime(job.processing_time_ms)}
                    </TableCell>
                    <TableCell className="text-center">
                      {job.retry_count || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onViewJob(job)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {job.status === 'failed' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-blue-500 hover:text-blue-600"
                            onClick={() => onRetryJob(job.id)}
                            title="Tentar novamente"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {(job.status === 'pending' || job.status === 'processing') && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            onClick={() => onCancelJob(job.id)}
                            title="Cancelar"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {filteredJobs.length > 100 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Mostrando 100 de {filteredJobs.length} jobs
          </p>
        )}
      </CardContent>
    </Card>
  );
}
