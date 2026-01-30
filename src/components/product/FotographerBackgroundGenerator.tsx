import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Sparkles, Download, Eye } from 'lucide-react';
import { useFotographerBackground } from '@/hooks/useFotographerBackground';
import { useAIImagesCache } from '@/hooks/useAIImagesCache';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSafeDownload } from '@/hooks/useSafeDownload';
import { AIGeneratedImagesGrid } from './AIGeneratedImagesGrid';

interface FotographerBackgroundGeneratorProps {
  images: string[];
  productName: string;
  productId: string;
}

export const FotographerBackgroundGenerator = ({ 
  images, 
  productName, 
  productId 
}: FotographerBackgroundGeneratorProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [prompt, setPrompt] = useState(`Professional product photography background for ${productName}, clean studio lighting, modern aesthetic`);
  const [style, setStyle] = useState('realistic');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Cache de sessão para imagens geradas (array para compatibilidade)
  const { cachedImages, saveToCache } = useAIImagesCache(productId, 'Fotographer AI');

  const { generateBackground, isProcessing, progress } = useFotographerBackground();
  const { downloadFile } = useSafeDownload();

  // Restaurar cache ao montar componente
  useEffect(() => {
    if (cachedImages.length > 0 && !generatedImage) {
      setGeneratedImage(cachedImages[cachedImages.length - 1]); // Última imagem gerada
      console.log(`🔄 [FOTOGRAPHER] Imagem restaurada do cache`);
    }
  }, [cachedImages, generatedImage]);

  // Salvar no cache sempre que gerar nova imagem
  useEffect(() => {
    if (generatedImage) {
      const updatedImages = cachedImages.includes(generatedImage) 
        ? cachedImages 
        : [...cachedImages, generatedImage];
      saveToCache(updatedImages);
    }
  }, [generatedImage]);

  const handleGenerateBackground = async () => {
    if (!images[selectedImageIndex]) {
      return;
    }

    try {
      const result = await generateBackground(images[selectedImageIndex], prompt, style);
      
      if (result.success && result.background_url) {
        setGeneratedImage(result.background_url);
      }
    } catch (error) {
      console.error('Erro ao gerar background:', error);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const filename = `${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_background_${Date.now()}.jpg`;
      await downloadFile(generatedImage, filename);
    } catch (error) {
      console.error('Erro no download:', error);
    }
  };

  const backgroundStyles = [
    { value: 'realistic', label: 'Realista' },
    { value: 'fantasy', label: 'Fantasia' },
    { value: 'premium', label: 'Premium' },
    { value: 'minimal', label: 'Minimalista' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'studio', label: 'Estúdio' }
  ];

  if (!images || images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Gerador de Background - Fotographer.ai
          </CardTitle>
          <CardDescription>
            Nenhuma imagem disponível para gerar background
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Gerador de Background - Fotographer.ai
        </CardTitle>
        <CardDescription>
          Gere backgrounds profissionais ambientados para suas imagens de produto usando IA
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seleção de Imagem */}
        <div className="space-y-2">
          <Label>Selecionar Imagem</Label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {images.map((image, index) => (
              <div
                key={index}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedImageIndex === index 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={image}
                  alt={`${productName} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      ✓
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="style">Estilo do Background</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estilo" />
              </SelectTrigger>
              <SelectContent>
                {backgroundStyles.map((styleOption) => (
                  <SelectItem key={styleOption.value} value={styleOption.value}>
                    {styleOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prompt personalizado */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Descrição do Background (Prompt)</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva o tipo de background que você deseja..."
            className="min-h-[80px]"
          />
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Gerando background...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Botão de Gerar */}
        <Button
          onClick={handleGenerateBackground}
          disabled={isProcessing || !images[selectedImageIndex]}
          className="w-full"
          size="lg"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isProcessing ? 'Gerando Background...' : 'Gerar Background'}
        </Button>

        {/* Imagens Geradas - Usando o novo componente padronizado */}
        {generatedImage && (
          <AIGeneratedImagesGrid
            images={[generatedImage]}
            aiName="Fotographer AI"
            productName={productName}
            productId={productId}
            className="mt-6"
          />
        )}
      </CardContent>
    </Card>
  );
};