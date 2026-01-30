import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Minus, Image, Zap } from 'lucide-react';
import { useRunwareTest } from '@/hooks/useRunwareTest';
import { useGeminiBackgroundGenerator } from '@/hooks/useGeminiBackgroundGenerator';
import { toast } from 'sonner';

interface MultiPromptImageGeneratorProps {
  baseImageUrls: string[];
  onImagesGenerated: (images: string[]) => void;
  isDisabled?: boolean;
  externalPrompts?: string[];
  selectedAI?: 'runware' | 'gemini';
}

interface PromptSlot {
  id: string;
  prompt: string;
  enabled: boolean;
}

export const MultiPromptImageGenerator = ({ 
  baseImageUrls,
  onImagesGenerated, 
  isDisabled = false,
  externalPrompts = [],
  selectedAI = 'runware'
}: MultiPromptImageGeneratorProps) => {
  const { isProcessing: isProcessingRunware, imageToImage } = useRunwareTest();
  const { generateBackground: geminiGenerateBackground, isProcessing: isProcessingGemini } = useGeminiBackgroundGenerator();
  
  const isProcessing = isProcessingRunware || isProcessingGemini;
  
  // Estados para múltiplos prompts
  const [promptSlots, setPromptSlots] = useState<PromptSlot[]>([
    { id: '1', prompt: '', enabled: true },
    { id: '2', prompt: '', enabled: true },
    { id: '3', prompt: '', enabled: true },
    { id: '4', prompt: '', enabled: true },
    { id: '5', prompt: '', enabled: true }
  ]);

  // Parâmetros Image to Image otimizados para preservação
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [strength, setStrength] = useState(0.15);
  const [cfgScale, setCfgScale] = useState(1.5);
  const [steps, setSteps] = useState(20);
  const [guidanceEndStepPercentage, setGuidanceEndStepPercentage] = useState(50);
  const [outputFormat, setOutputFormat] = useState('JPEG');

  // Helpers: sanitização e truncamento de prompts para a API da Runware
  const sanitizePromptForRunware = (raw: string, maxLen: number = 900): string => {
    if (!raw) return '';
    let text = String(raw);
    // Remover marcações Markdown e bullets comuns
    text = text
      .replace(/\*\*|__|\*|`|>/g, '')
      .replace(/[••·▪►–—\-]{1,}\s*/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ') // remove [placeholders]
      .replace(/IMPORTANTE:.*?$/gmi, ' ');
    // Consolidar espaços e linhas
    text = text.replace(/\s+/g, ' ').trim();
    // Truncar
    if (text.length > maxLen) text = text.slice(0, maxLen - 3) + '...';
    return text;
  };

  const buildPositivePrompt = (core: string): string => {
    return (
      `Place the uploaded product exactly as shown in the input image on ${core}. ` +
      `Show realistic background elements with proper lighting and shadows. ` +
      `Make the lighting warm and photographic with light grain and ambient shadows.\n\n` +
      `🔒 CRITICAL PRESERVATION INSTRUCTIONS - ABSOLUTE REQUIREMENTS:\n` +
      `- Use the uploaded image as the ABSOLUTE TEMPLATE - the product must be pixel-perfect identical to the reference\n` +
      `- PRESERVE EXACTLY: shape, proportions, textures, colors, materials, finish, edges, details, scale, positioning\n` +
      `- MAINTAIN ORIGINAL: product orientation, size ratio, surface textures, color tones, reflections, shadows on product\n` +
      `- DO NOT ALTER: product form, don't reshape, don't recolor, don't change materials, don't modify textures\n` +
      `- DO NOT DISTORT: keep original proportions, don't stretch, don't compress, don't rotate the product\n` +
      `- CHANGE ONLY: background/environment context - product itself remains 100% untouched and identical\n` +
      `- REFERENCE FIDELITY: the product must look like it was photographed in the new environment, not recreated\n\n` +
      `Style: photo-realistic with centered subject and contextual background.`
    );
  };

  // Aplicar prompts externos quando fornecidos
  useEffect(() => {
    if (externalPrompts && externalPrompts.length > 0) {
      console.log('🔄🔄 [MULTI-PROMPT] Aplicando prompts externos:', externalPrompts.length);
      console.log('🔄🔄 [MULTI-PROMPT] Detalhes dos prompts:', externalPrompts.map((p, i) => `${i+1}: ${p.substring(0, 100)}...`));
      
      const newSlots: PromptSlot[] = [];
      
      // ✅ LIMITE RIGOROSO: Máximo 6 prompts externos (para gerar 6 imagens)
      const maxPrompts = 10; // Permitir até 10 slots
      const limitedPrompts = externalPrompts.slice(0, maxPrompts);
      
      console.log(`🔒🔒 [MULTI-PROMPT] LIMITE APLICADO: Usando ${limitedPrompts.length} de ${externalPrompts.length} prompts externos`);
      
      limitedPrompts.forEach((prompt, index) => {
        // Validar se o prompt não está vazio
        if (prompt && prompt.trim().length > 0) {
          console.log(`📝📝 [MULTI-PROMPT] Slot ${index + 1}: ${prompt.substring(0, 150)}...`);
          newSlots.push({
            id: (index + 1).toString(),
            prompt: prompt.trim(),
            enabled: true // SEMPRE HABILITADO se o prompt não está vazio
          });
        }
      });
      
      // Completar com slots vazios até 10 se necessário
      while (newSlots.length < 10) {
        newSlots.push({
          id: (newSlots.length + 1).toString(),
          prompt: '',
          enabled: false
        });
      }
      
      console.log(`✅✅ [MULTI-PROMPT] Slots criados: ${newSlots.length} total, ${newSlots.filter(s => s.enabled).length} habilitados`);
      
      toast.success(`✅ ${newSlots.filter(s => s.enabled).length} prompts aplicados com sucesso!`, {
        description: 'Prompts gerados pela IA foram aplicados e estão prontos para gerar imagens',
        duration: 6000
      });
      
      setPromptSlots(newSlots);
    }
  }, [externalPrompts]);

  const addPromptSlot = () => {
    if (promptSlots.length < 10) {
      const newId = (promptSlots.length + 1).toString();
      setPromptSlots([...promptSlots, { id: newId, prompt: '', enabled: true }]);
    }
  };

  const removePromptSlot = (id: string) => {
    if (promptSlots.length > 1) {
      setPromptSlots(promptSlots.filter(slot => slot.id !== id));
    }
  };

  const updatePromptSlot = (id: string, prompt: string) => {
    setPromptSlots(promptSlots.map(slot => 
      slot.id === id ? { ...slot, prompt } : slot
    ));
  };

  const togglePromptSlot = (id: string) => {
    setPromptSlots(promptSlots.map(slot => 
      slot.id === id ? { ...slot, enabled: !slot.enabled } : slot
    ));
  };

  const getActivePrompts = () => {
    const active = promptSlots.filter(slot => slot.enabled && slot.prompt.trim());
    console.log('🔍 [MULTI-PROMPT] getActivePrompts:', {
      totalSlots: promptSlots.length,
      activePrompts: active.length,
      slots: promptSlots.map(s => ({ id: s.id, enabled: s.enabled, hasPrompt: !!s.prompt.trim() }))
    });
    return active;
  };

  const validateImageUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (trimmedUrl === '') return false;
    
    // Aceita URLs HTTP/HTTPS válidas
    if (/^https?:\/\/.+/i.test(trimmedUrl)) {
      return true;
    }
    
    // Aceita URLs relativas que começam com /
    if (/^\//.test(trimmedUrl)) {
      return true;
    }
    
    // Aceita dados base64 (data:image/...)
    if (/^data:image\/.+;base64,/.test(trimmedUrl)) {
      return true;
    }
    
    return false;
  };

  const handleGenerateMultipleImages = async () => {
    const activePrompts = getActivePrompts();
    
    console.log('🚀 [MULTI-PROMPT] INICIANDO GERAÇÃO MÚLTIPLA');
    console.log('📋 Base Image URLs recebidas:', baseImageUrls);
    console.log('📝 Prompts ativos:', activePrompts.map((p, i) => `${i+1}: "${p.prompt}"`));
    
    if (activePrompts.length === 0) {
      toast.error('Adicione pelo menos um prompt ativo para gerar imagens');
      return;
    }

    if (!baseImageUrls || baseImageUrls.length === 0) {
      toast.error('Selecione pelo menos uma imagem base primeiro');
      return;
    }

    // Validar todas as URLs
    const invalidUrls = baseImageUrls.filter(url => !validateImageUrl(url));
    if (invalidUrls.length > 0) {
      toast.error(`${invalidUrls.length} URL(s) de imagem inválida(s). Use URLs válidas`);
      return;
    }

    try {
      const isExternalPrompts = externalPrompts && externalPrompts.length > 0;
      
      // ⚡ SEMPRE USAR MODO DE 1 IMAGEM POR PROMPT (seja manual ou externo)
      console.log(`🎯 MODO GERAÇÃO MÚLTIPLA SIMPLES`);
      console.log(`📊 ${activePrompts.length} prompts ativos disponíveis`);
      
      // ✅ LIMITE RIGOROSO: Máximo 6 imagens geradas (1 por prompt ativo)
      const maxImagesAllowed = 6;
      const limitedPrompts = activePrompts.slice(0, maxImagesAllowed);
      
      console.log(`🔒 LIMITE APLICADO: Processando apenas ${limitedPrompts.length}/${activePrompts.length} prompts`);
      console.log(`🎯 Cada prompt = 1 imagem | Total máximo: ${maxImagesAllowed} imagens`);
      
      const allGeneratedImages: string[] = [];
      const baseImageToUse = baseImageUrls[0]; // Usar sempre a primeira imagem base
      
      console.log(`\n🖼️ === PROCESSAMENTO INICIADO ===`);
      console.log(`📸 Imagem base: ${baseImageToUse.substring(0, 50)}...`);
      console.log(`📝 Prompts limitados: ${limitedPrompts.length}`);
      console.log(`🧠 Fonte: ${isExternalPrompts ? 'Prompts externos (IA)' : 'Prompts manuais (usuário)'}`);
      
      // Processar cada prompt individualmente com a mesma imagem base
      for (let promptIndex = 0; promptIndex < limitedPrompts.length; promptIndex++) {
        const promptSlot = limitedPrompts[promptIndex];
        const currentIndex = promptIndex + 1;
          
        console.log(`\n🎯 Processando: Prompt ${currentIndex}/${limitedPrompts.length}`);
        console.log(`📝 Prompt: "${promptSlot.prompt}"`);
        console.log(`📸 Usando imagem base: ${baseImageToUse}`);
        
        // Sanitizar e construir prompt positivo
        const core = sanitizePromptForRunware(promptSlot.prompt);
        const enhancedPrompt = buildPositivePrompt(core);

        // Prompt negativo para máxima preservação
        const negativePrompt = "modified object, deformed product, changed colors, altered shape, different texture, repainted object, stylized product, distorted proportions, wrong lighting, blurry object, altered product, changed appearance, different style, reshaped item, stretched product, compressed object, rotated product, scaled incorrectly, wrong proportions, texture changes, material changes, color shifts, surface alterations, finish modifications, edge distortions, warped object, morphed product, transformed item, redesigned object";

        try {
          // Progress toast para cada geração individual
          toast.loading(`🔄 Gerando imagem ${currentIndex}/${limitedPrompts.length}...`, {
            id: `gen-${promptIndex}`,
            description: `"${core.substring(0, 80)}..."`
          });

          let generatedImageUrl: string | undefined;

          // Lógica condicional baseada em selectedAI
          if (selectedAI === 'gemini') {
            // Usar Gemini Background Generator
            console.log(`🧠 Usando Gemini Background Generator para prompt ${currentIndex}`);
            
            const geminiResult = await geminiGenerateBackground(
              baseImageToUse,
              enhancedPrompt
            );

            console.log(`📊 [MULTI-PROMPT] Resultado Gemini:`, geminiResult);

            if (geminiResult.success && geminiResult.generatedImage) {
              generatedImageUrl = geminiResult.generatedImage;
              console.log(`✅ Gemini gerou: ${generatedImageUrl}`);
            } else {
              console.error(`❌ Falha Gemini:`, geminiResult.error);
              toast.error(`❌ Falha: Imagem ${currentIndex}/${limitedPrompts.length}`, {
                id: `gen-${promptIndex}`,
                description: geminiResult.error || 'Erro no Gemini'
              });
            }
          } else {
            // Usar Runware API (comportamento original)
            console.log(`🚀 Usando Runware API para prompt ${currentIndex}`);
            
            let result = await imageToImage(
              enhancedPrompt,
              baseImageToUse,
              'runware:106@1',
              width,
              height,
              strength,
              cfgScale,
              steps,
              1,
              outputFormat,
              guidanceEndStepPercentage,
              negativePrompt
            );

            console.log(`📊 [MULTI-PROMPT] Resultado Runware (1ª tentativa):`, result);

            // Retry com prompt simplificado em caso de falha  
            if (!(result.success && result.data?.[0]?.imageURL)) {
              const simplifiedCore = sanitizePromptForRunware(core, 300);
              const fallbackPrompt = buildPositivePrompt(simplifiedCore);
              console.warn('⚠️ Tentativa 1 falhou. Tentando fallback com prompt reduzido');
              
              result = await imageToImage(
                fallbackPrompt,
                baseImageToUse,
                'runware:106@1',
                width,
                height,
                strength,
                cfgScale,
                steps,
                1,
                outputFormat,
                guidanceEndStepPercentage,
                negativePrompt
              );

              console.log(`📊 [MULTI-PROMPT] Resultado Runware (fallback):`, result);
            }
            
            if (result.success && result.data?.[0]?.imageURL) {
              generatedImageUrl = result.data[0].imageURL;
              console.log(`✅ Runware gerou: ${generatedImageUrl}`);
            } else {
              console.error(`❌ Falha Runware:`, result);
              toast.error(`❌ Falha: Imagem ${currentIndex}/${limitedPrompts.length}`, {
                id: `gen-${promptIndex}`,
                description: result.error || 'Erro no Runware'
              });
            }
          }

          // Adicionar imagem se foi gerada com sucesso
          if (generatedImageUrl) {
            allGeneratedImages.push(generatedImageUrl);
            toast.success(`✅ Imagem ${currentIndex}/${limitedPrompts.length} concluída!`, {
              id: `gen-${promptIndex}`,
              description: `Gerada com ${selectedAI === 'gemini' ? '🧠 Gemini' : '🚀 Runware'}`
            });
          }
        } catch (error) {
          console.error(`❌ Erro na geração individual:`, error);
          toast.error(`❌ Erro: Imagem ${currentIndex}/${limitedPrompts.length}`, {
            id: `gen-${promptIndex}`,
            description: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
        
        // Dynamic delay based on success rate and progress
        if (promptIndex < limitedPrompts.length - 1) {
          const successRate = allGeneratedImages.length / (promptIndex + 1);
          const baseDelay = successRate > 0.8 ? 1500 : (successRate > 0.5 ? 2500 : 4000);
          const jitter = Math.random() * 500; // Add jitter to avoid thundering herd
          const totalDelay = baseDelay + jitter;
          
          console.log(`⏳ Pausa dinâmica: ${Math.round(totalDelay)}ms (sucesso: ${Math.round(successRate * 100)}%)`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
        }
      }
      
      console.log(`\n🎉 === PROCESSAMENTO CONCLUÍDO ===`);
      console.log(`📊 Total de imagens geradas: ${allGeneratedImages.length}/${limitedPrompts.length}`);
      
      if (allGeneratedImages.length > 0) {
        onImagesGenerated(allGeneratedImages);
        toast.success(`🎉 Processamento completo! ${allGeneratedImages.length} imagens geradas`, {
          description: `Fonte: ${isExternalPrompts ? 'Prompts IA' : 'Prompts manuais'} | IA: ${selectedAI === 'gemini' ? '🧠 Gemini' : '🚀 Runware'}`
        });
      } else {
        toast.error('❌ Nenhuma imagem foi gerada com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro geral na geração múltipla:', error);
      toast.error('Erro na geração múltipla de imagens');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-blue-600" />
            Geração Múltipla com Prompts Diferentes
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 text-xs">
              Máx. 6 Imagens
            </Badge>
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure múltiplos prompts para gerar várias versões da imagem base
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status da imagem base */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            📸 <strong>Imagens base:</strong> {baseImageUrls.length} selecionada(s)
          </p>
          {externalPrompts.length > 0 && (
            <p className="text-sm text-blue-700 mt-1">
              🧠 <strong>Prompts externos:</strong> {externalPrompts.length} recebido(s) → {getActivePrompts().length} prontos para gerar
            </p>
          )}
          <p className="text-sm text-blue-700 mt-1">
            ⚡ <strong>Prompts ativos:</strong> {getActivePrompts().length} de {promptSlots.length} slots
          </p>
        </div>

        {/* Slots de prompts */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Configure os prompts:</Label>
          {promptSlots.map((slot, index) => (
            <div key={slot.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={slot.enabled}
                onChange={() => togglePromptSlot(slot.id)}
                className="rounded"
              />
              <span className="text-sm font-medium w-8">{slot.id}.</span>
              <Textarea
                placeholder={`Prompt ${slot.id} - Descreva o cenário/contexto...`}
                value={slot.prompt}
                onChange={(e) => updatePromptSlot(slot.id, e.target.value)}
                className="flex-1 min-h-[60px]"
                disabled={!slot.enabled}
              />
              {promptSlots.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removePromptSlot(slot.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Controles */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={addPromptSlot}
            disabled={promptSlots.length >= 10}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Prompt
          </Button>
        </div>

        {/* Parâmetros avançados */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-xs">Strength</Label>
            <Input
              type="number"
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              min="0.1"
              max="1"
              step="0.05"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">CFG Scale</Label>
            <Input
              type="number"
              value={cfgScale}
              onChange={(e) => setCfgScale(Number(e.target.value))}
              min="1"
              max="20"
              step="0.5"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Steps</Label>
            <Input
              type="number"
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              min="10"
              max="50"
              step="5"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Guidance %</Label>
            <Input
              type="number"
              value={guidanceEndStepPercentage}
              onChange={(e) => setGuidanceEndStepPercentage(Number(e.target.value))}
              min="10"
              max="100"
              step="10"
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Botão de geração */}
        <Button 
          onClick={handleGenerateMultipleImages}
          disabled={isProcessing || isDisabled || getActivePrompts().length === 0 || baseImageUrls.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Image className="w-4 h-4 mr-2" />
              Gerar {getActivePrompts().length} Imagens ({Math.min(getActivePrompts().length, 6)} máx.)
            </>
          )}
        </Button>

        {/* Status */}
        {(getActivePrompts().length === 0 || baseImageUrls.length === 0) && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            <p className="font-medium mb-1">🔒 Requisitos para gerar:</p>
            <div className="space-y-1">
              <p className={getActivePrompts().length > 0 ? "text-green-600" : "text-red-600"}>
                {getActivePrompts().length > 0 ? "✅" : "❌"} Pelo menos 1 prompt ativo ({getActivePrompts().length})
              </p>
              <p className={baseImageUrls.length > 0 ? "text-green-600" : "text-red-600"}>
                {baseImageUrls.length > 0 ? "✅" : "❌"} Imagem base selecionada ({baseImageUrls.length})
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};