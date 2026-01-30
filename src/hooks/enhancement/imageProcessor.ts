
import { toast } from "sonner";
import { EnhancementType } from "@/components/enhancement/EnhancementOptions";
import { EnhancedImage } from "./types";
import { processWithDeepAI } from "./deepaiProcessor";
import { handleProcessingErrors } from "./errorHandler";

export const processImageWithDeepAI = async (
  imageUrl: string,
  enhancementType: EnhancementType,
  imageIndex: number,
  totalImages: number,
  useEnhancementCredit: () => Promise<boolean>
): Promise<{ success: boolean; enhancedImage?: EnhancedImage; shouldStop?: boolean }> => {
  console.log(`\n=== PROCESSANDO IMAGEM ${imageIndex + 1}/${totalImages} ===`);
  console.log(`URL: ${imageUrl.substring(0, 100)}...`);
  console.log(`Tipo: ${enhancementType}`);
  
  // Consumir crédito
  console.log('💳 Consumindo crédito...');
  const hasCredit = await useEnhancementCredit();
  if (!hasCredit) {
    toast.error(`Créditos esgotados na imagem ${imageIndex + 1}`);
    return { success: false, shouldStop: true };
  }
  console.log('✅ Crédito consumido com segurança');
  
  // Processar com DeepAI
  const deepaiResult = await processWithDeepAI(imageUrl, enhancementType, imageIndex, totalImages);
  
  if (!deepaiResult.success) {
    const errorResult = handleProcessingErrors({ 
      success: false, 
      error: deepaiResult.error 
    } as any, imageIndex, 1);
    
    if (errorResult.shouldStop) {
      return errorResult;
    }
    
    toast.error(`Erro na imagem ${imageIndex + 1}: ${deepaiResult.error}`, {
      description: `Crédito foi consumido mas processamento falhou.`,
      duration: 8000
    });
    
    return { success: false };
  }

  const data = deepaiResult.data;
  if (data && data.enhanced_url) {
    console.log(`✅ DeepAI processou imagem ${imageIndex + 1} com sucesso!`);
    console.log(`🔗 URL DeepAI recebida:`, data.enhanced_url);
    
    const enhancedImage: EnhancedImage = {
      original: imageUrl,
      enhanced: data.enhanced_url,
      metadata: {
        ...data.metadata,
        processor: 'DeepAI',
        enhanced_at: new Date().toISOString()
      }
    };
    
    return { success: true, enhancedImage };
  }

  return { success: false };
};
