import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Loader2, Upload, X, Copy, Image as ImageIcon, Wand2 } from 'lucide-react';
import { useRunwayGenerator } from '@/hooks/useRunwayGenerator';
import { DeepAIImageSelector } from '@/components/product/DeepAIImageSelector';
import { useImageEnhancementPersistence } from '@/hooks/enhancement/useImageEnhancementPersistence';
import { EnhancedImage } from '@/hooks/enhancement/types';
import { useImageResizer } from '@/hooks/useImageResizer';
import { toast } from 'sonner';
import { usePromptSync } from '@/contexts/PromptSyncContext';
import { PromptDebugPanel } from '@/components/debug/PromptDebugPanel';
import { EnhancedPromptDebugPanel } from '@/components/debug/EnhancedPromptDebugPanel';
import { useHostedImages } from '@/hooks/useHostedImages';
import { supabase } from '@/integrations/supabase/client';
import { useAIImagesCache } from '@/hooks/useAIImagesCache';

interface RunwayImageGeneratorProps {
  productId: string;
  productName: string;
  productImages?: string[];
}

export const RunwayImageGenerator: React.FC<RunwayImageGeneratorProps> = ({
  productId,
  productName,
  productImages = []
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gen4_image' | 'gen4_image_turbo' | 'gemini_2.5_flash'>('gen4_image_turbo');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // Cache de sessão para imagens geradas
  const { cachedImages, saveToCache } = useAIImagesCache(productId, 'Runway AI');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  
  // DeepAI Integration States
  const [selectedDeepAIImages, setSelectedDeepAIImages] = useState<string[]>([]);
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);

  // Imported prompts states
  const [importedPrompts, setImportedPrompts] = useState<string[]>([]);
  const [isGeneratingMultiplePrompts, setIsGeneratingMultiplePrompts] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Prompt sync integration
  const { collectedPrompts, getPromptsForRunway, totalPrompts, isRunwayReady, clearPrompts } = usePromptSync();
  
  const { 
    generateTextToImage, 
    generateMultipleVariations,
    isProcessing, 
    progress,
    isProcessingMultiple,
    multiProgress,
    currentVariation 
  } = useRunwayGenerator();

  const { loadEnhancedImages } = useImageEnhancementPersistence();
  const { resizeImageTo1000x1000 } = useImageResizer();
  
  // Hook para salvar imagens hospedadas com tags padronizadas
  const { saveHostedImage } = useHostedImages();

  // Restaurar cache ao montar componente
  useEffect(() => {
    if (cachedImages.length > 0 && generatedImages.length === 0) {
      setGeneratedImages(cachedImages);
      console.log(`🔄 [RUNWAY] ${cachedImages.length} imagens restauradas do cache`);
    }
  }, [cachedImages]);

  // Salvar no cache sempre que gerar novas imagens
  useEffect(() => {
    if (generatedImages.length > 0) {
      saveToCache(generatedImages);
    }
  }, [generatedImages, saveToCache]);

  // ✅ CONSOLIDADO: Single useEffect para carregar imagens e estabilizar estados
  useEffect(() => {
    let mounted = true;
    
    const loadImagesAndSync = async () => {
      if (!productId || !mounted) return;
      
      // Load DeepAI images
      if (enhancedImages.length === 0) {
        setIsLoadingEnhanced(true);
        try {
          console.log('🔍 [RUNWAY COMPONENT] Carregando imagens melhoradas do DeepAI para produto:', productId);
          const images = await loadEnhancedImages(productId);
          
          if (mounted) {
            setEnhancedImages(images);
            
            // Auto-select first enhanced image if none selected (only once)
            if (images.length > 0 && selectedDeepAIImages.length === 0) {
              setSelectedDeepAIImages([images[0].enhanced]);
              console.log('✅ [RUNWAY COMPONENT] Auto-selecionada primeira imagem DeepAI:', images[0].enhanced);
            }
          }
          
          console.log('✅ [RUNWAY COMPONENT] Imagens carregadas:', images.length);
        } catch (error) {
          console.error('❌ [RUNWAY COMPONENT] Erro ao carregar imagens melhoradas:', error);
        } finally {
          if (mounted) setIsLoadingEnhanced(false);
        }
      }
    };

    // ✅ DEBOUNCE para evitar múltiplas execuções
    const timeoutId = setTimeout(loadImagesAndSync, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [productId, loadEnhancedImages, enhancedImages.length, selectedDeepAIImages.length]);

  // ✅ DEBOUNCED: Sync prompts com proteção contra loops
  useEffect(() => {
    let syncTimeout: NodeJS.Timeout;
    
    const debouncedSync = () => {
      const syncedPrompts = collectedPrompts.flatMap(data => data.prompts);
      
      // Guard: avoid unnecessary updates
      if (JSON.stringify(syncedPrompts) === JSON.stringify(importedPrompts)) {
        return;
      }
      
      console.log('📋 [RUNWAY COMPONENT] Prompts obtidos do sync:', syncedPrompts.length);
      
      if (syncedPrompts.length > 0) {
        setImportedPrompts(syncedPrompts);
        console.log('✅ [RUNWAY COMPONENT] Prompts sincronizados:', syncedPrompts.length);

        // Auto-apply first prompt ONLY if empty or explicitly different
        if (syncedPrompts[0] && !prompt.trim()) {
          setPrompt(syncedPrompts[0]);
          console.log('🎯 [RUNWAY COMPONENT] Primeiro prompt aplicado:', syncedPrompts[0]);
          toast.info('📝 Primeiro prompt aplicado automaticamente!');
        }
      }
      
      // Show ready notification only once when 4+ prompts available
      if (syncedPrompts.length >= 4 && totalPrompts >= 4 && !isRunwayReady) {
        toast.success('✅ 4 prompts coletados! Prontos para geração no Runway AI');
      }
    };
    
    // ✅ 300ms debounce to prevent rapid re-renders
    syncTimeout = setTimeout(debouncedSync, 300);
    
    return () => clearTimeout(syncTimeout);
  }, [collectedPrompts, totalPrompts, isRunwayReady, importedPrompts, prompt.trim()]);

  // Force collect prompts from all sources  
  const handleForceCollect = useCallback(() => {
    console.log('🔄 [RUNWAY] Forçando coleta de prompts...');
    
    window.dispatchEvent(new CustomEvent('requestPromptsForRunway', {
      detail: { productId, timestamp: Date.now() }
    }));
    
    // ✅ Shorter timeout to prevent UI freezing
    setTimeout(() => {
      const allPrompts = collectedPrompts.flatMap(data => data.prompts);
      setImportedPrompts(allPrompts);
      toast.info(`🔄 Forçou coleta: ${allPrompts.length} prompts encontrados`);
    }, 500);
  }, [productId, collectedPrompts]);

  // Copy first collected prompt to main field
  const handleCopyFirstPrompt = useCallback(() => {
    const currentPrompts = getPromptsForRunway();
    if (currentPrompts.length > 0) {
      setPrompt(currentPrompts[0]);
      toast.success('📋 Primeiro prompt copiado para o campo principal!');
      console.log('📋 [RUNWAY COMPONENT] Primeiro prompt copiado manualmente:', currentPrompts[0]);
    } else {
      toast.warning('Nenhum prompt coletado ainda. Gere prompts em outros geradores primeiro.');
    }
  }, [getPromptsForRunway]);

  // Convert URL to File for Runway API (CORS-safe via edge proxy, with fallback)
  const convertUrlToFile = useCallback(async (imageUrl: string): Promise<File | null> => {
    try {
      console.log('🔄 [RUNWAY] convertUrlToFile start:', imageUrl?.slice(0, 100));

      const dataUrlToFile = (dataUrl: string, fallbackExt = 'jpg'): File => {
        const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
        const mime = match?.[1] || 'image/jpeg';
        const b64 = match?.[2] || '';
        const byteChars = atob(b64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const ext = mime.split('/')[1] || fallbackExt;
        const filename = `deepai-reference-${Date.now()}.${ext}`;
        return new File([byteArray], filename, { type: mime });
      };

      // 1) If already a data URL, convert directly
      if (imageUrl.startsWith('data:')) {
        console.log('🧪 [RUNWAY] data URL detected');
        return dataUrlToFile(imageUrl);
      }

      // 2) Try edge function proxy first (bypasses CORS/expiring hosts)
      try {
        console.log('🧪 [RUNWAY] trying image-proxy via Supabase Edge Function...');
        const { data, error } = await supabase.functions.invoke('image-proxy', { body: { imageUrl } });
        if (error) {
          console.warn('⚠️ [RUNWAY] image-proxy error:', error);
        } else if (data?.success && data?.base64) {
          console.log('✅ [RUNWAY] image-proxy OK, converting base64...');
          return dataUrlToFile(data.base64);
        } else {
          console.warn('⚠️ [RUNWAY] image-proxy returned unexpected payload:', data);
        }
      } catch (proxyErr) {
        console.warn('⚠️ [RUNWAY] image-proxy call failed:', proxyErr);
      }

      // 3) Fallback: direct fetch
      console.log('🧪 [RUNWAY] trying direct fetch...');
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) {
        console.error('❌ [RUNWAY] direct fetch failed:', response.status, response.statusText);
        return null;
      }
      const blob = await response.blob();
      const type = blob.type || 'image/jpeg';
      const ext = type.split('/')[1] || 'jpg';
      const filename = `deepai-reference-${Date.now()}.${ext}`;
      console.log('✅ [RUNWAY] direct fetch OK, blob type:', type);
      return new File([blob], filename, { type });

    } catch (error) {
      console.error('❌ [RUNWAY] convertUrlToFile error:', error);
      return null;
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    setReferenceImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setReferenceImage(null);
    setReferenceImageFile(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, insira um prompt válido');
      return;
    }

    // OBRIGATÓRIO: Apenas imagens melhoradas DeepAI
    if (selectedDeepAIImages.length === 0) {
      toast.error('⚠️ Imagem DeepAI obrigatória! Vá em "Melhoria com DeepAI" e gere pelo menos 1 imagem melhorada antes de continuar.');
      return;
    }
    
    console.log('🔍 [RUNWAY COMPONENT] Usando imagem DeepAI (obrigatória):', selectedDeepAIImages[0]);
    const imageFile = await convertUrlToFile(selectedDeepAIImages[0]);
    if (!imageFile) {
      toast.error('Erro ao processar imagem DeepAI selecionada');
      return;
    }

    try {
      console.log('🎬 [RUNWAY COMPONENT] Gerando imagem:', { 
        prompt, 
        selectedModel, 
        productId, 
        hasDeepAIImage: selectedDeepAIImages.length > 0,
        hasManualImage: !!referenceImageFile
      });
      
      const result = await generateTextToImage(prompt, selectedModel, imageFile);
      
      if (result.success && result.data?.imageURL) {
        const newImageUrl = result.data.imageURL;
        console.log('✅ [RUNWAY COMPONENT] Imagem gerada:', newImageUrl);
        
        // Adicionar à lista local
        setGeneratedImages(prev => [newImageUrl, ...prev]);
        
        // Salvar imagem SEM hospedar (apenas para exibição na galeria)
        try {
          console.log('💾 [RUNWAY] Salvando imagem gerada sem hospedagem...');
          
          const fileName = `runway-${Date.now()}.jpg`;
          
          await saveHostedImage({
            url: newImageUrl, // URL ORIGINAL do Runway
            filename: fileName,
            original_filename: `runway-generated-${Date.now()}.jpg`,
            r2_path: '', // Vazio = não hospedado ainda
            file_type: 'image/jpeg',
            file_size: 0,
            width: 1024,
            height: 1024,
            productId: productId,
            aiSource: 'runway',
            processing: ['text-to-image'],
            quality: 'original',
            tags: ['ai-source:runway', 'original-source:runway', 'not-hosted']
          });
          
          console.log('✅ [RUNWAY] Imagem salva na tabela hosted_images (aguardando hospedagem)');
          toast.success('Imagem gerada e salva com sucesso!');
        } catch (saveError) {
          console.error('❌ [RUNWAY] Erro ao salvar imagem:', saveError);
          toast.error('Erro ao salvar imagem');
        }
        
        // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
        console.log('🔄 [RUNWAY] Convertendo imagem para Blob...');
        const resizedBlobUrl = await resizeImageTo1000x1000(newImageUrl);
        console.log('✅ [RUNWAY] Conversão Blob concluída:', resizedBlobUrl.substring(0, 50));
        
        // Disparar evento para galeria principal
        const imageGeneratedEvent = new CustomEvent('imageGenerated', {
          detail: {
            source: 'runway',
            images: [resizedBlobUrl], // ✅ Usar Blob URL
            productId,
            metadata: {
              model: selectedModel,
              prompt,
              taskId: result.data.taskId,
              generatedAt: Date.now(),
              hasDeepAIReference: selectedDeepAIImages.length > 0,
              hasManualReference: !!referenceImageFile,
              referenceSource: selectedDeepAIImages.length > 0 ? 'deepai' : 'manual'
            }
          }
        });
        
        window.dispatchEvent(imageGeneratedEvent);
        console.log('📡 [RUNWAY COMPONENT] Evento imageGenerated disparado');
        
      } else {
        console.error('❌ [RUNWAY COMPONENT] Falha na geração:', result.error);
      }
    } catch (error) {
      console.error('❌ [RUNWAY COMPONENT] Erro:', error);
    }
  }, [prompt, selectedModel, selectedDeepAIImages, convertUrlToFile, generateTextToImage, productId]);

  const handleGenerateMultiple = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, insira um prompt válido');
      return;
    }

    // OBRIGATÓRIO: Apenas imagens melhoradas DeepAI
    if (selectedDeepAIImages.length === 0) {
      toast.error('⚠️ Imagem DeepAI obrigatória! Vá em "Melhoria com DeepAI" e gere pelo menos 1 imagem melhorada antes de continuar.');
      return;
    }
    
    console.log('🔍 [RUNWAY COMPONENT] Usando imagem DeepAI para variações (obrigatória):', selectedDeepAIImages[0]);
    const imageFile = await convertUrlToFile(selectedDeepAIImages[0]);
    if (!imageFile) {
      toast.error('Erro ao processar imagem DeepAI selecionada');
      return;
    }

    try {
      console.log('🎬 [RUNWAY COMPONENT] Gerando 3 variações:', { 
        prompt, 
        selectedModel, 
        productId,
        hasDeepAIImage: selectedDeepAIImages.length > 0,
        hasManualImage: !!referenceImageFile
      });
      
      const results = await generateMultipleVariations(prompt, selectedModel, imageFile);
      
      // Add successful images to local state
      const successfulImages = results
        .filter(result => result.success && result.data?.imageURL)
        .map(result => result.data!.imageURL);
      
      if (successfulImages.length > 0) {
        setGeneratedImages(prev => [...successfulImages, ...prev]);
        console.log('✅ [RUNWAY COMPONENT] Variações geradas:', successfulImages.length);
      }
      
    } catch (error) {
      console.error('❌ [RUNWAY COMPONENT] Erro nas variações:', error);
    }
  }, [prompt, selectedModel, selectedDeepAIImages, convertUrlToFile, generateMultipleVariations, productId]);

  // Generate images from imported prompts (4 images)
  const handleGenerateFromImportedPrompts = async () => {
    const currentPrompts = getPromptsForRunway();
    
    if (currentPrompts.length < 4) {
      toast.error(`Necessário 4 prompts, apenas ${currentPrompts.length} disponíveis. Use "Forçar Coleta" se necessário.`);
      return;
    }

    if (selectedDeepAIImages.length === 0) {
      toast.error('Selecione uma imagem DeepAI como referência');
      return;
    }

    setIsGeneratingMultiplePrompts(true);
    setCurrentPromptIndex(0);

    try {
      const referenceImageFile = await convertUrlToFile(selectedDeepAIImages[0]);
      if (!referenceImageFile) {
        toast.error('Erro ao processar imagem DeepAI');
        return;
      }

      const newGeneratedImages: string[] = [];
      const currentPrompts = getPromptsForRunway().slice(0, 4); // Use exactly 4 prompts
      
      console.log('🎨 [RUNWAY] Usando variações de prompts:', currentPrompts.map((p, i) => `${i + 1}: ${p.substring(0, 50)}...`));

      for (let i = 0; i < currentPrompts.length; i++) {
        setCurrentPromptIndex(i + 1);
        
        const prompt = currentPrompts[i];
        const sources = ['Runware IA #1', 'Runware IA #2', 'Gemini Background', 'BFL.ai'];
        
        console.log(`🎬 [RUNWAY] Gerando imagem ${i + 1}/4 - Origem: ${sources[i]}`);
        console.log(`🎨 [RUNWAY] Usando variação de contexto: ${prompt.substring(0, 80)}...`);
        toast.info(`🎬 Gerando imagem ${i + 1}/4 - ${sources[i]}...`, { duration: 3000 });

        const result = await generateTextToImage(prompt, selectedModel, referenceImageFile);
        
        if (result.success && result.data?.imageURL) {
          newGeneratedImages.push(result.data.imageURL);
          console.log(`✅ [RUNWAY] Imagem ${i + 1}/4 gerada com sucesso`);
          
          // Dispatch event for generated image
          window.dispatchEvent(new CustomEvent('imageGenerated', {
            detail: { 
              imageUrl: result.data.imageURL, 
              productId: productId,
              source: `runway_imported_${i + 1}`,
              prompt: prompt,
              model: selectedModel
            }
          }));
        } else {
          console.error(`❌ [RUNWAY] Falha na imagem ${i + 1}/4:`, result.error);
          toast.error(`Erro na imagem ${i + 1}/4: ${result.error}`);
        }

        // Delay between generations
        if (i < importedPrompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setGeneratedImages(prev => [...prev, ...newGeneratedImages]);
      
      if (newGeneratedImages.length === 4) {
        toast.success(`🎉 4 imagens geradas com sucesso no Runway AI!`);
      } else {
        toast.warning(`⚠️ ${newGeneratedImages.length}/4 imagens geradas com sucesso`);
      }

    } catch (error) {
      console.error('❌ Error generating from imported prompts:', error);
      toast.error('Erro ao gerar imagens dos prompts importados');
    } finally {
      setIsGeneratingMultiplePrompts(false);
      setCurrentPromptIndex(0);
    }
  };

  return (
    <Card className="w-full border-orange-200 bg-gradient-to-br from-orange-50 to-purple-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Gerador Runway AI
              </CardTitle>
              <p className="text-sm text-gray-600">
                Text-to-Image com modelos Gen4
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
            Premium
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar 1 Imagem
            </TabsTrigger>
            <TabsTrigger value="multiple" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Gerar 3 Variações
            </TabsTrigger>
            <TabsTrigger value="imported">
              Prompts Auto ({totalPrompts}/4)
              {isRunwayReady && <span className="ml-1 text-green-500">✓</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 mt-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Modelo
              </label>
              <Select value={selectedModel} onValueChange={(value: 'gen4_image' | 'gen4_image_turbo' | 'gemini_2.5_flash') => setSelectedModel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gen4_image_turbo">
                    Gen4 Image Turbo (Rápido)
                  </SelectItem>
                  <SelectItem value="gen4_image">
                    Gen4 Image (Qualidade)
                  </SelectItem>
                  <SelectItem value="gemini_2.5_flash">
                    Gemini 2.5 Flash
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DeepAI Image Selection - Priority */}
            {enhancedImages.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-green-600" />
                  Imagens Melhoradas (DeepAI) - Prioridade
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {enhancedImages.length} disponível{enhancedImages.length !== 1 ? 'eis' : ''}
                  </Badge>
                </label>
                <DeepAIImageSelector
                  productId={productId}
                  onImageSelected={setSelectedDeepAIImages}
                  selectedImageUrls={selectedDeepAIImages}
                />
                {selectedDeepAIImages.length > 0 && (
                  <div className="text-xs text-green-600 font-medium bg-green-50 p-2 rounded-lg border border-green-200">
                    ✅ {selectedDeepAIImages.length} imagem{selectedDeepAIImages.length !== 1 ? 'ns' : ''} DeepAI selecionada{selectedDeepAIImages.length !== 1 ? 's' : ''} como referência
                  </div>
                )}
              </div>
            )}

            {/* DeepAI Requirement Notice */}
            {selectedDeepAIImages.length === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Imagem DeepAI obrigatória
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Vá em "Melhoria com DeepAI" e gere pelo menos 1 imagem melhorada para usar este gerador.
                </p>
              </div>
            )}

            {/* Prompt Input com contador de caracteres */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Prompt da Imagem *
                </label>
                <div className="flex items-center gap-2">
                  <Badge variant={prompt.length > 1000 ? "destructive" : prompt.length > 800 ? "secondary" : "outline"} className="text-xs">
                    {prompt.length}/1000
                  </Badge>
                  {importedPrompts.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCopyFirstPrompt}
                      className="text-xs h-7 px-2"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Colar 1º Prompt
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Descreva a imagem que deseja gerar para "${productName}"...`}
                className="min-h-[100px] resize-none"
                disabled={isProcessing}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500">
                Resolução: 1024x1024 • Limite: 1000 caracteres (Runway API) • Imagens otimizadas automaticamente
              </p>
              {prompt.length > 1000 && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  ⚠️ Prompt será truncado automaticamente para 1000 caracteres
                </p>
              )}
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Gerando imagem...</span>
                  <span className="text-gray-600">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isProcessing || !prompt.trim() || selectedDeepAIImages.length === 0}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando... {Math.round(progress)}%
                </>
              ) : selectedDeepAIImages.length === 0 ? (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  DeepAI obrigatório
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Imagem
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="multiple" className="space-y-4 mt-4">
            {/* Model Selection - Same as single */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Modelo
              </label>
              <Select value={selectedModel} onValueChange={(value: 'gen4_image' | 'gen4_image_turbo' | 'gemini_2.5_flash') => setSelectedModel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gen4_image_turbo">
                    Gen4 Image Turbo (Rápido)
                  </SelectItem>
                  <SelectItem value="gen4_image">
                    Gen4 Image (Qualidade)
                  </SelectItem>
                  <SelectItem value="gemini_2.5_flash">
                    Gemini 2.5 Flash
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* DeepAI Image Selection - OBRIGATÓRIO */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-red-600" />
                Imagens Melhoradas (DeepAI) - OBRIGATÓRIO
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  {enhancedImages.length} disponível{enhancedImages.length !== 1 ? 'eis' : ''}
                </Badge>
              </label>
              
              {enhancedImages.length > 0 ? (
                <>
                  <DeepAIImageSelector
                    productId={productId}
                    onImageSelected={setSelectedDeepAIImages}
                    selectedImageUrls={selectedDeepAIImages}
                  />
                  {selectedDeepAIImages.length > 0 && (
                    <div className="text-xs text-green-600 font-medium bg-green-50 p-2 rounded-lg border border-green-200">
                      ✅ {selectedDeepAIImages.length} imagem{selectedDeepAIImages.length !== 1 ? 'ns' : ''} DeepAI selecionada{selectedDeepAIImages.length !== 1 ? 's' : ''} para 3 variações
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Nenhuma imagem melhorada encontrada
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Vá em "Melhoria com DeepAI" e gere pelo menos 1 imagem melhorada para usar este gerador.
                  </p>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Prompt da Imagem *
                </label>
                {importedPrompts.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyFirstPrompt}
                    className="text-xs h-7 px-2"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Colar 1º Prompt
                  </Button>
                )}
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Descreva a imagem que deseja gerar 3 variações para "${productName}"...`}
                className="min-h-[100px] resize-none"
                disabled={isProcessingMultiple}
              />
            </div>

            {/* Progress Bar */}
            {isProcessingMultiple && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Gerando variação {currentVariation}/3...</span>
                  <span className="text-gray-600">{multiProgress}%</span>
                </div>
                <Progress value={multiProgress} className="w-full" />
              </div>
            )}

            <Button
              onClick={handleGenerateMultiple}
              disabled={isProcessingMultiple || !prompt.trim() || (selectedDeepAIImages.length === 0 && !referenceImageFile)}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              {isProcessingMultiple ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating {currentVariation}/3...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Gerar 3 Variações
                </>
              )}
            </Button>
          </TabsContent>

          {/* Imported Prompts Tab */}
          <TabsContent value="imported" className="space-y-4 mt-4">
            {/* Debug Panel */}
            <EnhancedPromptDebugPanel 
              productId={productId} 
              onForceCollect={handleForceCollect}
            />
            
            {totalPrompts > 0 ? (
              <div className="space-y-4">
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-purple-900">Prompts Coletados Automaticamente</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={isRunwayReady ? "default" : "secondary"} className="bg-purple-100 text-purple-700">
                        {totalPrompts}/4 prompts
                      </Badge>
                      {isRunwayReady && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          ✓ Pronto
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {getPromptsForRunway().slice(0, 4).map((prompt, index) => (
                    <div key={index} className="mb-2 p-3 bg-white border border-purple-100 rounded-lg">
                      <div className="text-sm font-medium text-purple-700 mb-1">
                        Prompt {index + 1}:
                      </div>
                      <div className="text-xs text-gray-700 line-clamp-2">
                        {prompt}
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 space-y-2">
                    <Button 
                      onClick={handleGenerateFromImportedPrompts}
                      disabled={isProcessing || isGeneratingMultiplePrompts || !isRunwayReady || selectedDeepAIImages.length === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="lg"
                    >
                      {isGeneratingMultiplePrompts ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando {currentPromptIndex}/4...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Gerar 4 Imagens dos Prompts
                        </>
                      )}
                    </Button>
                    
                    {totalPrompts > 0 && (
                      <Button 
                        onClick={clearPrompts}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        🧹 Limpar Cache de Prompts
                      </Button>
                    )}
                  </div>
                  
                  {selectedDeepAIImages.length === 0 && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ Selecione uma imagem DeepAI como referência acima
                    </div>
                  )}
                  
                  {!isRunwayReady && totalPrompts > 0 && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      ⏳ Aguardando mais prompts... ({totalPrompts}/4 coletados)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Wand2 className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <div className="text-sm">Nenhum prompt coletado ainda</div>
                <div className="text-xs text-gray-400 mt-1">
                  Execute os outros geradores (Runware, Gemini, BFL) para coletar prompts automaticamente
                </div>
                <Button 
                  onClick={handleForceCollect}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  🔄 Tentar Coletar Prompts
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Generated Images Grid */}
        {generatedImages.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700">
              Imagens Geradas ({generatedImages.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {generatedImages.slice(0, 6).map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Runway generated ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-orange-200 group-hover:border-orange-400 transition-colors cursor-pointer"
                    onError={(e) => {
                      console.error('❌ [RUNWAY COMPONENT] Erro ao carregar imagem:', imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-opacity flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(imageUrl, '_blank');
                        }}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {generatedImages.length > 6 && (
              <p className="text-xs text-gray-500 text-center">
                +{generatedImages.length - 6} imagens na galeria principal
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};