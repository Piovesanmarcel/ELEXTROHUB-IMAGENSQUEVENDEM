import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Download, Loader2, Sparkles, Type, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { safeBlobDownload } from "@/utils/safeDownload";
import { supabase } from "@/integrations/supabase/client";

const CloudinaryTransform = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [benefitText, setBenefitText] = useState("");
  const [transformedUrl, setTransformedUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string>("cta");
  const [imageMetadata, setImageMetadata] = useState<{ width: number; height: number } | null>(null);
  const [upscaleFile, setUpscaleFile] = useState<File | null>(null);
  const [upscalePreview, setUpscalePreview] = useState<string | null>(null);

  // Efeito para carregar metadados da imagem ao mudar a URL
  useEffect(() => {
    if (imageUrl && imageUrl.startsWith('http')) {
      const img = new Image();
      img.onload = () => {
        setImageMetadata({ width: img.width, height: img.height });
      };
      img.src = imageUrl;
    } else {
      setImageMetadata(null);
    }
  }, [imageUrl]);

  const handleTransform = async () => {
    if (mode === 'cta' && !imageUrl) {
      toast.error("Insira a URL da imagem");
      return;
    }

    if (mode === 'upscale' && !imageUrl && !upscalePreview) {
      toast.error("Insira uma URL ou faça upload de uma imagem");
      return;
    }

    if (mode === 'cta' && (!ctaText || !benefitText)) {
      toast.error("Preencha todos os campos obrigatórios para o tratamento de CTA");
      return;
    }

    console.log("🚀 INICIANDO TRANSFORMAÇÃO V4.3 - DADOS:", {
      mode,
      imageUrl: imageUrl ? `${imageUrl.substring(0, 30)}...` : 'URL vazia',
      hasPreview: !!upscalePreview,
      previewLength: upscalePreview?.length,
      previewPrefix: upscalePreview?.substring(0, 30)
    });

    setLoading(true);

    try {
      const payload = {
        imageUrl: mode === 'upscale' && upscalePreview ? upscalePreview : imageUrl,
        ctaText: mode === 'cta' ? ctaText : undefined,
        benefitText: mode === 'cta' ? benefitText : undefined,
        upscale: mode === 'upscale',
      };

      console.log("📤 PAYLOAD FINAL (tamanho aproximado):", JSON.stringify(payload).length);

      const { data, error } = await supabase.functions.invoke('cloudinary-transform', {
        body: payload
      });

      if (error) {
        throw new Error(error.message || `Erro HTTP: ${error}`);
      }

      if (data.success && data.transformedUrl) {
        setTransformedUrl(data.transformedUrl);
        toast.success(mode === 'upscale' ? "Imagem aprimorada com sucesso!" : "Imagem transformada com sucesso!");
      } else {
        throw {
          message: data.error || "URL da imagem transformada não retornada",
          details: data.details
        };
      }
    } catch (error: any) {
      console.error("Erro ao processar imagem:", error);
      const errorMessage = error.details || error.message || "Erro desconhecido";
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePing = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cloudinary-transform', {
        body: { ping: true }
      });
      if (error) throw error;
      if (data.success) {
        toast.success(`Conexão OK: ${data.message}`);
      } else {
        toast.error(`Falha no Ping: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Erro no ping:", err);
      toast.error(`Erro de Conectividade: ${err.message || 'Sem resposta da Edge Function'}`);
    }
  };

  const handleDownload = async () => {
    if (!transformedUrl) return;

    try {
      const response = await fetch(transformedUrl);
      const blob = await response.blob();
      await safeBlobDownload(blob, `produto-processado-${Date.now()}.jpg`);
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error("Erro ao fazer download da imagem");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máx 10MB)");
        return;
      }
      setUpscaleFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpscalePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setUpscaleFile(null);
    setUpscalePreview(null);
  };

  const handleReset = () => {
    setImageUrl("");
    setCtaText("");
    setBenefitText("");
    setTransformedUrl("");
    setUpscaleFile(null);
    setUpscalePreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Cloudinary Image Tools
          </h1>
          <p className="text-lg text-gray-600">
            Tratamento de CTA e Aprimoramento Generativo com base em IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Tabs value={mode} onValueChange={setMode} className="w-full">
              <div className="flex justify-between items-center mb-4 gap-4">
                <TabsList className="grid flex-1 grid-cols-2">
                  <TabsTrigger value="cta" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Tratamento CTA
                  </TabsTrigger>
                  <TabsTrigger value="upscale" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Upscale AI
                  </TabsTrigger>
                </TabsList>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePing}
                  className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 whitespace-nowrap"
                >
                  Testar Conexão
                </Button>
              </div>

              <TabsContent value="cta" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-purple-600" />
                      Configuração de CTA
                    </CardTitle>
                    <CardDescription>
                      Adicione fundo branco e textos de marketing à sua imagem
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">URL da Imagem *</Label>
                      <Input
                        id="imageUrl"
                        type="url"
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ctaText">Texto do CTA *</Label>
                      <Input
                        id="ctaText"
                        placeholder="Ex: Compre Agora"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="benefitText">Texto do Benefício *</Label>
                      <Textarea
                        id="benefitText"
                        placeholder="Ex: Frete grátis para todo o Brasil"
                        value={benefitText}
                        onChange={(e) => setBenefitText(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleTransform}
                        disabled={loading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          "Adicionar CTA"
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleReset}>
                        Limpar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upscale" className="mt-0">
                <Card className="border-indigo-200 bg-white shadow-md">
                  <CardHeader className="bg-indigo-50/50">
                    <CardTitle className="flex items-center gap-2 text-indigo-900">
                      <Sparkles className="h-5 w-5 text-indigo-500" />
                      Aprimoramento Generativo
                    </CardTitle>
                    <CardDescription className="text-indigo-700">
                      Aumente a resolução e nitidez da imagem usando IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="upscaleImageUrl" className="text-indigo-900 font-medium">Upload da Imagem para Upscale *</Label>

                        {!upscalePreview ? (
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-xl p-8 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors cursor-pointer relative group">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleFileChange}
                            />
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                              <Upload className="h-8 w-8 text-indigo-500" />
                            </div>
                            <p className="text-sm font-semibold text-indigo-900">Clique para fazer upload</p>
                            <p className="text-xs text-indigo-600 mt-1">ou arraste e solte o arquivo (JPG, PNG)</p>
                          </div>
                        ) : (
                          <div className="relative rounded-xl border border-indigo-200 overflow-hidden bg-indigo-50/20">
                            <img
                              src={upscalePreview}
                              alt="Upload preview"
                              className="w-full h-48 object-contain bg-white"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8 rounded-full shadow-lg"
                                onClick={clearFile}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="p-3 bg-white/80 backdrop-blur-sm border-t border-indigo-100 flex items-center justify-between">
                              <span className="text-xs font-medium text-indigo-900 truncate max-w-[200px]">
                                {upscaleFile?.name}
                              </span>
                              <span className="text-[10px] text-indigo-500">
                                {upscaleFile ? (upscaleFile.size / (1024 * 1024)).toFixed(2) : "0.00"} MB
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-indigo-100"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-indigo-400">ou use uma URL</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Input
                          id="upscaleImageUrl"
                          type="url"
                          placeholder="https://exemplo.com/imagem.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="border-indigo-100 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-md shadow-sm">
                          <ImageIcon className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-indigo-900">Informações Técnicas</p>
                          <p className="text-xs text-indigo-700">A IA irá reconstruir detalhes perdidos e remover artefatos de compressão.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleTransform}
                        disabled={loading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Aprimorando...
                          </>
                        ) : (
                          "Iniciar Upscale Beta"
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleReset} className="border-indigo-100 text-indigo-700 hover:bg-indigo-50">
                        Limpar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview da Imagem */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Preview do Resultado</CardTitle>
              <CardDescription>
                {transformedUrl ? "Imagem processada pronta para uso" : "O resultado aparecerá aqui após o processamento"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transformedUrl ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-white">
                    <img
                      src={transformedUrl}
                      alt="Resultado Cloudinary"
                      className="w-full h-auto max-h-[500px] object-contain"
                    />
                  </div>
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download da Imagem
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Selecione uma ferramenta e processe a imagem
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações de Créditos */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-indigo-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">Uso de Créditos Cloudinary</h3>
                  <p className="text-sm text-indigo-700">Upscale Generativo consome aproximadamente 0.1 crédito por imagem no plano Free.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryTransform;
