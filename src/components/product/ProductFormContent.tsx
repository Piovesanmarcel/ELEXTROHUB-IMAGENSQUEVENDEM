
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { ProductBasicInfo } from "./ProductBasicInfo";
import { ProductDescription } from "./ProductDescription";
import { CompactAIDescriptionEnhancer } from "./ai-enhancer/CompactAIDescriptionEnhancer";
// ❌ REMOVIDO: ProductContextFields - IA deve usar apenas Comando Unificado + Copywriting

interface ProductFormContentProps {
  product: any;
  isEditing: boolean;
  formData: any;
  onFormDataChange: (field: string, value: any) => void;
  onUpdateDescription: (type: 'short' | 'long' | 'name', value: string) => void;
  isAutomationRunning?: boolean;
  automationStep?: string | null;
  copywritingData?: { content: string; timestamp: number } | null;
  unifiedCommandsData?: any;
  // N8N Webhooks
  onExecuteWebhookComando?: () => void;
  onExecuteWebhookCopywriting?: () => void;
  isLoadingComando?: boolean;
  isLoadingCopywriting?: boolean;
  webhookComandoConfigured?: boolean;
  webhookCopywritingConfigured?: boolean;
}

export const ProductFormContent = ({
  product,
  isEditing,
  formData,
  onFormDataChange,
  onUpdateDescription,
  isAutomationRunning = false,
  automationStep = null,
  copywritingData = null,
  unifiedCommandsData = null,
  // N8N Webhooks
  onExecuteWebhookComando,
  onExecuteWebhookCopywriting,
  isLoadingComando = false,
  isLoadingCopywriting = false,
  webhookComandoConfigured = false,
  webhookCopywritingConfigured = false
}: ProductFormContentProps) => {
  const [aiEnhancementUsed, setAiEnhancementUsed] = useState(false);

  console.log('🔍 ProductFormContent - Product ID:', product?.id);
  console.log('🔍 ProductFormContent - Product SKU:', product?.sku);

  // Escutar evento para iniciar automação do Comando Unificado
  useEffect(() => {
    const handleStartUnified = () => {
      console.log('🚀 [ProductFormContent] Evento automationStartUnified recebido');
      // O CompactAIDescriptionEnhancer vai tratar a automação
    };

    window.addEventListener('automationStartUnified', handleStartUnified);
    return () => {
      window.removeEventListener('automationStartUnified', handleStartUnified);
    };
  }, []);

  return (
    <CardContent className="p-6 space-y-6">
      <ProductBasicInfo
        product={product}
        isEditing={isEditing}
        formData={formData}
        onFormDataChange={onFormDataChange}
      />

      <ProductDescription
        product={product}
        isEditing={isEditing}
        formData={formData}
        onFormDataChange={onFormDataChange}
        onUpdateDescription={onUpdateDescription}
      />

      {/* ❌ REMOVIDO: ProductContextFields - IA usa apenas Comando Unificado + Copywriting */}

      {/* Comando Unificado (5 em 1) - Usa dados do formData inseridos pelo usuário */}
      <div className="hidden">
        <CompactAIDescriptionEnhancer
          productId={product?.id}
          productSku={formData.sku}
          productName={formData.nome}
          shortDescription={formData.descricao_curta}
          onUpdateDescription={onUpdateDescription}
          isAutomationRunning={isAutomationRunning}
          automationStep={automationStep}
          copywritingData={copywritingData}
          externalUnifiedData={unifiedCommandsData}
          onExecuteWebhookComando={onExecuteWebhookComando}
          onExecuteWebhookCopywriting={onExecuteWebhookCopywriting}
          isLoadingComando={isLoadingComando}
          isLoadingCopywriting={isLoadingCopywriting}
          webhookComandoConfigured={webhookComandoConfigured}
          webhookCopywritingConfigured={webhookCopywritingConfigured}
        />
      </div>
    </CardContent>
  );
};
