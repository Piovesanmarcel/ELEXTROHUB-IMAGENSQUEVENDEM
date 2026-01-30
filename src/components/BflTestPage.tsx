import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useBflTest } from '@/hooks/useBflTest';
import { toast } from 'sonner';
import { Upload, Sparkles, Image, X } from 'lucide-react';

export default function BflTestPage() {
  const [prompt, setPrompt] = useState('Transforme esta imagem com estilo artístico moderno');
  const [selectedModel, setSelectedModel] = useState('flux-kontext');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  
  const { generateImage, isProcessing } = useBflTest();

  const fluxModels = [
    {
      value: 'flux-kontext',
      label: 'FLUX.1 Kontext',
      description: 'Edição avançada - Melhor para modificar imagens existentes',
      operation: 'image-to-image'
    },
    {
      value: 'flux-fill',
      label: 'FLUX.1 Fill',
      description: 'Inpainting/Outpainting - Para preenchimento e expansão de imagens',
      operation: 'inpainting'
    },
    {
      value: 'flux-pro-1.1',
      label: 'FLUX1.1 [pro]',
      description: 'Geração de texto para imagem - Para criação desde zero',
      operation: 'text-to-image'
    }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateImageWithFlux = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, insira um prompt');
      return;
    }

    const selectedModelData = fluxModels.find(m => m.value === selectedModel);
    
    if ((selectedModel === 'flux-kontext' || selectedModel === 'flux-fill') && !uploadedImage) {
      toast.error('Este modelo requer uma imagem de entrada. Por favor, faça upload de uma imagem.');
      return;
    }

    setResult(null);
    
    try {
      console.log('🚀 Starting FLUX generation...');
      console.log('📊 Current state:', { selectedModel, prompt: prompt.trim(), uploadedImage: !!uploadedImage });
      
      let imageBase64: string | undefined;
      if (uploadedImage) {
        console.log('📷 Converting image to base64...');
        imageBase64 = await convertImageToBase64(uploadedImage);
        console.log('✅ Image converted, length:', imageBase64.length);
      }

      const params = {
        prompt: prompt.trim(),
        width: 1024,
        height: 1024,
        steps: 28,
        guidance: 7,
        operation: selectedModelData?.operation || 'text-to-image',
        input_image: imageBase64,
        strength: 0.8
      };
      
      console.log('📡 Calling generateImage with params:', {
        ...params,
        input_image: params.input_image ? `[BASE64 ${params.input_image.length} chars]` : undefined
      });

      const result = await generateImage(selectedModel, params);
      
      console.log('📥 Result received:', result);

      if (result?.success && result?.result_url) {
        setResult(result.result_url);
      } else {
        console.error('❌ Generation failed:', result);
      }
      
    } catch (err) {
      console.error('💥 Error generating image:', err);
      console.error('💥 Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause
      });
      toast.error(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">FLUX Generator com Upload</h1>
          <p className="text-muted-foreground">Teste os modelos FLUX com imagens enviadas</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>
              Configure o modelo FLUX e parâmetros de geração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Modelo FLUX</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fluxModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.label}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload de Imagem */}
            <div className="space-y-2">
              <Label>Imagem Base (necessária para Kontext e Fill)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-h-32 mx-auto rounded-lg object-contain"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={clearImage}>
                        <X className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <Button variant="secondary" size="sm" asChild>
                          <span>Trocar</span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                ) : (
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Upload className="h-6 w-6" />
                      <div className="text-center">
                        <p className="font-medium">Clique para upload</p>
                        <p className="text-xs">PNG, JPG até 10MB</p>
                      </div>
                    </div>
                  </Label>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prompt de Transformação</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva como transformar a imagem..."
                rows={3}
              />
            </div>

            <Button 
              onClick={generateImageWithFlux} 
              disabled={isProcessing || !prompt.trim()}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar com FLUX
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              A imagem transformada aparecerá aqui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
              {isProcessing ? (
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
                  <p className="text-muted-foreground">Gerando com FLUX...</p>
                  <p className="text-sm text-muted-foreground mt-2">Isso pode levar alguns minutos</p>
                </div>
              ) : result ? (
                <div className="w-full space-y-4">
                  <img 
                    src={result} 
                    alt="Generated image" 
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      console.error('Image failed to load:', result);
                      toast.error('Erro ao carregar a imagem');
                    }}
                  />
                  <div className="text-center">
                    <Button variant="outline" asChild>
                      <a href={result} download="flux-generated.jpg">
                        Download
                      </a>
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground break-all text-center">
                    {result}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>A imagem transformada aparecerá aqui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações sobre os modelos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sobre os Modelos FLUX</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fluxModels.map((model) => (
              <div key={model.value} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={selectedModel === model.value ? "default" : "outline"}>
                    {model.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{model.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}