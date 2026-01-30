
import { useState, useCallback, useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactAIDescriptionEnhancerProps, UnifiedAIResponse } from "./types";
import { AIEnhancerHeader } from "./AIEnhancerHeader";
import { ResultsContainer } from "./ResultsContainer";
import { ResultsToggleSection } from "./ResultsToggleSection";
import { useUnifiedResults } from "./hooks/useUnifiedResults";
import { useUnifiedCommands } from "./hooks/useUnifiedCommands";

export const CompactAIDescriptionEnhancer = ({ 
  productName, 
  shortDescription, 
  onUpdateDescription,
  productId,
  productSku,
  copywritingData,
  externalUnifiedData,
  // N8N Webhooks
  onExecuteWebhookComando,
  onExecuteWebhookCopywriting,
  isLoadingComando = false,
  isLoadingCopywriting = false,
  webhookComandoConfigured = false,
  webhookCopywritingConfigured = false
}: CompactAIDescriptionEnhancerProps) => {
  
  const [showResults, setShowResults] = useState(false);
  
  console.log('🎯 MAIN - Renderizando com props:', {
    productName: productName || 'VAZIO',
    productId: productId || 'VAZIO',
    productSku: productSku || 'VAZIO',
    hasShortDescription: !!shortDescription,
    hasCopywritingData: !!copywritingData
  });

  // ✅ Hook simplificado - 100% em memória, sem persistência
  const { unifiedResults, setUnifiedResults } = useUnifiedResults();

  const { isLoadingGemini, isLoadingOpenAI, generateUnifiedCommands } = useUnifiedCommands();

  // ✅ Combinar resultados INDEPENDENTEMENTE - cada fonte adiciona seus dados
  const combinedResults = useMemo((): UnifiedAIResponse | null => {
    // Verificar se há QUALQUER dado disponível
    const hasExternalData = externalUnifiedData && Object.keys(externalUnifiedData).length > 0;
    const hasLocalData = unifiedResults && Object.keys(unifiedResults).length > 0;
    const hasCopywriting = !!copywritingData?.content;
    
    console.log('🔄 RESULTS - Calculando combinedResults (independente):', {
      hasExternalData,
      hasLocalData,
      hasCopywriting,
      externalKeys: externalUnifiedData ? Object.keys(externalUnifiedData) : [],
      localKeys: unifiedResults ? Object.keys(unifiedResults) : [],
    });
    
    // Se não há NENHUM dado, retornar null
    if (!hasExternalData && !hasLocalData && !hasCopywriting) {
      return null;
    }
    
    // ✅ Construir resultado combinando TODAS as fontes disponíveis
    // Base com valores null para campos obrigatórios
    const result: UnifiedAIResponse = {
      topicos_conversao: null,
      palavras_chave_seo: null,
      perguntas_respostas: null,
      kits_criativos: null,
    };
    
    // 1. Adicionar dados locais (se existirem)
    if (hasLocalData && unifiedResults) {
      Object.assign(result, unifiedResults);
    }
    
    // 2. Adicionar/sobrescrever com dados externos (Comando n8n) - têm prioridade
    if (hasExternalData && externalUnifiedData) {
      Object.assign(result, externalUnifiedData);
    }
    
    // 3. Adicionar copywriting (se existir)
    if (hasCopywriting && copywritingData) {
      result.copywriting = {
        improvedText: copywritingData.content,
        keywords: [],
      };
    }
    
    console.log('✅ RESULTS - Resultado combinado final:', Object.keys(result));
    
    return result;
  }, [externalUnifiedData, unifiedResults, copywritingData]);

  // Auto-expandir resultados quando dados externos chegarem
  useEffect(() => {
    if (externalUnifiedData && Object.keys(externalUnifiedData).length > 0) {
      console.log('📂 MAIN - Dados externos recebidos, expandindo automaticamente:', Object.keys(externalUnifiedData));
      setShowResults(true);
    }
  }, [externalUnifiedData]);

  // Auto-expandir quando copywriting chegar
  useEffect(() => {
    if (copywritingData?.content) {
      console.log('📝 MAIN - Copywriting recebido, expandindo automaticamente');
      setShowResults(true);
    }
  }, [copywritingData]);

  const handleGenerateGemini = useCallback(async () => {
    console.log('🚀 MAIN - Gerando comandos unificados com Gemini...');
    
    await generateUnifiedCommands(
      productName,
      shortDescription,
      'gemini',
      (data) => {
        console.log('📥 MAIN - Recebendo dados da API Gemini:', data);
        setUnifiedResults(data);
        setShowResults(true);
        
        // Emitir evento de conclusão para automação
        window.dispatchEvent(new CustomEvent('unifiedCommandsComplete', {
          detail: data
        }));
      }
    );
  }, [productName, shortDescription, generateUnifiedCommands, setUnifiedResults]);

  const handleGenerateOpenAI = useCallback(async () => {
    console.log('🚀 MAIN - Gerando comandos unificados com OpenAI (PADRÃO)...');
    
    await generateUnifiedCommands(
      productName,
      shortDescription,
      'openai',
      (data) => {
        console.log('📥 MAIN - Recebendo dados da API OpenAI:', data);
        setUnifiedResults(data);
        setShowResults(true);
        
        // Emitir evento de conclusão para automação
        window.dispatchEvent(new CustomEvent('unifiedCommandsComplete', {
          detail: data
        }));
      }
    );
  }, [productName, shortDescription, generateUnifiedCommands, setUnifiedResults]);

  // ✅ Função para baixar resultados como JSON
  const downloadResults = useCallback(() => {
    if (!combinedResults) return;
    
    const blob = new Blob([JSON.stringify(combinedResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados-${productSku || productId || 'produto'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [combinedResults, productSku, productId]);

  // 🚫 AUTOMAÇÃO AUTOMÁTICA DESATIVADA
  useEffect(() => {
    const handleAutomationStart = async () => {
      console.log('⏸️ [AUTOMAÇÃO] Evento automationStartUnified IGNORADO - automação automática desativada');
      return;
    };

    window.addEventListener('automationStartUnified', handleAutomationStart);
    return () => {
      window.removeEventListener('automationStartUnified', handleAutomationStart);
    };
  }, []);

  const shouldShowResults = combinedResults && Object.keys(combinedResults).length > 0;
  const isAnyLoading = isLoadingGemini || isLoadingOpenAI;

  console.log('🎯 MAIN - Estado de renderização:', {
    productId: productId || 'N/A',
    shouldShowResults,
    isLoadingGemini,
    isLoadingOpenAI,
    showResults,
    hasCopywriting: !!combinedResults?.copywriting
  });

  return (
    <div className="space-y-3">
      <AIEnhancerHeader
        isLoading={isAnyLoading}
        shortDescription={shortDescription}
        onGenerateUnifiedCommands={handleGenerateOpenAI}
        hasPersistedResults={false}
        onExecuteWebhookComando={onExecuteWebhookComando}
        onExecuteWebhookCopywriting={onExecuteWebhookCopywriting}
        isLoadingComando={isLoadingComando}
        isLoadingCopywriting={isLoadingCopywriting}
        webhookComandoConfigured={webhookComandoConfigured}
        webhookCopywritingConfigured={webhookCopywritingConfigured}
      />

      {shouldShowResults && (
        <>
          <ResultsToggleSection
            showResults={showResults}
            onToggleResults={() => setShowResults(!showResults)}
          />

          {showResults && (
            <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                  <p className="text-amber-700 font-semibold">📋 Resultados Gerados (Temporários)</p>
                </div>
                <Button
                  onClick={downloadResults}
                  size="sm"
                  variant="outline"
                  className="text-amber-700 border-amber-300 hover:bg-amber-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar JSON
                </Button>
              </div>
              <p className="text-xs text-amber-600 mb-3">
                ⚠️ Estes resultados existem apenas em memória. Fechar a aba = dados perdidos. Use o botão acima para salvar.
              </p>
              <ResultsContainer
                unifiedResults={combinedResults}
                onUpdateDescription={onUpdateDescription}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
