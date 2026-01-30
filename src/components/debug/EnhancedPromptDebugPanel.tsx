import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { usePromptSync } from '@/contexts/PromptSyncContext';
import { toast } from 'sonner';

interface EnhancedPromptDebugPanelProps {
  productId: string;
  onForceCollect?: () => void;
}

export const EnhancedPromptDebugPanel: React.FC<EnhancedPromptDebugPanelProps> = ({ 
  productId, 
  onForceCollect 
}) => {
  const { collectedPrompts, totalPrompts, isRunwayReady, clearPrompts, debugInfo, getPromptsForRunway } = usePromptSync();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check connection status
  useEffect(() => {
    const checkConnection = () => {
      const now = Date.now();
      const lastUpdate = debugInfo.lastUpdate;
      const timeSinceUpdate = now - lastUpdate;
      
      if (timeSinceUpdate < 30000) { // Less than 30 seconds
        setConnectionStatus('connected');
      } else if (lastUpdate === 0) {
        setConnectionStatus('checking');
      } else {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    
    return () => clearInterval(interval);
  }, [debugInfo.lastUpdate]);

  const formatTime = (timestamp: number) => {
    if (timestamp === 0) return 'Nunca';
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const getStatusIcon = (status: typeof connectionStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const handleTestConnection = () => {
    console.log('🧪 [ENHANCED DEBUG] Testando conexão...');
    
    // Dispatch test event
    const testEvent = new CustomEvent('promptsReadyForRunway', {
      detail: {
        prompts: [`Test prompt ${Date.now()}`],
        source: 'Enhanced Debug Test',
        timestamp: Date.now(),
        productId
      }
    });
    
    window.dispatchEvent(testEvent);
    toast.info('🧪 Evento de teste enviado');
  };

  const handleForceCollectInternal = () => {
    console.log('🔄 [ENHANCED DEBUG] Iniciando coleta forçada...');
    clearPrompts();
    
    if (onForceCollect) {
      onForceCollect();
    }
    
    // Also try to collect from other sources
    window.dispatchEvent(new CustomEvent('requestPromptsForRunway', {
      detail: { productId, timestamp: Date.now() }
    }));
    
    toast.success('🔄 Coleta forçada iniciada');
  };

  const currentPrompts = getPromptsForRunway();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Debug Prompts - Runway AI
          {getStatusIcon(connectionStatus)}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalPrompts}</div>
            <div className="text-sm text-muted-foreground">Total Prompts</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{collectedPrompts.length}</div>
            <div className="text-sm text-muted-foreground">Fontes Ativas</div>
          </div>
          
          <div className="text-center">
            <Badge variant={isRunwayReady ? "default" : "secondary"}>
              {isRunwayReady ? "Pronto" : "Aguardando"}
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">Status Runway</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium">{formatTime(debugInfo.lastUpdate)}</div>
            <div className="text-sm text-muted-foreground">Última Atualização</div>
          </div>
        </div>

        <Separator />

        {/* Sources Status */}
        <div>
          <h4 className="font-medium mb-2">Status das Fontes</h4>
          <div className="space-y-2">
            {collectedPrompts.map((data, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                <div>
                  <div className="font-medium text-sm">{data.source}</div>
                  <div className="text-xs text-muted-foreground">
                    {data.prompts.length} prompts • {formatTime(data.timestamp)}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Ativo
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Current Prompts Preview */}
        {currentPrompts.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Prompts Atuais ({currentPrompts.length})</h4>
              <ScrollArea className="h-32 w-full rounded border p-2">
                <div className="space-y-1">
                  {currentPrompts.map((prompt, index) => (
                    <div key={index} className="text-sm p-1 bg-muted rounded text-xs">
                      {index + 1}. {prompt.substring(0, 100)}...
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleForceCollectInternal}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Forçar Coleta
          </Button>
          
          <Button 
            onClick={handleTestConnection}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Testar Conexão
          </Button>
          
          <Button 
            onClick={clearPrompts}
            variant="destructive" 
            size="sm"
          >
            Limpar Cache
          </Button>
        </div>

        {/* Product ID Info */}
        <div className="text-xs text-muted-foreground">
          Product ID: {productId}
        </div>
      </CardContent>
    </Card>
  );
};