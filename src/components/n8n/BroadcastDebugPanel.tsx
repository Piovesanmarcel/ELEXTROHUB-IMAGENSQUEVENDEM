import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Activity, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useBroadcast } from "@/contexts/BroadcastContext";

export function BroadcastDebugPanel() {
    const { debugState, isConnected } = useBroadcast();
    const [isOpen, setIsOpen] = useState(false);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado!`);
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                className="fixed bottom-4 right-4 z-50 shadow-lg gap-2 bg-background/80 backdrop-blur"
                onClick={() => setIsOpen(true)}
            >
                <Activity className={`h-4 w-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                Debug Realtime
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl border-purple-200">
            <CardHeader className="py-3 bg-muted/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    Debug Realtime
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsOpen(false)}>
                    &times;
                </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
                {/* Status Conexão */}
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
                        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                </div>

                {/* User ID */}
                <div className="space-y-1">
                    <span className="text-muted-foreground">User ID (para n8n):</span>
                    <div className="flex gap-1">
                        <code className="flex-1 p-1.5 bg-muted rounded border truncate font-mono text-[10px]">
                            {debugState.userId || 'Não autenticado'}
                        </code>
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copyToClipboard(debugState.userId || '', 'User ID')}
                            disabled={!debugState.userId}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Canal */}
                <div className="space-y-1">
                    <span className="text-muted-foreground">Canal Monitorado:</span>
                    <code className="block p-1.5 bg-muted rounded border truncate font-mono text-[10px]">
                        {debugState.channelName || 'Aguardando...'}
                    </code>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                        <span className="text-muted-foreground block mb-1">Mensagens:</span>
                        <span className="font-medium text-sm">{debugState.messagesReceived}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block mb-1">Última:</span>
                        <span className="font-medium text-[10px] truncate block" title={debugState.lastMessageAt || ''}>
                            {debugState.lastMessageAt ? new Date(debugState.lastMessageAt).toLocaleTimeString() : '-'}
                        </span>
                    </div>
                </div>

                <div className="pt-2 text-[10px] text-muted-foreground text-center">
                    Este ID deve ser usado no nó "Stream Image" do n8n.
                </div>
            </CardContent>
        </Card>
    );
}
