
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EnhancementType } from "@/components/enhancement/EnhancementOptions";
import { useEnhancementUsage } from "../useEnhancementUsage";
import { useEnhancementProgress } from "./useEnhancementProgress";
import { useImageEnhancementPersistence } from "./useImageEnhancementPersistence";
import { useImageProcessor } from "./useImageProcessor";
import { validateImages, validateCredits } from "./imageValidationUtils";
import { processImageWithDeepAI } from "./imageProcessor";
import { EnhancedImage } from "./types";

import { useHostingLogger } from "./useHostingLogger";

export const useImageEnhancementCore = (productId?: string) => {
  const [enhancementType, setEnhancementType] = useState<EnhancementType>('super_resolution');
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isLoadingPersisted, setIsLoadingPersisted] = useState(false);

  const { usage, isLoading: isUsageLoading, useEnhancementCredit } = useEnhancementUsage();
  const progressHook = useEnhancementProgress();
  const { isSaving, saveEnhancedImages, loadEnhancedImages, hasEnhancedImages } = useImageEnhancementPersistence();
  const { resizeImageTo1400 } = useImageProcessor();
  const { logHostingAttempt, generateReport, clearLogs } = useHostingLogger();

  useEffect(() => {
    if (productId) {
      loadPersistedImages();
    }
  }, [productId]);

  const loadPersistedImages = async () => {
    if (!productId) return;
    
    setIsLoadingPersisted(true);
    try {
      const persistedImages = await loadEnhancedImages(productId);
      if (persistedImages.length > 0) {
        setEnhancedImages(persistedImages);
        console.log(`✅ ${persistedImages.length} imagens melhoradas carregadas da persistência`);
        toast.success(`${persistedImages.length} imagens melhoradas carregadas!`);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens persistidas:', error);
    } finally {
      setIsLoadingPersisted(false);
    }
  };

  const processImages = async (images: string[]) => {
    console.log('=== INICIANDO PROCESSO SEM HOSPEDAGEM R2 ===');
    console.log('Tipo de melhoria selecionado:', enhancementType);
    
    if (productId && await hasEnhancedImages(productId)) {
      const shouldReprocess = confirm('Este produto já possui imagens melhoradas. Deseja reprocessar?');
      if (!shouldReprocess) {
        toast.info('Carregando imagens melhoradas existentes...');
        await loadPersistedImages();
        return;
      }
    }
    
    const { isValid, validImages } = validateImages(images);
    if (!isValid) return;

    if (!validateCredits(usage, validImages.length)) return;

    // Limpar logs anteriores e iniciar processamento
    clearLogs();
    setEnhancedImages([]);
    progressHook.startProcessing();

    try {
      const enhanced: EnhancedImage[] = [];
      
      toast.info(`Iniciando melhoria de ${validImages.length} imagem(ns)...`, {
        duration: 8000
      });
      
      for (let i = 0; i < validImages.length; i++) {
        const imageUrl = validImages[i];
        
        console.log(`\n=== PROCESSANDO IMAGEM ${i + 1}/${validImages.length} ===`);
        
        try {
          const result = await processImageWithDeepAI(
            imageUrl, 
            enhancementType, 
            i, 
            validImages.length, 
            useEnhancementCredit
          );

          if (result.success && result.enhancedImage) {
            console.log(`✅ Imagem ${i + 1} melhorada pelo DeepAI:`, result.enhancedImage.enhanced);
            
            try {
              console.log(`🔧 REDIMENSIONANDO imagem ${i + 1} para 1400x1400px...`);
              const resizedImageData = await resizeImageTo1400(result.enhancedImage.enhanced);
              
              // SEM HOSPEDAGEM - usar URL direta
              const fileName = `up-${Date.now()}-${i + 1}.jpg`;
              const startTime = Date.now();
              const duration = Date.now() - startTime;
              
              // Log sem hospedagem
              logHostingAttempt({
                timestamp: new Date().toISOString(),
                processingOrder: i + 1,
                fileName,
                originalUrl: imageUrl,
                enhancedUrl: result.enhancedImage.enhanced,
                attempts: 1,
                finalUrl: resizedImageData,
                hosted: false,
                service: 'direct-url',
                duration
              });
              
              const enhancedImage: EnhancedImage = {
                ...result.enhancedImage,
                enhanced: resizedImageData,
                metadata: {
                  ...result.enhancedImage.metadata,
                  hosted: false,
                  hosting_service: 'direct-url',
                  hosting_message: 'URL direta (sem hospedagem R2)',
                  hosted_at: new Date().toISOString(),
                  max_resolution: '1400x1400px',
                  resized_before_upload: true,
                  original_deepai_url: result.enhancedImage.enhanced,
                  processing_order: i + 1
                }
              };
              
              enhanced.push(enhancedImage);
              toast.success(`✅ Imagem ${i + 1} processada!`);
              
            } catch (processingError) {
              console.error(`❌ ERRO ao processar imagem ${i + 1}:`, processingError);
              
              // FALLBACK: Usar imagem original do DeepAI
              const emergencyImage: EnhancedImage = {
                ...result.enhancedImage,
                enhanced: result.enhancedImage.enhanced,
                metadata: {
                  ...result.enhancedImage.metadata,
                  hosted: false,
                  hosting_service: 'direct-url-fallback',
                  hosting_message: 'URL DeepAI direta',
                  hosted_at: new Date().toISOString(),
                  processing_order: i + 1
                }
              };
              
              enhanced.push(emergencyImage);
              toast.success(`🆘 Imagem ${i + 1} processada com fallback!`);
            }
          } else if (result.shouldStop) {
            break;
          }
        } catch (processError) {
          console.error(`❌ Erro ao processar imagem ${i + 1}:`, processError);
          toast.error(`Erro ao processar imagem ${i + 1}: ${processError.message}`);
          continue;
        }
        
        progressHook.updateProgress(i + 1, validImages.length);
      }

      console.log(`=== PROCESSO CONCLUÍDO ===`);
      console.log(`Imagens processadas: ${enhanced.length} de ${validImages.length}`);
      
      // Gerar relatório final
      const report = generateReport();
      
      // Atualizar estado apenas uma vez, no final
      if (enhanced.length > 0) {
        setEnhancedImages(enhanced);
        if (productId) {
          const saveSuccess = await saveEnhancedImages(productId, enhanced);
          if (saveSuccess) {
            toast.success(`🎉 ${enhanced.length} imagens processadas!`);
          } else {
            toast.warning(`${enhanced.length} imagens processadas, mas houve erro ao salvar permanentemente.`);
          }
        } else {
          toast.success(`🎉 ${enhanced.length} imagens processadas!`);
        }
      } else {
        toast.error("❌ Nenhuma imagem foi processada com sucesso.", {
          duration: 15000,
          description: 'Verifique a configuração da API DeepAI e tente novamente.'
        });
      }
      
    } catch (error) {
      console.error('Erro no processo de melhoria:', error);
      toast.error(`Erro no processo: ${error.message}`, {
        description: 'Verifique a configuração da API DeepAI'
      });
    } finally {
      progressHook.finishProcessing();
    }
  };

  return {
    enhancementType,
    enhancedImages,
    usage,
    isUsageLoading,
    isLoadingPersisted,
    isSaving,
    setEnhancementType,
    processImages,
    loadPersistedImages,
    ...progressHook
  };
};
