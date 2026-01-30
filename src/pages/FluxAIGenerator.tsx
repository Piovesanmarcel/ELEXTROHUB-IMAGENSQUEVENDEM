import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Wand2, Sparkles, Scissors, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { useFluxAIGenerator } from "@/hooks/useFluxAIGenerator";

export default function FluxAIGenerator() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [enhancedPrompt, setEnhancedPrompt] = useState("");
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);

  const {
    imageToImage,
    fluxKontext,
    generatePrompt,
    enhanceImage,
    removeBackground,
    isProcessing,
    progress
  } = useFluxAIGenerator();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedImage(acceptedFiles[0]);
        toast.success("Imagem carregada com sucesso!");
      }
    }
  });

  const handleImageToImage = async () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }
    try {
      const result = await imageToImage(selectedImage, prompt);
      if (result.success && result.result?.image_url) {
        setGeneratedResult(result.result.image_url);
      }
    } catch (error) {
      console.error('Erro em image-to-image:', error);
    }
  };

  const handleFluxKontext = async () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }
    try {
      const result = await fluxKontext(selectedImage, prompt);
      if (result.success && result.result?.image_url) {
        setGeneratedResult(result.result.image_url);
      }
    } catch (error) {
      console.error('Erro em flux-kontext:', error);
    }
  };

  const handlePromptGeneration = async () => {
    if (!prompt) {
      toast.error("Digite uma descrição para gerar o prompt");
      return;
    }
    try {
      const result = await generatePrompt(prompt, selectedImage || undefined);
      console.log('🔍 Resultado completo:', result);
      
      if (result.success) {
        // Estrutura de resposta conforme documentação FluxAI: { code, message, data: { prompt } }
        const generatedPrompt = result.result?.data?.prompt || // FluxAI format
                               result.result?.prompt ||        // Fallback format
                               result.result?.generated_text;  // Alternative format
        
        if (generatedPrompt) {
          setEnhancedPrompt(generatedPrompt);
          toast.success("Prompt gerado com sucesso!");
        } else {
          console.warn('❌ Prompt não encontrado na resposta:', result.result);
          console.warn('📋 Estrutura da resposta recebida:', JSON.stringify(result.result, null, 2));
          toast.error("Erro: prompt não foi gerado corretamente");
        }
      } else {
        console.error('❌ Falha na geração:', result);
        toast.error(`Erro: ${result.error || 'Falha na geração do prompt'}`);
      }
    } catch (error) {
      console.error('Erro em prompt generation:', error);
      toast.error("Erro ao gerar prompt");
    }
  };

  const handleImageEnhancement = async () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }
    try {
      const result = await enhanceImage(selectedImage);
      if (result.success && result.result?.enhanced_image_url) {
        setGeneratedResult(result.result.enhanced_image_url);
      }
    } catch (error) {
      console.error('Erro em image enhancement:', error);
    }
  };

  const handleBackgroundRemoval = async () => {
    if (!selectedImage) {
      toast.error("Selecione uma imagem primeiro");
      return;
    }
    try {
      const result = await removeBackground(selectedImage);
      if (result.success && result.result?.processed_image_url) {
        setGeneratedResult(result.result.processed_image_url);
      }
    } catch (error) {
      console.error('Erro em background removal:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FluxAI Generator</h1>
        <p className="text-muted-foreground">
          Ferramentas avançadas de IA para processamento e geração de imagens
        </p>
      </div>

      {/* API Configuration Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Status da API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>API Key do FluxAI Generator</span>
              <Badge variant="default">Configurada no Servidor</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              A API Key é gerenciada de forma segura no servidor. Para configurar ou atualizar, acesse:{" "}
              <a 
                href="https://fluxaiimagegenerator.com/pt/my/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                fluxaiimagegenerator.com/pt/my/api
              </a>
            </p>
            {isProcessing && (
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Upload Area */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Imagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            {selectedImage ? (
              <div className="space-y-2">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded"
                />
                <p className="text-sm font-medium">{selectedImage.name}</p>
                <Badge variant="outline">Imagem Carregada</Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p>Arraste uma imagem aqui ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground">
                  Suporta JPEG, PNG, WebP
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Tabs defaultValue="image-to-image" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="image-to-image">Imagem → Imagem</TabsTrigger>
          <TabsTrigger value="flux-kontext">Flux Kontext</TabsTrigger>
          <TabsTrigger value="prompt-generator">Gerador de Prompt</TabsTrigger>
          <TabsTrigger value="enhancer">Aprimorador</TabsTrigger>
          <TabsTrigger value="background-removal">Remover Fundo</TabsTrigger>
        </TabsList>

        <TabsContent value="image-to-image">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Imagem para Imagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Prompt de Transformação</Label>
                <Textarea
                  id="prompt"
                  placeholder="Descreva como você quer transformar a imagem..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleImageToImage}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processando..." : "Transformar Imagem"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flux-kontext">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Flux Kontext
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="kontext-prompt">Contexto para Aplicar</Label>
                <Textarea
                  id="kontext-prompt"
                  placeholder="Descreva o contexto ou estilo que deseja aplicar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleFluxKontext}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Processando..." : "Aplicar Kontext"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt-generator">
          <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Wand2 className="h-5 w-5" />
                 Gerador de Prompt de Imagem para IA
                 {selectedImage && <Badge variant="secondary">Baseado na imagem carregada</Badge>}
               </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição da Imagem Desejada</Label>
                 <Textarea
                   id="description"
                   placeholder={selectedImage 
                     ? "Descreva o que você quer gerar baseado na imagem carregada..." 
                     : "Descreva brevemente o que você quer gerar..."}
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                 />
              </div>
              <Button 
                onClick={handlePromptGeneration}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Gerando..." : "Gerar Prompt Otimizado"}
              </Button>
              
              {enhancedPrompt && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Prompt Gerado:</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(enhancedPrompt)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-sm">{enhancedPrompt}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhancer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Aprimorador de Imagens com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Melhore a qualidade, resolução e detalhes da sua imagem automaticamente.
              </p>
              <Button 
                onClick={handleImageEnhancement}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Aprimorando..." : "Aprimorar Imagem"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background-removal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Removedor de Fundo AI em 4X
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Remove o fundo da imagem com precisão em resolução 4X superior.
              </p>
              <Button 
                onClick={handleBackgroundRemoval}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? "Removendo..." : "Remover Fundo"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      {generatedResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img
                src={generatedResult}
                alt="Resultado processado"
                className="max-w-full h-auto rounded-lg border"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar URL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}