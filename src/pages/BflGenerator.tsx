import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Download, Eye, Loader2, Upload, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BflGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("flux-pro-1.1");
  const [width, setWidth] = useState("1024");
  const [height, setHeight] = useState("1024");
  const [seed, setSeed] = useState("");
  const [steps, setSteps] = useState("28");
  const [guidance, setGuidance] = useState("3.5");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [backgroundMode, setBackgroundMode] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Direct API call states
  const [apiKey, setApiKey] = useState("");
  const [directApiMode, setDirectApiMode] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [pollingUrl, setPollingUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Prompt generator states
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [multiGeneratedImages, setMultiGeneratedImages] = useState<string[]>([]);

  // White background generation states
  const [selectedImagesForWhiteBg, setSelectedImagesForWhiteBg] = useState<string[]>([]);
  const [whiteBgImages, setWhiteBgImages] = useState<string[]>([]);
  const [isGeneratingWhiteBg, setIsGeneratingWhiteBg] = useState(false);

  const models = [
    { 
      value: "flux-pro-1.1", 
      label: "FLUX1.1 [pro]", 
      description: "Fast & reliable standard - State-of-the-art speed with consistent results",
      price: "$0.04"
    },
    { 
      value: "flux-kontext", 
      label: "FLUX.1 Kontext", 
      description: "Advanced editing + generation - Most versatile model with editing capabilities",
      price: "$0.04"
    },
    { 
      value: "flux-pro-1.1-ultra", 
      label: "FLUX1.1 [pro] Ultra", 
      description: "Ultra-high resolution - Generate up to 4MP images with Raw mode",
      price: "$0.06"
    },
    { 
      value: "flux-fill", 
      label: "FLUX.1 Fill", 
      description: "Targeted image editing - Fast text-driven inpainting and outpainting",
      price: "$0.05"
    }
  ];

  const aspectRatios = [
    { label: "1:1 (1024x1024)", width: "1024", height: "1024" },
    { label: "16:9 (1792x1024)", width: "1792", height: "1024" },
    { label: "9:16 (1024x1792)", width: "1024", height: "1792" },
    { label: "4:3 (1536x1152)", width: "1536", height: "1152" },
    { label: "3:4 (1152x1536)", width: "1152", height: "1536" },
    { label: "21:9 (2048x896)", width: "2048", height: "896" }
  ];

  const handleGenerate = async () => {
    console.log('🎯 handleGenerate called');
    
    if (!prompt.trim()) {
      console.log('❌ No prompt provided');
      toast.error("Por favor, insira um prompt para gerar a imagem");
      return;
    }

    console.log('✅ Starting generation process');
    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('🚀 Calling BFL function directly...');
      console.log('🔧 Supabase client status:', !!supabase);
      setProgress(25);

      // Determine operation and model based on uploaded image
      const hasInputImage = !!uploadedImage;
      const operation = hasInputImage ? 'image-to-image' : 'text-to-image';
      const recommendedModel = hasInputImage ? 'flux-kontext-pro' : selectedModel; // Use flux-kontext-pro for image editing
      
      console.log('🖼️ Has input image:', hasInputImage);
      console.log('🔧 Operation:', operation);
      console.log('🤖 Using model:', recommendedModel);

      // Build request body
      const requestBody: any = {
        prompt: prompt.trim(),
        width: parseInt(width) || 1024,
        height: parseInt(height) || 1024,
        steps: parseInt(steps) || 28,
        guidance: parseFloat(guidance) || 7,
        model: recommendedModel,
        operation: operation
      };

      // Add image-to-image specific parameters
      if (hasInputImage) {
        console.log('🖼️ Converting uploaded image to base64...');
        const base64Image = await convertImageToBase64(uploadedImage);
        requestBody.input_image = base64Image;
        requestBody.strength = 0.3; // LOWER strength - preserve more of original image
        console.log('✅ Image converted to base64, length:', base64Image.length);
        
        // Force the prompt to reference the original image
        requestBody.prompt = `Based on the provided input image, ${prompt.trim()}. Keep the original composition and main elements, only modify according to the description.`;
        console.log('📝 Enhanced prompt:', requestBody.prompt);
      }
      
      // Only add seed if it's valid
      if (seed && !isNaN(parseInt(seed))) {
        requestBody.seed = parseInt(seed);
      }

      console.log('📡 About to call supabase.functions.invoke with body:', JSON.stringify({...requestBody, input_image: requestBody.input_image ? '[BASE64_DATA]' : undefined}, null, 2));
      console.log('📡 Function name: bfl-test');
      
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('bfl-test', {
        body: requestBody
      });
      const endTime = Date.now();
      
      console.log(`⏱️ Function call took ${endTime - startTime}ms`);
      console.log('📥 Function response data:', data);
      console.log('📥 Function error:', error);
      setProgress(75);

      if (error) {
        console.error('💥 Error details:', error);
        toast.error(`Erro na função: ${error.message}`);
        return;
      }

      if (data?.success && (data?.result_base64 || data?.result_url)) {
        // Prefer base64 over URL to avoid CORS issues with expired signed URLs
        const imageToUse = data.result_base64 || data.result_url;
        setGeneratedImage(imageToUse);
        toast.success('Imagem gerada com sucesso!');
        setProgress(100);
      } else {
        toast.error('Falha na geração da imagem');
        console.error('Response data:', data);
      }

    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleAspectRatioChange = (ratio: string) => {
    const selected = aspectRatios.find(ar => ar.label === ratio);
    if (selected) {
      setWidth(selected.width);
      setHeight(selected.height);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setBackgroundMode(true);
      if (!prompt.trim()) {
        setPrompt("Crie um fundo profissional e ambientado para este produto");
      }
    }
  };

  const clearImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setBackgroundMode(false);
  };

  // Convert image to base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Direct API call functions
  const handleDirectApiCall = async () => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua API Key da BFL");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Por favor, insira um prompt para gerar a imagem");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setApiResponse(null);
    setPollingUrl(null);

    try {
      console.log('🚀 Making direct BFL API call...');
      setProgress(25);

      // Prepare request body exactly as BFL API expects
      const requestBody: any = {
        prompt: prompt.trim(),
        width: parseInt(width) || 1024,
        height: parseInt(height) || 1024,
        steps: parseInt(steps) || 28,
        guidance: parseFloat(guidance) || 7,
        safety_tolerance: 2
      };

      // Only add seed if it's valid
      if (seed && !isNaN(parseInt(seed))) {
        requestBody.seed = parseInt(seed);
      }

      console.log('📡 Direct API Request body:', JSON.stringify(requestBody, null, 2));

      // Determine endpoint based on model
      let endpoint = `https://api.bfl.ml/v1/${selectedModel}`;
      if (selectedModel === "flux-fill") {
        endpoint = `https://api.bfl.ml/v1/flux-fill-pro`;
      }

      // Make initial POST request
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 BFL API Response Status:', response.status);
      const initData = await response.json();
      console.log('📥 BFL API Response:', JSON.stringify(initData, null, 2));

      setApiResponse(initData);
      setProgress(50);

      if (!initData.id || !initData.polling_url) {
        toast.error("Falha ao iniciar geração na API da BFL");
        console.error("Invalid BFL response:", initData);
        return;
      }

      // Start polling
      setPollingUrl(initData.polling_url);
      toast.success("Geração iniciada! Fazendo polling...");
      
      await pollForResult(initData.polling_url, apiKey);

    } catch (error) {
      console.error("Erro na chamada direta da API:", error);
      toast.error(`Erro: ${error.message}`);
      setApiResponse({ error: error.message });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const pollForResult = async (pollingUrl: string, apiKey: string) => {
    setIsPolling(true);
    const maxAttempts = 60; // 5 minutes with 5s intervals
    let attempt = 0;

    while (attempt < maxAttempts && isProcessing) {
      try {
        console.log(`⏳ Polling attempt ${attempt + 1}/${maxAttempts}...`);
        setProgress(50 + (attempt / maxAttempts) * 40); // 50% to 90%

        await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
        
        const pollResponse = await fetch(pollingUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "X-Key": apiKey,
          },
        });

        const pollData = await pollResponse.json();
        console.log(`📊 Poll ${attempt + 1} response:`, JSON.stringify(pollData, null, 2));
        
        setApiResponse(pollData);

        if (pollData.status === "Ready" && pollData.result?.sample) {
          console.log("🎉 Image generation completed!");
          setGeneratedImage(pollData.result.sample);
          toast.success("Imagem gerada com sucesso via API direta!");
          setProgress(100);
          setIsPolling(false);
          return;
        }

        if (pollData.status === "Error") {
          console.error("❌ BFL generation error:", pollData);
          toast.error("Erro na geração da imagem");
          setIsPolling(false);
          return;
        }

        attempt++;
      } catch (error) {
        console.error("Erro no polling:", error);
        attempt++;
      }
    }

    if (attempt >= maxAttempts) {
      toast.error("Timeout: imagem não foi gerada no tempo esperado");
    }
    
    setIsPolling(false);
  };

  const handlePromptsGenerated = (prompts: string[]) => {
    console.log('📝 Prompts gerados recebidos:', prompts);
    setGeneratedPrompts(prompts);
  };

  const handleMultiImagesGenerated = (images: string[]) => {
    console.log('🖼️ Imagens múltiplas geradas:', images);
    setMultiGeneratedImages(images);
  };

  // White background generation functions
  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImagesForWhiteBg(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else if (prev.length < 2) {
        return [...prev, imageUrl];
      } else {
        toast.error("Selecione no máximo 2 imagens");
        return prev;
      }
    });
  };

  const handleGenerateWhiteBgImages = async () => {
    if (selectedImagesForWhiteBg.length === 0) {
      toast.error("Selecione pelo menos 1 imagem para gerar fundo branco");
      return;
    }

    setIsGeneratingWhiteBg(true);
    const newWhiteBgImages: string[] = [];
    
    try {
      const fixedPrompt = `CRITICAL INSTRUCTION — PURE WHITE BACKGROUND ONLY (#FFFFFF, RGB 255,255,255)

Using the provided reference image as the ONLY visual reference,
RECREATE the product in its ORIGINAL design and identity,
but NOT by copying the low-resolution pixels of the reference image.

The goal is to faithfully reconstruct the product at MAXIMUM QUALITY,
preserving its original shape, proportions, colors, materials, textures,
logos, labels and finishes, while enhancing clarity, sharpness,
micro-details and realism beyond the source image.

Do NOT redesign, reinterpret or stylize the product.
This is a high-resolution reconstruction, not a modification.

COMPOSITION:
The product must be PERFECTLY CENTERED and LARGE,
occupying approximately 85–90% of the image area,
fully visible, no cropping, dominant in the frame,
optimized for marketplace listings.

BACKGROUND:
100% pure white seamless background (#FFFFFF),
no environment, no scene, no context, no surface,
no horizon line, no gradients.

LIGHTING & SHADOW:
Professional studio lighting with physically accurate light behavior,
even and controlled illumination.
Add ONLY a soft, subtle, natural shadow beneath the product
to anchor it to the white background.
No dramatic, hard or artistic shadows.

DETAIL & QUALITY:
Ultra-realistic professional product photography,
true 4K or higher resolution,
razor-sharp focus across the entire product,
accurate color reproduction (color-matched to the real product),
high dynamic range (HDR),
global illumination,
realistic material response.

Capture and enhance ALL authentic micro-details:
textures, stitching, grain, surface imperfections,
material finishes and edges,
with surgical precision — without inventing details.

STYLE:
Clean, neutral, premium e-commerce look.
Looks like a high-end DSLR studio photograph
made specifically for Amazon and major marketplaces.
No artistic interpretation.`;
      
      // Enhanced negative prompt for strict white background enforcement
      const negativePrompt = "NO redesign, NO shape change, NO color shift, NO exaggeration, NO stylization, NO CGI look, NO cartoon or illustration, NO artificial textures, NO invented details, NO background elements, NO props, NO text, NO watermark, NO reflections artifacts, NO blur, NO noise, NO vignette, NO dramatic shadows, NO environment";
      
      console.log('🎨 Gerando fundo branco para imagens:', selectedImagesForWhiteBg);
      console.log('📝 Prompt fixo:', fixedPrompt);
      console.log('🚫 Negative prompt:', negativePrompt);
      
      for (let i = 0; i < selectedImagesForWhiteBg.length; i++) {
        const imageUrl = selectedImagesForWhiteBg[i];
        
        // Convert image URL to base64 (or use directly if already base64)
        let base64Image: string;
        
        if (imageUrl.startsWith('data:image/')) {
          // Already a base64 data URL
          base64Image = imageUrl;
          console.log('✅ Using existing base64 data URL');
        } else {
          // Convert URL to base64
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          base64Image = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          console.log('🔄 Converted URL to base64');
        }

        const requestBody = {
          prompt: fixedPrompt,
          input_image: base64Image,
          width: 1024,
          height: 1024,
          steps: 32,
          guidance: 1.1,
          model: 'flux-kontext',
          operation: 'image-to-image',
          strength: 0.1, // Baixo para preservar produto
          negative_prompt: negativePrompt
        };

        console.log(`🚀 Chamando BFL para imagem ${i + 1}/${selectedImagesForWhiteBg.length}`);
        
        const { data, error } = await supabase.functions.invoke('bfl-test', {
          body: requestBody
        });

        if (error) {
          console.error('❌ Erro na geração:', error);
          throw new Error(error.message);
        }

        if (data?.success && (data?.result_base64 || data?.result_url)) {
          // Prefer base64 over URL to avoid CORS issues
          const imageToUse = data.result_base64 || data.result_url;
          newWhiteBgImages.push(imageToUse);
          console.log(`✅ Imagem ${i + 1} gerada com sucesso`);
        } else {
          throw new Error('Falha na geração da imagem');
        }
      }
      
      setWhiteBgImages(newWhiteBgImages);
      toast.success(`${newWhiteBgImages.length} imagem(ns) com fundo branco gerada(s) com sucesso!`);
      
    } catch (error) {
      console.error('❌ Erro ao gerar fundo branco:', error);
      toast.error(`Erro ao gerar fundo branco: ${error.message}`);
    } finally {
      setIsGeneratingWhiteBg(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">BFL.ai Editor de Imagens</h1>
          <p className="text-muted-foreground">
            {uploadedImage 
              ? "Edite imagens com instruções de texto usando FLUX Kontext" 
              : "Gere ou edite imagens com os modelos FLUX da Black Forest Labs"
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configurações */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configurações de Geração</CardTitle>
            <CardDescription>
              Configure os parâmetros para gerar sua imagem com BFL.ai
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="advanced">Avançado</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo FLUX</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div className="flex justify-between items-center w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {model.price}/img
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Descreva a imagem que você quer gerar..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Proporção da Imagem</Label>
                  <Select onValueChange={handleAspectRatioChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma proporção" />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.label} value={ratio.label}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload de Imagem do Produto</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="max-h-48 mx-auto rounded-lg object-contain"
                        />
                        <div className="flex gap-2 justify-center">
                          <Button variant="outline" size="sm" onClick={clearImage}>
                            Remover
                          </Button>
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <Button variant="secondary" size="sm" asChild>
                              <span>Trocar Imagem</span>
                            </Button>
                          </Label>
                        </div>
                      </div>
                    ) : (
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Upload className="h-8 w-8" />
                          <div>
                            <p className="font-medium">Clique para fazer upload</p>
                            <p className="text-sm">PNG, JPG até 10MB</p>
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

                {backgroundMode && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Modo Fundo Ambientado Ativo</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Descreva o ambiente ou fundo que você deseja criar para seu produto. 
                      O BFL.ai irá gerar um fundo profissional mantendo o produto em destaque.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Largura</Label>
                    <Input
                      id="width"
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      min="256"
                      max="2048"
                      step="64"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura</Label>
                    <Input
                      id="height"
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      min="256"
                      max="2048"
                      step="64"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seed">Seed (opcional)</Label>
                  <Input
                    id="seed"
                    type="number"
                    placeholder="Deixe vazio para aleatório"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                </div>

                {selectedModel === "flux-pro-1.1" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="steps">Steps: {steps}</Label>
                      <Input
                        id="steps"
                        type="range"
                        min="1"
                        max="50"
                        value={steps}
                        onChange={(e) => setSteps(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="guidance">Guidance: {guidance}</Label>
                      <Input
                        id="guidance"
                        type="range"
                        min="1.0"
                        max="20.0"
                        step="0.1"
                        value={guidance}
                        onChange={(e) => setGuidance(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleGenerate} 
              disabled={isProcessing || !prompt.trim()}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadedImage ? "Editando Imagem..." : "Gerando Imagem..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {uploadedImage ? "Editar com IA" : "Gerar Imagem"}
                </>
              )}
            </Button>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              Sua imagem gerada aparecerá aqui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
              {isProcessing ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Gerando sua imagem...</p>
                  <p className="text-sm text-muted-foreground mt-2">Isso pode levar alguns minutos</p>
                </div>
              ) : generatedImage ? (
                <div className="w-full">
                  <img 
                    src={generatedImage} 
                    alt="Imagem gerada" 
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      console.error('Image failed to load:', generatedImage);
                      toast.error('Erro ao carregar a imagem');
                    }}
                  />
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button variant="outline" size="sm" asChild>
                      <a href={generatedImage} download="bfl-generated-image.jpg">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={generatedImage} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Original
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>A imagem gerada aparecerá aqui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Componentes principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>
              Configure os parâmetros para geração de imagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Use os controles acima para configurar e gerar imagens.
            </p>
          </CardContent>
        </Card>

        {/* Galeria ou espaço reservado */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
            <CardDescription>
              Suas imagens geradas aparecerão aqui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Aguardando geração...</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultado da Geração Múltipla */}
      {multiGeneratedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imagens Geradas - Geração Múltipla</CardTitle>
            <CardDescription>
              {multiGeneratedImages.length} imagens geradas com prompts diferentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* White Background Selection UI */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">🎨 Gerar Fundo Branco</h3>
                    <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedImagesForWhiteBg.length}/2 selecionadas
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateWhiteBgImages}
                    disabled={selectedImagesForWhiteBg.length === 0 || isGeneratingWhiteBg}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isGeneratingWhiteBg ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        🎨 Gerar Fundo Branco nas {selectedImagesForWhiteBg.length > 0 ? selectedImagesForWhiteBg.length : ''} Imagem{selectedImagesForWhiteBg.length !== 1 ? 'ns' : ''} Selecionada{selectedImagesForWhiteBg.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Clique nas imagens abaixo para selecioná-las (máximo 2) e gerar versões com fundo 100% branco.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {multiGeneratedImages.map((imageUrl, index) => {
                  const isSelected = selectedImagesForWhiteBg.includes(imageUrl);
                  return (
                    <div key={index} className="space-y-2">
                      <div 
                        className={`aspect-square border-2 rounded-lg overflow-hidden bg-muted/50 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-blue-500 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800' 
                            : 'border-muted hover:border-blue-300'
                        }`}
                        onClick={() => toggleImageSelection(imageUrl)}
                      >
                        <div className="relative h-full">
                          <img 
                            src={imageUrl} 
                            alt={`Imagem gerada ${index + 1}`} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              ✓
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-black/70 text-white rounded px-2 py-1 text-xs">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(imageUrl, '_blank');
                          }}
                          className="flex-1 text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = `bfl-multi-${index + 1}.jpg`;
                            link.click();
                          }}
                          className="flex-1 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado Fundo Branco */}
      {whiteBgImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🤍 Imagens com Fundo Branco
              <Badge variant="secondary">{whiteBgImages.length} gerada{whiteBgImages.length !== 1 ? 's' : ''}</Badge>
            </CardTitle>
            <CardDescription>
              Versões com fundo 100% branco das suas imagens selecionadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {whiteBgImages.map((imageUrl, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-square border border-muted rounded-lg overflow-hidden bg-white">
                    <img 
                      src={imageUrl} 
                      alt={`Fundo branco ${index + 1}`} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(imageUrl, '_blank')}
                      className="flex-1 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `fundo-branco-${index + 1}.png`;
                        link.click();
                      }}
                      className="flex-1 text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre os modelos */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre os Modelos FLUX</CardTitle>
          <CardDescription>
            Entenda as diferenças entre os modelos disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((model) => (
              <div key={model.value} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{model.label}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {model.price}/imagem
                    </Badge>
                    {model.value === selectedModel && (
                      <Badge variant="secondary">Selecionado</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{model.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Direta Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Chamada Direta à API da BFL
          </CardTitle>
          <CardDescription>
            Faça chamadas POST diretas à API da Black Forest Labs para testes avançados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key da BFL</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Insira sua API Key da Black Forest Labs..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Sua API key será usada apenas para esta sessão e não será armazenada.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleDirectApiCall}
                disabled={isProcessing || !prompt.trim() || !apiKey.trim()}
                variant="outline"
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPolling ? "Fazendo Polling..." : "Processando..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Chamada POST Direta
                  </>
                )}
              </Button>
            </div>

            {pollingUrl && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Polling URL:</p>
                <p className="text-xs text-muted-foreground break-all">{pollingUrl}</p>
              </div>
            )}

            {apiResponse && (
              <div className="space-y-2">
                <Label>Resposta da API</Label>
                <div className="border rounded-lg p-4 bg-muted/50 max-h-96 overflow-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <h4 className="font-semibold text-sm mb-2">Documentação da API</h4>
            <div className="text-xs text-muted-foreground space-y-2">
              <p><strong>Endpoint:</strong> https://api.bfl.ml/v1/{`{model}`}</p>
              <p><strong>Método:</strong> POST</p>
              <p><strong>Headers:</strong></p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Content-Type: application/json</li>
                <li>Authorization: Bearer YOUR_API_TOKEN</li>
                <li>X-Key: YOUR_API_TOKEN</li>
              </ul>
              <p><strong>Body:</strong> JSON com prompt, width, height, steps, guidance, etc.</p>
              <p><strong>Resposta:</strong> Retorna um task_id e polling_url para verificar o status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BflGenerator;