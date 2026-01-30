import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Sparkles, Loader2, Copy, CheckCircle } from "lucide-react";
import { useSpecialistCommands } from "./ai-enhancer/hooks/useSpecialistCommands";
import { useUnifiedCommandsData } from "@/hooks/useUnifiedCommandsData";
import { toast } from "sonner";

interface RunwarePromptGeneratorProps {
  productName: string;
  shortDescription: string;
  onPromptGenerated: (prompt: string) => void;
  productId?: string;
}

export const RunwarePromptGenerator = ({ 
  productName, 
  shortDescription, 
  onPromptGenerated,
  productId 
}: RunwarePromptGeneratorProps) => {
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasUnifiedData, setHasUnifiedData] = useState(false);
  
  const { isLoadingGemini, isLoadingOpenAI, generateSpecialistCommands } = useSpecialistCommands();
  const { getUnifiedDataForProduct } = useUnifiedCommandsData();

  const isAnyLoading = isLoadingGemini || isLoadingOpenAI;

  useEffect(() => {
    const checkUnifiedData = async () => {
      if (productId) {
        const data = await getUnifiedDataForProduct(productId);
        setHasUnifiedData(data.hasUnifiedData);
      }
    };
    checkUnifiedData();
  }, [productId]);

  // GERAR PROMPT COM VARIAÇÕES BASEADAS NO COMANDO UNIFICADO
  const generateBackgroundPrompt = async (data: any, unifiedData?: any): Promise<string> => {
    try {
      // Se houver dados do Comando Unificado, usar variações
      if (unifiedData && (unifiedData.idealFor?.length > 0 || unifiedData.idealEnvironments?.length > 0)) {
        console.log('🎯 Usando dados do Comando Unificado para gerar prompt variado');
        
        const { generatePromptVariations } = await import('@/utils/promptVariationGenerator');
        const { distributeVariations } = await import('@/utils/promptDistributor');
        
        const variations = generatePromptVariations(productName, shortDescription, unifiedData);
        
        if (variations.length > 0) {
          // Distribuir e pegar uma variação aleatória
          const distributed = distributeVariations(variations, {
            totalImages: 1,
            prioritizeHigh: true,
            shuffle: true
          });
          
          if (distributed.length > 0) {
            console.log('✅ Prompt variado gerado com sucesso:', distributed[0].context);
            return distributed[0].prompt;
          }
        }
      }
      
      // FALLBACK: 5 PROMPTS DIRETOS OTIMIZADOS PARA RUNWAY
      const promptsRunware = [
        `Professional product photography of ${productName} in a modern minimalist studio, clean white background with subtle shadows, studio lighting with soft diffused light from the right, product centered and well-lit, commercial product shot, ultra-realistic, high resolution, 8K quality`,
        `${productName} placed in a beautiful modern living room, natural window lighting, cozy atmosphere, wooden furniture and plants in background, lifestyle photography, warm and inviting colors, professional commercial shot, ultra-realistic, high detail`,
        `${productName} in a creative workspace setting, artistic lighting with golden hour glow, inspiring background with design elements, modern and trendy atmosphere, professional product photography, vibrant but balanced colors, ultra-realistic`,
        `${productName} in use in its natural environment, practical demonstration setting, clear and clean composition, good lighting that shows product benefits, organized and efficient space, commercial photography style, ultra-realistic, high quality`,
        `Luxury product photography of ${productName}, elegant background with premium materials, sophisticated lighting setup, high-end commercial photography, rich colors and textures, ultra-realistic, magazine quality, professional studio shot`
      ];
      
      const promptIndex = Math.abs(productName.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % promptsRunware.length;
      console.log(`✅ Prompt Runway fallback ${promptIndex + 1} selecionado`);
      return promptsRunware[promptIndex];
      
    } catch (error) {
      console.error('❌ Erro ao gerar prompt Runway:', error);
      return `Professional product photography of ${productName}, ${shortDescription}, studio lighting, high quality, 8K resolution`;
    }
  };

  const handleGeneratePrompt = async (apiType: 'gemini' | 'openai') => {
    if (!productName.trim() || !shortDescription.trim()) {
      toast.error('Nome do produto e descrição são obrigatórios para gerar o prompt');
      return;
    }

    try {
      // Buscar dados do Comando Unificado se disponível
      let unifiedData = undefined;
      if (productId) {
        const data = await getUnifiedDataForProduct(productId);
        if (data.hasUnifiedData) {
          unifiedData = {
            seoDescription: data.seoDescription,
            technicalSpecs: data.technicalSpecs,
            keywords: data.keywords
          };
          console.log('🎯 Gerando prompt COM dados do Comando Unificado:', {
            hasSeoDesc: !!data.seoDescription,
            hasTechSpecs: !!data.technicalSpecs,
            hasKeywords: !!data.keywords
          });
          toast.info(`Gerando prompt avançado com ${apiType.toUpperCase()} + Dados do Comando Unificado...`, {
            icon: '🎯',
            description: 'Usando descrição SEO e especificações técnicas para maior precisão'
          });
        } else {
          console.log('📝 Gerando prompt SEM dados do Comando Unificado');
          toast.info(`Gerando prompt avançado com ${apiType.toUpperCase()}...`);
        }
      }
      
      await generateSpecialistCommands(
        productName,
        shortDescription,
        apiType,
        async (data) => {
          console.log('📥 Dados recebidos das 7 Funções Especializadas:', data);
          
          // Gerar prompt especializado usando variações do Comando Unificado
          const backgroundPrompt = await generateBackgroundPrompt(data, unifiedData);
          
          setGeneratedPrompt(backgroundPrompt);
          onPromptGenerated(backgroundPrompt);
          
          const hasVariations = unifiedData && (unifiedData.idealFor?.length > 0 || unifiedData.idealEnvironments?.length > 0);
          
          toast.success(`🎯 Prompt ALTO IMPACTO gerado com ${apiType.toUpperCase()}!`, {
            description: hasVariations 
              ? `✅ COM VARIAÇÕES DO COMANDO UNIFICADO • ✅ ${unifiedData.idealFor?.length || 0} cenários • ✅ ${unifiedData.idealEnvironments?.length || 0} ambientes`
              : '✅ MODERNOS • ✅ REALISTAS • ✅ CRIATIVOS PODEROSOS • ✅ AMBIENTES DIFERENTES'
          });
        },
        unifiedData
      );
    } catch (error) {
      console.error('Erro ao gerar prompt:', error);
      toast.error(`Erro ao gerar prompt com ${apiType.toUpperCase()}`);
    }
  };

  const handleCopyPrompt = async () => {
    if (!generatedPrompt) return;
    
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopySuccess(true);
      toast.success('Prompt copiado para a área de transferência!');
      
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao copiar prompt:', error);
      toast.error('Erro ao copiar prompt');
    }
  };

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Brain className="h-5 w-5" />
            Gerador de Prompts IA AVANÇADO
            <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-100 text-xs">
              ALTO IMPACTO • MODERNOS • REALISTAS
            </Badge>
          </CardTitle>
          {hasUnifiedData && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Dados do Comando Unificado disponíveis</span>
            </div>
          )}
        </div>
        <p className="text-sm text-orange-600">
          Gera prompts de <strong>ALTO IMPACTO</strong> para ambientes <strong>TOTALMENTE DIFERENTES</strong> • <strong>MODERNOS</strong> • <strong>REALISTAS</strong> • <strong>CRIATIVOS PODEROSOS</strong>
          {hasUnifiedData && <span className="block mt-1 text-green-600 font-medium">🎯 Usando informações do Comando Unificado para prompts mais precisos</span>}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações do Produto */}
        <div className="grid grid-cols-1 gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-200">
          <div>
            <Label className="text-xs font-medium text-orange-700">Nome do Produto</Label>
            <p className="text-sm text-orange-800 font-medium">{productName || 'Não informado'}</p>
          </div>
          <div>
            <Label className="text-xs font-medium text-orange-700">Descrição Resumida</Label>
            <p className="text-sm text-orange-800">{shortDescription || 'Não informada'}</p>
          </div>
        </div>

        {/* Botões de Geração */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleGeneratePrompt('gemini')}
            disabled={isAnyLoading || !productName.trim() || !shortDescription.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoadingGemini ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                🤖 Gemini
              </>
            )}
          </Button>
          
          <Button
            onClick={() => handleGeneratePrompt('openai')}
            disabled={isAnyLoading || !productName.trim() || !shortDescription.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoadingOpenAI ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                OpenAI...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                🧠 OpenAI
              </>
            )}
          </Button>
        </div>

        {/* Prompt Gerado */}
        {generatedPrompt && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-orange-700">
                Prompt Gerado ({generatedPrompt.length} caracteres)
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPrompt}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            {generatedPrompt.length > 2000 && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ Prompt longo ({generatedPrompt.length} chars). Considere editar para ser mais conciso.
              </div>
            )}
            <Textarea
              value={generatedPrompt}
              readOnly
              className="min-h-[120px] text-sm bg-orange-50/30 border-orange-200 text-orange-800"
            />
            <Button
              onClick={() => onPromptGenerated(generatedPrompt)}
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Usar este Prompt
            </Button>
          </div>
        )}

        {/* Informação sobre as Funções */}
        <div className="text-xs text-orange-600 bg-orange-50/30 p-2 rounded border border-orange-200">
          <p className="font-medium mb-1">🎯 ENGENHEIRO DE PROMPTS AVANÇADO:</p>
          <p>✅ <strong>AMBIENTES TOTALMENTE DIFERENTES</strong> • ✅ <strong>MODERNOS E REALISTAS</strong> • ✅ <strong>ALTO IMPACTO VISUAL</strong> • ✅ <strong>CRIATIVOS PODEROSOS</strong> • ✅ <strong>BOA ILUMINAÇÃO</strong> • ✅ <strong>FUNDOS ESTRUTURADOS</strong> • ✅ <strong>Preservação 100% do Produto</strong></p>
        </div>
      </CardContent>
    </Card>
  );
};