import { useState } from 'react';
import { Check, Copy, ExternalLink, Database, Key, Server, Zap, CheckCircle2, AlertCircle, FileText, Settings, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
}

interface EdgeFunction {
  name: string;
  verifyJwt: boolean;
  category: string;
}

const MigrationGuide = () => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const phases: { title: string; icon: React.ReactNode; items: ChecklistItem[] }[] = [
    {
      title: 'Fase 1: Preparação',
      icon: <Database className="h-5 w-5" />,
      items: [
        { id: '1.1', label: 'Código commitado no GitHub' },
        { id: '1.2', label: 'Branch main atualizada' },
        { id: '1.3', label: 'Secrets copiados' },
        { id: '1.4', label: 'Workflows n8n exportados' },
      ]
    },
    {
      title: 'Fase 2: Nova Conta',
      icon: <Server className="h-5 w-5" />,
      items: [
        { id: '2.1', label: 'Projeto criado no Lovable' },
        { id: '2.2', label: 'Lovable Cloud habilitado' },
        { id: '2.3', label: 'GitHub conectado' },
      ]
    },
    {
      title: 'Fase 3: Banco de Dados',
      icon: <Database className="h-5 w-5" />,
      items: [
        { id: '3.1', label: 'SQL_COMPLETE.sql executado' },
        { id: '3.2', label: 'Tabelas criadas (22)' },
        { id: '3.3', label: 'Funções criadas (12)' },
        { id: '3.4', label: 'RLS policies aplicadas' },
        { id: '3.5', label: 'Storage bucket criado' },
      ]
    },
    {
      title: 'Fase 4: Secrets',
      icon: <Key className="h-5 w-5" />,
      items: [
        { id: '4.1', label: 'STRIPE_SECRET_KEY' },
        { id: '4.2', label: 'CLOUDINARY_API_KEY' },
        { id: '4.3', label: 'CLOUDINARY_API_SECRET' },
        { id: '4.4', label: 'CLOUDINARY_CLOUD_NAME' },
        { id: '4.5', label: 'GOOGLE_GEMINI_API_KEY' },
        { id: '4.6', label: 'OPENAI_API_KEY' },
        { id: '4.7', label: 'N8N_CALLBACK_SECRET' },
      ]
    },
    {
      title: 'Fase 5: n8n',
      icon: <Zap className="h-5 w-5" />,
      items: [
        { id: '5.1', label: 'Workflows importados' },
        { id: '5.2', label: 'URL callback atualizada' },
        { id: '5.3', label: 'Secret configurado no n8n' },
        { id: '5.4', label: 'Webhook /system-status testado' },
      ]
    },
    {
      title: 'Fase 6: Validação',
      icon: <CheckCircle2 className="h-5 w-5" />,
      items: [
        { id: '6.1', label: 'Login/Signup funcionando' },
        { id: '6.2', label: 'Página /system-status OK' },
        { id: '6.3', label: 'Geração de imagem OK' },
        { id: '6.4', label: 'Primeiro admin configurado' },
      ]
    },
  ];

  const edgeFunctions: EdgeFunction[] = [
    // Chat & AI
    { name: 'ai-chat-proxy', verifyJwt: false, category: 'Chat & AI' },
    { name: 'deepai-chat', verifyJwt: true, category: 'Chat & AI' },
    { name: 'deepai-chat-test', verifyJwt: false, category: 'Chat & AI' },
    { name: 'openai-normal-chat', verifyJwt: true, category: 'Chat & AI' },
    { name: 'openai-assistant-chat', verifyJwt: true, category: 'Chat & AI' },
    { name: 'openai-copywriting', verifyJwt: false, category: 'Chat & AI' },
    // Geração de Imagens
    { name: 'gemini-background-generator', verifyJwt: false, category: 'Geração de Imagens' },
    { name: 'gemini-carousel', verifyJwt: false, category: 'Geração de Imagens' },
    { name: 'fluxai-generator', verifyJwt: false, category: 'Geração de Imagens' },
    { name: 'stability-generator', verifyJwt: false, category: 'Geração de Imagens' },
    { name: 'fotographer-background', verifyJwt: false, category: 'Geração de Imagens' },
    { name: 'photoroon-enhance', verifyJwt: false, category: 'Geração de Imagens' },
    { name: 'tongyi-wanxiang', verifyJwt: false, category: 'Geração de Imagens' },
    { name: 'generate-logo', verifyJwt: false, category: 'Geração de Imagens' },
    { name: 'generate-marketing-image', verifyJwt: false, category: 'Geração de Imagens' },
    // Stripe & Pagamentos
    { name: 'create-credits-checkout', verifyJwt: true, category: 'Stripe & Pagamentos' },
    { name: 'create-subscription-checkout', verifyJwt: true, category: 'Stripe & Pagamentos' },
    { name: 'check-subscription', verifyJwt: true, category: 'Stripe & Pagamentos' },
    { name: 'customer-portal', verifyJwt: true, category: 'Stripe & Pagamentos' },
    { name: 'verify-credits-payment', verifyJwt: false, category: 'Stripe & Pagamentos' },
    // Admin
    { name: 'check-admin', verifyJwt: true, category: 'Admin' },
    { name: 'admin-get-purchases', verifyJwt: true, category: 'Admin' },
    { name: 'admin-get-metrics', verifyJwt: true, category: 'Admin' },
    // Cloudinary
    { name: 'cloudinary-transform', verifyJwt: false, category: 'Cloudinary' },
    { name: 'cloudinary-upscale', verifyJwt: false, category: 'Cloudinary' },
    // API Keys
    { name: 'manage-api-keys', verifyJwt: true, category: 'API Keys' },
    { name: 'manage-gemini-keys', verifyJwt: true, category: 'API Keys' },
    // Queue
    { name: 'queue-image', verifyJwt: false, category: 'Queue' },
    { name: 'process-queue', verifyJwt: false, category: 'Queue' },
    { name: 'check-queue-status', verifyJwt: false, category: 'Queue' },
    // Comandos & Proxy
    { name: 'unified-commands', verifyJwt: false, category: 'Comandos & Proxy' },
    { name: 'preflight-check', verifyJwt: false, category: 'Comandos & Proxy' },
    { name: 'n8n-proxy', verifyJwt: false, category: 'Comandos & Proxy' },
    // Templates
    { name: 'import-templates', verifyJwt: false, category: 'Templates' },
    { name: 'analyze-template', verifyJwt: true, category: 'Templates' },
    // Callbacks
    { name: 'redis-callback', verifyJwt: false, category: 'Callbacks' },
    // Streaming
    { name: 'image-stream', verifyJwt: false, category: 'Streaming' },
    // Upload & Storage
    { name: 'cloudflare-upload', verifyJwt: false, category: 'Upload & Storage' },
    { name: 'storage-upload', verifyJwt: false, category: 'Upload & Storage' },
    { name: 'download-images-proxy', verifyJwt: false, category: 'Upload & Storage' },
    { name: 'image-proxy', verifyJwt: false, category: 'Upload & Storage' },
    // Sync & Automação
    { name: 'auto-group-3cliques', verifyJwt: false, category: 'Sync & Automação' },
    { name: 'auto-sync-products', verifyJwt: false, category: 'Sync & Automação' },
    { name: 'sync-log', verifyJwt: false, category: 'Sync & Automação' },
    // Auth
    { name: 'send-password-reset', verifyJwt: false, category: 'Auth' },
    // Testes
    { name: 'bfl-test', verifyJwt: false, category: 'Testes' },
    { name: 'freepik-test', verifyJwt: false, category: 'Testes' },
    { name: 'runware-test', verifyJwt: false, category: 'Testes' },
    { name: 'runway-test', verifyJwt: false, category: 'Testes' },
    { name: 'test-api-keys', verifyJwt: false, category: 'Testes' },
    { name: 'check-secret', verifyJwt: false, category: 'Testes' },
  ];

  const totalItems = phases.reduce((acc, phase) => acc + phase.items.length, 0);
  const completedCount = completedItems.size;
  const progress = Math.round((completedCount / totalItems) * 100);

  const secrets = [
    { name: 'STRIPE_SECRET_KEY', required: true },
    { name: 'CLOUDINARY_API_KEY', required: true },
    { name: 'CLOUDINARY_API_SECRET', required: true },
    { name: 'CLOUDINARY_CLOUD_NAME', required: true },
    { name: 'GOOGLE_GEMINI_API_KEY', required: true },
    { name: 'OPENAI_API_KEY', required: true },
    { name: 'N8N_CALLBACK_SECRET', required: true },
    { name: 'RESEND_API_KEY', required: false },
    { name: 'STABILITY_API_KEY', required: false },
    { name: 'RUNWARE_API_KEY2', required: false },
  ];

  const groupedFunctions = edgeFunctions.reduce((acc, fn) => {
    if (!acc[fn.category]) {
      acc[fn.category] = [];
    }
    acc[fn.category].push(fn);
    return acc;
  }, {} as Record<string, EdgeFunction[]>);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Guia de Migração - Anúncios Que Vende</h1>
          <p className="text-muted-foreground">
            Siga este checklist para migrar o projeto para uma nova conta Lovable
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-lg px-4 py-1">
              {progress}% Completo
            </Badge>
            <span className="text-sm text-muted-foreground">
              {completedCount} de {totalItems} itens
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('/docs/HANDOVER.md', '_blank')}>
            <FileText className="h-4 w-4 mr-2" />
            HANDOVER.md
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('/system-status', '_blank')}>
            <Zap className="h-4 w-4 mr-2" />
            Status do Sistema
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-3">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Tabs defaultValue="checklist" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="functions">Edge Functions</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
            <TabsTrigger value="secrets">Secrets</TabsTrigger>
            <TabsTrigger value="docs">Documentação</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {phases.map((phase) => (
                <Card key={phase.title}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {phase.icon}
                      {phase.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {phase.items.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                      >
                        <div 
                          onClick={() => toggleItem(item.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            completedItems.has(item.id) 
                              ? 'bg-primary border-primary' 
                              : 'border-muted-foreground'
                          }`}
                        >
                          {completedItems.has(item.id) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className={completedItems.has(item.id) ? 'line-through text-muted-foreground' : ''}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="functions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Edge Functions ({edgeFunctions.length} total)
                </CardTitle>
                <CardDescription>
                  Todas as funções configuradas em supabase/config.toml
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {Object.entries(groupedFunctions).map(([category, functions]) => (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <span>{category}</span>
                          <Badge variant="secondary">{functions.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {functions.map((fn) => (
                            <div 
                              key={fn.name}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted"
                            >
                              <code className="text-sm">{fn.name}</code>
                              <Badge variant={fn.verifyJwt ? 'default' : 'outline'}>
                                {fn.verifyJwt ? 'JWT: true' : 'JWT: false'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sql" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Script SQL Completo
                </CardTitle>
                <CardDescription>
                  Execute este script para criar toda a estrutura do banco
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => window.open('/docs/SQL_COMPLETE.sql', '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir SQL_COMPLETE.sql
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => copyToClipboard('docs/SQL_COMPLETE.sql', 'Caminho do arquivo')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Caminho
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">O script inclui:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>22 tabelas com estrutura completa</li>
                    <li>12 funções de banco (RPC)</li>
                    <li>RLS policies para todas as tabelas</li>
                    <li>Storage bucket marketing-templates</li>
                    <li>Índices otimizados</li>
                    <li>Trigger para novos usuários</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="secrets" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Secrets Necessários
                </CardTitle>
                <CardDescription>
                  Configure em Settings → Cloud → Secrets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {secrets.map((secret) => (
                    <div 
                      key={secret.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        {secret.required ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        )}
                        <code className="text-sm">{secret.name}</code>
                        {secret.required && (
                          <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(secret.name, secret.name)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: 'HANDOVER.md', file: '/docs/HANDOVER.md', desc: 'Documento de transferência simplificado', icon: <FileText className="h-4 w-4" /> },
                { title: 'SQL Completo', file: '/docs/SQL_COMPLETE.sql', desc: 'Script com todas as tabelas e funções', icon: <Database className="h-4 w-4" /> },
                { title: 'Integração n8n', file: '/docs/N8N_INTEGRATION.md', desc: 'Documentação técnica do n8n', icon: <Zap className="h-4 w-4" /> },
                { title: 'Contratos de API', file: '/docs/API_CONTRACTS.md', desc: 'Todos os endpoints e contratos', icon: <Code className="h-4 w-4" /> },
                { title: 'Variáveis de Ambiente', file: '/docs/ENVIRONMENT.md', desc: 'Secrets e configurações', icon: <Key className="h-4 w-4" /> },
                { title: 'Arquitetura', file: '/docs/ARCHITECTURE.md', desc: 'Visão geral do sistema', icon: <Settings className="h-4 w-4" /> },
                { title: 'Guia Completo', file: '/docs/COMPLETE_MIGRATION.md', desc: 'Documentação detalhada de migração', icon: <FileText className="h-4 w-4" /> },
              ].map((doc) => (
                <Card 
                  key={doc.file} 
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => window.open(doc.file, '_blank')}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      {doc.icon}
                      {doc.title}
                    </CardTitle>
                    <CardDescription>{doc.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <code className="text-xs text-muted-foreground">{doc.file}</code>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* n8n Endpoint Info */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Endpoint n8n Principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm">
                GET https://nwh.visualvendas.cloud/webhook/system-status
              </code>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => copyToClipboard('https://nwh.visualvendas.cloud/webhook/system-status', 'URL')}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                size="sm"
                onClick={() => window.open('https://nwh.visualvendas.cloud/webhook/system-status', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Endpoint público, read-only. Polling a cada 30 segundos.
            </p>
            
            {/* n8n Setup Instructions */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Configuração do n8n:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Exporte os workflows do n8n atual</li>
                <li>Importe no novo ambiente n8n</li>
                <li>Atualize a URL de callback para o novo Supabase</li>
                <li>Configure o secret <code>N8N_CALLBACK_SECRET</code></li>
                <li>Teste o endpoint /system-status</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Última atualização: 2026-01-14 | Versão: 1.0.0</p>
          <p className="mt-1">
            Dúvidas? Consulte <code>docs/COMPLETE_MIGRATION.md</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MigrationGuide;
