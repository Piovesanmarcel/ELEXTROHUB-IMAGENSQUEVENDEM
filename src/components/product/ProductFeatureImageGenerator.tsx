import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Image, Type, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSafeDownload } from "@/hooks/useSafeDownload";
import { useImageEnhancementPersistence } from "@/hooks/enhancement/useImageEnhancementPersistence";
import { EnhancedImage } from "@/hooks/enhancement/types";
import { CANVAS_SIZE, CANVAS_OFFSETS } from "@/constants/imageCanvas";

interface ProductFeatureImageGeneratorProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[]; // Não usado mais, mantido para compatibilidade
}


export const ProductFeatureImageGenerator = ({ 
  productId, 
  productName, 
  productSku, 
  images // Não usado mais, vamos usar imagens enhanced
}: ProductFeatureImageGeneratorProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [features, setFeatures] = useState<string[]>([]);
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { downloadBlob } = useSafeDownload();
  const { loadEnhancedImages } = useImageEnhancementPersistence();

  // Carregar copywriting salva e extrair características
  useEffect(() => {
    loadFeaturesFromCopywriting();
  }, [productId]);

  // Carregar imagens melhoradas do DeepAI
  useEffect(() => {
    console.log('🎯 useEffect EXECUTADO - productId:', productId, 'type:', typeof productId);
    
    if (!productId) {
      console.log('❌ ProductId inválido, setando loading = false');
      setIsLoading(false);
      setEnhancedImages([]);
      return;
    }

    let isMounted = true;

    const loadImages = async () => {
      try {
        console.log('🎯 INICIANDO loadImages para:', productId);
        setIsLoading(true);
        
        console.log('🎯 Chamando loadEnhancedImages...');
        const images = await loadEnhancedImages(productId);
        console.log('🎯 loadEnhancedImages RETORNOU:', images?.length || 0, 'imagens');
        
        if (!isMounted) {
          console.log('🎯 Componente desmontado, ignorando resultado');
          return;
        }
        
        if (images && Array.isArray(images) && images.length > 0) {
          console.log('✅ DEFININDO', images.length, 'imagens no estado');
          setEnhancedImages(images);
        } else {
          console.log('⚠️ NENHUMA imagem encontrada, definindo array vazio');
          setEnhancedImages([]);
        }
      } catch (error) {
        console.error('💥 ERRO CRÍTICO em loadImages:', error);
        if (isMounted) {
          setEnhancedImages([]);
          toast.error(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
        }
      } finally {
        if (isMounted) {
          console.log('🎯 FINALIZANDO loading');
          setIsLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const loadFeaturesFromCopywriting = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('ai_unified_results')
        .select('results')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar resultados:', error);
        setIsLoading(false);
        return;
      }

      // ✅ PRIORIDADE 1: Tentar extrair de topicos_conversao (Comando Unificado 5 em 1)
      if (data?.results && typeof data.results === 'object') {
        const results = data.results as any;
        
        // Verificar se existe topicos_conversao com ESPECIFICAÇÕES TÉCNICAS
        if (results.topicos_conversao?.improvedText) {
          console.log('✅ [FEATURES] Usando dados de topicos_conversao (Comando Unificado)');
          const extractedFeatures = extractFeaturesFromTopicosConversao(results.topicos_conversao.improvedText);
          if (extractedFeatures.length > 0) {
            setFeatures(extractedFeatures);
            setIsLoading(false);
            return;
          }
        }
        
        // ✅ PRIORIDADE 2: Fallback para copywriting seção 3
        if (results.copywriting) {
          console.log('⚠️ [FEATURES] Fallback: Usando dados de copywriting (seção 3)');
          const extractedFeatures = extractFeaturesFromCopywriting(results.copywriting);
          setFeatures(extractedFeatures);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro inesperado ao carregar dados:', error);
      setIsLoading(false);
    }
  };

  // ✅ NOVO: Extrair de Tópicos de Conversão > ESPECIFICAÇÕES TÉCNICAS (com ou sem emoji)
  const extractFeaturesFromTopicosConversao = (topicosText: string): string[] => {
    console.log('🔍 [FEATURES] Extraindo de ESPECIFICAÇÕES TÉCNICAS...');
    
    const features: string[] = [];
    const lines = topicosText.split('\n');
    let inSpecsSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      const lowerLine = trimmedLine.toLowerCase();
      
      // ✅ FLEXÍVEL: Detectar início da seção com OU sem emoji
      const isSpecsSection = (
        lowerLine.includes('especificações técnicas') ||
        lowerLine.includes('especificacoes tecnicas') ||
        lowerLine.includes('technical specifications') ||
        (trimmedLine.includes('📋') && lowerLine.includes('especificações')) ||
        lowerLine.match(/^#+\s*especificações/i) ||
        lowerLine.match(/^\*\*especificações/i) ||
        lowerLine.match(/especificações\s*técnicas\s*[:\-–—]/i) ||
        lowerLine.match(/^(\d+\.?\s*)?(📋\s*)?especificações/i)
      );
      
      if (isSpecsSection && !inSpecsSection) {
        console.log('✅ [FEATURES] Encontrou seção ESPECIFICAÇÕES TÉCNICAS:', trimmedLine);
        inSpecsSection = true;
        continue;
      }
      
      // Detectar fim da seção (próximo emoji de seção, próxima seção numerada, ou linha com muitos caracteres especiais)
      if (inSpecsSection) {
        const isNewSection = (
          ((trimmedLine.includes('📍') || trimmedLine.includes('🎯') || 
           trimmedLine.includes('💡') || trimmedLine.includes('⭐') ||
           trimmedLine.includes('🔥') || trimmedLine.includes('✨') ||
           trimmedLine.includes('🏠') || trimmedLine.includes('🔍')) &&
          !trimmedLine.includes('📋')) ||
          lowerLine.match(/^#+\s*\d+\./) || // Markdown header com número
          lowerLine.match(/^\*\*\d+\./) // Bold com número
        );
        
        if (isNewSection) {
          console.log('🔚 [FEATURES] Fim da seção ESPECIFICAÇÕES TÉCNICAS');
          break;
        }
      }
      
      // Extrair itens no formato "- Campo: Valor" ou "Campo: Valor"
      if (inSpecsSection && trimmedLine.length > 3) {
        let cleanLine = trimmedLine
          .replace(/^[-•]\s*/, '') // Remove bullet points
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .replace(/^\*/, '')
          .replace(/\*$/, '')
          .trim();
        
        // Verificar se é um item de especificação (contém ":")
        if (cleanLine.includes(':') && cleanLine.length > 5) {
          // Limpar markdown residual
          cleanLine = cleanLine.replace(/\*\*/g, '').trim();
          features.push(cleanLine);
          console.log('➕ [FEATURES] Adicionado:', cleanLine);
        }
      }
    }
    
    console.log('🎯 [FEATURES] Total extraído de ESPECIFICAÇÕES TÉCNICAS:', features.length);
    return features;
  };

  const extractFeaturesFromCopywriting = (copywriting: string): string[] => {
    console.log('🔍 INICIANDO extração de características da seção 3...');
    
    const lines = copywriting.split('\n');
    const features: string[] = [];
    let inCharacteristicsSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      console.log('📝 Analisando linha:', trimmedLine);
      
      // Detectar início da seção 3 - "Destaque das Principais Características"
      if (trimmedLine.includes('3.') && 
          (trimmedLine.toLowerCase().includes('característica') || 
           trimmedLine.toLowerCase().includes('características'))) {
        console.log('✅ ENCONTROU seção 3 (Características) na linha:', trimmedLine);
        inCharacteristicsSection = true;
        continue;
      }
      
      // Detectar fim da seção 3 (próxima seção numerada)
      if (inCharacteristicsSection && trimmedLine.match(/^\d+\./) && !trimmedLine.includes('3.')) {
        console.log('🔚 FIM da seção 3');
        break;
      }
      
      // Extrair características (formato: **Nome da Característica:** descrição)
      if (inCharacteristicsSection && trimmedLine && 
          (trimmedLine.includes('**') && trimmedLine.includes(':**'))) {
        
        console.log('➕ ADICIONANDO característica:', trimmedLine);
        
        // Remover formatação ** e manter apenas o texto
        let cleanFeature = trimmedLine
          .replace(/\*\*/g, '')  // Remove **
          .replace(/[#*]/g, '')  // Remove # e *
          .trim();
        
        if (cleanFeature && cleanFeature.length > 0) {
          features.push(cleanFeature);
        }
      }
      
      // Também extrair itens numerados dentro da seção
      if (inCharacteristicsSection && trimmedLine.match(/^\d+\.\s/) && !trimmedLine.includes('**')) {
        let feature = trimmedLine.replace(/^\d+\.\s/, '');
        feature = feature.replace(/\*\*(.*?)\*\*/g, '$1');
        feature = feature.replace(/\s*:\s*:/g, ':');
        if (feature.trim()) {
          features.push(feature.trim());
        }
      }
      
      // Extrair características (itens de lista)
      if (inCharacteristicsSection && trimmedLine.match(/^[-*]\s/)) {
        let feature = trimmedLine.replace(/^[-*]\s/, '');
        // Remover markdown (negrito)
        feature = feature.replace(/\*\*(.*?)\*\*/g, '$1');
        // Limpar dois pontos extras
        feature = feature.replace(/\s*:\s*:/g, ':');
        if (feature.trim()) {
          features.push(feature.trim());
        }
      }
    }
    
    console.log('🎯 Características extraídas:', features);
    return features;
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      console.log('📷 Carregando imagem R2 via blob para evitar taint:', src);
      
      // Estratégia principal: sempre usar fetch + blob para evitar taint do canvas
      const loadViaBlob = async (url: string) => {
        try {
          console.log('🔄 Fazendo fetch da imagem R2...');
          
          // Tentar diferentes modos de fetch
          let response;
          try {
            response = await fetch(url, {
              mode: 'cors',
              cache: 'no-cache',
              credentials: 'omit'
            });
          } catch (corsError) {
            console.log('⚠️ CORS falhou, tentando no-cors...');
            response = await fetch(url, {
              mode: 'no-cors',
              cache: 'no-cache'
            });
          }
          
          if (!response.ok && response.type !== 'opaque') {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          console.log('📦 Blob obtido:', { size: blob.size, type: blob.type });
          
          const objectUrl = URL.createObjectURL(blob);
          
          const img = document.createElement('img');
          img.onload = () => {
            console.log('✅ Imagem R2 carregada via blob (sem taint):', img.width, 'x', img.height);
            URL.revokeObjectURL(objectUrl); // Limpar memória
            resolve(img);
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            console.error('❌ Falha ao carregar via blob');
            reject(new Error(`Falha ao carregar imagem via blob: ${src}`));
          };
          
          // Não usar crossOrigin ao carregar de blob
          img.src = objectUrl;
          
        } catch (fetchError) {
          console.error('❌ Fetch falhou:', fetchError);
          
          // Fallback: tentar carregamento direto (pode causar taint)
          console.log('🔄 Tentando carregamento direto como último recurso...');
          const img = document.createElement('img');
          
          img.onload = () => {
            console.log('⚠️ Carregamento direto bem-sucedido (pode ter taint)');
            resolve(img);
          };
          
          img.onerror = () => {
            console.error('❌ Todos os métodos falharam');
            reject(new Error(`Falha completa ao carregar imagem: ${src}`));
          };
          
          // Para carregamento direto, só usar crossOrigin se não for R2
          if (!src.includes('.r2.dev')) {
            img.crossOrigin = 'anonymous';
          }
          
          img.src = src;
        }
      };
      
      // Sempre usar blob para qualquer URL externa
      loadViaBlob(src);
    });
  };

  const generateImageWithCanvas = async (): Promise<string> => {
    console.log('🎨 Iniciando generateImageWithCanvas...');
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível obter o contexto do canvas');
      }

      console.log('✅ Canvas e contexto criados');

      // Definir tamanho do canvas - PADRONIZADO 1000x1000
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      console.log(`✅ Tamanho do canvas definido: ${CANVAS_SIZE}x${CANVAS_SIZE}`);

      // Carregar imagem
      console.log('📷 Carregando imagem:', enhancedImages[selectedImageIndex].enhanced);
      const img = await loadImage(enhancedImages[selectedImageIndex].enhanced);
      console.log('✅ Imagem carregada com sucesso', img.width, 'x', img.height);
      
      // Desenhar a imagem de fundo
      console.log('🎨 Desenhando imagem de fundo...');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      console.log('✅ Imagem de fundo desenhada');

      // Desenhar overlay gradient
      console.log('🎨 Criando gradiente...');
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log('✅ Gradiente aplicado');

      // Desenhar caixa de fundo para características - AJUSTADO para 1000x1000
      console.log('🎨 Desenhando caixa de características...');
      const boxX = CANVAS_OFFSETS.boxMargin;
      const boxY = canvas.height - CANVAS_OFFSETS.boxBottomOffset;
      const boxWidth = canvas.width - (CANVAS_OFFSETS.boxMargin * 2);
      const boxHeight = CANVAS_OFFSETS.boxHeight;

      // Fundo da caixa semi-transparente com borda arredondada
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      // Borda da caixa
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'; // emerald com transparência
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      console.log('✅ Caixa de características desenhada');

      // Configurar fonte para características - AJUSTADO para 1000x1000
      ctx.font = `${CANVAS_OFFSETS.bodyFontSize}px Inter, Arial, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';

      // Desenhar título "Características"
      console.log('🎨 Desenhando título "Características"...');
      ctx.font = `bold ${CANVAS_OFFSETS.titleFontSize}px Inter, Arial, sans-serif`;
      ctx.fillStyle = '#10b981';
      ctx.fillText('📋 Especificações:', boxX + CANVAS_OFFSETS.textPadding, boxY + 40);
      console.log('✅ Título "Características" desenhado');

      // Desenhar características - AJUSTADO para 1000x1000
      console.log('🎨 Desenhando características...');
      ctx.font = `${CANVAS_OFFSETS.bodyFontSize}px Inter, Arial, sans-serif`;
      ctx.fillStyle = '#ffffff';
      const lineHeight = 48; // Aumentado proporcionalmente
      const startY = boxY + 80;

      console.log('📝 Total de características:', features.length);

      let currentYPos = startY;
      
      features.slice(0, 4).forEach((feature, index) => {
        console.log(`📝 Desenhando característica ${index + 1}:`, feature);
        
        // Desenhar bullet point
        ctx.beginPath();
        ctx.arc(boxX + 25, currentYPos - 5, 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        
        // Desenhar texto da característica com quebra inteligente
        ctx.fillStyle = '#ffffff';
        
        const maxWidth = boxWidth - 80;
        const words = feature.split(' ');
        const lines = [];
        let currentLine = '';
        
        // Quebrar texto em linhas
        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = words[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        
        // Desenhar cada linha da característica
        lines.forEach((line, lineIndex) => {
          ctx.fillText(line, boxX + 45, currentYPos + (lineIndex * 18));
        });
        
        // Aumentar posição Y para próxima característica
        currentYPos += Math.max(lineHeight, lines.length * 18 + 15);
      });
      
      console.log('✅ Características desenhadas');

      console.log('🎨 Convertendo canvas para base64...');
      const dataURL = canvas.toDataURL('image/png');
      console.log('✅ Canvas convertido para base64, tamanho:', dataURL.length);
      
      return dataURL;
    } catch (error) {
      console.error('❌ Erro detalhado em generateImageWithCanvas:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Erro na geração da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const generateImage = async () => {
    console.log('🔍 INICIANDO GERAÇÃO - Estado atual:', {
      selectedImageIndex,
      enhancedImagesLength: enhancedImages.length,
      featuresLength: features.length,
      selectedImage: enhancedImages[selectedImageIndex]?.enhanced,
      firstFeature: features[0]
    });

    // Validações detalhadas
    if (!enhancedImages || enhancedImages.length === 0) {
      console.error('❌ Nenhuma imagem melhorada disponível');
      toast.error('Nenhuma imagem melhorada disponível. Execute primeiro a "Melhoria com DeepAI"');
      return;
    }

    if (!enhancedImages[selectedImageIndex]) {
      console.error('❌ Imagem selecionada inválida:', selectedImageIndex, 'de', enhancedImages.length);
      toast.error('Imagem selecionada é inválida');
      return;
    }

    if (!features || features.length === 0) {
      console.error('❌ Nenhuma característica disponível');
      toast.error('Nenhuma característica encontrada no copywriting');
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('✅ Validações OK - Iniciando geração...');
      const base64Image = await generateImageWithCanvas();
      
      if (!base64Image || base64Image.length < 100) {
        throw new Error('Imagem gerada está vazia ou corrompida');
      }
      
      console.log('✅ Imagem gerada com sucesso - tamanho:', base64Image.length);
      setGeneratedImage(base64Image);
      toast.success('Imagem gerada com sucesso! Agora você pode visualizar ou baixar.');
    } catch (error) {
      console.error('❌ Erro completo na geração:', {
        error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
      toast.error(`Erro ao gerar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePreview = () => {
    if (!generatedImage) {
      toast.error('Gere a imagem primeiro antes de visualizar');
      return;
    }
    setShowPreview(!showPreview);
  };

  const downloadImage = async () => {
    if (!generatedImage) {
      toast.error('Gere a imagem primeiro antes de baixar');
      return;
    }

    try {
      console.log('Iniciando download da imagem...');
      // Converter base64 para blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_caracteristicas`;
      await downloadBlob(blob, fileName);
      toast.success('Imagem baixada com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      toast.error(`Erro ao baixar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect border-2 border-emerald-200">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando imagens melhoradas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (enhancedImages.length === 0) {
    return (
      <Card className="glass-effect border-2 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Type className="h-5 w-5" />
            Gerador de Imagem com Características
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Type className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              Nenhuma imagem melhorada encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Execute primeiro a "Melhoria com DeepAI" para usar esta ferramenta
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (features.length === 0) {
    return (
      <Card className="glass-effect border-2 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Type className="h-5 w-5" />
            Gerador de Imagem com Características
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Type className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              Nenhuma característica encontrada no copywriting gerado
            </p>
            <p className="text-sm text-muted-foreground">
              Gere um copywriting profissional primeiro para usar esta ferramenta
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-2 border-emerald-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-emerald-700">Gerador de Imagem com Características</CardTitle>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 text-xs">
              {features.length} característica{features.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-emerald-600 mt-2">
          📝 Combine uma imagem do produto com as características do copywriting gerado
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Debug info */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p><strong>Debug:</strong> Imagens Enhanced: {enhancedImages.length} | Features: {features.length} | Selected: {selectedImageIndex}</p>
          {features.length > 0 && <p><strong>Primeira característica:</strong> {features[0]}</p>}
        </div>

        {/* Seleção de imagem */}
        <div>
          <h4 className="text-sm font-medium text-emerald-700 mb-3 flex items-center gap-2">
            <Image className="h-4 w-4" />
            Selecione uma imagem melhorada do DeepAI:
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {enhancedImages.map((image, index) => (
              <div
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedImageIndex === index
                    ? 'border-emerald-500 ring-2 ring-emerald-200'
                    : 'border-emerald-200 hover:border-emerald-300'
                }`}
              >
                <img
                  src={image.enhanced}
                  alt={`Opção melhorada ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <div className="bg-emerald-500 text-white rounded-full p-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview das características */}
        <div>
          <h4 className="text-sm font-medium text-emerald-700 mb-3">
            Características que serão incluídas:
          </h4>
          <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
            {features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-emerald-800">{feature}</span>
              </div>
            ))}
            {features.length > 4 && (
              <p className="text-xs text-emerald-600 mt-2">
                + {features.length - 4} característica{features.length - 4 !== 1 ? 's' : ''} adiciona{features.length - 4 === 1 ? 'l' : 'is'}
              </p>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => {
              console.log('🔘 Botão Gerar clicado');
              generateImage();
            }}
            disabled={isGenerating || enhancedImages.length === 0 || features.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Type className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Imagem'}
          </Button>
          
          <Button
            onClick={togglePreview}
            disabled={!generatedImage}
            variant="outline"
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Ocultar' : 'Visualizar'}
          </Button>
          
          <Button
            onClick={downloadImage}
            disabled={!generatedImage}
            variant="outline"
            className="border-emerald-500 text-emerald-700 hover:bg-emerald-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar Imagem
          </Button>
        </div>

        {/* Status da imagem */}
        {generatedImage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              Imagem gerada e pronta para visualização/download
            </p>
          </div>
        )}

        {/* Preview da imagem gerada */}
        {showPreview && generatedImage && (
          <div className="border-t border-emerald-200 pt-6">
            <h4 className="text-sm font-medium text-emerald-700 mb-3">Preview do resultado:</h4>
            <div className="bg-emerald-50 rounded-lg p-4">
              <img
                src={generatedImage}
                alt="Preview da imagem com características"
                className="w-full max-w-md mx-auto rounded-lg shadow-lg border border-emerald-200"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};