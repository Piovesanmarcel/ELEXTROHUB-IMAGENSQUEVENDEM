import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePromptSync } from '@/contexts/PromptSyncContext';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

interface PromptDebugPanelProps {
  productId: string;
  onForceCollect?: () => void;
}

export const PromptDebugPanel: React.FC<PromptDebugPanelProps> = ({ 
  productId, 
  onForceCollect 
}) => {
  const { 
    collectedPrompts, 
    totalPrompts, 
    isRunwayReady, 
    clearPrompts, 
    debugInfo 
  } = usePromptSync();

  const expectedSources = [
    'IA Avançada - Runware',
    'Gemini Background', 
    'BFL.ai'
  ];

  const getSourceStatus = (source: string) => {
    const hasSource = debugInfo.sources.includes(source);
    const sourceData = collectedPrompts.find(data => data.source === source);
    
    return {
      connected: hasSource,
      promptCount: sourceData?.prompts.length || 0,
      lastUpdate: sourceData?.timestamp || 0
    };
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Nunca';
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) return `${minutes}m atrás`;
    if (seconds > 0) return `${seconds}s atrás`;
    return 'Agora mesmo';
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Debug: Sincronização de Prompts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isRunwayReady ? "default" : "secondary"}>
              {totalPrompts}/4 Prompts
            </Badge>
            {isRunwayReady && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status das Fontes */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Status das Fontes
          </div>
          {expectedSources.map((source) => {
            const status = getSourceStatus(source);
            return (
              <div key={source} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100">
                <div className="flex items-center gap-2">
                  {status.connected ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-orange-400" />
                  )}
                  <span className="text-xs font-medium">{source}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{status.promptCount} prompts</span>
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(status.lastUpdate)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Histórico de Eventos */}
        {debugInfo.eventHistory.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Últimos Eventos
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {debugInfo.eventHistory.slice(-5).reverse().map((event, index) => (
                <div key={index} className="text-xs p-2 rounded bg-gray-50 border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{event.source}</span>
                    <span className="text-gray-400">{formatTime(event.timestamp)}</span>
                  </div>
                  <div className="text-gray-600 mt-1">
                    {event.prompts.length} prompt{event.prompts.length !== 1 ? 's' : ''} recebido{event.prompts.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={clearPrompts}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Limpar Cache
          </Button>
          
          {onForceCollect && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onForceCollect}
              className="text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Forçar Coleta
            </Button>
          )}
        </div>

        {/* Status Geral */}
        <div className="p-2 rounded-lg bg-white border border-gray-100">
          <div className="text-xs text-gray-600">
            <strong>Status:</strong> {isRunwayReady ? '✅ Pronto para Runway' : '⏳ Aguardando prompts'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            <strong>Product ID:</strong> {productId}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};