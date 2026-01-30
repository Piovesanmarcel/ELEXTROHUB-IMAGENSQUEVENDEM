import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ImageIcon, Download, Loader2, Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { safeBlobDownload } from "@/utils/safeDownload";
import { EnhancedImage } from "@/hooks/enhancement/types";
import { useImageEnhancementPersistence } from "@/hooks/enhancement/useImageEnhancementPersistence";
import { useImageResizer } from "@/hooks/useImageResizer";
import { useHostedImages } from "@/hooks/useHostedImages";
import { supabase } from "@/integrations/supabase/client";

interface CloudinaryProductTransformProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
  autoGenerate?: boolean;
  onComplete?: () => void;
}

const KIT_CTAS = [
  "KIT com 2 unidades",
  "KIT com 6 unidades",
  "KIT com 10 unidades"
];

const BENEFIT_TEXT = "Leve mais e Pague menos!";

interface TransformedImage {
  ctaText: string;
  url: string;
}

// 🏷️ Helper: Extrair quantidade do texto do CTA
const extractKitQuantity = (ctaText: string): number | null => {
  const match = ctaText.match(/(\d+)\s*unidades/i);
  return match ? parseInt(match[1], 10) : null;
};

// 🔄 Helper: Converter Blob URL ou qualquer URL de imagem → Base64
const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    console.log('🔄 [BASE64] Convertendo imagem para Base64:', imageUrl.substring(0, 100));
    
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        console.log('✅ [BASE64] Conversão concluída, tamanho:', Math.round(base64.length / 1024), 'KB');
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ [BASE64] Erro ao converter imagem:', error);
    throw error;
  }
};

export const CloudinaryProductTransform = ({
  productId, 
  productName, 
  productSku, 
  images,
  autoGenerate = false,
  onComplete
}: CloudinaryProductTransformProps) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [transformedImages, setTransformedImages] = useState<TransformedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { loadEnhancedImages } = useImageEnhancementPersistence();
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [imageSource, setImageSource] = useState<'gallery-white-bg' | 'deepai' | 'gemini-white-background' | 'original'>('original');
  
  // Estado para upload manual
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { resizeImageTo1000x1000, isResizing } = useImageResizer();
  const { saveHostedImage } = useHostedImages();
  
  // Estado para bloco colapsável
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Ref para controle de automação
  const automationTriggeredRef = React.useRef(false);

  // 🧹 RESET: Limpar estados quando o produto mudar (evita contaminação entre produtos)
  useEffect(() => {
    console.log('🧹 [KIT GENERATOR] Produto alterado, limpando estados...', productId);
    setAvailableImages([]);
    setSelectedImageUrl('');
    setTransformedImages([]);
    setUploadedImages([]);
    setImageSource('original');
    setProgress(0);
    automationTriggeredRef.current = false;
  }, [productId]);

  // 🚀 AUTOMAÇÃO: Listener para iniciar geração de KITs automaticamente
  useEffect(() => {
    const handleAutomationTrigger = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('🤖 [KIT AUTOMAÇÃO] Recebido evento automationTriggerKits');
      console.log('📥 [KIT AUTOMAÇÃO] Detail:', customEvent.detail);
      
      // Evitar execução duplicada
      if (automationTriggeredRef.current || loading) {
        console.log('⚠️ [KIT AUTOMAÇÃO] Já em execução, ignorando...');
        return;
      }
      
      // ✅ CORREÇÃO: Receber imagens diretamente do evento
      const geminiImages = customEvent.detail?.geminiImages || [];
      console.log('📸 [KIT AUTOMAÇÃO] Imagens do Gemini recebidas:', geminiImages.length);
      
      let imagesToUse: string[] = [];
      
      if (geminiImages.length > 0) {
        // Usar imagens do Gemini diretamente
        console.log('🔄 [KIT AUTOMAÇÃO] Processando imagens do Gemini...');
        
        // Converter para Base64 se necessário
        const processedImages = await Promise.all(
          geminiImages.map(async (img: string) => {
            if (img.startsWith('data:image/')) {
              console.log('✅ [KIT AUTOMAÇÃO] Imagem já é Base64');
              return img;
            }
            try {
              console.log('🔄 [KIT AUTOMAÇÃO] Convertendo imagem para Base64...');
              return await convertImageToBase64(img);
            } catch (error) {
              console.error('❌ [KIT AUTOMAÇÃO] Erro ao converter:', error);
              return null;
            }
          })
        );
        
        imagesToUse = processedImages.filter((img): img is string => img !== null);
        console.log('✅ [KIT AUTOMAÇÃO] Imagens processadas:', imagesToUse.length);
        
        // Atualizar estados com as imagens do Gemini
        if (imagesToUse.length > 0) {
          setAvailableImages(imagesToUse);
          setSelectedImageUrl(imagesToUse[0]);
          setImageSource('gemini-white-background');
        }
      } else if (availableImages.length > 0) {
        // Fallback: usar imagens já disponíveis
        imagesToUse = availableImages;
        console.log('📦 [KIT AUTOMAÇÃO] Usando imagens já disponíveis:', imagesToUse.length);
      }
      
      // Verificar se temos imagens para processar
      if (imagesToUse.length === 0) {
        console.error('❌ [KIT AUTOMAÇÃO] Nenhuma imagem disponível para gerar KITs');
        toast.error('❌ Nenhuma imagem disponível para gerar KITs');
        return;
      }
      
      automationTriggeredRef.current = true;
      console.log('🚀 [KIT AUTOMAÇÃO] Iniciando geração automática de KITs com', imagesToUse.length, 'imagens');
      setIsExpanded(true);
      
      // Aguardar um pouco para garantir que estados foram atualizados
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Chamar a função de geração com a primeira imagem
      await handleTransformAllAutoWithImage(imagesToUse[0]);
    };

    window.addEventListener('automationTriggerKits', handleAutomationTrigger);
    return () => {
      window.removeEventListener('automationTriggerKits', handleAutomationTrigger);
    };
  }, [loading, availableImages]);

  // Função de geração automática de KITs (fallback)
  const handleTransformAllAuto = async () => {
    const imageToUse = selectedImageUrl || availableImages[0];
    if (imageToUse) {
      await handleTransformAllAutoWithImage(imageToUse);
    } else {
      console.error('❌ [KIT AUTOMAÇÃO] Nenhuma imagem disponível');
      automationTriggeredRef.current = false;
    }
  };

  // ✅ NOVA FUNÇÃO: Geração automática de KITs com imagem específica
  const handleTransformAllAutoWithImage = async (imageToUse: string) => {
    if (!imageToUse) {
      console.error('❌ [KIT AUTOMAÇÃO] Nenhuma imagem fornecida');
      automationTriggeredRef.current = false;
      return;
    }

    setLoading(true);
    setProgress(0);
    setTransformedImages([]);
    
    try {
      console.log('📤 [KIT AUTO] Usando imagem:', imageToUse.substring(0, 80) + '...');
      const base64Image = imageToUse;
      
      const results: TransformedImage[] = [];
      
      for (let i = 0; i < KIT_CTAS.length; i++) {
        const ctaText = KIT_CTAS[i];
        
        try {
          toast.info(`🔄 Gerando KIT ${i+1}/7: ${ctaText}...`);
          
          const { data: responseData, error: invokeError } = await supabase.functions.invoke('cloudinary-transform', {
            body: {
              imageUrl: base64Image,
              ctaText,
              benefitText: BENEFIT_TEXT,
            }
          });

          if (invokeError) {
            console.error(`❌ [KIT ${i+1}] Erro:`, invokeError);
            continue;
          }

          const response = { ok: true };
          const data = responseData;

          
          if (data.transformedUrl) {
            results.push({
              ctaText,
              url: data.transformedUrl
            });
            
            setTransformedImages([...results]);
            setProgress(Math.round(((i + 1) / KIT_CTAS.length) * 100));
            
            toast.success(`✅ KIT ${i+1}/7: ${ctaText}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao transformar imagem ${ctaText}:`, error);
        }
      }
      
      console.log(`🎉 [KIT AUTOMAÇÃO] Total de KITs gerados: ${results.length}`);
      
      if (results.length > 0) {
        toast.success(`🎉 ${results.length} KITs gerados com sucesso!`);
        
        // Emitir evento de conclusão com as URLs dos KITs
        console.log('📤 [KIT AUTOMAÇÃO] Disparando kitsAutomationComplete...');
        window.dispatchEvent(new CustomEvent('kitsAutomationComplete', {
          detail: { kits: results }
        }));
      } else {
        toast.error('❌ Nenhum KIT foi gerado');
      }
    } catch (error) {
      console.error("Erro geral ao transformar imagens:", error);
      toast.error("Erro ao transformar as imagens");
    } finally {
      setLoading(false);
      setProgress(0);
      automationTriggeredRef.current = false;
    }
  };

  // Aguardar apenas imagens com fundo branco da Galeria IA ou Gemini
  useEffect(() => {
    console.log('⏳ [KIT GENERATOR] Aguardando imagens com fundo branco da Galeria IA ou Gemini...');
    console.log('🎯 [KIT GENERATOR] Status:', {
      imageSource,
      availableImagesCount: availableImages.length,
      selectedImage: selectedImageUrl,
      isWhiteBackground: imageSource === 'gallery-white-bg' || imageSource === 'gemini-white-background'
    });
  }, [productId, imageSource, availableImages.length, selectedImageUrl]);

  // 🚀 ESCUTAR EVENTOS APENAS PARA IMAGENS COM FUNDO BRANCO
  useEffect(() => {
    // 🤍 PRIORIDADE MÁXIMA: Imagens de fundo branco da Galeria IA
    const handleWhiteBackgroundGalleryImages = async (event: CustomEvent) => {
      const { source, images: newImages, productId: eventProductId } = event.detail;
      
      if (eventProductId === productId && source === 'gallery-white-background') {
        console.log('🤍 [KIT GENERATOR PRIORIDADE] Recebendo imagens de fundo branco da Galeria IA:', newImages);
        
        // 🔄 CONVERTER TODAS AS BLOB URLs → BASE64 antes de armazenar
        toast.info('🔄 Preparando imagens para o gerador de KITs...');
        
        try {
          const base64Images = await Promise.all(
            newImages.map(async (blobUrl: string) => {
              try {
                return await convertImageToBase64(blobUrl);
              } catch (error) {
                console.error('❌ Erro ao converter imagem:', error);
                return null;
              }
            })
          );
          
          // Filtrar imagens que falharam na conversão
          const validBase64Images = base64Images.filter(img => img !== null) as string[];
          
          if (validBase64Images.length === 0) {
            toast.error('❌ Erro ao preparar imagens');
            return;
          }
          
          // SUBSTITUIR completamente as imagens disponíveis (agora em Base64)
          setAvailableImages(validBase64Images);
          setImageSource('gallery-white-bg');
          
          // Selecionar primeira imagem automaticamente
          if (validBase64Images.length > 0) {
            setSelectedImageUrl(validBase64Images[0]);
          }
          
          toast.success(`🤍 ${validBase64Images.length} imagens preparadas e prontas para KITs!`);
          
        } catch (error) {
          console.error('❌ Erro ao processar imagens da galeria:', error);
          toast.error('❌ Erro ao processar imagens da galeria');
        }
      }
    };

    const handleGeminiWhiteBackgroundImages = async (event: CustomEvent) => {
      const { source, images: newImages, productId: eventProductId } = event.detail;
      
      if (eventProductId === productId && source === 'gemini-white-background') {
        console.log('📥 [KIT GENERATOR] Recebendo imagens do Gemini Fundo Branco:', newImages);
        
        // Só usar Gemini se não há imagens de fundo branco da galeria
        if (imageSource !== 'gallery-white-bg') {
          toast.info('🔄 Preparando imagens Gemini...');
          
          try {
            const base64Images = await Promise.all(
              newImages.map(async (blobUrl: string) => {
                try {
                  return await convertImageToBase64(blobUrl);
                } catch (error) {
                  console.error('❌ Erro ao converter imagem Gemini:', error);
                  return null;
                }
              })
            );
            
            const validBase64Images = base64Images.filter(img => img !== null) as string[];
            
            if (validBase64Images.length > 0) {
              // ✅ CORREÇÃO: Substituir ao invés de acumular (evita contaminação)
              setAvailableImages(validBase64Images);
              setImageSource('gemini-white-background');
              toast.success(`🤍 ${validBase64Images.length} imagens Gemini preparadas!`);
              
              // Selecionar primeira imagem se não há nenhuma selecionada
              if (!selectedImageUrl && validBase64Images.length > 0) {
                setSelectedImageUrl(validBase64Images[0]);
              }
            }
          } catch (error) {
            console.error('❌ Erro ao processar imagens Gemini:', error);
          }
        } else {
          console.log('📥 [KIT GENERATOR] Gemini WhiteBG ignorado - priorizando Galeria IA');
        }
      }
    };

    window.addEventListener('whiteBackgroundGalleryToKit', handleWhiteBackgroundGalleryImages as EventListener);
    window.addEventListener('geminiWhiteBackgroundToKit', handleGeminiWhiteBackgroundImages as EventListener);
    
    return () => {
      window.removeEventListener('whiteBackgroundGalleryToKit', handleWhiteBackgroundGalleryImages as EventListener);
      window.removeEventListener('geminiWhiteBackgroundToKit', handleGeminiWhiteBackgroundImages as EventListener);
    };
  }, [productId, selectedImageUrl, imageSource]);

  // 📤 HANDLER: Upload manual de imagem
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    toast.info('📤 Processando imagem carregada...');

    try {
      const file = files[0];
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('❌ Por favor, selecione apenas arquivos de imagem');
        return;
      }

      // Validar tamanho (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('❌ Imagem muito grande (máx 10MB)');
        return;
      }

      // Converter para Base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Adicionar às imagens disponíveis
      setUploadedImages(prev => [...prev, base64Image]);
      setAvailableImages(prev => [...prev, base64Image]);
      setImageSource('original'); // Marcar como upload manual
      setSelectedImageUrl(base64Image); // Selecionar automaticamente

      toast.success('✅ Imagem carregada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao fazer upload da imagem:', error);
      toast.error('❌ Erro ao processar a imagem');
    } finally {
      setIsUploading(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      event.target.value = '';
    }
  };

  const handleTransformAll = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('🔒 [NO-RELOAD] Gerar KITs - preventDefault aplicado');
    
    if (!selectedImageUrl) {
      toast.error("Selecione uma imagem com fundo branco");
      return;
    }

    // Remover validação de fundo branco - aceitar qualquer imagem agora

    setLoading(true);
    setProgress(0);
    setTransformedImages([]);
    
    try {
      // ✅ IMAGEM JÁ ESTÁ EM BASE64 - Não precisa redimensionar!
      console.log('📤 [KIT] Usando imagem Base64 preparada anteriormente');
      const base64Image = selectedImageUrl; // Já é Base64!
      
      const results: TransformedImage[] = [];
      
      for (let i = 0; i < KIT_CTAS.length; i++) {
        const ctaText = KIT_CTAS[i];
        
        try {
          toast.info(`🔄 Gerando KIT ${i+1}/7: ${ctaText}...`);
          
          const { data, error } = await supabase.functions.invoke('cloudinary-transform', {
            body: {
              imageUrl: base64Image,
              ctaText,
              benefitText: BENEFIT_TEXT,
            }
          });

          if (error) {
            console.error(`❌ [KIT ${i+1}] Erro:`, error);
            throw new Error(`Erro: ${error.message}`);
          }
          
          if (data.transformedUrl) {
            results.push({
              ctaText,
              url: data.transformedUrl
            });
            
            setTransformedImages([...results]);
            setProgress(Math.round(((i + 1) / KIT_CTAS.length) * 100));
            
            toast.success(`✅ KIT ${i+1}/7: ${ctaText}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao transformar imagem ${ctaText}:`, error);
          toast.error(`Erro ao transformar: ${ctaText}`);
        }
      }
      
      if (results.length > 0) {
        toast.success(`🎉 ${results.length} KITs gerados com sucesso!`);
      }
    } catch (error) {
      console.error("Erro geral ao transformar imagens:", error);
      toast.error("Erro ao transformar as imagens");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // ✅ Enviar imagens dos KITs para a Galeria de IA
  useEffect(() => {
    if (!transformedImages || transformedImages.length === 0) return;

    const saveKitImages = async () => {
      const batchId = `cloudinary-kit-${productId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const imageUrls = transformedImages.map(img => img.url);
      
      console.log('🛍️ [KIT→GALERIA] Despachando imagens dos KITs para a galeria:', {
        total: imageUrls.length,
        batchId,
        ctas: transformedImages.map(img => img.ctaText)
      });

      // ✅ Salvar cada KIT no banco com tags corretas ANTES de disparar evento
      for (let i = 0; i < transformedImages.length; i++) {
        const kitImage = transformedImages[i];
        try {
          // 🏷️ Extrair quantidade e criar tag específica
          const kitQuantity = extractKitQuantity(kitImage.ctaText);
          const kitQuantityTag = kitQuantity ? `kit:${kitQuantity}` : 'kit:generic';
          
          await saveHostedImage({
            url: kitImage.url,
            filename: `cloudinary-kit-${i + 1}-${Date.now()}.jpg`,
            original_filename: `cloudinary-kit-${kitImage.ctaText.replace(/\s+/g, '-')}-${Date.now()}.jpg`,
            r2_path: '', // Vazio = não hospedado ainda
            file_type: 'image/jpeg',
            file_size: 0,
            width: 1300,
            height: 1300,
            productId: productId,
            aiSource: 'cloudinary',
            processing: ['kit-composition'],
            quality: 'original',
            description: `${kitImage.ctaText} - ${BENEFIT_TEXT} | KIT com ${kitQuantity || 'múltiplas'} unidades`,
            tags: [
              'ai-source:cloudinary-kit', 
              'original-source:cloudinary-kit', 
              'not-hosted', 
              `product:${productId}`, 
              'type:kit-image',
              kitQuantityTag,
              'source:cloudinary-kit-hosted'
            ]
          });
          
          console.log(`✅ [CLOUDINARY KIT] KIT ${i + 1}/${transformedImages.length} salvo:`, {
            cta: kitImage.ctaText,
            quantity: kitQuantity,
            tag: kitQuantityTag,
            url: kitImage.url.substring(0, 50) + '...',
            productId
          });
        } catch (saveError) {
          console.error(`❌ [CLOUDINARY KIT] Erro ao salvar KIT ${i + 1}:`, saveError);
        }
      }

      // 🔄 Converter Base64 → Blob URL ANTES de enviar para galeria
      console.log(`🔄 [CLOUDINARY] Convertendo ${imageUrls.length} imagens para Blob...`);
      const blobUrls = await Promise.all(
        imageUrls.map(img => resizeImageTo1000x1000(img))
      );
      console.log('✅ [CLOUDINARY] Conversão Blob concluída para todas as imagens');

      window.dispatchEvent(
        new CustomEvent('imageGenerated', {
          detail: {
            source: 'cloudinary-kit',
            images: blobUrls, // ✅ Usar Blob URLs
            productId,
            timestamp: Date.now(),
            batchComplete: true,
            batchId,
            metadata: {
              ctas: transformedImages.map(img => img.ctaText),
              benefitText: BENEFIT_TEXT,
              selectedImageUrl
            }
          },
        })
      );
    };

    saveKitImages();
  }, [transformedImages, productId, selectedImageUrl, saveHostedImage]);

  const handleDownload = async (imageUrl: string, ctaText: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const filename = `${productSku}-${ctaText.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      await safeBlobDownload(blob, filename);
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error("Erro ao fazer download da imagem");
    }
  };

  const handleDownloadAll = async () => {
    if (transformedImages.length === 0) return;
    
    toast.info("Iniciando download de todas as imagens...");
    
    for (const image of transformedImages) {
      await handleDownload(image.url, image.ctaText);
      // Pequena pausa entre downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleReset = () => {
    setTransformedImages([]);
    setProgress(0);
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="mt-12">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-xl">Gerador Automático de KITs</CardTitle>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CardDescription>
            Gere automaticamente 7 imagens com textos de CTA para diferentes quantidades de KIT
          </CardDescription>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            <div className="text-center bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-700 font-semibold">
                Texto do Benefício: "{BENEFIT_TEXT}"
              </p>
              <p className="text-sm text-purple-600 mt-1">
                CTAs: {KIT_CTAS.join(', ')}
              </p>
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Seleção da Imagem Base
            </CardTitle>
            <CardDescription>
              {imageSource === 'gallery-white-bg' 
                ? "🤍 ✅ Imagens de fundo branco da Galeria IA - prontas para gerar KITs"
                : imageSource === 'gemini-white-background'
                ? "🤍 ✅ Imagens com fundo branco do Gemini - prontas para gerar KITs"
                : uploadedImages.length > 0
                ? "📤 ✅ Imagem carregada manualmente - pronta para gerar KITs"
                : "⏳ Aguardando imagens... Use Galeria IA, Gemini ou faça upload de uma imagem"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {availableImages.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-amber-800 font-semibold">
                  ⚠️ Nenhuma imagem disponível
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  Use: <strong>Galeria IA (Fundo Branco)</strong>, <strong>Gemini AI (Fundo Branco)</strong> ou <strong>faça upload</strong>
                </p>
              </div>
            )}

            {/* 📤 SEÇÃO DE UPLOAD MANUAL */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500 font-medium">ou</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors">
                <label 
                  htmlFor="image-upload" 
                  className="cursor-pointer block text-center"
                >
                  <div className="space-y-2">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {isUploading ? 'Processando...' : '📤 Fazer Upload de Imagem'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG ou WEBP (máx 10MB)
                      </p>
                    </div>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageUpload}
                    disabled={isUploading || loading}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadedImages.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-green-800 font-semibold">
                    ✅ {uploadedImages.length} imagem{uploadedImages.length > 1 ? 's' : ''} carregada{uploadedImages.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
            
            {/* Seletor de Imagem */}
            <div className="space-y-2">
              <Label>
                Selecionar Imagem 
                {imageSource === 'gallery-white-bg' && <span className="text-white bg-purple-600 px-2 py-1 rounded text-xs ml-2">🤍 Galeria IA - Fundo Branco</span>}
                {imageSource === 'gemini-white-background' && <span className="text-white bg-blue-600 px-2 py-1 rounded text-xs ml-2">🤍 Gemini - Fundo Branco</span>}
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {availableImages.map((imageUrl, index) => {
                  const isUploaded = uploadedImages.includes(imageUrl);
                  
                  return (
                    <div
                      key={index}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageUrl === imageUrl 
                          ? 'border-purple-500 ring-2 ring-purple-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedImageUrl(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Opção ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                      
                      {/* Badge de origem */}
                      {imageSource === 'gallery-white-bg' && !isUploaded && (
                        <div className="absolute top-1 right-1 bg-purple-600 text-white rounded px-1 text-xs font-bold">
                          🤍 IA
                        </div>
                      )}
                      {imageSource === 'gemini-white-background' && !isUploaded && (
                        <div className="absolute top-1 right-1 bg-blue-600 text-white rounded px-1 text-xs font-bold">
                          🤍 Gemini
                        </div>
                      )}
                      {isUploaded && (
                        <div className="absolute top-1 right-1 bg-green-600 text-white rounded px-1 text-xs font-bold">
                          📤 Upload
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Gerando imagens...</span>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTransformAll(e);
                }}
                disabled={loading || !selectedImageUrl}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isResizing ? "Redimensionando..." : `Gerando KITs... ${progress}%`}
                  </>
                ) : (
                  "🎯 Gerar 7 Imagens de KIT"
                )}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleReset} 
                disabled={loading}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados das Transformações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Imagens Geradas ({transformedImages.length}/7)
              {transformedImages.length > 0 && (
                <Button 
                  type="button"
                  onClick={handleDownloadAll} 
                  variant="outline" 
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Todas
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {transformedImages.length > 0 
                ? "Imagens geradas com sucesso - clique para fazer download individual"
                : "As 7 imagens de KIT aparecerão aqui após a geração"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transformedImages.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                {transformedImages.map((image, index) => (
                  <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={image.url}
                        alt={image.ctaText}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{image.ctaText}</p>
                        <p className="text-xs text-gray-500">{BENEFIT_TEXT}</p>
                      </div>
                      <Button 
                        onClick={() => handleDownload(image.url, image.ctaText)}
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    As 7 imagens de KIT aparecerão aqui após a geração
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Selecione uma imagem e clique em "Gerar 7 Imagens de KIT"
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

            {/* Informações de uso */}
            <Card>
              <CardHeader>
                <CardTitle>Como funciona esta transformação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold mb-2 text-purple-700">1. Fundo Branco</div>
                    <p>A imagem selecionada receberá automaticamente um fundo branco profissional</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold mb-2 text-purple-700">2. CTA Destacado</div>
                    <p>O texto do CTA será posicionado de forma estratégica para máxima conversão</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="font-semibold mb-2 text-purple-700">3. Benefício Visível</div>
                    <p>O texto do benefício será adicionado para reforçar a proposta de valor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};