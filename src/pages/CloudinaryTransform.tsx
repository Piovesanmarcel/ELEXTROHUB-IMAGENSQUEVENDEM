import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { safeBlobDownload } from "@/utils/safeDownload";
import { supabase } from "@/integrations/supabase/client";

const CloudinaryTransform = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [benefitText, setBenefitText] = useState("");
  const [transformedUrl, setTransformedUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransform = async () => {
    if (!imageUrl || !ctaText || !benefitText) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('cloudinary-transform', {
        body: {
          imageUrl,
          ctaText,
          benefitText,
        }
      });

      if (error) {
        throw new Error(error.message || `Erro HTTP: ${error}`);
      }
      
      if (data.transformedUrl) {
        setTransformedUrl(data.transformedUrl);
        toast.success("Imagem transformada com sucesso!");
      } else {
        throw new Error("URL da imagem transformada não retornada");
      }
    } catch (error) {
      console.error("Erro ao transformar imagem:", error);
      toast.error("Erro ao transformar a imagem");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!transformedUrl) return;

    try {
      const response = await fetch(transformedUrl);
      const blob = await response.blob();
      await safeBlobDownload(blob, `produto-transformado-${Date.now()}.jpg`);
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Erro no download:", error);
      toast.error("Erro ao fazer download da imagem");
    }
  };

  const handleReset = () => {
    setImageUrl("");
    setCtaText("");
    setBenefitText("");
    setTransformedUrl("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transformação de Imagens com Cloudinary
          </h1>
          <p className="text-lg text-gray-600">
            Adicione fundo branco, CTA e benefícios às suas imagens de produtos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Configuração da Transformação
              </CardTitle>
              <CardDescription>
                Insira a URL da imagem e os textos que deseja adicionar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              <div className="flex gap-2">
                <Button 
                  onClick={handleTransform} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Transformando...
                    </>
                  ) : (
                    "Transformar Imagem"
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview da Imagem */}
          <Card>
            <CardHeader>
              <CardTitle>Preview da Transformação</CardTitle>
              <CardDescription>
                {transformedUrl ? "Imagem transformada" : "A imagem aparecerá aqui após a transformação"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transformedUrl ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={transformedUrl}
                      alt="Imagem transformada"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download da Imagem
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-200 rounded-lg">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Imagem transformada aparecerá aqui
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações de uso */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold mb-2">1. Fundo Branco</div>
                <p>A imagem receberá automaticamente um fundo branco uniforme</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold mb-2">2. Texto CTA</div>
                <p>O texto do CTA será adicionado na parte superior da imagem</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold mb-2">3. Benefício</div>
                <p>O texto do benefício será posicionado logo abaixo do CTA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CloudinaryTransform;
