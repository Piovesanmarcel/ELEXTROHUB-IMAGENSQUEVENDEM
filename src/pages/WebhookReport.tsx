import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Activity, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWebhookStorage } from "@/features/generator/hooks/useWebhookStorage";

interface WebhookJob {
    job_id: string;
    user_id: string;
    created_at: string;
    status: 'active' | 'completed' | 'failed';
    metadata: {
        package_id?: string;
        webhook_key?: string;
        product_name?: string;
        source?: string;
        [key: string]: any;
    };
}

export default function WebhookReport() {
    const [jobs, setJobs] = useState<WebhookJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const { webhooks, isLoading: isLoadingWebhooks } = useWebhookStorage();

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('authorized_jobs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setJobs((data as unknown) as WebhookJob[]);
        } catch (err) {
            console.error("Erro ao buscar jobs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();

        // Auto-refresh a cada 30s
        const interval = setInterval(fetchJobs, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredJobs = jobs.filter(job =>
        job.job_id.toLowerCase().includes(filter.toLowerCase()) ||
        job.metadata.product_name?.toLowerCase().includes(filter.toLowerCase()) ||
        job.metadata.webhook_key?.toLowerCase().includes(filter.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Sucesso</Badge>;
            case 'failed': return <Badge className="bg-red-500 hover:bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>;
            default: return <Badge className="bg-blue-500 hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" /> Em Andamento</Badge>;
        }
    };

    const getValidationBadge = (webhookKey?: string) => {
        if (!webhookKey) return <Badge variant="outline" className="text-gray-400">N/A</Badge>;

        // Validar se existe no banco de dados (ignorando case)
        const exists = Object.keys(webhooks).some(k => k.toLowerCase() === webhookKey.toLowerCase());

        if (exists) {
            return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> Ativo no Banco</Badge>;
        } else {
            return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" /> Não Encontrado</Badge>;
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Relatório de Webhooks</h1>
                    <p className="text-muted-foreground">Monitore os disparos realizados para o n8n em tempo real.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()} disabled={isLoadingWebhooks}>
                        {isLoadingWebhooks ? 'Carregando Configs...' : 'Configs Carregadas'}
                    </Button>
                    <Button onClick={fetchJobs} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Disparos Recentes
                    </CardTitle>
                    <CardDescription>
                        Mostrando os últimos 50 disparos registrados.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                        <Input
                            placeholder="Filtrar por ID, Produto ou Webhook..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="max-w-md"
                        />
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Configuração (DB)</TableHead>
                                    <TableHead>Webhook Key</TableHead>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Pacote</TableHead>
                                    <TableHead>Job ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredJobs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            Nenhum registro encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredJobs.map((job) => (
                                        <TableRow key={job.job_id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(job.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(job.status)}</TableCell>
                                            <TableCell>{getValidationBadge(job.metadata.webhook_key)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {job.metadata.webhook_key || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{job.metadata.product_name || 'Desconhecido'}</TableCell>
                                            <TableCell>{job.metadata.package_id || job.metadata.package || '-'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[100px]" title={job.job_id}>
                                                {job.job_id}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
