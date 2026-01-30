import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Play, 
  Plus, 
  RefreshCw, 
  Coins,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Zap,
  AlertTriangle,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type GenerationType = 'carousel' | 'marketing' | 'background';
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface QueueJob {
  id: string;
  status: JobStatus;
  generation_type: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
  priority: number;
  queue_wait_time_ms: number | null;
  processing_time_ms: number | null;
}

interface UserCredits {
  credits_balance: number;
  credits_used: number;
}

interface GenerationMetric {
  id: string;
  generation_type: string;
  model_used: string | null;
  queue_wait_time_ms: number | null;
  processing_time_ms: number | null;
  tokens_used: number | null;
  estimated_cost_usd: number | null;
  estimated_cost_brl: number | null;
  success: boolean;
  created_at: string;
}

const QueueTestPage = () => {
  // Estados
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [metrics, setMetrics] = useState<GenerationMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isRunningWorker, setIsRunningWorker] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  // Form state
  const [selectedType, setSelectedType] = useState<GenerationType>('carousel');
  const [testPrompt, setTestPrompt] = useState('Produto de teste para validação da fila');
  const [testImageUrl, setTestImageUrl] = useState('https://via.placeholder.com/500');

  // Contadores
  const jobCounts = {
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar créditos
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('credits_balance, credits_used')
        .eq('user_id', user.id)
        .maybeSingle();

      setCredits(creditsData);

      // Carregar jobs recentes
      const { data: jobsData } = await supabase
        .from('image_generation_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setJobs((jobsData as QueueJob[]) || []);

      // Carregar métricas
      const { data: metricsData } = await supabase
        .from('generation_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setMetrics((metricsData as GenerationMetric[]) || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling automático quando há jobs pendentes/processando
  useEffect(() => {
    if (jobCounts.pending > 0 || jobCounts.processing > 0) {
      setIsPolling(true);
      const interval = setInterval(loadData, 3000);
      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [jobCounts.pending, jobCounts.processing, loadData]);

  // Adicionar créditos de teste
  const addTestCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar se já existe registro
      const { data: existing } = await supabase
        .from('user_credits')
        .select('id, credits_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_credits')
          .update({ credits_balance: existing.credits_balance + 10 })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_credits')
          .insert({ user_id: user.id, credits_balance: 10 });
      }

      toast.success('10 créditos de teste adicionados!');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao adicionar créditos', { description: error.message });
    }
  };

  // Criar job de teste
  const createTestJob = async () => {
    if (!credits || credits.credits_balance < 1) {
      toast.error('Créditos insuficientes', { description: 'Adicione créditos de teste primeiro' });
      return;
    }

    setIsCreatingJob(true);
    try {
      const { data, error } = await supabase.functions.invoke('queue-image', {
        body: {
          generationType: selectedType,
          inputData: {
            prompt: testPrompt,
            imageUrl: testImageUrl,
            testMode: true
          },
          priority: 1
        }
      });

      if (error) throw error;

      toast.success('Job criado com sucesso!', { 
        description: `ID: ${data.jobId?.slice(0, 8)}...`
      });
      
      loadData();
    } catch (error: any) {
      toast.error('Erro ao criar job', { description: error.message });
    } finally {
      setIsCreatingJob(false);
    }
  };

  // Executar worker manualmente
  const runWorkerManually = async () => {
    setIsRunningWorker(true);
    try {
      const response = await supabase.functions.invoke('process-queue', {
        body: { worker: 'manual-test', batch_size: 5 }
      });

      if (response.error) throw response.error;

      const result = response.data;
      toast.success('Worker executado!', { 
        description: `Processados: ${result.processed || 0}, Falhas: ${result.failed || 0}` 
      });
      
      // Aguardar um pouco e recarregar
      setTimeout(loadData, 1000);
    } catch (error: any) {
      toast.error('Erro ao executar worker', { description: error.message });
    } finally {
      setIsRunningWorker(false);
    }
  };

  // Helpers
  const getStatusBadge = (status: JobStatus) => {
    const variants: Record<JobStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      processing: { variant: 'default', icon: <Activity className="h-3 w-3 animate-pulse" /> },
      completed: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      failed: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    };
    const config = variants[status];
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Teste da Fila de Processamento
          </h1>
          <p className="text-muted-foreground mt-2">
            Valide o fluxo completo: criar job → executar worker → verificar resultado
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPolling && (
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3 animate-pulse" />
              Monitorando...
            </Badge>
          )}
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Créditos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credits?.credits_balance ?? 0}</div>
            <Button 
              onClick={addTestCredits} 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              +10 créditos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{jobCounts.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Processando
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{jobCounts.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{jobCounts.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Falhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{jobCounts.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Área de Ações */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Criar Job de Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar Job de Teste
            </CardTitle>
            <CardDescription>
              Adicione um job à fila para validar o fluxo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Geração</Label>
              <Select 
                value={selectedType} 
                onValueChange={(v) => setSelectedType(v as GenerationType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prompt de Teste</Label>
              <Textarea 
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Descreva o produto..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>URL da Imagem (opcional)</Label>
              <Input 
                value={testImageUrl}
                onChange={(e) => setTestImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <Button 
              onClick={createTestJob}
              disabled={isCreatingJob || !credits || credits.credits_balance < 1}
              className="w-full"
            >
              {isCreatingJob ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Job de Teste
            </Button>

            {(!credits || credits.credits_balance < 1) && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Adicione créditos antes de criar um job
              </p>
            )}
          </CardContent>
        </Card>

        {/* Executar Worker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Executar Worker Manualmente
            </CardTitle>
            <CardDescription>
              Processe jobs pendentes sem depender do pg_cron
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Jobs pendentes:</strong> {jobCounts.pending}
              </p>
              <p className="text-sm">
                <strong>Processando:</strong> {jobCounts.processing}
              </p>
              <p className="text-sm text-muted-foreground">
                O worker irá processar até 5 jobs por vez
              </p>
            </div>

            <Button 
              onClick={runWorkerManually}
              disabled={isRunningWorker || jobCounts.pending === 0}
              className="w-full"
              variant="secondary"
            >
              {isRunningWorker ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Executar Worker
            </Button>

            {jobCounts.pending === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Nenhum job pendente para processar
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Jobs Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Jobs Recentes
            {isPolling && (
              <Badge variant="outline" className="ml-2 text-xs">
                Atualizando a cada 3s
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Tempo Fila</TableHead>
                <TableHead>Tempo Proc.</TableHead>
                <TableHead>Retries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">
                      {job.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.generation_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status as JobStatus)}</TableCell>
                    <TableCell>{job.priority}</TableCell>
                    <TableCell className="text-xs">
                      {formatDistanceToNow(new Date(job.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTime(job.queue_wait_time_ms)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTime(job.processing_time_ms)}
                    </TableCell>
                    <TableCell>
                      {job.retry_count > 0 ? (
                        <Badge variant="outline">{job.retry_count}/3</Badge>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum job encontrado. Crie um job de teste acima.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Métricas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas de Geração
          </CardTitle>
          <CardDescription>
            Últimas 10 métricas registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Sucesso</TableHead>
                <TableHead>Tempo Fila</TableHead>
                <TableHead>Tempo Proc.</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Custo USD</TableHead>
                <TableHead>Custo BRL</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.length > 0 ? (
                metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell>
                      <Badge variant="outline">{metric.generation_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {metric.model_used || '-'}
                    </TableCell>
                    <TableCell>
                      {metric.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTime(metric.queue_wait_time_ms)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatTime(metric.processing_time_ms)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {metric.tokens_used || '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      ${metric.estimated_cost_usd?.toFixed(4) || '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      R${metric.estimated_cost_brl?.toFixed(4) || '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDistanceToNow(new Date(metric.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhuma métrica registrada ainda. Execute o worker para gerar métricas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Checklist de Validação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Checklist de Validação
          </CardTitle>
          <CardDescription>
            Verifique se todos os passos estão funcionando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              {credits && credits.credits_balance > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span>Usuário possui créditos</span>
            </div>
            <div className="flex items-center gap-3">
              {jobs.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span>Jobs foram criados na fila</span>
            </div>
            <div className="flex items-center gap-3">
              {jobCounts.completed > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span>Worker processou jobs com sucesso</span>
            </div>
            <div className="flex items-center gap-3">
              {metrics.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span>Métricas foram registradas</span>
            </div>
            <div className="flex items-center gap-3">
              {credits && credits.credits_used > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
              <span>Créditos foram debitados</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueTestPage;
