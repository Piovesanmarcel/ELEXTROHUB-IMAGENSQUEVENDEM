import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Sparkles, Image, X, Brain, Palette } from 'lucide-react';
import { AIGeneratedImagesGrid } from './AIGeneratedImagesGrid';
import { EnhancedImage } from '@/hooks/enhancement/types';
import { useImageEnhancementPersistence } from '@/hooks/enhancement/useImageEnhancementPersistence';
import { BflProductPromptGenerator } from './BflProductPromptGenerator';
import { BflProductMultiGenerator } from './BflProductMultiGenerator';
import { useHostedImages } from '@/hooks/useHostedImages';
import { useAIImagesCache } from '@/hooks/useAIImagesCache';
import { useImageResizer } from '@/hooks/useImageResizer';

interface BflProductImageGeneratorProps {
  images: string[];
  productName: string;
  productId: string;
}

export const BflProductImageGenerator = ({ 
  images, 
  productName, 
  productId 
}: BflProductImageGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('flux-kontext');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  
  // Cache de sessão para imagens geradas
  const { cachedImages, saveToCache } = useAIImagesCache(productId, 'BFL.ai');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estados para o gerador de prompts com Gemini
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [showMultiGenerator, setShowMultiGenerator] = useState(false);
  
  // Estados para geração de fundo branco
  const [selectedImagesForWhiteBg, setSelectedImagesForWhiteBg] = useState<number[]>([]);
  const [whiteBgImages, setWhiteBgImages] = useState<string[]>([]);
  const [isGeneratingWhiteBg, setIsGeneratingWhiteBg] = useState(false);
  
  // Estados para imagens melhoradas com DeepAI (PÚBLICAS)
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(true);
  const { loadEnhancedImages } = useImageEnhancementPersistence();
  
  // Hook para salvar imagens hospedadas com tags padronizadas
  const { saveHostedImage } = useHostedImages();
  const { resizeImageTo1000x1000 } = useImageResizer();

  // Restaurar cache ao montar componente
  useEffect(() => {
    if (cachedImages.length > 0 && generatedImages.length === 0) {
      setGeneratedImages(cachedImages);
      console.log(`🔄 [BFL] ${cachedImages.length} imagens restauradas do cache`);
    }
  }, [cachedImages]);

  // Salvar no cache sempre que gerar novas imagens
  useEffect(() => {
    if (generatedImages.length > 0) {
      saveToCache(generatedImages);
    }
  }, [generatedImages, saveToCache]);

  // Carregar imagens melhoradas do DeepAI (PÚBLICO)
  useEffect(() => {
    const loadDeepAIImages = async () => {
      if (!productId) {
        setIsLoadingEnhanced(false);
        return;
      }

      try {
        console.log('🔍 Carregando imagens melhoradas PÚBLICAS do DeepAI para produto:', productId);
        const images = await loadEnhancedImages(productId);
        if (images && Array.isArray(images)) {
          setEnhancedImages(images);
          console.log('✅ Imagens DeepAI carregadas:', images.length);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar imagens melhoradas:', error);
      } finally {
        setIsLoadingEnhanced(false);
      }
    };

    loadDeepAIImages();

    // 🔄 LISTENER para receber imagens melhoradas do DeepAI em tempo real
    const handleDeepAIImages = (event: CustomEvent) => {
      const { source, images: newImages, productId: eventProductId } = event.detail;
      
      if (eventProductId === productId && source === 'deepai' && newImages?.length > 0) {
        console.log('📥 [BFL] Recebendo imagens melhoradas do DeepAI:', newImages);
        
        // Criar objetos EnhancedImage para as novas imagens
        const newEnhancedImages: EnhancedImage[] = newImages.map((url: string, index: number) => ({
          id: `deepai-${Date.now()}-${index}`,
          original: '',
          enhanced: url,
          metadata: {
            hosted: true,
            processor: 'deepai',
            enhanced_at: new Date().toISOString()
          }
        }));
        
        setEnhancedImages(newEnhancedImages);
        setIsLoadingEnhanced(false);
        console.log('✅ [BFL] Imagens melhoradas atualizadas via evento:', newEnhancedImages.length);
        toast.success('Imagens melhoradas atualizadas! Agora pode usar no BFL.ai');
      }
    };

    window.addEventListener('deepaiImagesToKit', handleDeepAIImages as EventListener);
    
    return () => {
      window.removeEventListener('deepaiImagesToKit', handleDeepAIImages as EventListener);
    };
  }, [productId]);

  const fluxModels = [
    {
      value: 'flux-kontext',
      label: 'FLUX.1 Kontext',
      description: 'Edição avançada - Melhor para modificar imagens existentes',
      operation: 'image-to-image'
    },
    {
      value: 'flux-fill',
      label: 'FLUX.1 Fill',
      description: 'Inpainting/Outpainting - Para preenchimento e expansão de imagens',
      operation: 'inpainting'
    },
    {
      value: 'flux-pro-1.1',
      label: 'FLUX1.1 [pro]',
      description: 'Geração de texto para imagem - Para criação desde zero',
      operation: 'text-to-image'
    }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUploadedImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const convertUrlToBase64 = async (url: string): Promise<string> => {
    console.log('🔄 Convertendo URL para base64:', url);
    
    // Se já é uma string base64, retornar diretamente
    if (url.startsWith('data:image/')) {
      console.log('✅ URL já é base64, retornando diretamente');
      return url;
    }
    
    // Método local direto (mais confiável que proxy)
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        console.log('✅ URL convertida para base64, length:', dataURL.length);
        resolve(dataURL);
      };
      
      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem:', error);
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      // Adicionar timestamp para evitar cache
      const urlWithTimestamp = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
      img.src = urlWithTimestamp;
    });
  };

  const generateImageWithFlux = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, insira um prompt');
      return;
    }

    const selectedModelData = fluxModels.find(m => m.value === selectedModel);
    
    // OBRIGATÓRIO: Apenas imagens melhoradas DeepAI
    if ((selectedModel === 'flux-kontext' || selectedModel === 'flux-fill') && !uploadedImage && enhancedImages.length === 0) {
      toast.error('⚠️ Imagens melhoradas DeepAI obrigatórias! Execute primeiro "Melhoria com DeepAI" para usar este gerador.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🚀 Starting BFL FLUX generation...');
      
      let imageData: string | undefined;
      
      // PRIORIDADE: Usar imagens melhoradas do DeepAI (OBRIGATÓRIO)
      if (uploadedImage) {
        console.log('📷 Converting uploaded image to base64...');
        imageData = await convertImageToBase64(uploadedImage);
        console.log('✅ Uploaded image converted to base64, length:', imageData.length);
      } else if (enhancedImages.length > 0 && selectedImageIndex < enhancedImages.length) {
        console.log('📷 Converting DeepAI ENHANCED image to base64 (OBRIGATÓRIO)...');
        try {
          imageData = await convertUrlToBase64(enhancedImages[selectedImageIndex].enhanced);
          console.log('✅ DeepAI enhanced image converted to base64, length:', imageData.length);
        } catch (error) {
          console.warn('⚠️ CORS error converting DeepAI image, using URL directly:', error);
          imageData = enhancedImages[selectedImageIndex].enhanced;
        }
      } else {
        toast.error('⚠️ Imagem melhorada DeepAI obrigatória! Execute "Melhoria com DeepAI" primeiro.');
        return;
      }

      // Determine operation and model based on input image
      const hasInputImage = !!imageData;
      const operation = hasInputImage ? 'image-to-image' : 'text-to-image';
      const recommendedModel = hasInputImage ? 'flux-kontext-pro' : selectedModel;
      
      // Build request body 
      const requestBody: any = {
        prompt: prompt.trim(),
        width: 1024,
        height: 1024,
        steps: 28,
        guidance: 3.5,
        model: recommendedModel,
        operation: operation
      };

      // Add image parameters
      if (hasInputImage) {
        console.log('🖼️ Sending base64 image (SAME FOR BOTH UPLOAD AND SELECTION)...');
        requestBody.input_image = imageData;
        console.log('📡 Sending base64 image, length:', imageData?.length);
        requestBody.strength = 0.3;
        
        // Force the prompt to reference the original image
        requestBody.prompt = `Based on the provided input image, ${prompt.trim()}. Keep the original composition and main elements, only modify according to the description.`;
        console.log('📝 Enhanced prompt:', requestBody.prompt);
      }
      
      console.log('📡 Calling BFL function with body:', {
        ...requestBody,
        input_image: requestBody.input_image ? '[BASE64_DATA]' : undefined
      });

      // Chamar a função BFL
      console.log('🚀 Enviando POST para bfl-test...');
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('bfl-test', {
        body: requestBody
      });
      
      const endTime = Date.now();
      console.log(`⏱️ POST para bfl-test levou ${endTime - startTime}ms`);
      console.log('📥 BFL Result received:', data);
      console.log('❌ BFL Error:', error);

      if (error) {
        console.error('💥 Error details:', error);
        toast.error(`Erro na função: ${error.message}`);
        return;
      }

      if (data?.success && data?.result_url) {
        // Use base64 if available (avoids CORS issues), otherwise use URL
        const imageToUse = data.result_base64 || data.result_url;
        setGeneratedImages(prev => [...prev, imageToUse]);
        
        // Salvar imagem SEM hospedar (apenas para exibição na galeria)
        try {
          console.log('💾 [BFL] Salvando imagem gerada sem hospedagem...');
          
          const fileName = `bfl-${Date.now()}.jpg`;
          
          await saveHostedImage({
            url: imageToUse, // URL ORIGINAL da BFL
            filename: fileName,
            original_filename: `bfl-generated-${Date.now()}.jpg`,
            r2_path: '', // Vazio = não hospedado ainda
            file_type: 'image/jpeg',
            file_size: 0,
            width: 1024,
            height: 1024,
            productId: productId,
            aiSource: 'bfl',
            processing: ['text-to-image'],
            quality: 'original', // Qualidade original da IA
            tags: ['ai-source:bfl', 'original-source:bfl', 'not-hosted'] // Tag para indicar que precisa hospedar
          });
          
          console.log('✅ [BFL] Imagem salva na tabela hosted_images (aguardando hospedagem)');
          toast.success('Imagem gerada e salva com sucesso!');
        } catch (saveError) {
          console.error('❌ [BFL] Erro ao salvar imagem:', saveError);
          toast.error('Erro ao salvar imagem');
        }
        
        // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
        console.log('🔄 [BFL] Convertendo imagem para Blob...');
        const resizedBlobUrl = await resizeImageTo1000x1000(imageToUse);
        console.log('✅ [BFL] Conversão Blob concluída:', resizedBlobUrl.substring(0, 50));
        
        // Disparar evento para a galeria de IA
        window.dispatchEvent(new CustomEvent('imageGenerated', {
          detail: {
            source: 'bfl',
            images: [resizedBlobUrl], // ✅ Usar Blob URL
            productId: productId,
            timestamp: Date.now()
          }
        }));
        
        const baseMsg = 'Imagem gerada com sucesso!';
        const extraMsg = data.result_base64 ? ' (Base64 - sem CORS)' : ' (URL)';
        toast.success(baseMsg + extraMsg);
      } else {
        console.error('❌ BFL Generation failed:', data);
        toast.error('Erro na geração da imagem');
      }
      
    } catch (err) {
      console.error('💥 Error generating BFL image:', err);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para lidar com prompts gerados e copiar para o gerador manual
  const handlePromptsGenerated = async (prompts: string[]) => {
    console.log('🧠 Prompts gerados pelo Gemini:', prompts);
    setGeneratedPrompts(prompts);
    
    toast.loading('Iniciando geração automática de imagens...', { id: 'auto-generation' });
    
    // Aguardar a geração sequencial ser concluída antes de prosseguir
    const success = await generateImagesSequentially(prompts);
    
    if (success) {
      setShowMultiGenerator(true);
      toast.success(`✅ Processo concluído! ${prompts.length} prompts processados com sucesso!`, { id: 'auto-generation' });
    } else {
      toast.error('❌ Processo interrompido! Nem todas as imagens foram geradas. Verifique os erros e tente novamente.', { 
        id: 'auto-generation',
        duration: 10000
      });
      // Não mostra o próximo passo se falhou
    }
  };

  // Função para gerar imagens sequencialmente com cada prompt
  const generateImagesSequentially = async (prompts: string[]): Promise<boolean> => {
    if (prompts.length === 0) {
      toast.error('Nenhum prompt disponível para geração');
      return false;
    }

    setIsProcessing(true);
    const newGeneratedImages: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      console.log(`🚀 [BFL] Iniciando geração sequencial de ${prompts.length} imagens COM VARIAÇÕES...`);
      console.log('🎨 [BFL] Prompts recebidos:', prompts.map((p, i) => `${i + 1}: ${p.substring(0, 50)}...`));
      
      for (let i = 0; i < prompts.length; i++) {
        const currentPrompt = prompts[i];
        const promptTitle = `Prompt ${i + 1}`;
        
        console.log(`🎯 [BFL] Gerando imagem ${i + 1}/${prompts.length} com prompt:`, currentPrompt.substring(0, 100) + '...');
        console.log(`🎨 [BFL] Variação: Contexto único para diversidade visual`);
        toast.loading(`Gerando imagem ${i + 1}/${prompts.length} - ${promptTitle}...`, { id: `img-gen-${i}` });

        try {
          // Preparar dados da imagem (mesmo código do generateImageWithFlux)
          let imageData: string | undefined;
          
          // OBRIGATÓRIO: Usar imagens melhoradas do DeepAI
          if (uploadedImage) {
            console.log('📷 Converting uploaded image to base64...');
            imageData = await convertImageToBase64(uploadedImage);
          } else if (enhancedImages.length > 0 && selectedImageIndex < enhancedImages.length) {
            console.log('📷 Converting DeepAI ENHANCED image to base64 (OBRIGATÓRIO)...');
            imageData = await convertUrlToBase64(enhancedImages[selectedImageIndex].enhanced);
          } else {
            toast.error('⚠️ Imagem melhorada DeepAI obrigatória! Execute "Melhoria com DeepAI"');
            failureCount++;
            continue;
          }

          const hasInputImage = !!imageData;
          const operation = hasInputImage ? 'image-to-image' : 'text-to-image';
          const recommendedModel = hasInputImage ? 'flux-kontext-pro' : 'flux-pro-1.1';
          
          const requestBody: any = {
            prompt: currentPrompt.trim(),
            width: 1024,
            height: 1024,
            steps: 28,
            guidance: 3.5,
            model: recommendedModel,
            operation: operation
          };

          if (hasInputImage) {
            requestBody.input_image = imageData;
            requestBody.strength = 0.3;
            requestBody.prompt = `Based on the provided input image, ${currentPrompt.trim()}. Keep the original composition and main elements, only modify according to the description.`;
          }
          
          console.log(`📡 Chamando BFL para imagem ${i + 1}...`);
          console.log(`🚀 POST para bfl-test (imagem ${i + 1})...`);
          const startTime = Date.now();
          
          const { data, error } = await supabase.functions.invoke('bfl-test', {
            body: requestBody
          });
          
          const endTime = Date.now();
          console.log(`⏱️ POST para bfl-test (imagem ${i + 1}) levou ${endTime - startTime}ms`);

          if (error) {
            console.error(`❌ Erro na geração da imagem ${i + 1}:`, error);
            toast.error(`Erro na imagem ${i + 1}: ${error.message}`, { id: `img-gen-${i}` });
            failureCount++;
            continue;
          }

          if (data?.success && data?.result_url) {
            // Use base64 if available (avoids CORS issues), otherwise use URL
            const imageToUse = data.result_base64 || data.result_url;
            newGeneratedImages.push(imageToUse);
          console.log(`✅ Imagem ${i + 1} gerada com sucesso:`, imageToUse);
          toast.success(`Imagem ${i + 1} concluída!`, { id: `img-gen-${i}` });
          successCount++;

          // 📡 Send first generated prompt to Runway (only for first image)
          if (i === 0 && currentPrompt) {
            console.log('📡 [BFL] Enviando primeiro prompt para Runway:', currentPrompt);
            
            const runwayEvent = new CustomEvent('promptsReadyForRunway', {
              detail: {
                prompts: [currentPrompt],
                source: 'BFL.ai',
                timestamp: Date.now()
              }
            });
            window.dispatchEvent(runwayEvent);
            
            toast.success('✅ Prompt BFL enviado para Runway AI');
            
            // 🎯 Listen for force collection requests (only once)
            const handleForceRequest = () => {
              console.log('🔄 [BFL] Recebeu solicitação de força - reenviando prompt...');
              const forceEvent = new CustomEvent('promptsReadyForRunway', {
                detail: {
                  prompts: [currentPrompt],
                  source: 'BFL.ai',
                  timestamp: Date.now()
                }
              });
              window.dispatchEvent(forceEvent);
              console.log('🔄 [BFL] Reenvio forçado - primeiro prompt enviado para Runway');
            };

            window.addEventListener('requestPromptsForRunway', handleForceRequest);
            
            // Cleanup listener after 30 seconds
            setTimeout(() => {
              window.removeEventListener('requestPromptsForRunway', handleForceRequest);
            }, 30000);
          }
          } else {
            console.error(`❌ Falha na geração da imagem ${i + 1}:`, data);
            toast.error(`Falha na imagem ${i + 1}`, { id: `img-gen-${i}` });
            failureCount++;
          }

          // Delay entre gerações para não sobrecarregar
          if (i < prompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

        } catch (imageError) {
          console.error(`❌ Erro na geração da imagem ${i + 1}:`, imageError);
          toast.error(`Erro na imagem ${i + 1}: ${imageError.message}`, { id: `img-gen-${i}` });
          failureCount++;
        }
      }

      // Verificar se o processo foi bem-sucedido
      const allSuccessful = successCount === prompts.length;
      
      // Adicionar todas as imagens geradas à galeria
      if (newGeneratedImages.length > 0) {
        setGeneratedImages(prev => [...prev, ...newGeneratedImages]);
        
        // Disparar evento para a galeria de IA
        window.dispatchEvent(new CustomEvent('imageGenerated', {
          detail: {
            source: 'bfl',
            images: newGeneratedImages,
            productId: productId,
            timestamp: Date.now()
          }
        }));
      }

      // Relatório final do processo
      console.log(`📊 Relatório final: ${successCount} sucessos, ${failureCount} falhas de ${prompts.length} total`);
      
      if (allSuccessful) {
        toast.success(`🎉 Todas as ${prompts.length} imagens foram geradas com sucesso!`, {
          description: `Processo concluído sem erros. ${newGeneratedImages.length} novas imagens adicionadas à galeria`
        });
        return true;
      } else if (newGeneratedImages.length > 0) {
        toast.error(`⚠️ Processo parcialmente concluído: ${successCount}/${prompts.length} imagens geradas`, {
          description: `${failureCount} imagens falharam na geração. Verifique os logs e tente novamente.`,
          duration: 10000
        });
        return false;
      } else {
        toast.error('❌ Nenhuma imagem foi gerada com sucesso', {
          description: 'Todas as tentativas falharam. Verifique a conexão e tente novamente.',
          duration: 10000
        });
        return false;
      }

    } catch (error) {
      console.error('❌ Erro crítico na geração sequencial:', error);
      toast.error(`Erro crítico na geração sequencial: ${error.message}`, {
        duration: 10000
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para lidar com imagens geradas pelo gerador múltiplo
  const handleMultiImagesGenerated = (images: string[]) => {
    console.log('🎨 Imagens geradas pelo gerador múltiplo:', images);
    setGeneratedImages(prev => [...prev, ...images]);
    toast.success(`${images.length} novas imagens adicionadas à galeria!`);
  };

  // Função para alternar seleção de imagens para fundo branco
  const toggleImageSelection = (index: number) => {
    setSelectedImagesForWhiteBg(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else if (prev.length < 2) {
        return [...prev, index];
      } else {
        toast.warning('Máximo de 2 imagens podem ser selecionadas');
        return prev;
      }
    });
  };

  // Função pour gerar imagens com fundo branco
  const handleGenerateWhiteBgImages = async () => {
    if (selectedImagesForWhiteBg.length === 0) {
      toast.error('Selecione pelo menos 1 imagem');
      return;
    }

    setIsGeneratingWhiteBg(true);
    const whitePrompt = "Remove the background completely and replace it with a pure solid white background (#FFFFFF). Make the background completely uniform white with no gradients, shadows, or textures. Keep the product exactly as it appears but place it on a perfect white background. Professional product photography on white background, no shadows on background, clean commercial style, high contrast, vibrant product colors against pure white.";
    
    try {
      console.log('🎨 Gerando imagens com fundo branco para:', selectedImagesForWhiteBg);
      const newWhiteBgImages: string[] = [];

      for (const index of selectedImagesForWhiteBg) {
        const selectedImage = generatedImages[index];
        if (!selectedImage) continue;

        console.log(`🎨 Processando imagem ${index + 1} para fundo branco:`, selectedImage);
        
        // Converter imagem para base64
        const imageData = await convertUrlToBase64(selectedImage);
        
        const requestBody = {
          prompt: whitePrompt,
          input_image: imageData,
          width: 1024,
          height: 1024,
          steps: 32,
          guidance: 3.5,
          model: 'flux-kontext-pro',
          operation: 'image-to-image',
          strength: 0.1
        };

        console.log('📡 Enviando requisição BFL para fundo branco...');
        const { data, error } = await supabase.functions.invoke('bfl-test', {
          body: requestBody
        });

        if (error) {
          console.error('❌ Erro na geração fundo branco:', error);
          toast.error(`Erro na imagem ${index + 1}: ${error.message}`);
          continue;
        }

        if (data?.success && data?.result_url) {
          // Use base64 if available (avoids CORS issues), otherwise use URL
          const imageToUse = data.result_base64 || data.result_url;
          newWhiteBgImages.push(imageToUse);
          console.log(`✅ Fundo branco gerado para imagem ${index + 1}:`, imageToUse);
        } else {
          console.error(`❌ Falha na geração fundo branco imagem ${index + 1}:`, data);
          toast.error(`Falha na imagem ${index + 1}`);
        }

        // Delay entre gerações
        if (index !== selectedImagesForWhiteBg[selectedImagesForWhiteBg.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (newWhiteBgImages.length > 0) {
        setWhiteBgImages(prev => [...prev, ...newWhiteBgImages]);
        
        // ✅ Salvar cada imagem no banco com tags corretas ANTES de disparar evento
        for (const imageUrl of newWhiteBgImages) {
          try {
            await saveHostedImage({
              url: imageUrl,
              filename: `bfl-white-bg-${Date.now()}.jpg`,
              original_filename: `bfl-white-bg-generated-${Date.now()}.jpg`,
              r2_path: '', // Vazio = não hospedado ainda
              file_type: 'image/jpeg',
              file_size: 0,
              width: 1024,
              height: 1024,
              productId: productId,
              aiSource: 'bfl',
              processing: ['white-background'],
              quality: 'original',
              description: `White background image generated by BFL.ai`,
              tags: ['ai-source:bfl-white-bg', 'original-source:bfl-white-bg', 'not-hosted', `product:${productId}`]
            });
            console.log('✅ [BFL WHITE BG] Imagem salva no banco:', imageUrl);
          } catch (saveError) {
            console.error('❌ [BFL WHITE BG] Erro ao salvar:', saveError);
          }
        }
        
        // Disparar evento para a galeria de IA
        window.dispatchEvent(new CustomEvent('imageGenerated', {
          detail: {
            source: 'bfl-white-bg',
            images: newWhiteBgImages,
            productId: productId,
            timestamp: Date.now()
          }
        }));
        
        toast.success(`✅ ${newWhiteBgImages.length} imagem(ns) com fundo branco gerada(s)!`);
        setSelectedImagesForWhiteBg([]);
      } else {
        toast.error('Nenhuma imagem foi gerada com sucesso');
      }

    } catch (error) {
      console.error('❌ Erro ao gerar fundo branco:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsGeneratingWhiteBg(false);
    }
  };

  // Verificar se tem imagens melhoradas ou originais
  if (enhancedImages.length === 0 && images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gerador BFL.ai
          </CardTitle>
          <CardDescription>
            Execute primeiro "Melhoria com DeepAI" para ter imagens públicas de qualidade, ou adicione imagens ao produto.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gerador de Prompts com Gemini AI */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Brain className="h-5 w-5" />
            Gerador de Prompts BFL.ai - Gemini IA
          </CardTitle>
          <CardDescription className="text-purple-600">
            Gere prompts especializados que serão automaticamente copiados para geração sequencial de 4 imagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BflProductPromptGenerator
            onPromptGenerated={handlePromptsGenerated}
            uploadedImage={uploadedImage || undefined}
            enhancedImages={enhancedImages}
            originalImages={images}
            selectedImageIndex={selectedImageIndex}
            productName={productName}
          />
        </CardContent>
      </Card>

      {/* Geração Múltipla com Prompts Diferentes */}
      {showMultiGenerator && generatedPrompts.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Sparkles className="h-5 w-5" />
              Geração Múltipla com Prompts Diferentes
            </CardTitle>
            <CardDescription className="text-green-600">
              Gere múltiplas imagens usando os prompts criados pelo Gemini AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BflProductMultiGenerator
              baseImage={uploadedImage || undefined}
              externalPrompts={generatedPrompts}
              onImagesGenerated={handleMultiImagesGenerated}
            />
          </CardContent>
        </Card>
      )}

      {/* Gerador BFL.ai Original */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Gerador BFL.ai Manual
          </CardTitle>
          <CardDescription>
            Transforme imagens do produto usando IA FLUX com prompt personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção do Modelo */}
          <div className="space-y-2">
            <Label>Modelo FLUX</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fluxModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Imagem Base */}
          <div className="space-y-2">
            <Label>Imagem Base</Label>
            
            {/* Upload de nova imagem */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 mb-4">
              {imagePreview ? (
                <div className="space-y-3">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-32 mx-auto rounded-lg object-contain"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={clearUploadedImage}>
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                    <Label htmlFor="bfl-image-upload" className="cursor-pointer">
                      <Button variant="secondary" size="sm" asChild>
                        <span>Trocar</span>
                      </Button>
                    </Label>
                  </div>
                </div>
              ) : (
                <Label htmlFor="bfl-image-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="h-6 w-6" />
                    <div className="text-center">
                      <p className="font-medium">Upload nova imagem</p>
                      <p className="text-xs">PNG, JPG até 10MB</p>
                    </div>
                  </div>
                </Label>
              )}
              <input
                id="bfl-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* USAR IMAGENS MELHORADAS DO DEEPAI (PÚBLICAS) */}
            {!uploadedImage && enhancedImages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-green-700">Imagens Melhoradas DeepAI (Públicas):</p>
                  <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    Imagem {selectedImageIndex + 1} selecionada
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {enhancedImages.map((enhancedImage, index) => (
                    <div 
                      key={index}
                      className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative ${
                        selectedImageIndex === index 
                          ? 'border-green-500 ring-2 ring-green-500/20 shadow-lg' 
                          : 'border-muted hover:border-green-300'
                      }`}
                      onClick={() => {
                        setSelectedImageIndex(index);
                        console.log(`📸 Imagem DeepAI ${index + 1} selecionada:`, enhancedImage.enhanced);
                      }}
                    >
                      <img 
                        src={enhancedImage.enhanced} 
                        alt={`${productName} melhorada ${index + 1}`} 
                        className="w-full h-20 object-cover"
                      />
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                        <p className="text-xs text-white text-center">{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2 bg-green-50 p-2 rounded">
                  ✅ Usando imagens melhoradas PÚBLICAS do DeepAI para melhor qualidade
                </p>
              </div>
            )}

            {/* Fallback para imagens originais apenas se não há imagens melhoradas */}
            {!uploadedImage && enhancedImages.length === 0 && images.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Imagens originais (fallback):</p>
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Imagem {selectedImageIndex + 1} selecionada
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div 
                      key={index}
                      className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative ${
                        selectedImageIndex === index 
                          ? 'border-primary ring-2 ring-primary/20 shadow-lg' 
                          : 'border-muted hover:border-muted-foreground'
                      }`}
                      onClick={() => {
                        setSelectedImageIndex(index);
                        console.log(`📸 Imagem original ${index + 1} selecionada:`, image);
                      }}
                    >
                      <img 
                        src={image} 
                        alt={`${productName} ${index + 1}`} 
                        className="w-full h-20 object-cover"
                      />
                      {selectedImageIndex === index && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                        <p className="text-xs text-white text-center">{index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-yellow-600 mt-2 bg-yellow-50 p-2 rounded">
                  ⚠️ Execute primeiro "Melhoria com DeepAI" para usar imagens públicas de melhor qualidade
                </p>
              </div>
            )}
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label>Prompt de Transformação</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva como transformar a imagem..."
              rows={3}
            />
          </div>

          {/* Botão de Gerar */}
          <Button 
            onClick={generateImageWithFlux} 
            disabled={isProcessing || !prompt.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar com BFL.ai
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Imagens Geradas */}
      {generatedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Imagens Geradas ({generatedImages.length})
            </CardTitle>
            <CardDescription>
              Clique nas imagens para selecioná-las para gerar fundo branco
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grid de Imagens Geradas - Clicáveis para Seleção */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedImages.map((image, index) => (
                <div 
                  key={index}
                  className={`relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                    selectedImagesForWhiteBg.includes(index) 
                      ? 'border-green-500 ring-2 ring-green-500/20 shadow-lg' 
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                  onClick={() => toggleImageSelection(index)}
                >
                  <img 
                    src={image} 
                    alt={`Gerada ${index + 1}`} 
                    className="w-full h-32 object-cover"
                  />
                  {selectedImagesForWhiteBg.includes(index) && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                      <div className="bg-green-500 text-white rounded-full p-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                    <p className="text-xs text-white text-center">Imagem {index + 1}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão de Geração de Fundo Branco */}
            {selectedImagesForWhiteBg.length > 0 && (
              <div className="border-t pt-4">
                <Button
                  onClick={handleGenerateWhiteBgImages}
                  disabled={isGeneratingWhiteBg}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  size="lg"
                >
                  {isGeneratingWhiteBg ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Gerando Fundo Branco...
                    </>
                  ) : (
                    <>
                      <Palette className="h-4 w-4 mr-2" />
                      🎨 Gerar Fundo Branco nas {selectedImagesForWhiteBg.length} Imagens Selecionadas
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Selecionadas: {selectedImagesForWhiteBg.length}/2 imagens
                </p>
              </div>
            )}

            {/* Galeria AI Padrão */}
            <AIGeneratedImagesGrid
              images={generatedImages}
              aiName="BFL.ai"
              productName={productName}
              productId={productId}
            />
          </CardContent>
        </Card>
      )}

      {/* Imagens com Fundo Branco */}
      {whiteBgImages.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Palette className="h-5 w-5" />
              Imagens com Fundo Branco ({whiteBgImages.length})
            </CardTitle>
            <CardDescription className="text-green-600">
              Imagens otimizadas com fundo branco puro para e-commerce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIGeneratedImagesGrid
              images={whiteBgImages}
              aiName="BFL.ai - Fundo Branco"
              productName={productName}
              productId={productId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};