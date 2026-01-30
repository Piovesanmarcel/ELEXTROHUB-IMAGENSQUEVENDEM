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

interface ProductAuthorityImageGeneratorProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
}

export const ProductAuthorityImageGenerator = ({ 
  productId, 
  productName, 
  productSku, 
  images
}: ProductAuthorityImageGeneratorProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [authorityText, setAuthorityText] = useState<string>('');
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { downloadBlob } = useSafeDownload();
  const { loadEnhancedImages } = useImageEnhancementPersistence();

  useEffect(() => {
    loadAuthorityFromCopywriting();
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

  const loadAuthorityFromCopywriting = async () => {
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
        const extractedAuthority = extractAuthorityFromCopywriting(copywriting);
        setAuthorityText(extractedAuthority);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro inesperado ao carregar copywriting:', error);
      setIsLoading(false);
    }
  };

  const extractAuthorityFromCopywriting = (copywriting: string): string => {
    console.log('🔍 [AUTHORITY] Extraindo DOR X SOLUÇÃO do copywriting...');
    
    const lines = copywriting.split('\n');
    let inPainSolutionSection = false;
    let painSolutionText = '';
    let problems: string[] = [];
    let solutions: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      const lowerLine = trimmedLine.toLowerCase();
      
      // Detectar início da seção 4 (Dor x Solução)
      if (!inPainSolutionSection && trimmedLine.includes('4.') && 
          (lowerLine.includes('dor') || 
           lowerLine.includes('solução') ||
           lowerLine.includes('conversão') ||
           lowerLine.includes('problema'))) {
        console.log(`✅ [AUTHORITY] Encontrou seção 4 na linha ${i+1}`);
        inPainSolutionSection = true;
        continue;
      }
      
      // Detectar fim da seção
      if (inPainSolutionSection && trimmedLine.match(/^5\./)) break;
      if (inPainSolutionSection && trimmedLine.match(/^([6-9]|1[0-9])\./)) break;
      
      if (inPainSolutionSection && trimmedLine && trimmedLine.length > 5) {
        let cleanText = trimmedLine
          .replace(/^\*+\s*/, '')
          .replace(/\s*\*+$/, '')
          .replace(/^-+\s*/, '')
          .replace(/^#{1,6}\s*/, '')
          .trim();
        
        if (!cleanText) continue;
        
        // ✅ PRIORIDADE 1: Detectar padrão explícito PROBLEMA: e SOLUÇÃO: do copywriting gerado
        if (cleanText.match(/^PROBLEMA[S]?:/i)) {
          const problemText = cleanText.replace(/^PROBLEMA[S]?:\s*/i, '').trim();
          if (problemText) {
            problems.push(problemText);
            console.log(`➕ [AUTHORITY] PROBLEMA detectado: ${problemText.substring(0, 50)}`);
          }
          continue;
        }
        
        if (cleanText.match(/^SOLU[ÇC][ÃA]O[ES]?:/i)) {
          const solutionText = cleanText.replace(/^SOLU[ÇC][ÃA]O[ES]?:\s*/i, '').trim();
          if (solutionText) {
            solutions.push(solutionText);
            console.log(`➕ [AUTHORITY] SOLUÇÃO detectada: ${solutionText.substring(0, 50)}`);
          }
          continue;
        }
        
        // ✅ PRIORIDADE 2: Heurística baseada em conteúdo (mais genérica)
        const lower = cleanText.toLowerCase();
        if (lower.includes('problema') || lower.includes('dificuldade') || lower.includes('dor') ||
            lower.includes('falta') || lower.includes('sem ') || lower.includes('difícil')) {
          problems.push(cleanText);
        } else if (lower.includes('solução') || lower.includes('resolve') || lower.includes('elimina') ||
                   lower.includes('proporciona') || lower.includes('garante') || lower.includes('oferece')) {
          solutions.push(cleanText);
        } else {
          painSolutionText += cleanText + ' ';
        }
      }
    }
    
    // ✅ FALLBACK: Se não encontrou padrões explícitos, usar heurística de posição
    if (problems.length === 0 && solutions.length === 0 && painSolutionText.trim()) {
      console.log('⚠️ [AUTHORITY] Padrões PROBLEMA:/SOLUÇÃO: não encontrados, usando heurística de posição...');
      const sentences = painSolutionText.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      // Primeiras 3 frases = problemas, últimas 3 = soluções
      const mid = Math.ceil(sentences.length / 2);
      problems = sentences.slice(0, Math.min(3, mid)).map(s => s.trim());
      solutions = sentences.slice(mid, mid + 3).map(s => s.trim());
      console.log(`✅ [AUTHORITY] Heurística: ${problems.length} problemas + ${solutions.length} soluções`);
    }
    
    // Organizar o texto final
    let organizedText = '';
    if (problems.length > 0) organizedText += 'PROBLEMAS: ' + problems.join('. ') + '. ';
    if (solutions.length > 0) organizedText += 'SOLUÇÕES: ' + solutions.join('. ') + '.';
    if (!organizedText.trim() && painSolutionText.trim()) organizedText = painSolutionText.trim();
    
    console.log(`✅ [AUTHORITY] Resultado (${organizedText.length} chars): ${organizedText.substring(0, 100)}`);
    return organizedText.trim();
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

      console.log('🎨 Desenhando caixa de autoridade...');
      const boxX = CANVAS_OFFSETS.boxMargin;
      const boxY = canvas.height - CANVAS_OFFSETS.boxBottomOffset;
      const boxWidth = canvas.width - (CANVAS_OFFSETS.boxMargin * 2);
      const boxHeight = CANVAS_OFFSETS.boxHeightLarge;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      // Borda da caixa (roxo)
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)'; // purple com transparência
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      console.log('✅ Caixa de autoridade desenhada');

      // Desenhar texto da autoridade de forma organizada
      console.log('🎨 Desenhando texto da autoridade organizado...');
      let currentY = boxY + 25;
      const lineHeight = 18;
      const maxWidth = boxWidth - 60;

      // Título destacado mais genérico
      ctx.font = 'bold 16px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ff6b6b'; // vermelho para chamar atenção
      ctx.fillText('💡 VANTAGENS DO PRODUTO', boxX + 20, currentY);
      currentY += 30;

      // Processar o texto organizando em frases separadas
      if (authorityText.includes('PROBLEMAS:') && authorityText.includes('SOLUÇÕES:')) {
        // Texto já organizado - desenhar seções separadas
        const parts = authorityText.split('SOLUÇÕES:');
        const problemsPart = parts[0].replace('PROBLEMAS:', '').trim();
        const solutionsPart = parts[1] ? parts[1].trim() : '';

        // Desenhar seção de NECESSIDADES
        ctx.font = 'bold 14px Inter, Arial, sans-serif';
        ctx.fillStyle = '#fbbf24'; // amarelo para necessidades
        ctx.fillText('📋 NECESSIDADES:', boxX + 20, currentY);
        currentY += 22;

        ctx.font = '12px Inter, Arial, sans-serif';
        ctx.fillStyle = '#fef3c7';
        
        // Quebrar problemas em frases curtas
        const problemSentences = problemsPart.split('.').filter(s => s.trim().length > 10);
        
        problemSentences.slice(0, 3).forEach((sentence, index) => {
          let cleanSentence = sentence.trim()
            .replace(/^PROBLEMA:\s*/i, '')
            .replace(/^PROBLEMAS:\s*/i, '')
            .replace(/^\*+\s*PROBLEMA:\s*/i, '')
            .replace(/^\*+\s*PROBLEMAS:\s*/i, '');
          if (cleanSentence) {
            // Quebrar frases longas em múltiplas linhas se necessário
            const words = cleanSentence.split(' ');
            let currentLine = '• ';
            
            for (let word of words) {
              const testLine = currentLine + word + ' ';
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth && currentLine !== '• ') {
                ctx.fillText(currentLine.trim(), boxX + 25, currentY);
                currentY += lineHeight;
                currentLine = '  ' + word + ' ';
              } else {
                currentLine = testLine;
              }
            }
            
            if (currentLine.trim() !== '•') {
              ctx.fillText(currentLine.trim(), boxX + 25, currentY);
              currentY += lineHeight + 3;
            }
          }
        });
        
        currentY += 10;

        // Desenhar seção de BENEFÍCIOS
        if (solutionsPart) {
          ctx.font = 'bold 14px Inter, Arial, sans-serif';
          ctx.fillStyle = '#22c55e'; // verde para benefícios
          ctx.fillText('✅ BENEFÍCIOS:', boxX + 20, currentY);
          currentY += 22;

          ctx.font = '12px Inter, Arial, sans-serif';
          ctx.fillStyle = '#dcfce7';
          
          // Quebrar soluções em frases curtas
          const solutionSentences = solutionsPart.split('.').filter(s => s.trim().length > 10);
          
          solutionSentences.slice(0, 3).forEach((sentence, index) => {
            let cleanSentence = sentence.trim()
              .replace(/^SOLUÇÃO:\s*/i, '')
              .replace(/^SOLUÇÕES:\s*/i, '')
              .replace(/^\*+\s*SOLUÇÃO:\s*/i, '')
              .replace(/^\*+\s*SOLUÇÕES:\s*/i, '');
            if (cleanSentence) {
              // Quebrar frases longas em múltiplas linhas se necessário
              const words = cleanSentence.split(' ');
              let currentLine = '• ';
              
              for (let word of words) {
                const testLine = currentLine + word + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && currentLine !== '• ') {
                  ctx.fillText(currentLine.trim(), boxX + 25, currentY);
                  currentY += lineHeight;
                  currentLine = '  ' + word + ' ';
                } else {
                  currentLine = testLine;
                }
              }
              
              if (currentLine.trim() !== '•') {
                ctx.fillText(currentLine.trim(), boxX + 25, currentY);
                currentY += lineHeight + 3;
              }
            }
          });
        }
      } else {
        // Texto não organizado - quebrar em frases bem estruturadas
        ctx.font = '13px Inter, Arial, sans-serif';
        ctx.fillStyle = '#ffffff';

        // Dividir o texto em frases
        const sentences = authorityText.split(/[.!?]+/).filter(s => s.trim().length > 15);
        
        sentences.slice(0, 6).forEach((sentence, index) => {
          const cleanSentence = sentence.trim();
          if (cleanSentence) {
            const words = cleanSentence.split(' ');
            let currentLine = '• ';
            
            for (let word of words) {
              const testLine = currentLine + word + ' ';
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > maxWidth && currentLine !== '• ') {
                ctx.fillText(currentLine.trim(), boxX + 20, currentY);
                currentY += lineHeight;
                currentLine = '  ' + word + ' ';
              } else {
                currentLine = testLine;
              }
            }
            
            if (currentLine.trim() !== '•') {
              ctx.fillText(currentLine.trim(), boxX + 20, currentY);
              currentY += lineHeight + 5;
            }
          }
        });
      }
      
      console.log('✅ Autoridade desenhada');

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

    if (!authorityText || authorityText.length === 0) {
      toast.error('Nenhum conteúdo de dor x solução encontrado no copywriting');
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
      const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_autoridade`;
      await downloadBlob(blob, fileName);
      toast.success('Imagem baixada com sucesso!');
    } catch (error) {
      toast.error(`Erro ao baixar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect border-2 border-purple-200">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando imagens melhoradas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (enhancedImages.length === 0) {
    return (
      <Card className="glass-effect border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Type className="h-5 w-5" />
            Gerador de Imagem com Dor x Solução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Type className="h-12 w-12 text-red-300 mx-auto mb-3" />
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

  if (!authorityText) {
    return (
      <Card className="glass-effect border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Type className="h-5 w-5" />
            Gerador de Imagem com Dor x Solução
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Type className="h-12 w-12 text-red-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              Nenhum conteúdo de dor x solução encontrado no copywriting gerado
            </p>
            <p className="text-sm text-muted-foreground">
              Gere um copywriting profissional primeiro para extrair o conteúdo de conversão
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-2 border-red-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-700">Gerador de Imagem com Dor x Solução</CardTitle>
            <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 text-xs">
              Conversão Persuasiva
            </Badge>
          </div>
        </div>
        
        {/* Descrição inicial genérica */}
        <div className="mt-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            🎯 O que é "Dor x Solução" para Conversão?
          </h4>
          <p className="text-sm text-red-700 leading-relaxed">
            <strong>Dor x Solução</strong> é uma estratégia de marketing persuasiva que identifica os <em>problemas específicos</em> que o cliente enfrenta 
            e apresenta seu produto como a <em>solução perfeita</em>. Esta técnica cria uma conexão emocional instantânea e aumenta drasticamente 
            as chances de conversão em vendas.
          </p>
        </div>

        {/* Descrição de conversão */}
        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h4 className="text-sm font-semibold text-green-800 mb-2">
            💰 Como Isso Gera Conversões e Vendas?
          </h4>
          <div className="space-y-2 text-sm text-green-700">
            <p><span className="font-medium">• Identificação Emocional:</span> O cliente se reconhece no problema apresentado</p>
            <p><span className="font-medium">• Urgência de Solução:</span> Desperta o desejo imediato de resolver a dor</p>
            <p><span className="font-medium">• Posicionamento Estratégico:</span> Seu produto vira a única saída lógica</p>
            <p><span className="font-medium">• Gatilho de Ação:</span> Transforma interesse em decisão de compra</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preview da Dor x Solução Organizado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-800">Conteúdo de Dor x Solução Extraído:</h4>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 rounded-lg border-l-4 border-red-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-xs">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-1">PROBLEMA x SOLUÇÃO:</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {authorityText}
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
            <strong>💡 Dica Estratégica:</strong> Este texto será sobreposto à imagem selecionada, criando um visual impactante que 
            destaca os problemas do cliente e posiciona seu produto como a solução ideal.
          </div>
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
                    ? 'border-red-500 ring-2 ring-red-200 shadow-lg'
                    : 'border-gray-200 hover:border-red-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={img.enhanced}
                  alt={`Imagem melhorada ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
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
              className="bg-red-600 hover:bg-red-700 text-white font-medium"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Gerando Imagem...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
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
              <strong>⏳ Próximo passo:</strong> Clique em "Gerar Imagem de Conversão" para criar uma imagem persuasiva 
              que combina sua imagem melhorada com o texto estratégico de dor x solução.
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
                <p className="text-xs text-green-600">Pronta para usar em anúncios, redes sociais e materiais de marketing</p>
              </div>
              
              <div className="border-2 border-green-300 rounded-lg overflow-hidden bg-white shadow-lg">
                <img
                  src={generatedImage}
                  alt="Imagem de conversão com dor x solução"
                  className="w-full max-w-md mx-auto block"
                />
              </div>
              
              <div className="mt-3 text-xs text-green-700 bg-green-100 p-2 rounded">
                <strong>💡 Dica de Uso:</strong> Use esta imagem em seus anúncios do Facebook, Instagram Stories, 
                posts no LinkedIn ou materiais de venda para maximizar conversões.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};