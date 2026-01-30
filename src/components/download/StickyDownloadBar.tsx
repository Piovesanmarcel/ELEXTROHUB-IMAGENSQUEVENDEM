import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Package, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { createCompleteZipPackage } from '@/utils/completePackageGenerator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { UnifiedAIResponse } from '@/components/product/ai-enhancer/types';
import type { GeneratedImage } from '@/components/n8n/GeneratedImageGallery';

interface StickyDownloadBarProps {
  generatedImages: GeneratedImage[];
  step1Result?: UnifiedAIResponse | null;
  step2Result?: string | null;
  productName: string;
  productDescription?: string;
}

export const StickyDownloadBar: React.FC<StickyDownloadBarProps> = ({
  generatedImages,
  step1Result,
  step2Result,
  productName,
  productDescription,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const hasContent = generatedImages.length > 0 || step1Result || step2Result;
  const contentCount = generatedImages.length + (step1Result ? 1 : 0) + (step2Result ? 1 : 0);

  if (!hasContent || isDismissed) {
    return null;
  }

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setProgress(0);

    const toastId = toast.loading('Preparando download...', {
      description: 'Gerando pacote completo'
    });

    try {
      await createCompleteZipPackage({
        product: {
          nome: productName,
          descricao: productDescription,
          sku: `gerador_${Date.now()}`
        },
        unifiedData: step1Result,
        copywritingText: step2Result || undefined,
        images: generatedImages.map(img => ({ 
          url: img.imageUrl, 
          type: img.sceneType 
        })),
        templateId: 'professional',
        includeImagesInPDF: true,
        onProgress: (stage, percent) => {
          setProgress(percent);
          toast.loading(`${stage}...`, { 
            id: toastId,
            description: `${percent}% concluído`
          });
        }
      });

      toast.success('Download iniciado!', {
        id: toastId,
        description: 'Kit completo salvo com sucesso'
      });
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro no download', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/95 to-primary/90 backdrop-blur-sm border-b border-primary/20 shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-primary-foreground">
            <p className="font-medium text-sm">
              Conteúdo pronto para download
            </p>
            <div className="flex items-center gap-2 text-xs text-primary-foreground/80">
              {generatedImages.length > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0 text-xs">
                  {generatedImages.length} imagem{generatedImages.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {step1Result && (
                <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0 text-xs">
                  Comando IA
                </Badge>
              )}
              {step2Result && (
                <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0 text-xs">
                  Copywriting
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            variant="secondary"
            size="sm"
            className="gap-2 bg-white text-primary hover:bg-white/90"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">{progress}%</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Baixar ZIP + PDF</span>
                <span className="sm:hidden">Baixar</span>
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyDownloadBar;
