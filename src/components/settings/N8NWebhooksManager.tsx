import { useWebhookStorage } from "@/features/generator/hooks/useWebhookStorage";
import { Webhook } from "lucide-react";
import { N8NWebhooksUI } from "./N8NWebhooksUI";

export function N8NWebhooksManager() {
    const { webhooks, saveWebhook, isLoading } = useWebhookStorage();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Webhook className="h-5 w-5 text-primary" />
                    Gerenciamento de Webhooks N8N
                </h2>
                <p className="text-muted-foreground text-sm">
                    Configure as URLs de entrada para seus workflows do n8n. Estas URLs são salvas localmente no seu navegador.
                </p>
            </div>

            <N8NWebhooksUI
                webhooks={webhooks}
                onSave={saveWebhook}
                isLoading={isLoading}
            />
        </div>
    );
}
