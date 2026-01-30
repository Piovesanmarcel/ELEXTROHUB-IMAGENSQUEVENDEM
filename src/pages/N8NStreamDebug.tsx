import { N8NStreamDebugPanel } from '@/components/debug/N8NStreamDebugPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function N8NStreamDebug() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bug className="h-6 w-6 text-primary" />
                Debug n8n Stream
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor de imagens recebidas em tempo real do n8n
              </p>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <N8NStreamDebugPanel />

        {/* Instruções */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <h3 className="font-medium">Como usar:</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              Mantenha esta página aberta enquanto executa o workflow n8n
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              As imagens aparecerão automaticamente quando o n8n enviar via broadcast
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              O status "Conectado" indica que o canal Supabase está ativo
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              Use o botão "Limpar" para resetar o painel entre testes
            </li>
          </ul>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Dica:</strong> Abra o Console do navegador (F12) para ver logs detalhados do BroadcastProvider
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
