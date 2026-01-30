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

interface ProductFaqImageGeneratorProps {
  productId: string;
  productName: string;
  productSku: string;
  images: string[];
}

export const ProductFaqImageGenerator = ({ 
  productId, 
  productName, 
  productSku, 
  images
}: ProductFaqImageGeneratorProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [faqText, setFaqText] = useState<string>('');
  const [enhancedImages, setEnhancedImages] = useState<EnhancedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { downloadBlob } = useSafeDownload();
  const { loadEnhancedImages } = useImageEnhancementPersistence();

  useEffect(() => {
    loadFaqFromCopywriting();
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

  const loadFaqFromCopywriting = async () => {
    console.log('🚀 INICIANDO loadFaqFromCopywriting...');
    console.log('📋 ProductId:', productId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário autenticado:', user?.id);
      
      if (!user) {
        console.log('❌ Usuário não autenticado');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Buscando dados no Supabase...');
      const { data, error } = await (supabase as any)
        .from('ai_unified_results')
        .select('results')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('📊 Resultado da query:', { data, error });

      if (error) {
        console.error('❌ Erro ao carregar copywriting:', error);
        setIsLoading(false);
        return;
      }

      if (data?.results) {
        console.log('📄 Dados encontrados:', data.results);
        console.log('📄 Tipo dos dados:', typeof data.results);
        console.log('📄 É objeto?', typeof data.results === 'object');
        
        if (typeof data.results === 'object' && data.results !== null && 'copywriting' in data.results) {
          const copywriting = (data.results as any).copywriting;
          console.log('📝 Copywriting encontrado:', copywriting);
          console.log('📝 Tipo do copywriting:', typeof copywriting);
          console.log('📝 Tamanho do copywriting:', copywriting?.length);
          
          if (copywriting && typeof copywriting === 'string') {
            console.log('✅ Iniciando extração de FAQ...');
            const extractedFaq = extractFaqFromCopywriting(copywriting);
            console.log('🎯 FAQ extraído:', extractedFaq);
            setFaqText(extractedFaq);
          } else {
            console.log('❌ Copywriting não é uma string válida');
          }
        } else {
          console.log('❌ Dados não contêm copywriting válido');
        }
      } else {
        console.log('❌ Nenhum dado encontrado');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('💥 Erro inesperado ao carregar copywriting:', error);
      setIsLoading(false);
    }
  };

  const extractFaqFromCopywriting = (copywriting: string): string => {
    console.log('🔍 INICIANDO extração de FAQ...');
    console.log('📄 Texto completo recebido (primeiros 500 chars):', copywriting.substring(0, 500));
    
    if (!copywriting || copywriting.length === 0) {
      console.log('❌ Copywriting está vazio');
      return '';
    }
    
    const lines = copywriting.split('\n');
    console.log('📝 Total de linhas:', lines.length);
    
    let inFaqSection = false;
    let faqPairs = [];
    let currentQuestion = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Log das primeiras 20 linhas para debug
      if (i < 20) {
        console.log(`📝 Linha ${i+1}: "${trimmedLine}"`);
      }
      
      // Detectar início da seção "8. Perguntas Frequentes (FAQ)" de forma mais ampla
      if ((trimmedLine.includes('8.') || trimmedLine.includes('8 -') || trimmedLine.includes('8)')) && 
          (trimmedLine.toLowerCase().includes('pergunta') || 
           trimmedLine.toLowerCase().includes('frequente') ||
           trimmedLine.toLowerCase().includes('faq'))) {
        console.log('✅ ENCONTROU seção de FAQ na linha:', i+1, 'Conteúdo:', trimmedLine);
        inFaqSection = true;
        continue;
      }
      
      // Detectar fim da seção (próxima seção numerada)
      if (inFaqSection && trimmedLine.match(/^(9\.|9 -|9\))/)) {
        console.log('🔚 FIM da seção de FAQ na linha:', i+1);
        break;
      }
      
      if (inFaqSection && trimmedLine) {
        console.log('🔍 Analisando linha na seção FAQ:', trimmedLine);
        
        // Múltiplos formatos de pergunta:
        // 1. **P : ** texto (formato do usuário)
        // 2. - **P:** texto (formato do banco)
        // 3. **P:** texto
        // 4. P: texto
        if (trimmedLine.includes('P') && 
            (trimmedLine.includes('**P') || trimmedLine.includes('P:') || trimmedLine.includes('P :')) 
            && (trimmedLine.includes('**') || trimmedLine.includes('?'))) {
          
          console.log('➕ ENCONTROU PERGUNTA:', trimmedLine);
          
          let question = trimmedLine;
          
          // Remover formatações diversas (mais robustas)
          question = question.replace(/^-\s*/, ''); // Remove "-" no início
          question = question.replace(/\*\*P\s*:\s*\*\*/g, ''); // **P : **
          question = question.replace(/\*\*P:\*\*/g, ''); // **P:**
          question = question.replace(/P\s*:\s*/g, ''); // P:
          question = question.replace(/\*\*/g, ''); // ** restantes
          question = question.replace(/[#*]/g, ''); // # e *
          question = question.trim();
          
          if (question.length > 0) {
            currentQuestion = question;
            console.log('✅ Pergunta extraída:', currentQuestion);
          }
        }
        
        // Múltiplos formatos de resposta:
        // 1. R: texto (formato do usuário)  
        // 2. **R:** texto (formato do banco)
        if (currentQuestion && 
            (trimmedLine.startsWith('R:') || 
             trimmedLine.includes('**R:**') || 
             (trimmedLine.includes('R:') && !trimmedLine.includes('P')))) {
          
          console.log('➕ ENCONTROU RESPOSTA:', trimmedLine);
          
          let answer = trimmedLine;
          
          // Remover formatações de resposta
          answer = answer.replace(/^\s*\*\*R:\*\*/g, ''); // **R:**
          answer = answer.replace(/^R:\s*/g, ''); // R:
          answer = answer.replace(/[#*]/g, ''); // # e *
          answer = answer.trim();
          
          console.log('✅ Resposta extraída:', answer);
          
          if (answer.length > 0) {
            faqPairs.push({
              question: currentQuestion,
              answer: answer
            });
            
            console.log('📝 Par FAQ adicionado:', { question: currentQuestion, answer: answer });
            currentQuestion = '';
          }
        }
      }
    }
    
    console.log('🎯 Total de pares encontrados:', faqPairs.length);
    console.log('🎯 Pares completos:', JSON.stringify(faqPairs, null, 2));
    
    // Se não encontrou pares, tentar estratégia alternativa mais ampla
    if (faqPairs.length === 0) {
      console.log('⚠️ Nenhum par encontrado, tentando estratégia alternativa...');
      
      // Procurar qualquer linha com ? seguida de linha com resposta
      const allLines = copywriting.split('\n');
      for (let i = 0; i < allLines.length - 1; i++) {
        const currentLine = allLines[i].trim();
        const nextLine = allLines[i + 1]?.trim();
        
        if (currentLine.includes('?') && nextLine && 
            (nextLine.startsWith('R:') || nextLine.includes('**R:**') || 
             nextLine.toLowerCase().includes('sim') || 
             nextLine.toLowerCase().includes('não'))) {
          
          console.log('📝 Encontrou par alternativo:', currentLine, '|', nextLine);
          
          let question = currentLine.replace(/\*\*/g, '').replace(/P\s*:\s*/g, '').replace(/^-\s*/, '').trim();
          let answer = nextLine.replace(/^\s*\*\*R:\*\*/g, '').replace(/^R:\s*/g, '').trim();
          
          faqPairs.push({
            question: question,
            answer: answer
          });
        }
      }
      
      console.log('🎯 Pares encontrados na estratégia alternativa:', faqPairs.length);
    }
    
    // Converter pares em texto formatado
    let faqText = '';
    faqPairs.forEach((pair, index) => {
      faqText += pair.question + '\n';
      faqText += pair.answer + '\n';
    });
    
    console.log('🎯 RESULTADO final do FAQ:', faqText);
    
    return faqText.trim();
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

      console.log('🎨 Desenhando caixa de FAQ...');
      const boxX = CANVAS_OFFSETS.boxMargin;
      const boxY = canvas.height - CANVAS_OFFSETS.boxBottomOffset;
      const boxWidth = canvas.width - (CANVAS_OFFSETS.boxMargin * 2);
      const boxHeight = CANVAS_OFFSETS.boxHeight;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

      // Borda da caixa (indigo)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)'; // indigo com transparência
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      console.log('✅ Caixa de FAQ desenhada');

      // Desenhar texto de FAQ
      console.log('🎨 Desenhando texto de FAQ...');
      ctx.font = 'bold 18px Inter, Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      let currentY = boxY + 25;
      const lineHeight = 20;
      const maxWidth = boxWidth - 60;

      // Título destacado
      ctx.fillText('❓ Perguntas Frequentes:', boxX + 20, currentY);
      currentY += 28;

      // Processar texto para organizar melhor e remover formatações
      let organizedText = faqText;
      
      // Remover todos os caracteres # e *
      organizedText = organizedText.replace(/[#*]/g, '');
      
      // Processar FAQ em formato pergunta-resposta
      const lines = organizedText.split('\n').filter(line => line.trim());
      const processedLines = [];
      const questionEmojis = ['🤔', '💡', '🔧', '📦', '⚠️', '🛡️', '✅', '❓'];
      
       for (let i = 0; i < lines.length; i += 2) { // Processa pares de pergunta-resposta
        const question = lines[i]?.trim();
        const answer = lines[i + 1]?.trim();
        
        if (question) {
          // Adicionar emoji à pergunta
          const emoji = questionEmojis[Math.floor(i / 2) % questionEmojis.length];
          processedLines.push({
            text: emoji + ' ' + question,
            type: 'question'
          });
          
          // Se houver resposta, adicionar com emoji de check
          if (answer) {
            processedLines.push({
              text: '✅ ' + answer,
              type: 'answer'
            });
          }
        }
      }

      // Se não conseguiu processar no formato esperado, usar formato genérico
      if (processedLines.length === 0) {
        lines.forEach((line, index) => {
          if (line.trim()) {
            const emoji = line.includes('?') ? '❓' : '✅';
            const type = line.includes('?') ? 'question' : 'answer';
            processedLines.push({
              text: emoji + ' ' + line.trim(),
              type: type
            });
          }
        });
      }

      // Quebrar texto em linhas que cabem no canvas
      const textLines = [];
      
      processedLines.forEach(item => {
        if (!item.text.trim()) return;
        
        const words = item.text.split(' ');
        let currentLine = '';

        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + ' ';
          
          // Usar fonte apropriada para medir
          ctx.font = item.type === 'question' ? 'bold 15px Inter, Arial, sans-serif' : '14px Inter, Arial, sans-serif';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && currentLine !== '') {
            textLines.push({
              text: currentLine.trim(),
              type: item.type
            });
            currentLine = words[n] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        
        if (currentLine.trim()) {
          textLines.push({
            text: currentLine.trim(),
            type: item.type
          });
        }
      });

      // Renderizar as linhas com estilos diferentes para pergunta e resposta
      textLines.slice(0, 11).forEach((line, index) => {
        if (line.type === 'question') {
          ctx.font = 'bold 15px Inter, Arial, sans-serif';
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.font = '14px Inter, Arial, sans-serif';
          ctx.fillStyle = '#e0e0e0';
        }
        
        ctx.fillText(line.text, boxX + 20, currentY + (index * lineHeight));
      });
      
      console.log('✅ FAQ desenhado');

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

    if (!faqText || faqText.length === 0) {
      toast.error('Nenhuma FAQ encontrada no copywriting');
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
      const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_faq`;
      await downloadBlob(blob, fileName);
      toast.success('Imagem baixada com sucesso!');
    } catch (error) {
      toast.error(`Erro ao baixar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-effect border-2 border-indigo-200">
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando imagens melhoradas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (enhancedImages.length === 0) {
    return (
      <Card className="glass-effect border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <Type className="h-5 w-5" />
            Gerador de Imagem com FAQ Resumidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Type className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
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

  if (!faqText) {
    return (
      <Card className="glass-effect border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-700">
            <Type className="h-5 w-5" />
            Gerador de Imagem com FAQ Resumidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Type className="h-12 w-12 text-indigo-300 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              Nenhuma FAQ encontrada no copywriting gerado
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
    <Card className="glass-effect border-2 border-indigo-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-indigo-700">Gerador de Imagem com FAQ Resumidas</CardTitle>
            <Badge variant="outline" className="text-indigo-600 border-indigo-300 bg-indigo-50 text-xs">
              FAQ Resumidas
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview das FAQ */}
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-sm font-medium text-indigo-700 mb-2">FAQ que será aplicada:</p>
          <p className="text-sm text-indigo-600 line-clamp-3">
            {faqText}
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
                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={img.enhanced}
                  alt={`Enhanced ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-indigo-500 bg-opacity-20 flex items-center justify-center">
                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
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
                alt="Imagem gerada com FAQ"
                className="w-full max-w-md mx-auto"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};