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

interface ProductBenefitsImageGeneratorProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
}

export const ProductBenefitsImageGenerator = ({ 
  productId, 
  productName, 
  productSku, 
  images
}: ProductBenefitsImageGeneratorProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [benefitsText, setBenefitsText] = useState<string>('');
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { downloadBlob } = useSafeDownload();
  const { loadEnhancedImages } = useImageEnhancementPersistence();

  useEffect(() => {
    loadBenefitsFromCopywriting();
  }, [productId]);

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

  const loadBenefitsFromCopywriting = async () => {
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
        console.error('Erro ao carregar copywriting:', error);
        setIsLoading(false);
        return;
      }

      if (data?.results && typeof data.results === 'object' && 'copywriting' in data.results) {
        const copywriting = (data.results as any).copywriting;
        console.log('📄 Copywriting encontrado:', copywriting);
        const extractedBenefits = extractBenefitsFromCopywriting(copywriting);
        setBenefitsText(extractedBenefits);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro inesperado ao carregar copywriting:', error);
      setIsLoading(false);
    }
  };

  const extractBenefitsFromCopywriting = (copywriting: string): string => {
    console.log('🔍 INICIANDO extração de benefícios da seção 5...');
    
    const lines = copywriting.split('\n');
    let inSection5 = false;
    let benefitsText = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Detectar início da seção 5 - "Principais Benefícios para o Cliente"
      if (trimmedLine.includes('5.') && 
          (trimmedLine.toLowerCase().includes('benefício') || 
           trimmedLine.toLowerCase().includes('principais benefícios') ||
           trimmedLine.toLowerCase().includes('cliente'))) {
        console.log('✅ ENCONTROU seção 5 (Benefícios) na linha:', i+1);
        inSection5 = true;
        continue;
      }
      
      // Detectar fim da seção 5 - parar apenas em seções numeradas específicas ou FAQ
      if (inSection5 && (
          trimmedLine.match(/^6\./) ||
          trimmedLine.match(/^7\./) ||
          trimmedLine.match(/^8\./) ||
          trimmedLine.match(/^9\./) ||
          trimmedLine.match(/^10\./) ||
          (trimmedLine.toLowerCase().includes('perguntas') && trimmedLine.toLowerCase().includes('frequentes'))
      )) {
        console.log('🔚 FIM da seção 5 na linha:', i+1);
        break;
      }
      
      // Extrair linhas de benefícios (formato: **Nome do Benefício:** descrição)
      if (inSection5 && trimmedLine && 
          (trimmedLine.includes('**') && trimmedLine.includes(':**'))) {
        
        // Filtrar apenas linhas que claramente são FAQ
        const lowerLine = trimmedLine.toLowerCase();
        if (lowerLine.includes('pergunta:') || 
            lowerLine.includes('resposta:') ||
            lowerLine.match(/^p\d*:/) ||
            lowerLine.match(/^r\d*:/) ||
            lowerLine.match(/^q\d*:/) ||
            lowerLine.match(/^a\d*:/)) {
          console.log('⚠️ IGNORANDO linha de FAQ:', trimmedLine);
          continue;
        }
        
        console.log('➕ ADICIONANDO linha de benefício:', trimmedLine);
        
        // Manter a formatação original completa
        if (trimmedLine && trimmedLine.length > 0) {
          benefitsText += trimmedLine + '\n';
        }
      }
    }
    
    console.log('🎯 RESULTADO final dos benefícios:', benefitsText);
    return benefitsText.trim();
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

      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      console.log(`✅ Tamanho do canvas definido: ${CANVAS_SIZE}x${CANVAS_SIZE}`);

      console.log('📷 Carregando imagem:', enhancedImages[selectedImageIndex].enhanced);
      const img = await loadImage(enhancedImages[selectedImageIndex].enhanced);
      console.log('✅ Imagem carregada com sucesso', img.width, 'x', img.height);
      
      console.log('🎨 Desenhando imagem de fundo...');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      console.log('✅ Imagem de fundo desenhada');

      console.log('🎨 Criando gradiente...');
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.5, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log('✅ Gradiente aplicado');

      console.log('🎨 Desenhando caixa de benefícios...');
      const boxX = CANVAS_OFFSETS.boxMargin;
      const boxY = canvas.height - CANVAS_OFFSETS.boxBottomOffset;
      const boxWidth = canvas.width - (CANVAS_OFFSETS.boxMargin * 2);
      const boxHeight = CANVAS_OFFSETS.boxHeight;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      // Borda da caixa (verde)
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)'; // green com transparência
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      console.log('✅ Caixa de benefícios desenhada');

      // Desenhar texto dos benefícios
      console.log('🎨 Desenhando texto dos benefícios...');
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      let currentY = boxY + 25;
      const lineHeight = 22;
      const maxWidth = boxWidth - 60;

      // Título destacado
      ctx.fillText('🎯 Benefícios:', boxX + 20, currentY);
      currentY += 30;

      // Processar texto para organizar melhor e remover formatações
      let organizedText = benefitsText;
      
      // Remover todos os caracteres # e *
      organizedText = organizedText.replace(/[#*]/g, '');
      
      // Se o texto contém formatação, processar cada linha
      const lines = organizedText.split('\n').filter(line => line.trim());
      const processedLines = [];
      const emojis = ['✅', '⚡', '🔧', '🛡️', '💎', '🎯', '🚀', '⭐'];
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          // Quebrar em frases separadas por ponto final
          const sentences = line.split('.').filter(s => s.trim());
          sentences.forEach((sentence, sentenceIndex) => {
            if (sentence.trim()) {
              const cleanSentence = sentence.trim() + (sentence.includes('?') ? '' : '.');
              const emoji = emojis[processedLines.length % emojis.length];
              processedLines.push(emoji + ' ' + cleanSentence);
            }
          });
        }
      });

      // Se não conseguiu processar, criar formato padrão
      if (processedLines.length === 0) {
        const sentences = organizedText.split('.').filter(s => s.trim());
        sentences.forEach((sentence, index) => {
          if (sentence.trim()) {
            const emoji = emojis[index % emojis.length];
            processedLines.push(emoji + ' ' + sentence.trim() + '.');
          }
        });
      }

      // Quebrar texto em linhas que cabem no canvas
      ctx.font = '16px Inter, Arial, sans-serif';
      const textLines = [];
      
      processedLines.forEach(paragraph => {
        if (!paragraph.trim()) return;
        
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            textLines.push(currentLine.trim());
            currentLine = words[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine.trim()) {
          textLines.push(currentLine.trim());
        }
      });

      // Renderizar as linhas limitando a 9 linhas (para dar espaço ao título)
      textLines.slice(0, 9).forEach((line, index) => {
        ctx.fillText(line, boxX + 20, currentY + (index * lineHeight));
      });
      
      console.log('✅ Benefícios desenhados');

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
    if (!enhancedImages || enhancedImages.length === 0) {
      toast.error('Nenhuma imagem melhorada disponível. Execute primeiro a "Melhoria com DeepAI"');
      return;
    }

    if (!enhancedImages[selectedImageIndex]) {
      toast.error('Imagem selecionada é inválida');
      return;
    }

    if (!benefitsText || benefitsText.length === 0) {
      toast.error('Nenhum benefício encontrado no copywriting');
      return;
    }

    setIsGenerating(true);
    
    try {
      const base64Image = await generateImageWithCanvas();
      
      if (!base64Image || base64Image.length < 100) {
        throw new Error('Imagem gerada está vazia ou corrompida');
      }
      
      setGeneratedImage(base64Image);
      toast.success('Imagem gerada com sucesso! Agora você pode visualizar ou baixar.');
    } catch (error) {
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
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_beneficios`;
      await downloadBlob(blob, fileName);
      toast.success('Imagem baixada com sucesso!');
    } catch (error) {
      toast.error(`Erro ao baixar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect border-2 border-green-200">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando imagens melhoradas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (enhancedImages.length === 0) {
    return (
      <Card className="glass-effect border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Type className="h-5 w-5" />
            Gerador de Imagem com Benefícios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Type className="h-12 w-12 text-green-300 mx-auto mb-3" />
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

  if (!benefitsText) {
    return (
      <Card className="glass-effect border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Type className="h-5 w-5" />
            Gerador de Imagem com Benefícios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Type className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              Nenhum benefício encontrado no copywriting gerado
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
    <Card className="glass-effect border-2 border-green-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700">Gerador de Imagem com Benefícios</CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
              Benefícios
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview dos Benefícios */}
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-700 mb-2">Benefícios que serão aplicados:</p>
          <p className="text-sm text-green-600 line-clamp-3">
            {benefitsText}
          </p>
        </div>

        {/* Seleção de Imagem */}
        <div>
          <p className="text-sm font-medium mb-2">Selecione uma imagem melhorada:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {enhancedImages.map((img, index) => (
              <div
                key={index}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImageIndex === index
                    ? 'border-green-500 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={img.enhanced}
                  alt={`Enhanced ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={generateImage}
            disabled={isGenerating}
            className="flex-1"
            variant="default"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <Image className="h-4 w-4 mr-2" />
                Gerar Imagem
              </>
            )}
          </Button>

          {generatedImage && (
            <>
              <Button onClick={togglePreview} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Ocultar' : 'Visualizar'}
              </Button>
              <Button onClick={downloadImage} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </>
          )}
        </div>

        {/* Preview da Imagem Gerada */}
        {showPreview && generatedImage && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Prévia da Imagem Gerada:</p>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={generatedImage}
                alt="Imagem gerada com benefícios"
                className="w-full max-w-md mx-auto"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};