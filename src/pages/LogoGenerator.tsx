
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Sparkles, Type } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface GeneratedLogo {
  id: number;
  imageUrl: string;
  prompt: string;
}

export default function LogoGenerator() {
  const [phrase, setPhrase] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [logos, setLogos] = useState<GeneratedLogo[]>([]);

  const generateLogos = async () => {
    if (!phrase.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma frase para gerar os logos.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setLogos([]);

    try {
      const logoPromises = Array.from({ length: 20 }, (_, index) => {
        const styles = [
          "minimalist modern logo",
          "elegant typography logo",
          "geometric abstract logo",
          "vintage retro logo",
          "clean corporate logo",
          "creative artistic logo",
          "tech startup logo",
          "luxury brand logo",
          "playful colorful logo",
          "monochrome sophisticated logo",
          "circular badge logo",
          "letter mark logo",
          "icon-based logo",
          "hand-drawn style logo",
          "3D modern logo",
          "watercolor artistic logo",
          "bold typography logo",
          "gradient modern logo",
          "line art logo",
          "emblem style logo"
        ];

        const style = styles[index % styles.length];
        const logoPrompt = `${style} design for "${phrase}", professional, clean, vector style, white background, high quality`;

        return fetch('/api/generate-logo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: logoPrompt }),
        }).then(async (response) => {
          if (!response.ok) throw new Error('Falha na geração');
          const data = await response.json();
          return {
            id: index + 1,
            imageUrl: data.image,
            prompt: logoPrompt,
          };
        });
      });

      const results = await Promise.allSettled(logoPromises);
      const successfulLogos = results
        .filter((result): result is PromiseFulfilledResult<GeneratedLogo> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      setLogos(successfulLogos);

      if (successfulLogos.length === 0) {
        throw new Error('Nenhum logo foi gerado com sucesso');
      }

      toast({
        title: "Sucesso!",
        description: `${successfulLogos.length} logos foram gerados com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar logos:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar logos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLogo = async (logoUrl: string, index: number) => {
    const fileName = `logo-${phrase.replace(/\s+/g, '-').toLowerCase()}-${index}.png`;
    try {
      // Use método seguro de download
      const { safeDownload } = await import('@/utils/safeDownload');
      safeDownload(logoUrl, fileName);
    } catch (error) {
      console.error('Erro ao baixar logo:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Gerador de Logos
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Crie logos profissionais em segundos! Digite sua frase e gere 20 variações únicas de logos para escolher.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 shadow-lg border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Type className="h-5 w-5" />
              Informações do Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phrase" className="text-gray-700 font-medium">
                Frase ou Nome da Marca
              </Label>
              <Input
                id="phrase"
                type="text"
                placeholder="Ex: Minha Empresa, TechStart, Creative Studio..."
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                className="mt-2 border-purple-200 focus:border-purple-400"
                disabled={isGenerating}
              />
            </div>
            <Button
              onClick={generateLogos}
              disabled={isGenerating || !phrase.trim()}
              className="w-full gradient-primary h-12 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Gerando 20 Logos...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerar 20 Logos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {isGenerating && (
          <Card className="mb-8 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  Criando seus logos...
                </h3>
                <p className="text-gray-600">
                  Gerando 20 variações únicas do seu logo. Isso pode levar alguns minutos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Logos Grid */}
        {logos.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Seus Logos Gerados ({logos.length} de 20)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {logos.map((logo) => (
                <Card key={logo.id} className="group hover:shadow-xl transition-all duration-300 border-gray-200">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden border border-gray-100">
                      <img
                        src={logo.imageUrl}
                        alt={`Logo ${logo.id} para ${phrase}`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3 font-medium">
                        Logo #{logo.id}
                      </p>
                      <Button
                        onClick={() => downloadLogo(logo.imageUrl, logo.id)}
                        variant="outline"
                        size="sm"
                        className="w-full text-purple-600 border-purple-300 hover:bg-purple-50"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && logos.length === 0 && (
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
            <CardContent className="p-12 text-center">
              <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Pronto para criar seus logos?
              </h3>
              <p className="text-gray-500">
                Digite o nome da sua marca ou frase no campo acima e clique em "Gerar 20 Logos"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
