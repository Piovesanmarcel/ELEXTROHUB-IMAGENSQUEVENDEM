import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  Trash2, 
  History,
  ImageIcon,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { safeBlobDownload } from '@/utils/safeDownload';
import { cn } from '@/lib/utils';

export interface N8NGeneratedImage {
  id: string;
  templateId: string;
  templateName: string;
  imageUrl: string;
  generatedAt: string;
  productName: string;
}

interface N8NResultGalleryProps {
  images: N8NGeneratedImage[];
  isLoading?: boolean;
  onClearAll?: () => void;
  onRemoveImage?: (id: string) => void;
}

export function N8NResultGallery({ 
  images, 
  isLoading = false,
  onClearAll,
  onRemoveImage 
}: N8NResultGalleryProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (image: N8NGeneratedImage) => {
    setDownloadingId(image.id);
    try {
      let blob: Blob;
      
      if (image.imageUrl.startsWith('data:')) {
        // Base64
        const base64Data = image.imageUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/png' });
      } else {
        const res = await fetch(image.imageUrl);
        blob = await res.blob();
      }

      const filename = `${image.productName}-${image.templateName}-n8n.png`
        .replace(/\s+/g, '-')
        .toLowerCase();
      await safeBlobDownload(blob, filename);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar imagem');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenExternal = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Resultados do n8n</CardTitle>
          </div>
          {images.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{images.length} imagem(ns)</Badge>
              {onClearAll && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearAll}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        <CardDescription>
          Imagens geradas pelo workflow n8n aparecem aqui automaticamente
        </CardDescription>
      </CardHeader>

      <CardContent>
        {images.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma imagem gerada ainda.</p>
            <p className="text-sm">Envie um job para o n8n para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((image) => (
              <div 
                key={image.id} 
                className="relative group rounded-lg overflow-hidden border bg-muted"
              >
                <img
                  src={image.imageUrl}
                  alt={`${image.productName} - ${image.templateName}`}
                  className="w-full aspect-square object-cover"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 text-white hover:bg-white/20"
                    onClick={() => handleDownload(image)}
                    disabled={downloadingId === image.id}
                  >
                    {downloadingId === image.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 text-white hover:bg-white/20"
                    onClick={() => handleOpenExternal(image.imageUrl)}
                  >
                    <ExternalLink className="h-5 w-5" />
                  </Button>
                  {onRemoveImage && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 text-white hover:bg-destructive/80"
                      onClick={() => onRemoveImage(image.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm font-medium truncate">
                    {image.templateName}
                  </p>
                  <p className="text-white/70 text-xs">
                    {new Date(image.generatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
