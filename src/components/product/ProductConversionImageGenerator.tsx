import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Image, Type, Eye, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSafeDownload } from "@/hooks/useSafeDownload";
import { useImageEnhancementPersistence } from "@/hooks/enhancement/useImageEnhancementPersistence";
import { EnhancedImage } from "@/hooks/enhancement/types";

interface ProductConversionImageGeneratorProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
}

export const ProductConversionImageGenerator = ({ 
  productId, 
  productName, 
  productSku, 
  images
}: ProductConversionImageGeneratorProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [conversionContent, setConversionContent] = useState<{
    description: string;
    specifications: string;
    benefits: string;
  }>({
    description: '',
    specifications: '',
    benefits: ''
  });
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { downloadBlob } = useSafeDownload();
  const { loadEnhancedImages } = useImageEnhancementPersistence();

  useEffect(() => {
    loadConversionFromUnifiedResults();
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

  const loadConversionFromUnifiedResults = async () => {
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
        console.error('Erro ao carregar tópicos de conversão:', error);
        setIsLoading(false);
        return;
      }

      if (data?.results && typeof data.results === 'object' && 'topicos_conversao' in data.results) {
        const topicosConversao = (data.results as any).topicos_conversao;
        console.log('🎯 Tópicos de conversão encontrados:', topicosConversao);
        
        if (topicosConversao?.improvedText) {
          const extractedContent = extractConversionTopics(topicosConversao.improvedText);
          setConversionContent(extractedContent);
          console.log('✅ Conteúdo extraído com sucesso:', extractedContent);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro inesperado ao carregar tópicos de conversão:', error);
      setIsLoading(false);
    }
  };

  const extractConversionTopics = (topicosContent: string): {
    description: string;
    specifications: string;
    benefits: string;
  } => {
    console.log('🔍 INICIANDO extração dos Tópicos de Conversão...');
    console.log('📄 Conteúdo completo:', topicosContent);
    
    const lines = topicosContent.split('\n');
    let currentSection = '';
    let description = '';
    let specifications = '';
    let benefits = '';
    let foundDescription = false;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      
      // Detectar início da descrição SEO (primeira linha após o título)
      if (trimmedLine.includes('**🔍 DESCRIÇÃO SEO OTIMIZADA**')) {
        console.log('✅ ENCONTROU seção de DESCRIÇÃO SEO na linha:', i+1);
        currentSection = 'description';
        continue;
      }
      
      // Detectar seções específicas
      if (trimmedLine.includes('📋 ESPECIFICAÇÕES TÉCNICAS') || 
          trimmedLine.includes('**📋 ESPECIFICAÇÕES TÉCNICAS**')) {
        console.log('✅ ENCONTROU seção de ESPECIFICAÇÕES na linha:', i+1);
        currentSection = 'specifications';
        continue;
      }
      
      if (trimmedLine.includes('✨ PRINCIPAIS BENEFÍCIOS') || 
          trimmedLine.includes('**✨ PRINCIPAIS BENEFÍCIOS**')) {
        console.log('✅ ENCONTROU seção de BENEFÍCIOS na linha:', i+1);
        currentSection = 'benefits';
        continue;
      }
      
      // Parar se encontrar outra seção com emoji/formatação especial (🛒, 💡, etc.)
      if (trimmedLine.match(/^\*\*[🛒💡🎯].*\*\*$/) || 
          trimmedLine.match(/^[🛒💡🎯]/)) {
        console.log('🚫 PARANDO extração na seção:', trimmedLine);
        break;
      }
      
      // Extrair conteúdo baseado na seção atual
      if (trimmedLine && trimmedLine.length > 3) {
        let cleanText = trimmedLine
          .replace(/^\*+\s*/, '')
          .replace(/\s*\*+$/, '')
          .replace(/^•\s*/, '')
          .replace(/^-+\s*/, '')
          .replace(/^#{1,6}\s*/, '')
          .trim();
        
        if (cleanText && cleanText.length > 0) {
          if (currentSection === 'description') {
            console.log('➕ ADICIONANDO linha de DESCRIÇÃO:', cleanText);
            description += cleanText + ' ';
          } else if (currentSection === 'specifications') {
            console.log('➕ ADICIONANDO linha de ESPECIFICAÇÕES:', cleanText);
            specifications += cleanText + '\n';
          } else if (currentSection === 'benefits') {
            console.log('➕ ADICIONANDO linha de BENEFÍCIOS:', cleanText);
            benefits += cleanText + '\n';
          }
        }
      }
    }
    
    console.log('🎯 RESULTADO final dos Tópicos de Conversão:');
    console.log('📝 Descrição:', description.trim());
    console.log('📋 Especificações:', specifications.trim());
    console.log('✨ Benefícios:', benefits.trim());
    
    return {
      description: description.trim(),
      specifications: specifications.trim(),
      benefits: benefits.trim()
    };
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

      canvas.width = 800;
      canvas.height = 800;
      console.log('✅ Tamanho do canvas definido: 800x800');

      console.log('📷 Carregando imagem:', enhancedImages[selectedImageIndex].enhanced);
      const img = await loadImage(enhancedImages[selectedImageIndex].enhanced);
      console.log('✅ Imagem carregada com sucesso', img.width, 'x', img.height);
      
      console.log('🎨 Desenhando imagem de fundo...');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      console.log('✅ Imagem de fundo desenhada');

      console.log('🎨 Criando gradiente...');
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      console.log('✅ Gradiente aplicado');

      console.log('🎨 Desenhando caixa de conversão...');
      const boxX = 30;
      const boxY = canvas.height - 350;
      const boxWidth = canvas.width - 60;
      const boxHeight = 320;

      // Fundo da caixa
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      // Borda da caixa (verde para conversão)
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'; // green com transparência
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      console.log('✅ Caixa de conversão desenhada');

      // Desenhar conteúdo
      console.log('🎨 Desenhando conteúdo de conversão...');
      let currentY = boxY + 20;
      const lineHeight = 18;
      const maxWidth = boxWidth - 40;

      // Título principal
      ctx.font = 'bold 16px Inter, Arial, sans-serif';
      ctx.fillStyle = '#22c55e'; // verde
      ctx.fillText('🎯 DESCRIÇÃO', boxX + 20, currentY);
      currentY += 30;

      // Descrição SEO (sem título)
      if (conversionContent.description) {
        ctx.font = '14px Inter, Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        
        const descWords = conversionContent.description.split(' ');
        const descLines = [];
        let currentLine = '';

        for (let n = 0; n < descWords.length; n++) {
          const testLine = currentLine + descWords[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            descLines.push(currentLine.trim());
            currentLine = descWords[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine.trim()) {
          descLines.push(currentLine.trim());
        }

        descLines.slice(0, 3).forEach((line, index) => {
          ctx.fillText(line, boxX + 20, currentY + (index * lineHeight));
        });
        
        currentY += (Math.min(descLines.length, 3) * lineHeight) + 15;
      }

      // Especificações Técnicas
      if (conversionContent.specifications) {
        ctx.font = 'bold 13px Inter, Arial, sans-serif';
        ctx.fillStyle = '#60a5fa'; // azul
        ctx.fillText('📋 ESPECIFICAÇÕES TÉCNICAS', boxX + 20, currentY);
        currentY += 18;

        ctx.font = '11px Inter, Arial, sans-serif';
        ctx.fillStyle = '#e5e7eb';
        
        const specLines = conversionContent.specifications.split('\n').filter(line => line.trim());
        // Mostrar todas as especificações disponíveis (máximo 8 linhas para caber na imagem)
        const maxSpecLines = Math.min(specLines.length, 8);
        specLines.slice(0, maxSpecLines).forEach((line, index) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '• ').trim();
          
          // Se a linha for muito longa, quebrar em palavras
          const words = cleanLine.split(' ');
          let currentLine = '';
          let yOffset = 0;
          
          for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth - 25 && currentLine !== '') {
              ctx.fillText(currentLine.trim(), boxX + 25, currentY + (index * 13) + yOffset);
              currentLine = words[i] + ' ';
              yOffset += 13;
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine.trim()) {
            ctx.fillText(currentLine.trim(), boxX + 25, currentY + (index * 13) + yOffset);
          }
        });
        
        currentY += (maxSpecLines * 13) + 10;
      }

      // Principais Benefícios
      if (conversionContent.benefits) {
        ctx.font = 'bold 13px Inter, Arial, sans-serif';
        ctx.fillStyle = '#fbbf24'; // amarelo/dourado
        ctx.fillText('✨ PRINCIPAIS BENEFÍCIOS', boxX + 20, currentY);
        currentY += 18;

        ctx.font = '12px Inter, Arial, sans-serif';
        ctx.fillStyle = '#e5e7eb';
        
        const benefitLines = conversionContent.benefits.split('\n').filter(line => line.trim());
        benefitLines.slice(0, 3).forEach((line, index) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, '• ');
          ctx.fillText(cleanLine, boxX + 25, currentY + (index * 15));
        });
      }
      
      console.log('✅ Conteúdo de conversão desenhado');

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

    if (!conversionContent.description && !conversionContent.specifications && !conversionContent.benefits) {
      toast.error('Nenhum tópico de conversão encontrado no comando unificado');
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
      const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_conversao`;
      await downloadBlob(blob, fileName);
      toast.success('Imagem baixada com sucesso!');
    } catch (error) {
      toast.error(`Erro ao baixar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const hasContent = conversionContent.description || conversionContent.specifications || conversionContent.benefits;

  if (isLoading) {
    return (
      <Card className="glass-effect border-2 border-green-200">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando tópicos de conversão...</p>
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
            <Target className="h-5 w-5" />
            Gerador de Imagem com Tópicos de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              Nenhuma imagem melhorada encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Execute primeiro a "Melhoria com DeepAI" para usar esta ferramenta de conversão
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return (
      <Card className="glass-effect border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Target className="h-5 w-5" />
            Gerador de Imagem com Tópicos de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              Nenhum tópico de conversão encontrado no comando unificado
            </p>
            <p className="text-sm text-muted-foreground">
              Gere um comando unificado (5 em 1) primeiro para extrair os tópicos de conversão
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
            <Target className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700">Gerador de Imagem com Tópicos de Conversão</CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 text-xs">
              Comando Unificado 5 em 1
            </Badge>
          </div>
        </div>
        
        {/* Descrição inicial genérica */}
        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-2">
            🎯 O que é a "Descrição"?
          </h4>
          <p className="text-sm text-green-700 leading-relaxed">
            A <strong>Descrição</strong> são elementos estratégicos extraídos do seu <em>Comando Unificado (5 em 1)</em> 
            que focam especificamente em <em>converter visitantes em clientes</em>. Incluem descrição otimizada, especificações técnicas 
            e principais benefícios organizados para maximizar vendas.
          </p>
        </div>

        {/* Descrição de conversão */}
        <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            💰 Como Isso Aumenta as Conversões?
          </h4>
          <div className="space-y-2 text-sm text-blue-700">
            <p><span className="font-medium">• Organização Visual:</span> Informações estruturadas de forma escaneável</p>
            <p><span className="font-medium">• Foco em Benefícios:</span> Destaca o que realmente importa para o cliente</p>
            <p><span className="font-medium">• Credibilidade Técnica:</span> Especificações que geram confiança</p>
            <p><span className="font-medium">• Decisão Rápida:</span> Formato otimizado para conversão instantânea</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preview dos Tópicos Organizados */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-800">Tópicos de Conversão Extraídos:</h4>
          </div>
          
          {conversionContent.description && (
            <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border-l-4 border-gray-500">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-xs">📝</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">DESCRIÇÃO SEO OTIMIZADA:</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {conversionContent.description}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {conversionContent.specifications && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xs">📋</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-600 mb-1">ESPECIFICAÇÕES TÉCNICAS:</p>
                  <pre className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">
                    {conversionContent.specifications}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          {conversionContent.benefits && (
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-xs">✨</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-yellow-600 mb-1">PRINCIPAIS BENEFÍCIOS:</p>
                  <pre className="text-sm text-yellow-700 leading-relaxed whitespace-pre-wrap">
                    {conversionContent.benefits}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seleção de Imagem Melhorada */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-800">Selecione uma Imagem Melhorada:</h4>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {enhancedImages.map((img, index) => (
              <div
                key={index}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                  selectedImageIndex === index
                    ? 'border-green-500 ring-2 ring-green-200 shadow-lg'
                    : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={img.enhanced}
                  alt={`Imagem melhorada ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">✓</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações Organizadas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-800">Ações Disponíveis:</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={generateImage}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700 text-white font-medium"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Gerando Imagem...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Gerar Imagem de Conversão
                </>
              )}
            </Button>

            {generatedImage && (
              <>
                <Button 
                  onClick={togglePreview} 
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  size="lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Ocultar Prévia' : 'Visualizar Resultado'}
                </Button>
                
                <Button 
                  onClick={downloadImage} 
                  variant="outline"
                  className="border-green-300 text-green-600 hover:bg-green-50"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Imagem
                </Button>
              </>
            )}
          </div>
          
          {!generatedImage && (
            <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
              <strong>⏳ Próximo passo:</strong> Clique em "Gerar Imagem de Conversão" para criar uma imagem otimizada 
              que combina sua imagem melhorada com os tópicos estratégicos de conversão.
            </p>
          )}
        </div>

        {/* Preview da Imagem Gerada Melhorado */}
        {showPreview && generatedImage && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h4 className="text-sm font-semibold text-gray-800">Resultado Final:</h4>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
              <div className="text-center mb-3">
                <p className="text-sm font-medium text-green-800 mb-1">✅ Imagem de Conversão Gerada</p>
                <p className="text-xs text-green-600">Pronta para usar em e-commerce, landing pages e campanhas de marketing</p>
              </div>
              
              <div className="border-2 border-green-300 rounded-lg overflow-hidden bg-white shadow-lg">
                <img
                  src={generatedImage}
                  alt="Imagem de conversão com tópicos estratégicos"
                  className="w-full max-w-md mx-auto block"
                />
              </div>
              
              <div className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded">
                <strong>💡 Dica de Uso:</strong> Esta imagem combina visual atraente com informações estratégicas. 
                Ideal para páginas de produto, catálogos digitais e materiais comerciais que precisam converter.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};