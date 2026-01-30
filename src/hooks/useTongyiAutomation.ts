import { useCallback } from 'react';
import { toast } from 'sonner';

export const useTongyiAutomation = (
  availableImages: string[],
  generateUltraRealisticPrompts: (images?: string[], autoGenerate?: boolean) => Promise<boolean>,
  setExpandedTool: (tool: string) => void,
  setSelectedImagesForAnalysis: (images: string[]) => void,
  setSelectedBaseImages: (images: string[]) => void
) => {
  const handlePremiumTongyiAutomation = useCallback(async () => {
    console.log('🚀 TongyiWanxiang: Iniciando automação premium...');
    
    // Verificar se há imagens disponíveis
    if (availableImages.length < 2) {
      toast.error('TongyiWanxiang: Necessário pelo menos 2 imagens para automação');
      return;
    }

    try {
      // Expandir ferramenta
      setExpandedTool('analysis');
      
      // Aguardar um momento para UI atualizar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Auto-selecionar 2 melhores imagens (preferir DeepAI públicas)
      const candidateImages = availableImages.filter(url => !url.includes('app.sistemab2drop.com.br'));
      const chosenImages = (candidateImages.length >= 2
        ? candidateImages.slice(-2) // DeepAI normalmente vem no final
        : candidateImages.length > 0
          ? candidateImages
          : availableImages.slice(-2));
      console.log('✅ TongyiWanxiang: Selecionando imagens para automação:', chosenImages);
      
      // Definir as imagens selecionadas nos estados
      setSelectedImagesForAnalysis(chosenImages);
      setSelectedBaseImages(chosenImages);
      
      // Aguardar um momento para garantir que os estados foram atualizados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Auto-gerar prompts passando as imagens diretamente E acionar geração automática
      console.log('🔄 TongyiWanxiang: Iniciando geração automática de prompts com auto-geração de imagens...');
      toast.info('🔄 TongyiWanxiang: Gerando prompts e imagens automaticamente...');
      
      // Chamar generateUltraRealisticPrompts com flag para gerar imagens automaticamente
      const success = await generateUltraRealisticPrompts(chosenImages, true);
      
      if (!success) {
        console.log('⚠️ TongyiWanxiang: Falha na geração de prompts, tentando novamente...');
        toast.warning('⚠️ Tentando gerar prompts novamente...');
        
        // Tentar novamente após um delay
        setTimeout(async () => {
          await generateUltraRealisticPrompts(chosenImages, true);
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ TongyiWanxiang: Erro na automação:', error);
      toast.error('Erro na automação TongyiWanxiang');
    }
  }, [availableImages, generateUltraRealisticPrompts, setExpandedTool, setSelectedImagesForAnalysis, setSelectedBaseImages]);

  return { handlePremiumTongyiAutomation };
};