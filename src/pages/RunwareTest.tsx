import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRunwareTest } from '@/hooks/useRunwareTest';
import { Loader2, Upload, Image, Sparkles, ArrowUp, Eraser, MessageSquare, FileText, Trash2, Send, ZoomIn } from 'lucide-react';
import { ZoomableImageModal } from '@/components/enhancement/ZoomableImageModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function RunwareTest() {
  console.log('🧪 RunwareTest component está sendo renderizado');
  
  const {
    isProcessing,
    generateImage,
    imageToImage,
    upscaleImage,
    removeBackground,
    enhanceImage
  } = useRunwareTest();
  
  console.log('🔧 Hook useRunwareTest carregado, isProcessing:', isProcessing);

  // Estados para Text-to-Image / Image-to-Image - Parâmetros para MÁXIMA PRESERVAÇÃO DO PRODUTO
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('runware:106@1'); // MODELO ESPECÍFICO PARA PRESERVAÇÃO
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [strength, setStrength] = useState(0.3); // BAIXO para preservar produto 100%
  const [cfgScale, setCfgScale] = useState(1.5); // BAIXO para não alterar produto
  const [steps, setSteps] = useState(20); // BAIXO para preservação máxima
  const [guidanceEndStepPercentage, setGuidanceEndStepPercentage] = useState(60); // BAIXO para preservação
  const [outputFormat, setOutputFormat] = useState('JPEG');
  const [numberResults, setNumberResults] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [baseImageUrl, setBaseImageUrl] = useState<string>('');

  // Estados para fundo branco
  const [whiteBgImages, setWhiteBgImages] = useState<string[]>([]);
  const [isGeneratingWhiteBg, setIsGeneratingWhiteBg] = useState(false);
  const [selectedImagesForWhiteBg, setSelectedImagesForWhiteBg] = useState<string[]>([]);

  // Estados para processamento de imagem
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [upscaleFactor, setUpscaleFactor] = useState(4);
  const [showImageModal, setShowImageModal] = useState(false);

  // Estados para OpenAI Prompt Specialist
  interface Document {
    name: string;
    content: string;
  }
  
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDocuments, setAiDocuments] = useState<Document[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('📁 Arquivos para processamento:', acceptedFiles);
    const file = acceptedFiles[0];
    if (file) {
      console.log('📄 Arquivo para processamento:', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      });
      
      const reader = new FileReader();
      reader.onload = () => {
        console.log('✅ Arquivo para processamento carregado');
        const base64 = (reader.result as string).split(',')[1];
        setUploadedImage(base64);
        setProcessedImage(null);
        toast.success(`Imagem "${file.name}" carregada para processamento!`);
      };
      reader.onerror = (error) => {
        console.error('❌ Erro ao ler arquivo para processamento:', error);
        toast.error('Erro ao carregar a imagem para processamento.');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('❌ Nenhum arquivo para processamento');
      toast.error('Nenhuma imagem foi selecionada para processamento');
    }
  }, []);

  const validateImageUrl = (url: string): boolean => {
    // Aceitar URLs completas (http/https) ou URLs relativas (começando com /)
    const absoluteUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i;
    const relativeUrlPattern = /^\/.*\.(jpg|jpeg|png|webp)(\?.*)?$/i;
    return absoluteUrlPattern.test(url) || relativeUrlPattern.test(url);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: false,
    onDropAccepted: (files) => {
      console.log('🟢 Arquivos aceitos para processamento:', files);
    },
    onDropRejected: (rejections) => {
      console.log('🔴 Arquivos rejeitados para processamento:', rejections);
      toast.error('Formato de arquivo não suportado. Use PNG, JPG, JPEG ou WEBP.');
    }
  });


  const extractImageUrl = (data: any): string | null => {
    console.log('🔍 [DEBUG] Extraindo URL da imagem de:', data);
    
    // Se data é um array, pega o primeiro item
    if (Array.isArray(data)) {
      console.log('📊 [DEBUG] Data é array, pegando primeiro item:', data[0]);
      const firstItem = data[0];
      if (firstItem?.imageURL) return firstItem.imageURL;
      if (firstItem?.outputURL) return firstItem.outputURL;
      if (firstItem?.url) return firstItem.url;
    }
    
    // Se data é objeto direto
    if (data?.imageURL) return data.imageURL;
    if (data?.outputURL) return data.outputURL;
    if (data?.url) return data.url;
    
    console.log('❌ [DEBUG] Nenhuma URL encontrada no objeto:', data);
    return null;
  };

  const handleGenerateImage = async () => {
    console.log('🎨 handleGenerateImage chamado com prompt:', prompt);
    
    if (!prompt.trim()) {
      toast.error('Digite um prompt para gerar a imagem');
      return;
    }

    try {
      console.log('🚀 Chamando generateImage...');
      const result = await generateImage(prompt, selectedModel, width, height, cfgScale, steps, outputFormat, guidanceEndStepPercentage);
      console.log('📥 Resultado recebido:', result);
      
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        console.log('🖼️ URL da imagem extraída:', imageUrl);
        setGeneratedImages([imageUrl]);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar imagem:', error);
    }
  };

  const handleImageToImage = async () => {
    if (!prompt.trim()) {
      toast.error('Digite um prompt para transformar a imagem');
      return;
    }
    if (!baseImageUrl.trim()) {
      toast.error('Digite uma URL da imagem base primeiro');
      return;
    }
    
    if (!validateImageUrl(baseImageUrl)) {
      toast.error('URL da imagem inválida. Use uma URL que termine com .jpg, .jpeg, .png ou .webp');
      return;
    }

    try {
      console.log('🔍 [DEBUG] Verificando dados antes de enviar:');
      console.log('📋 URL da imagem base:', baseImageUrl);
      console.log('📝 Prompt original:', prompt);
      console.log('🎯 Modelo selecionado:', 'runware:106@1');
      console.log('⚙️ Parâmetros:', { width, height, strength, cfgScale, steps, numberResults, outputFormat, guidanceEndStepPercentage });
      
      // PROMPT REFORMULADO seguindo as instruções EXATAS do usuário
      const enhancedPrompt = `Place the uploaded pink thermal mug exactly as shown in the input image on ${prompt}. Show realistic background elements with proper lighting and shadows. Make the lighting warm and photographic with light grain and ambient shadows. 

🔒 CRITICAL PRESERVATION INSTRUCTIONS:
- Preserve the original object exactly as shown in the input image. Do not modify its shape, proportions, textures, color, lighting or edges.
- Use the uploaded image as the exact base. The pink thermal mug must remain visually identical — do not repaint or stylize the object.
- The product must remain 100% unchanged — only generate a new realistic background context around it.
- DO NOT modify the mug in any way. Preserve the exact appearance of the product — including shape, color, lid, material, and lighting. The object must remain fully intact and untouched.

Style: photo-realistic with centered subject and contextual background.`;
      
      console.log('🔒 PROMPT REFORMULADO para preservação TOTAL:', enhancedPrompt);
      console.log('🚀 Enviando com parâmetros específicos para runware:106@1...');
      
      // Parâmetros CRÍTICOS conforme documentação Runware para PRESERVAÇÃO MÁXIMA
      const result = await imageToImage(
        enhancedPrompt, 
        baseImageUrl, 
        'runware:106@1', // FLUX.1 Kontext [dev] - OBRIGATÓRIO para preservação
        width, 
        height, 
        0.3, // STRENGTH MUITO BAIXO para preservação máxima do produto
        2.5, // CFG BAIXO para não alterar produto (conforme documentação)
        25,  // STEPS MODERADOS para qualidade + preservação
        numberResults, 
        outputFormat, 
        70, // GUIDANCE baixo para preservação
        "modified object, deformed product, changed colors, altered shape, different texture, repainted object, stylized product, distorted proportions, wrong lighting, blurry object" // Prompt negativo específico
      );
      if (result.success && result.data) {
        // Verificar se recebemos um array de dados ou um único item
        if (Array.isArray(result.data)) {
          const imageUrls = result.data.map(item => extractImageUrl(item)).filter(Boolean);
          setGeneratedImages(imageUrls);
        } else {
          const imageUrl = extractImageUrl(result.data);
          setGeneratedImages(imageUrl ? [imageUrl] : []);
        }
      }
    } catch (error) {
      console.error('Erro ao transformar imagem:', error);
    }
  };

  const toggleImageSelection = (imageUrl: string) => {
    if (selectedImagesForWhiteBg.includes(imageUrl)) {
      setSelectedImagesForWhiteBg(prev => prev.filter(url => url !== imageUrl));
    } else if (selectedImagesForWhiteBg.length < 2) {
      setSelectedImagesForWhiteBg(prev => [...prev, imageUrl]);
    } else {
      toast.error('Você pode selecionar no máximo 2 imagens');
    }
  };

  const handleGenerateWhiteBgImages = async () => {
    if (selectedImagesForWhiteBg.length !== 2) {
      toast.error('Selecione exatamente 2 imagens para gerar fundo branco');
      return;
    }

    setIsGeneratingWhiteBg(true);
    const whiteBgPrompt = "gere uma imagem com o 100% fundo branco baseado na imagem de referencia, hiper, ultra realista, com muito brilho e destaque no produto";
    
    try {
      console.log('🎨 Iniciando geração de fundo branco para as imagens selecionadas');
      const results: string[] = [];

      // Processar primeira imagem selecionada
      console.log('🖼️ Processando primeira imagem:', selectedImagesForWhiteBg[0]);
      const result1 = await imageToImage(
        whiteBgPrompt,
        selectedImagesForWhiteBg[0],
        'runware:106@1',
        width,
        height,
        0.3, // Baixo para preservar produto
        2.5, // CFG baixo
        25,  // Steps moderados
        1,   // Uma imagem por vez
        outputFormat,
        70,  // Guidance baixo
        "modified object, deformed product, changed colors, altered shape, different texture, repainted object, stylized product, distorted proportions, wrong lighting, blurry object"
      );

      if (result1.success && result1.data) {
        const imageUrl1 = extractImageUrl(result1.data);
        if (imageUrl1) results.push(imageUrl1);
      }

      // Processar segunda imagem selecionada
      console.log('🖼️ Processando segunda imagem:', selectedImagesForWhiteBg[1]);
      const result2 = await imageToImage(
        whiteBgPrompt,
        selectedImagesForWhiteBg[1],
        'runware:106@1',
        width,
        height,
        0.3, // Baixo para preservar produto
        2.5, // CFG baixo
        25,  // Steps moderados
        1,   // Uma imagem por vez
        outputFormat,
        70,  // Guidance baixo
        "modified object, deformed product, changed colors, altered shape, different texture, repainted object, stylized product, distorted proportions, wrong lighting, blurry object"
      );

      if (result2.success && result2.data) {
        const imageUrl2 = extractImageUrl(result2.data);
        if (imageUrl2) results.push(imageUrl2);
      }

      setWhiteBgImages(results);
      
      if (results.length > 0) {
        toast.success(`${results.length} imagem(ns) com fundo branco gerada(s) com sucesso!`);
      } else {
        toast.error('Nenhuma imagem com fundo branco foi gerada');
      }

    } catch (error) {
      console.error('❌ Erro ao gerar fundo branco:', error);
      toast.error('Erro ao gerar imagens com fundo branco');
    } finally {
      setIsGeneratingWhiteBg(false);
    }
  };

  const handleUpscaleImage = async () => {
    if (!uploadedImage) {
      toast.error('Faça upload de uma imagem primeiro');
      return;
    }

    try {
      const result = await upscaleImage(uploadedImage, upscaleFactor);
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        setProcessedImage(imageUrl);
      }
    } catch (error) {
      console.error('Erro ao fazer upscale:', error);
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) {
      toast.error('Faça upload de uma imagem primeiro');
      return;
    }

    try {
      console.log('🗑️ [DEBUG] Iniciando remoção de fundo...');
      const result = await removeBackground(uploadedImage);
      console.log('📥 [DEBUG] Resultado COMPLETO recebido:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log('✅ [DEBUG] Processamento bem-sucedido!');
        
        // Extrair URL diretamente do array de dados
        let imageUrl = null;
        
        if (Array.isArray(result.data)) {
          // Se é array, pegar o primeiro item
          const firstItem = result.data[0];
          imageUrl = firstItem?.imageURL || firstItem?.outputURL || firstItem?.url;
          console.log('📊 [DEBUG] Extraindo de array - primeira URL encontrada:', imageUrl);
        } else if (result.data.imageURL) {
          // Se é objeto direto
          imageUrl = result.data.imageURL;
          console.log('📦 [DEBUG] Extraindo de objeto - URL encontrada:', imageUrl);
        }
        
        console.log('🖼️ [DEBUG] URL final extraída:', imageUrl);
        
        if (imageUrl) {
          console.log('✅ [DEBUG] Setando processedImage com URL:', imageUrl);
          setProcessedImage(imageUrl);
          toast.success('Fundo removido com sucesso!');
        } else {
          console.error('❌ [DEBUG] URL da imagem não encontrada');
          console.error('❌ [DEBUG] Estrutura de dados recebida:', result.data);
          toast.error('URL da imagem não encontrada na resposta');
        }
      } else {
        console.error('❌ [DEBUG] Resultado inválido:', result);
        toast.error('Erro no processamento da imagem');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao remover fundo:', error);
      toast.error('Erro ao processar imagem');
    }
  };

  const handleEnhanceImage = async () => {
    if (!uploadedImage) {
      toast.error('Faça upload de uma imagem primeiro');
      return;
    }

    try {
      const result = await enhanceImage(uploadedImage);
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        setProcessedImage(imageUrl);
      }
    } catch (error) {
      console.error('Erro ao melhorar imagem:', error);
    }
  };

  // Funções para OpenAI Prompt Specialist
  const handleAiFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          const newDocument: Document = {
            name: file.name,
            content: content
          };
          setAiDocuments(prev => [...prev, newDocument]);
          toast.success(`Documento "${file.name}" carregado!`);
        };
        reader.readAsText(file);
      } else {
        toast.error(`Arquivo "${file.name}" não é um arquivo .txt válido`);
      }
    });
  };

  const removeAiDocument = (index: number) => {
    setAiDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllAiDocuments = () => {
    setAiDocuments([]);
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    // Agora não precisamos mais de documentos - usamos as instruções gravadas internamente
    const userMessage = aiInput.trim();
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiInput('');
    setAiLoading(true);

    try {
      console.log('🚀 Enviando para openai-normal-chat:', { 
        message: userMessage
      });
      
      // Usar supabase.functions.invoke para chamadas seguras
      const { data, error: invokeError } = await supabase.functions.invoke('openai-normal-chat', {
        body: {
          message: userMessage,
          documents: aiDocuments
        }
      });

      console.log('📡 Resposta recebida via invoke');
      
      if (invokeError) {
        console.error('❌ Erro na chamada:', invokeError);
        throw new Error(`Erro: ${invokeError.message}`);
      }

      console.log('📥 Resposta recebida:', data);

      if (data?.error) {
        console.error('❌ Erro retornado pela função:', data.error);
        toast.error(`Erro da IA: ${data.error}`);
        return;
      }

      if (data?.response) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        toast.success('Resposta recebida!');
      } else {
        console.error('❌ Resposta vazia:', data);
        toast.error('Resposta vazia da IA');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem para IA:', error);
      toast.error(`Erro ao enviar mensagem: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiChat = () => {
    setAiMessages([]);
  };

  const TextToImageTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Text to Image
        </CardTitle>
        <CardDescription>
          Gere imagens apenas com texto usando modelos da Runware
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Modelo */}
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="runware:100@1">Runware Fast</SelectItem>
              <SelectItem value="runware:101@1">Runware Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Parâmetros Básicos Configurados */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>CFG Scale</Label>
            <Input
              type="number"
              value={cfgScale}
              onChange={(e) => setCfgScale(Number(e.target.value))}
              min={1}
              max={20}
              step={0.1}
            />
          </div>
          <div className="space-y-2">
            <Label>Steps</Label>
            <Input
              type="number"
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              min={1}
              max={50}
            />
          </div>
          <div className="space-y-2">
            <Label>Guidance End Step %</Label>
            <Input
              type="number"
              value={guidanceEndStepPercentage}
              onChange={(e) => setGuidanceEndStepPercentage(Number(e.target.value))}
              min={1}
              max={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Formato de Saída</Label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JPEG">JPEG</SelectItem>
                <SelectItem value="PNG">PNG</SelectItem>
                <SelectItem value="WEBP">WEBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dimensões */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Largura</Label>
            <Input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min={512}
              max={2048}
              step={64}
            />
          </div>
          <div className="space-y-2">
            <Label>Altura</Label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min={512}
              max={2048}
              step={64}
            />
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Descreva a imagem que você quer gerar..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Botão Gerar */}
        <Button 
          onClick={handleGenerateImage}
          disabled={isProcessing || !prompt.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Imagem
            </>
          )}
        </Button>

        {/* Resultado */}
        {generatedImages.length > 0 && (
          <div className="space-y-2">
            <Label>Imagens Geradas:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ImageToImageTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Image to Image
        </CardTitle>
        <CardDescription>
          Transforme uma imagem usando prompts de texto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URL da Imagem Base */}
        <div className="space-y-2">
          <Label htmlFor="base-image-url">URL da Imagem Base (Obrigatória)</Label>
          <Input
            id="base-image-url"
            type="url"
            placeholder="https://exemplo.com/imagem.jpg"
            value={baseImageUrl}
            onChange={(e) => setBaseImageUrl(e.target.value)}
            className="w-full"
          />
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setBaseImageUrl('/lovable-uploads/6ef82cc5-f4a4-4057-84a0-6a12f2884446.png')}
            >
              Usar Imagem de Teste
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole a URL de uma imagem (formato: JPEG, PNG, WEBP)
          </p>
        </div>

        {/* Preview da Imagem Base */}
        {baseImageUrl && validateImageUrl(baseImageUrl) && (
          <div className="space-y-2">
            <Label>Preview da Imagem Base:</Label>
            <div className="border rounded-lg overflow-hidden max-h-48">
              <img
                src={baseImageUrl}
                alt="Base image preview"
                className="w-full h-auto object-contain"
                onError={() => toast.error('Erro ao carregar a imagem. Verifique a URL.')}
              />
            </div>
          </div>
        )}

        {/* Modelo e Configurações para Máxima Preservação */}
        <div className="space-y-2">
          <Label>Configurações Otimizadas para Preservação do Produto</Label>
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/50 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-600 text-white">✓ Modelo: runware:106@1</Badge>
              <span className="text-sm text-green-700 dark:text-green-300">Modelo específico para preservação</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>Strength: {strength} (baixo)</div>
              <div>CFG: {cfgScale} (baixo)</div>
              <div>Steps: {steps} (baixo)</div>
              <div>Guidance: {guidanceEndStepPercentage}% (baixo)</div>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              🔒 Todos os parâmetros configurados para preservação MÁXIMA do produto original
            </p>
          </div>
        </div>

        {/* Parâmetros Básicos Configurados */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Strength (0.1-1.0)</Label>
            <Input
              type="number"
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              min={0.1}
              max={1.0}
              step={0.1}
            />
          </div>
          <div className="space-y-2">
            <Label>CFG Scale</Label>
            <Input
              type="number"
              value={cfgScale}
              onChange={(e) => setCfgScale(Number(e.target.value))}
              min={1}
              max={20}
              step={0.1}
            />
          </div>
          <div className="space-y-2">
            <Label>Steps</Label>
            <Input
              type="number"
              value={steps}
              onChange={(e) => setSteps(Number(e.target.value))}
              min={1}
              max={50}
            />
          </div>
          <div className="space-y-2">
            <Label>Guidance End Step %</Label>
            <Input
              type="number"
              value={guidanceEndStepPercentage}
              onChange={(e) => setGuidanceEndStepPercentage(Number(e.target.value))}
              min={1}
              max={100}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Formato de Saída</Label>
          <Select value={outputFormat} onValueChange={setOutputFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JPEG">JPEG</SelectItem>
              <SelectItem value="PNG">PNG</SelectItem>
              <SelectItem value="WEBP">WEBP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="img2img-prompt">Prompt para Transformação</Label>
          <div className="space-y-2">
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/50">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                ℹ️ <strong>Preservação Automática:</strong> O produto original será mantido exatamente como está (forma, cor, iluminação). Apenas o fundo/ambiente será modificado conforme seu prompt.
              </p>
            </div>
            <Textarea
              id="img2img-prompt"
              placeholder="Descreva o novo ambiente/fundo para o produto (ex: fundo branco minimalista, ambiente de loja moderna, cenário natural...)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        {/* Botão Transformar */}
        <Button 
          onClick={handleImageToImage}
          disabled={isProcessing || !prompt.trim() || !baseImageUrl.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Transformando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Transformar Imagem
            </>
          )}
        </Button>

        {/* Quantidade de Imagens */}
        <div className="space-y-2">
          <Label>Quantidade de Imagens (1-5)</Label>
          <Select value={numberResults.toString()} onValueChange={(v) => setNumberResults(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 imagem</SelectItem>
              <SelectItem value="2">2 imagens</SelectItem>
              <SelectItem value="3">3 imagens</SelectItem>
              <SelectItem value="4">4 imagens</SelectItem>
              <SelectItem value="5">5 imagens</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resultado */}
        {generatedImages.length > 0 && (
          <div className="space-y-4">
            <Label>Imagens Transformadas:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((image, index) => (
                <div 
                  key={index} 
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedImagesForWhiteBg.includes(image) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                  onClick={() => toggleImageSelection(image)}
                >
                  <div className="relative">
                    <img
                      src={image}
                      alt={`Transformed ${index + 1}`}
                      className="w-full h-auto"
                    />
                    {selectedImagesForWhiteBg.includes(image) && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {selectedImagesForWhiteBg.indexOf(image) + 1}
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-xs text-center text-muted-foreground">
                    {selectedImagesForWhiteBg.includes(image) ? 'Selecionada' : 'Clique para selecionar'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Seletor de Imagens para Fundo Branco */}
            {generatedImages.length >= 2 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Seleção para Fundo Branco ({selectedImagesForWhiteBg.length}/2):
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedImagesForWhiteBg([])}
                    disabled={selectedImagesForWhiteBg.length === 0}
                  >
                    Limpar Seleção
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique nas imagens acima para selecionar exatamente 2 imagens para gerar fundo branco
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botão para Gerar Fundo Branco nas Imagens Selecionadas */}
        {generatedImages.length >= 2 && (
          <div className="space-y-4">
            <Button 
              onClick={handleGenerateWhiteBgImages}
              disabled={isGeneratingWhiteBg || isProcessing || selectedImagesForWhiteBg.length !== 2}
              className="w-full"
              variant="outline"
            >
              {isGeneratingWhiteBg ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Fundo Branco...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  🎨 Gerar Fundo Branco ({selectedImagesForWhiteBg.length}/2 selecionadas)
                </>
              )}
            </Button>
            
            {/* Resultado das Imagens com Fundo Branco */}
            {whiteBgImages.length > 0 && (
              <div className="space-y-2">
                <Label>Imagens com Fundo Branco (100%):</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {whiteBgImages.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="space-y-2">
                        <img
                          src={image}
                          alt={`White Background ${index + 1}`}
                          className="w-full h-auto"
                        />
                        <div className="p-2 text-xs text-center text-muted-foreground bg-muted/50">
                          {index + 1}ª Imagem Selecionada - Fundo Branco
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ImageProcessingTab = () => (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Imagem</CardTitle>
          <CardDescription>
            Faça upload de uma imagem para processar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-muted-foreground">Solte a imagem aqui...</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Arraste uma imagem ou clique para selecionar
              </p>
            )}
          </div>

          {uploadedImage && (
            <div className="mt-4 space-y-2">
              <Label>Imagem Original:</Label>
              <div className="border rounded-lg overflow-hidden max-h-64">
                <img
                  src={`data:image/png;base64,${uploadedImage}`}
                  alt="Original"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações de Processamento */}
      <Card>
        <CardHeader>
          <CardTitle>Processamento de Imagem</CardTitle>
          <CardDescription>
            Escolha uma das opções de processamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upscale */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Label>Fator de Upscale:</Label>
              <Select value={upscaleFactor.toString()} onValueChange={(v) => setUpscaleFactor(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                  <SelectItem value="8">8x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleUpscaleImage}
              disabled={isProcessing || !uploadedImage}
              className="w-full"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4 mr-2" />
              )}
              Upscale Image
            </Button>
          </div>

          {/* Remover Fundo */}
          <Button 
            onClick={handleRemoveBackground}
            disabled={isProcessing || !uploadedImage}
            className="w-full"
            variant="outline"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Eraser className="w-4 h-4 mr-2" />
            )}
            Remover Fundo
          </Button>

          {/* Melhorar Imagem */}
          <Button 
            onClick={handleEnhanceImage}
            disabled={isProcessing || !uploadedImage}
            className="w-full"
            variant="outline"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Melhorar Imagem
          </Button>

          {/* Resultado - MODAL DE VISUALIZAÇÃO DA IMAGEM */}
          <div className="space-y-2 mt-6">
            <Label>Imagem Processada:</Label>
            {processedImage ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="relative group">
                  <img
                    src={processedImage}
                    alt="Processed"
                    className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setShowImageModal(true)}
                    onLoad={() => console.log('✅ Imagem carregada!')}
                    onError={(e) => console.error('❌ Erro ao carregar:', e)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 text-black hover:bg-white"
                      onClick={() => setShowImageModal(true)}
                    >
                      <ZoomIn className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </div>
                <div className="p-2 text-xs text-muted-foreground break-all">
                  {processedImage}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground">
                Nenhuma imagem processada ainda
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Runware AI Test</h1>
        <p className="text-muted-foreground">
          Teste as funcionalidades da API Runware para geração e processamento de imagens
        </p>
        <div className="flex gap-2">
          <Badge variant="secondary">Text-to-Image</Badge>
          <Badge variant="secondary">Image-to-Image</Badge>
          <Badge variant="secondary">Upscale</Badge>
          <Badge variant="secondary">Background Removal</Badge>
          <Badge variant="secondary">Enhancement</Badge>
        </div>
      </div>

      <Tabs defaultValue="text-to-image" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
          <TabsTrigger value="image-to-image">Image to Image</TabsTrigger>
          <TabsTrigger value="image-processing">Processamento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text-to-image" className="space-y-6">
          <TextToImageTab />
        </TabsContent>
        
        <TabsContent value="image-to-image" className="space-y-6">
          <ImageToImageTab />
        </TabsContent>
        
        <TabsContent value="image-processing" className="space-y-6">
          <ImageProcessingTab />
        </TabsContent>
      </Tabs>

      {/* Nova Seção: OpenAI Prompt Specialist */}
      <div className="mt-12 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            OpenAI Prompt Specialist
          </h2>
          <p className="text-muted-foreground">
            Especialista em prompts com 7 funções gravadas internamente. Pronto para gerar prompts otimizados para "Imagem para Imagem"
          </p>
          <div className="flex gap-2">
            <Badge variant="outline">✅ 7 Funções Gravadas</Badge>
            <Badge variant="outline">Conversa Direta</Badge>
            <Badge variant="outline">GPT-4o-mini</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Chat com IA - Agora ocupa toda a largura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversa com Especialista
              </CardTitle>
              <CardDescription>
                Especialista com 7 funções gravadas internamente. Pronto para gerar prompts otimizados!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Histórico da Conversa */}
              <div className="h-64 border rounded-lg p-4 overflow-y-auto bg-muted/25">
                {aiMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Comece a conversar com o especialista - ele já tem 7 funções gravadas internamente!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg max-w-[80%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">
                          {message.role === 'user' ? 'Você' : 'Especialista IA'}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="bg-secondary text-secondary-foreground p-3 rounded-lg max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Especialista está pensando...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input da Conversa */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Descreva seu produto para receber prompts especializados com as 7 funções gravadas..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    disabled={aiLoading}
                    className="min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendAiMessage();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={sendAiMessage}
                      disabled={!aiInput.trim() || aiLoading}
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    {aiMessages.length > 0 && (
                      <Button
                        onClick={clearAiChat}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter para enviar, Shift+Enter para nova linha
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">1. ✅ 7 Funções Gravadas</Badge>
                <p>O especialista já tem todas as funções necessárias gravadas internamente - não precisa mais de documentação.</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">2. Converse Diretamente</Badge>
                <p>Descreva seu produto, suas características e objetivos para receber prompts personalizados imediatamente.</p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit">3. Use os Prompts</Badge>
                <p>Use os prompts gerados na seção "Imagem para Imagem" acima para melhores resultados.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal de Visualização da Imagem Processada */}
      {processedImage && (
        <ZoomableImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          imageUrl={processedImage}
          alt="Imagem Processada"
        />
      )}
    </div>
  );
}