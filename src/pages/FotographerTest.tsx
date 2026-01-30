import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, Image as ImageIcon, Wand2 } from "lucide-react";
import { useFotographerBackground } from "@/hooks/useFotographerBackground";
import { useSafeDownload } from "@/hooks/useSafeDownload";
import { toast } from "@/components/ui/use-toast";

const FotographerTest = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("professional product photography background, clean studio lighting");
  const [style, setStyle] = useState("realistic");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  const { generateBackground, isProcessing, progress } = useFotographerBackground();
  const { downloadFile } = useSafeDownload();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageUrl) {
      toast({
        title: "Erro",
        description: "Por favor, adicione uma imagem primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateBackground(imageUrl, prompt, style);
      if (result.success && result.background_url) {
        setGeneratedImage(result.background_url);
      }
    } catch (error) {
      console.error("Erro ao gerar background:", error);
    }
  };

  const handleDownload = async () => {
    if (generatedImage) {
      try {
        await downloadFile(generatedImage, `fotographer-background-${Date.now()}.jpg`);
      } catch (error) {
        console.error("Erro no download:", error);
        toast({
          title: "Erro no download",
          description: "Não foi possível fazer o download da imagem",
          variant: "destructive",
        });
      }
    }
  };

  const testImages = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Teste Fotographer.ai API
          </h1>
          <p className="text-muted-foreground">
            Teste a geração de backgrounds com IA para suas imagens de produtos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuração */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Configuração do Teste
              </CardTitle>
              <CardDescription>
                Configure a imagem e os parâmetros para gerar o background
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label htmlFor="image-upload">Imagem do Produto</Label>
                <div className="flex flex-col gap-4">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  
                  {/* Imagens de Teste */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Ou use uma imagem de teste:
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {testImages.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Teste ${index + 1}`}
                          className="w-full h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-primary transition-colors"
                          onClick={() => {
                            setImageUrl(url);
                            setOriginalImage(url);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Manual */}
              <div className="space-y-2">
                <Label htmlFor="image-url">URL da Imagem</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt para o Background</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Descreva o background desejado..."
                  rows={3}
                />
              </div>

              {/* Estilo */}
              <div className="space-y-2">
                <Label htmlFor="style">Estilo</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realista</SelectItem>
                    <SelectItem value="artistic">Artístico</SelectItem>
                    <SelectItem value="minimal">Minimalista</SelectItem>
                    <SelectItem value="elegant">Elegante</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progresso */}
              {isProcessing && (
                <div className="space-y-2">
                  <Label>Processando...</Label>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {progress}% concluído
                  </p>
                </div>
              )}

              {/* Botão de Gerar */}
              <Button
                onClick={handleGenerate}
                disabled={!imageUrl || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  "Gerando Background..."
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Gerar Background
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Resultado
              </CardTitle>
              <CardDescription>
                Compare a imagem original com o background gerado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Imagem Original */}
              {originalImage && (
                <div className="space-y-2">
                  <Label>Imagem Original</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Imagem Gerada */}
              {generatedImage && (
                <div className="space-y-2">
                  <Label>Background Gerado</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={generatedImage}
                      alt="Background gerado"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Imagem
                  </Button>
                </div>
              )}

              {/* Estado vazio */}
              {!originalImage && !generatedImage && (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="mx-auto h-12 w-12 opacity-50 mb-4" />
                  <p>Adicione uma imagem e gere um background para ver os resultados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações da API */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="font-medium">API Endpoint</Label>
                <p className="text-muted-foreground">Fotographer.ai Background Generation</p>
              </div>
              <div>
                <Label className="font-medium">Status</Label>
                <p className={isProcessing ? "text-yellow-600" : "text-green-600"}>
                  {isProcessing ? "Processando..." : "Pronto"}
                </p>
              </div>
              <div>
                <Label className="font-medium">Última Execução</Label>
                <p className="text-muted-foreground">
                  {generatedImage ? "Sucesso" : "Nenhuma"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FotographerTest;