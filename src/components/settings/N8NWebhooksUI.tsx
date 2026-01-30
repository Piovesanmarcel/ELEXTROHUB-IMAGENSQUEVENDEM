import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, ExternalLink, Activity, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WEBHOOK_CONFIGS } from "@/features/generator/hooks/useWebhookStorage";

interface N8NWebhooksUIProps {
    webhooks: Record<string, string>;
    onSave: (key: string, value: string) => void;
    onTest?: (key: string) => void;
    isTesting?: boolean;
    testingKey?: string | null;
    variant?: "full" | "compact";
}

export function N8NWebhooksUI({
    webhooks,
    onSave,
    onTest,
    isTesting = false,
    testingKey = null,
    variant = "full",
    isLoading = false
}: N8NWebhooksUIProps & { isLoading?: boolean }) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }
    // Group configs for better display
    const groups = [
        {
            title: "Filas Redis - Geração de Imagens",
            prefix: "n8n_redis",
            description: "Webhooks para processamento assíncrono de imagens via filas Redis"
        },
        {
            title: "Comandos Unificados",
            prefix: "n8n_cmd",
            description: "Fluxos principais de orquestração"
        },
        {
            title: "Copywriting",
            prefix: "n8n_copy",
            description: "Geração de textos e legendas"
        },
        {
            title: "Marketing Canvas",
            prefix: "n8n_canvas",
            description: "Templates para criação de peças de marketing"
        },
        {
            title: "Webhook Unificado 4",
            prefix: "n8n_unified_4",
            description: "Acionamento simultâneo de 4 webhooks (Botão Único)"
        }
    ];

    const handleCopy = (url: string) => {
        if (!url) return;
        navigator.clipboard.writeText(url);
        toast.success("URL copiada!");
    };

    return (
        <div className={variant === "full" ? "space-y-8" : "space-y-4"}>
            {groups.map((group) => {
                const groupConfigs = WEBHOOK_CONFIGS.filter(c => c.key.startsWith(group.prefix));

                if (groupConfigs.length === 0) return null;

                return (
                    <Card key={group.prefix} className={variant === "compact" ? "bg-white/50" : ""}>
                        <CardHeader className={variant === "compact" ? "pb-2" : "pb-4"}>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                {group.title}
                            </CardTitle>
                            {variant === "full" && <CardDescription>{group.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {groupConfigs.map((config) => (
                                <div key={config.key} className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor={config.key} className="text-xs font-medium">
                                            {config.label}
                                        </Label>
                                        {webhooks[config.key] ? (
                                            <Badge variant="outline" className="text-[10px] text-green-600 border-green-600 flex gap-1 items-center bg-green-50 px-1 py-0 h-4">
                                                <Check className="h-2 w-2" />
                                            </Badge>
                                        ) : null}
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            id={config.key}
                                            placeholder={`Webhook para ${config.label}...`}
                                            value={webhooks[config.key] || ''}
                                            onChange={(e) => onSave(config.key, e.target.value)}
                                            className="font-mono text-[10px] h-8 bg-muted/20 focus:bg-background transition-colors"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleCopy(webhooks[config.key])}
                                            disabled={!webhooks[config.key]}
                                            title="Copiar URL"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                        {webhooks[config.key] && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                asChild
                                                title="Testar (GET)"
                                            >
                                                <a href={webhooks[config.key]} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </Button>
                                        )}
                                        {webhooks[config.key] && onTest && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                                                onClick={() => onTest(config.key)}
                                                disabled={isTesting}
                                                title="Testar Fluxo (Envio Completo)"
                                            >
                                                {isTesting && testingKey === config.key ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <Play className="h-3 w-3" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
