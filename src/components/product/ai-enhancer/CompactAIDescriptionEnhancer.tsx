
import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CompactAIDescriptionEnhancerProps, UnifiedAIResponse } from "./types";
import { ResultsContainer } from "./ResultsContainer";
import { ResultsToggleSection } from "./ResultsToggleSection";
import { useUnifiedResults } from "./hooks/useUnifiedResults";

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

  console.log('🎯 MAIN - Estado de renderização:', {
    productId: productId || 'N/A',
    shouldShowResults,
    showResults,
    hasCopywriting: !!combinedResults?.copywriting
  });

  return (
    <div className="space-y-3">
      <div className="w-full flex items-center justify-center py-2 px-4 bg-slate-50 border border-slate-100 rounded-lg">
        <span className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
          Conversão + Performance + Copy Profissional
        </span>
      </div>


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
              </div>
              <p className="text-xs text-amber-600 mb-3">
                ⚠️ Estes resultados existem apenas em memória. Fechar a aba = dados perdidos.
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
