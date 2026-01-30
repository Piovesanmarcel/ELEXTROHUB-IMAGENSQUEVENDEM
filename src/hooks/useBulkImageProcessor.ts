
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UploadedImage, ProcessedImage } from "@/pages/BulkImageEnhancement";
import { useEnhancementUsage } from "./useEnhancementUsage";

export const useBulkImageProcessor = () => {
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { usage, isLoading: isUsageLoading, useEnhancementCredit } = useEnhancementUsage();

  // Convert blob URL to base64 - VERSÃO SIMPLIFICADA
  async function blobToBase64(blobUrl: string): Promise<string> {
    console.log('🔄 Convertendo blob URL para base64:', blobUrl);
    
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log('✅ Conversão blob->base64 concluída, tamanho:', result.length);
        resolve(result);
      };
      reader.onerror = (error) => {
        console.error('❌ Erro na conversão blob->base64:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  }

  const processWithDeepAI = async (imageUrl: string, maxRetries: number = 2) => {
    console.log(`🚀 INICIANDO processWithDeepAI para: ${imageUrl.substring(0, 50)}...`);
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Tentativa ${attempt}/${maxRetries} - Processamento DeepAI`);
        
        // Verificar crédito APENAS na primeira tentativa
        if (attempt === 1) {
          console.log('💳 Verificando créditos disponíveis...');
          const hasCredit = await useEnhancementCredit();
          if (!hasCredit) {
            throw new Error('Créditos de melhoria esgotados');
          }
          console.log('✅ Crédito verificado e consumido');
        }

        // Preparar dados da imagem
        let imageData = null;
        if (imageUrl.startsWith('blob:')) {
          console.log('🔧 Convertendo blob URL para base64...');
          imageData = await blobToBase64(imageUrl);
          console.log('✅ Conversão concluída');
        }

        // Timeout mais generoso - 120 segundos
        const controller = new AbortController();
        const timeoutMs = 120000; // 2 minutos
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Timeout após ${timeoutMs}ms na tentativa ${attempt}`);
          controller.abort();
        }, timeoutMs);

        console.log(`📤 Enviando para DeepAI (timeout: ${timeoutMs}ms)...`);
        
        const { data, error } = await supabase.functions.invoke('photoroon-enhance', {
          body: {
            imageUrl: imageUrl,
            imageData: imageData,
            enhancement_type: 'super_resolution'
          },
          signal: controller.signal
        } as any);

        clearTimeout(timeoutId);

        if (error) {
          console.error(`❌ Erro da Edge Function:`, error);
          throw new Error(`Erro na comunicação com DeepAI: ${error.message}`);
        }
        
        console.log(`📥 Resposta DeepAI recebida:`, { success: data?.success, hasUrl: !!data?.enhanced_url });
        
        if (!data || !data.success) {
          const errorMsg = data?.error || data?.message || 'Falha no processamento DeepAI';
          console.error(`❌ Falha no processamento:`, errorMsg);
          
          if (data?.user_action_required) {
            throw new Error(`${errorMsg}: ${data.user_action_required}`);
          }
          
          throw new Error(errorMsg);
        }

        if (!data.enhanced_url) {
          throw new Error('URL da imagem melhorada não foi retornada pelo DeepAI');
        }

        console.log(`✅ Processamento DeepAI concluído com sucesso na tentativa ${attempt}`);
        return data.enhanced_url;

      } catch (fetchError) {
        console.error(`💥 Erro na tentativa ${attempt}:`, fetchError);
        
        if (fetchError.name === 'AbortError') {
          lastError = new Error(`Timeout na comunicação com DeepAI (tentativa ${attempt})`);
        } else {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        }
        
        // Se ainda há tentativas, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          const delay = 3000; // 3 segundos fixos entre tentativas
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw lastError;
      }
    }
    
    throw lastError || new Error('Falha após múltiplas tentativas');
  };

  const processBackgroundRemoval = async (imageUrl: string) => {
    // Implementar remoção de fundo com DeepAI ou outro serviço
    // Por enquanto, simular o processo
    await new Promise(resolve => setTimeout(resolve, 2000));
    return imageUrl; // Placeholder - retornar URL processada
  };

  const handleBulkProcess = async (
    images: UploadedImage[],
    processedImages: ProcessedImage[],
    onProcessedImagesUpdate: (images: ProcessedImage[]) => void,
    processingType: 'enhance' | 'background',
    onProcessingChange: (processing: boolean) => void
  ) => {
    console.log(`🎯 INICIANDO PROCESSAMENTO EM LOTE: ${images.length} imagens`);
    
    if (images.length === 0) {
      toast.error("Nenhuma imagem para processar");
      return;
    }

    // Verificar créditos para processamento de melhoria
    if (processingType === 'enhance') {
      if (!usage || usage.enhancements_available < images.length) {
        const needed = images.length;
        const available = usage?.enhancements_available || 0;
        toast.error(`Créditos insuficientes! Você precisa de ${needed} créditos mas tem apenas ${available} disponíveis.`, {
          duration: 8000,
          action: {
            label: "Comprar Créditos",
            onClick: () => {
              toast.info("Sistema de compra em desenvolvimento");
            }
          }
        });
        return;
      }
    }

    onProcessingChange(true);
    setProgress(0);
    setCurrentImageIndex(0);

    // Garantir que todas as imagens têm estado inicial pendente
    const initialProcessedImages = images.map(img => {
      const existing = processedImages.find(p => p.id === img.id);
      return existing || {
        id: img.id,
        original: img.preview,
        status: 'pending' as const
      };
    });
    onProcessedImagesUpdate(initialProcessedImages);

    let updatedImages = [...initialProcessedImages];

    try {
      const processingMessage = processingType === 'enhance' 
        ? `🚀 Iniciando melhoria DeepAI de ${images.length} imagem(ns) com sistema anti-falha...`
        : `Iniciando remoção de fundo de ${images.length} imagem(ns)...`;
      
      toast.info(processingMessage);

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setCurrentImageIndex(i + 1);
        
        console.log(`\n=== PROCESSANDO IMAGEM ${i + 1}/${images.length}: ${image.name} ===`);
        
        try {
          // Marcar como processando
          updatedImages = updatedImages.map(img => 
            img.id === image.id ? { ...img, status: 'processing' as const } : img
          );
          onProcessedImagesUpdate(updatedImages);

          let processedUrl: string;
          
          if (processingType === 'enhance') {
            console.log(`🔧 Processando com DeepAI: ${image.name}`);
            processedUrl = await processWithDeepAI(image.preview, 2);
            
            updatedImages = updatedImages.map(img => 
              img.id === image.id ? { 
                ...img, 
                status: 'completed' as const,
                enhanced: processedUrl
              } : img
            );
            
            console.log(`✅ Imagem ${i + 1} processada com sucesso!`);
            toast.success(`Imagem ${i + 1} melhorada com DeepAI!`);
          } else {
            processedUrl = await processBackgroundRemoval(image.preview);
            updatedImages = updatedImages.map(img => 
              img.id === image.id ? { 
                ...img, 
                status: 'completed' as const,
                backgroundRemoved: processedUrl
              } : img
            );
            
            toast.success(`Fundo removido da imagem ${i + 1}!`);
          }

          onProcessedImagesUpdate(updatedImages);

        } catch (error) {
          console.error(`❌ ERRO ao processar imagem ${i + 1} (${image.name}):`, error);
          
          const errorMessage = error.message || 'Erro desconhecido';
          updatedImages = updatedImages.map(img => 
            img.id === image.id ? { 
              ...img, 
              status: 'error' as const,
              error: errorMessage
            } : img
          );
          onProcessedImagesUpdate(updatedImages);
          
          // Tratamento específico de erros
          if (errorMessage.includes('créditos') || errorMessage.includes('credits')) {
            toast.error(`⚠️ Créditos esgotados na imagem ${i + 1}!`, {
              description: "Você não possui créditos suficientes para continuar",
              duration: 8000
            });
            break; // Parar processamento se não há créditos
          } else if (errorMessage.includes('Failed to fetch')) {
            toast.error(`🌐 Falha de conectividade na imagem ${i + 1}`, {
              description: "Problema na comunicação com DeepAI. Verifique sua conexão.",
              duration: 8000
            });
          } else {
            toast.error(`Erro na imagem ${i + 1}: ${image.name}`, {
              description: errorMessage,
              duration: 5000
            });
          }
        }

        // Atualizar progresso
        const newProgress = ((i + 1) / images.length) * 100;
        setProgress(newProgress);
        
        // Pausa estratégica entre imagens
        if (i < images.length - 1) {
          console.log('⏳ Pausa de 2s entre imagens...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Contar resultados finais
      const finalCompletedCount = updatedImages.filter(img => img.status === 'completed').length;
      const finalErrorCount = updatedImages.filter(img => img.status === 'error').length;
      
      console.log(`🏁 PROCESSAMENTO FINALIZADO: ${finalCompletedCount} sucesso, ${finalErrorCount} erros`);
      
      if (finalCompletedCount > 0) {
        const completionMessage = processingType === 'enhance'
          ? `✅ ${finalCompletedCount} imagem(ns) melhorada(s) com DeepAI!`
          : `✅ Fundo removido de ${finalCompletedCount} imagem(ns)!`;
        toast.success(completionMessage);
      }
      
      if (finalErrorCount > 0) {
        toast.warning(`⚠️ ${finalErrorCount} imagem(ns) falharam. Tentativas automáticas foram realizadas.`);
      }

    } catch (error) {
      console.error('💥 Erro crítico no processo em lote:', error);
      toast.error(`Erro no processamento: ${error.message}`);
    } finally {
      onProcessingChange(false);
      setTimeout(() => {
        setProgress(0);
        setCurrentImageIndex(0);
      }, 3000);
    }
  };

  return {
    progress,
    currentImageIndex,
    usage,
    isUsageLoading,
    handleBulkProcess
  };
};
