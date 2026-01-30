import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  History, 
  RefreshCw, 
  Download, 
  Eye, 
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter
} from "lucide-react";
import { useN8NGenerationLogs, type N8NGenerationLog, type LogFilters } from '@/hooks/useN8NGenerationLogs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const SCENE_TYPE_LABELS: Record<string, string> = {
  'product_studio': '📷 Studio',
  'packaging': '📦 Embalagem',
  'mockup': '🏠 Mockup',
  'lifestyle': '👤 Lifestyle',
  'ambient_1': '🌆 Comercial',
  'ambient_2': '🏡 Residencial',
  'ambient_3': '✨ Minimalista',
  'person_using': '👋 Pessoa Usando'
};

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  processing: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  retrying: 'bg-yellow-100 text-yellow-700'
};

export function GenerationLogsViewer() {
  const { logs, isLoading, getLogs, clearOldLogs } = useN8NGenerationLogs();
  const [filters, setFilters] = useState<LogFilters>({ limit: 50 });
  const [selectedLog, setSelectedLog] = useState<N8NGenerationLog | null>(null);

  useEffect(() => {
    getLogs(filters);
  }, []);

  const handleRefresh = () => {
    getLogs(filters);
    toast.success('Logs atualizados');
  };

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
    setFilters(newFilters);
    getLogs(newFilters);
  };

  const handleClearOldLogs = async () => {
    const success = await clearOldLogs(30);
    if (success) {
      toast.success('Logs antigos removidos');
      getLogs(filters);
    } else {
      toast.error('Erro ao limpar logs');
    }
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error('Nenhum log para exportar');
      return;
    }

    const headers = ['Data', 'Produto', 'Cena', 'Status', 'Tentativas', 'Duração (ms)', 'Erro'];
    const rows = logs.map(log => [
      log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm') : '',
      log.product_name,
      SCENE_TYPE_LABELS[log.scene_type] || log.scene_type,
      log.status,
      log.attempts?.toString() || '1',
      log.duration_ms?.toString() || '',
      log.error_message || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `n8n_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Gerações
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button size="sm" variant="destructive" onClick={handleClearOldLogs}>
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar +30d
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(v) => handleFilterChange('status', v)}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.scene_type || 'all'} 
            onValueChange={(v) => handleFilterChange('scene_type', v)}
          >
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Tipo de Cena" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Cenas</SelectItem>
              {Object.entries(SCENE_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="ml-auto">
            {logs.length} registros
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum log encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <StatusIcon status={log.status} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.created_at && format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-[150px]" title={log.product_name}>
                      {log.product_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {SCENE_TYPE_LABELS[log.scene_type] || log.scene_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{log.attempts || 1}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Log</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-4 text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-muted-foreground">Produto</p>
                                  <p className="font-medium">{selectedLog?.product_name}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Status</p>
                                  <Badge className={statusColors[selectedLog?.status || 'pending']}>
                                    {selectedLog?.status}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Cena</p>
                                  <p>{SCENE_TYPE_LABELS[selectedLog?.scene_type || ''] || selectedLog?.scene_type}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Tentativas</p>
                                  <p>{selectedLog?.attempts || 1}</p>
                                </div>
                              </div>

                              {selectedLog?.error_message && (
                                <div>
                                  <p className="text-muted-foreground">Erro</p>
                                  <p className="text-red-600 bg-red-50 p-2 rounded text-xs font-mono">
                                    {selectedLog.error_message}
                                  </p>
                                </div>
                              )}

                              {selectedLog?.image_url && (
                                <div>
                                  <p className="text-muted-foreground mb-2">Imagem Gerada</p>
                                  <img 
                                    src={selectedLog.image_url} 
                                    alt="Generated" 
                                    className="max-w-full h-auto rounded border"
                                  />
                                </div>
                              )}

                              {selectedLog?.request_payload && (
                                <div>
                                  <p className="text-muted-foreground">Payload (resumo)</p>
                                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify({
                                      product_name: (selectedLog.request_payload as any).product_name,
                                      sceneType: (selectedLog.request_payload as any).sceneType,
                                      images_count: (selectedLog.request_payload as any).images?.length || 0
                                    }, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default GenerationLogsViewer;
