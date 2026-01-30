import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFreepikTest } from '@/hooks/useFreepikTest';
import { useSafeDownload } from '@/hooks/useSafeDownload';
import { Download, Image as ImageIcon, Sparkles, Upload, Palette, Zap, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function FreepikTest() {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('classic-fast');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageData, setImageData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('text-to-image');

  const { generateImage, removeBackground, relightImage, upscaleImage, isProcessing, progress } = useFreepikTest();
  const { downloadFile } = useSafeDownload();

  const models = [
    { id: 'classic-fast', name: 'Classic Fast', description: 'Rápido e eficiente' },
    { id: 'imagen3', name: 'Google Imagen 3', description: 'Alta qualidade do Google' },
    { id: 'mystic', name: 'Mystic', description: 'Estilo artístico avançado' }
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Remove data URL prefix to get just base64
        const base64 = result.split(',')[1];
        setUploadedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const exampleImages = [
    "/lovable-uploads/513f5e57-627f-4783-a45b-7875991c47a1.png",
    "/lovable-uploads/98261f0a-0225-4482-acf5-da15a177fab3.png",
    "/lovable-uploads/9cc4050d-b0bf-4efa-9eb9-8159f90e2721.png"
  ];

  const examplePrompts = [
    "A futuristic city at sunset with flying cars",
    "A magical forest with glowing mushrooms and fairy lights",
    "A cyberpunk cat wearing neon sunglasses",
    "An astronaut playing guitar on Mars",
    "A steampunk robot reading a book in a library"
  ];

  const handleTextToImage = async () => {
    if (!prompt.trim()) return;

    try {
      const result = await generateImage(prompt, selectedModel, uploadedImage || undefined);
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        setGeneratedImage(imageUrl);
        setImageData(result.data);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) return;

    try {
      const result = await removeBackground(uploadedImage);
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        setGeneratedImage(imageUrl);
        setImageData(result.data);
      }
    } catch (error) {
      console.error('Error removing background:', error);
    }
  };

  const handleRelight = async () => {
    if (!uploadedImage) return;

    try {
      const result = await relightImage(uploadedImage, prompt);
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        setGeneratedImage(imageUrl);
        setImageData(result.data);
      }
    } catch (error) {
      console.error('Error relighting image:', error);
    }
  };

  const handleUpscale = async () => {
    if (!uploadedImage) return;

    try {
      const result = await upscaleImage(uploadedImage, prompt);
      if (result.success && result.data) {
        const imageUrl = extractImageUrl(result.data);
        setGeneratedImage(imageUrl);
        setImageData(result.data);
      }
    } catch (error) {
      console.error('Error upscaling image:', error);
    }
  };

  const extractImageUrl = (data: any): string => {
    // A API Freepik retorna diferentes estruturas dependendo do endpoint
    if (data.data && data.data[0]) {
      return data.data[0].base64 
        ? `data:image/png;base64,${data.data[0].base64}`
        : data.data[0].url;
    } else if (data.images && data.images[0]) {
      return data.images[0].base64
        ? `data:image/png;base64,${data.images[0].base64}`
        : data.images[0].url;
    } else if (data.url) {
      return data.url;
    } else if (data.base64) {
      return `data:image/png;base64,${data.base64}`;
    }
    return '';
  };

  const loadExampleImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        setUploadedImage(base64);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading example image:', error);
    }
  };

  const handleDownload = async () => {
    if (generatedImage) {
      const filename = `freepik-${activeTab}-${Date.now()}.png`;
      await downloadFile(generatedImage, filename);
    }
  };

  const renderTextToImageSection = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Text to Image / Image to Image</CardTitle>
          <CardDescription>
            Gere imagens a partir de texto ou transforme uma imagem existente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload de Imagem (opcional) */}
          <div className="space-y-2">
            <Label>Upload de Imagem (opcional para img2img)</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-xs text-muted-foreground">Solte aqui...</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Opcional: imagem base para transformação
                </p>
              )}
            </div>
          </div>

          {/* Imagem carregada */}
          {uploadedImage && (
            <div className="space-y-2">
              <Label>Imagem Base:</Label>
              <div className="border rounded-lg overflow-hidden max-h-32">
                <img
                  src={`data:image/png;base64,${uploadedImage}`}
                  alt="Base image"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          )}
          {/* Modelo */}
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {model.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva a imagem que você quer gerar..."
              disabled={isProcessing}
            />
          </div>

          {/* Exemplos */}
          <div className="space-y-2">
            <Label>Exemplos rápidos:</Label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(example)}
                  disabled={isProcessing}
                >
                  {example.slice(0, 30)}...
                </Button>
              ))}
            </div>
          </div>

          {/* Botão Gerar */}
          <Button 
            onClick={handleTextToImage} 
            disabled={!prompt.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Gerando...' : 'Gerar Imagem'}
          </Button>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Processando... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderImageUploadSection = (title: string, description: string, onProcess: () => void) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Upload de Imagem</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-sm text-muted-foreground">Solte a imagem aqui...</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Arraste uma imagem ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP até 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Imagem carregada */}
          {uploadedImage && (
            <div className="space-y-2">
              <Label>Imagem Carregada:</Label>
              <div className="border rounded-lg overflow-hidden max-h-48">
                <img
                  src={`data:image/png;base64,${uploadedImage}`}
                  alt="Uploaded"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* Exemplos de imagem */}
          <div className="space-y-2">
            <Label>Ou use uma imagem de exemplo:</Label>
            <div className="grid grid-cols-3 gap-2">
              {exampleImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => loadExampleImage(imageUrl)}
                  className="border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  disabled={isProcessing}
                >
                  <img
                    src={imageUrl}
                    alt={`Example ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Botão Processar */}
          <Button 
            onClick={onProcess} 
            disabled={!uploadedImage || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processando...' : title}
          </Button>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Processando... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderRelightSection = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relight Image</CardTitle>
          <CardDescription>
            Mude a iluminação e crie novos ambientes para suas imagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Upload de Imagem</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-sm text-muted-foreground">Solte a imagem aqui...</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Arraste uma imagem ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP até 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Imagem carregada */}
          {uploadedImage && (
            <div className="space-y-2">
              <Label>Imagem Carregada:</Label>
              <div className="border rounded-lg overflow-hidden max-h-48">
                <img
                  src={`data:image/png;base64,${uploadedImage}`}
                  alt="Uploaded"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* Prompt para nova iluminação */}
          <div className="space-y-2">
            <Label htmlFor="lighting-prompt">Prompt de Iluminação (opcional)</Label>
            <Input
              id="lighting-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="sunset lighting, professional studio, golden hour..."
              disabled={isProcessing}
            />
          </div>

          {/* Exemplos de iluminação */}
          <div className="space-y-2">
            <Label>Estilos de iluminação:</Label>
            <div className="flex flex-wrap gap-2">
              {[
                "sunset lighting",
                "professional studio lighting",
                "golden hour",
                "dramatic shadows",
                "soft natural light"
              ].map((style, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(style)}
                  disabled={isProcessing}
                >
                  {style}
                </Button>
              ))}
            </div>
          </div>

          {/* Exemplos de imagem */}
          <div className="space-y-2">
            <Label>Ou use uma imagem de exemplo:</Label>
            <div className="grid grid-cols-3 gap-2">
              {exampleImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => loadExampleImage(imageUrl)}
                  className="border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  disabled={isProcessing}
                >
                  <img
                    src={imageUrl}
                    alt={`Example ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Botão Processar */}
          <Button 
            onClick={handleRelight} 
            disabled={!uploadedImage || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processando...' : 'Aplicar Iluminação'}
          </Button>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Processando... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderUpscaleSection = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upscale Image</CardTitle>
          <CardDescription>
            Melhore a qualidade e resolução de suas imagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Upload de Imagem</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-sm text-muted-foreground">Solte a imagem aqui...</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Arraste uma imagem ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP até 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Imagem carregada */}
          {uploadedImage && (
            <div className="space-y-2">
              <Label>Imagem Carregada:</Label>
              <div className="border rounded-lg overflow-hidden max-h-48">
                <img
                  src={`data:image/png;base64,${uploadedImage}`}
                  alt="Uploaded"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          )}

          {/* Prompt para melhoria */}
          <div className="space-y-2">
            <Label htmlFor="enhance-prompt">Prompt de Melhoria (opcional)</Label>
            <Input
              id="enhance-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="enhance details, sharpen, improve quality..."
              disabled={isProcessing}
            />
          </div>

          {/* Exemplos de imagem */}
          <div className="space-y-2">
            <Label>Ou use uma imagem de exemplo:</Label>
            <div className="grid grid-cols-3 gap-2">
              {exampleImages.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => loadExampleImage(imageUrl)}
                  className="border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  disabled={isProcessing}
                >
                  <img
                    src={imageUrl}
                    alt={`Example ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Botão Processar */}
          <Button 
            onClick={handleUpscale} 
            disabled={!uploadedImage || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processando...' : 'Melhorar Imagem'}
          </Button>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Processando... {progress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderResultSection = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Resultado
          </CardTitle>
          <CardDescription>
            Resultado do processamento da API Freepik
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generatedImage ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {activeTab === 'text-to-image' 
                      ? models.find(m => m.id === selectedModel)?.name
                      : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                    }
                  </Badge>
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={generatedImage}
                    alt="Generated by Freepik API"
                    className="w-full h-auto"
                  />
                </div>
              </div>

              {imageData && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Ação:</strong> {activeTab}</p>
                  {activeTab === 'text-to-image' && (
                    <>
                      <p><strong>Prompt:</strong> {prompt}</p>
                      <p><strong>Modelo:</strong> {selectedModel}</p>
                    </>
                  )}
                  {(activeTab === 'relight' || activeTab === 'upscale') && prompt && (
                    <p><strong>Prompt:</strong> {prompt}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma imagem processada ainda</p>
              <p className="text-sm">Use as abas acima para processar imagens</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderApiInfo = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades da API Freepik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Text to Image:</strong> Gere imagens a partir de texto com modelos Classic Fast, Google Imagen 3, e Mystic.
            </div>
            <div>
              <strong>Remove Background:</strong> Remova automaticamente o fundo de qualquer imagem com precisão.
            </div>
            <div>
              <strong>Relight:</strong> Altere a iluminação e crie novos ambientes para suas imagens.
            </div>
            <div>
              <strong>Upscale:</strong> Melhore a qualidade e resolução de suas imagens com IA.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Teste Freepik API
        </h1>
        <p className="text-muted-foreground">
          Teste múltiplas funcionalidades da API Freepik: geração, edição e melhoria de imagens
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="text-to-image" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Text to Image
          </TabsTrigger>
          <TabsTrigger value="remove-bg" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Remove BG
          </TabsTrigger>
          <TabsTrigger value="relight" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Relight
          </TabsTrigger>
          <TabsTrigger value="upscale" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Upscale
          </TabsTrigger>
        </TabsList>

        {/* Text to Image Tab */}
        <TabsContent value="text-to-image">
          <div className="grid lg:grid-cols-2 gap-6">
            {renderTextToImageSection()}
            {renderResultSection()}
          </div>
        </TabsContent>

        {/* Remove Background Tab */}
        <TabsContent value="remove-bg">
          <div className="grid lg:grid-cols-2 gap-6">
            {renderImageUploadSection("Remove Background", "Remova automaticamente o fundo de suas imagens", handleRemoveBackground)}
            {renderResultSection()}
          </div>
        </TabsContent>

        {/* Relight Tab */}
        <TabsContent value="relight">
          <div className="grid lg:grid-cols-2 gap-6">
            {renderRelightSection()}
            {renderResultSection()}
          </div>
        </TabsContent>

        {/* Upscale Tab */}
        <TabsContent value="upscale">
          <div className="grid lg:grid-cols-2 gap-6">
            {renderUpscaleSection()}
            {renderResultSection()}
          </div>
        </TabsContent>
      </Tabs>

      {/* API Info */}
      {renderApiInfo()}
    </div>
  );
}