import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Upload, Plus, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { ImageGridItem } from "./ImageGridItem";
import { ImageGalleryModal } from "./ImageGalleryModal";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";

interface ImageQuality {
  resolution: 'low' | 'medium' | 'high';
  width: number;
  height: number;
  needsImprovement: boolean;
}

interface ProductImagesGridProps {
  images: string[];
  productName: string;
  productId: string;
  onUpdateImageOrder?: (newOrder: string[]) => Promise<boolean>;
  onImagesUploaded?: (newImages: string[]) => void;
  longTailTitles?: string[];
  isAutomationComplete?: boolean;
  referenceImageUrls?: string[]; // URLs das imagens de referência para ocultar após automação
  onDelete?: (index: number) => void;
}

export const ProductImagesGrid = ({
  images,
  productName,
  productId,
  onUpdateImageOrder,
  onImagesUploaded,
  longTailTitles = [],
  isAutomationComplete = false,
  referenceImageUrls = [],
  onDelete
}: ProductImagesGridProps) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageQualities, setImageQualities] = useState<Record<string, ImageQuality>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [removedImages, setRemovedImages] = useState<Set<string>>(() => new Set());

  // Combinar imagens originais com uploadadas (sem duplicar)
  const allImages = useMemo(
    () => Array.from(new Set([...images, ...uploadedImages])),
    [images, uploadedImages]
  );

  // Imagens realmente exibidas (após remoções locais) - COM ORDENAÇÃO: Referências por último com destaque
  const displayedImages = useMemo(() => {
    let filtered = allImages.filter((url) => !removedImages.has(url));

    // Criar set de referências para identificação
    const refSet = new Set(referenceImageUrls);

    // Separar imagens: referências, kits, e regulares
    const referenceImgs = filtered.filter(url => refSet.has(url));
    const nonRefImages = filtered.filter(url => !refSet.has(url));

    // Separar imagens de kit das outras (apenas entre não-referências)
    const isKitImage = (url: string): boolean => {
      const lowerUrl = url.toLowerCase();
      return lowerUrl.includes('kit') ||
        lowerUrl.includes('combo') ||
        lowerUrl.includes('pack') ||
        lowerUrl.includes('bundle');
    };

    const regularImages = nonRefImages.filter(url => !isKitImage(url));
    const kitImages = nonRefImages.filter(url => isKitImage(url));

    // ✅ REGRA DE OURO: SE JÁ EXISTEM IMAGENS GERADAS (não-ref), ESCONDER AS REFERÊNCIAS
    if (nonRefImages.length > 0) {
      return [...regularImages, ...kitImages];
    }

    // NOVA ORDEM: Imagens geradas → Kits → Referências por último (com destaque)
    return [...regularImages, ...kitImages, ...referenceImgs];
  }, [allImages, removedImages, referenceImageUrls]);

  // Analisar qualidade das imagens
  const analyzeImageQuality = useCallback(async (imageUrl: string): Promise<ImageQuality> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const totalPixels = width * height;

        let resolution: 'low' | 'medium' | 'high' = 'low';
        if (totalPixels >= 1000000) resolution = 'high';
        else if (totalPixels >= 500000) resolution = 'medium';

        const needsImprovement = resolution === 'low' || width < 800 || height < 800;

        resolve({ resolution, width, height, needsImprovement });
      };

      img.onerror = () => {
        resolve({ resolution: 'low', width: 0, height: 0, needsImprovement: true });
      };

      img.src = imageUrl;
    });
  }, []);

  // Analisar todas as imagens quando mudarem
  useEffect(() => {
    const analyzeAll = async () => {
      const qualities: Record<string, ImageQuality> = {};

      for (const imageUrl of displayedImages) {
        if (!imageQualities[imageUrl]) {
          const quality = await analyzeImageQuality(imageUrl);
          qualities[imageUrl] = quality;
        } else {
          qualities[imageUrl] = imageQualities[imageUrl];
        }
      }

      setImageQualities(qualities);
    };

    if (displayedImages.length > 0) {
      analyzeAll();
    }
  }, [displayedImages.length, analyzeImageQuality]);

  // Função para processar arquivos de upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const processedImages: string[] = [];
    let processedCount = 0;

    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        processedImages.push(base64);
        processedCount++;

        // Só atualiza quando TODOS os arquivos foram processados
        if (processedCount === acceptedFiles.length) {
          // Se o usuário re-enviar a mesma imagem após apagar, precisamos “desocultar”
          setRemovedImages(prev => {
            const next = new Set(prev);
            processedImages.forEach((img) => next.delete(img));
            return next;
          });

          setUploadedImages(prev => {
            const updated = Array.from(new Set([...prev, ...processedImages]));

            // Emitir evento para outros componentes (CopywritingGenerator)
            window.dispatchEvent(new CustomEvent('productImagesUploaded', {
              detail: {
                productId,
                images: updated,
                timestamp: Date.now()
              }
            }));

            if (onImagesUploaded) {
              onImagesUploaded(updated);
            }

            return updated;
          });

          toast.success(`${acceptedFiles.length} imagem(ns) carregada(s) com sucesso!`);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [productId, onImagesUploaded]);

  // Função para excluir imagem
  const handleDeleteImage = useCallback((index: number) => {
    const imageUrl = displayedImages[index];
    if (!imageUrl) return;

    const nextImages = displayedImages.filter((_, i) => i !== index);

    // Sempre remove localmente (para garantir UX imediata)
    setRemovedImages(prev => {
      const next = new Set(prev);
      next.add(imageUrl);
      return next;
    });

    // Se era upload local, remove do estado de uploads também
    setUploadedImages(prev => prev.filter(img => img !== imageUrl));

    // Remover qualidade da imagem deletada
    setImageQualities(prev => {
      const updated = { ...prev };
      delete updated[imageUrl];
      return updated;
    });

    // Notificar pai (AdGenerator usa isso para manter estado em sync)
    onImagesUploaded?.(nextImages);

    // Se existir callback de persistência (ex: ProductDetails), tenta salvar a nova ordem/lista
    if (onUpdateImageOrder) {
      void onUpdateImageOrder(nextImages).then((ok) => {
        if (!ok) toast.error('Não foi possível salvar a alteração das imagens');
      }).catch(() => {
        toast.error('Erro ao salvar alteração das imagens');
      });
    }

    toast.success('Imagem removida da galeria');
  }, [displayedImages, onImagesUploaded, onUpdateImageOrder]);

  // Função para ampliar imagem (agora usa índice para galeria com navegação)
  const handleZoomImage = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  });

  // Calcular estatísticas de qualidade
  const qualityStats = {
    total: displayedImages.length,
    good: Object.values(imageQualities).filter(q => !q.needsImprovement).length,
    needsImprovement: Object.values(imageQualities).filter(q => q.needsImprovement).length
  };

  // ✅ Função para sanitizar string para nome de arquivo
  const sanitizeFileName = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9\s-]/gi, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Espaços para hífens
      .substring(0, 100)
      .toLowerCase();
  };

  // ✅ Função para download de todas as imagens em ZIP
  const handleDownloadAllZip = async () => {
    if (displayedImages.length === 0) {
      toast.error('Nenhuma imagem para baixar');
      return;
    }

    const toastId = toast.loading('📦 Preparando ZIP com todas as imagens...');

    try {
      const zip = new JSZip();
      const folderName = sanitizeFileName(productName || 'produto');
      const folder = zip.folder(folderName);

      for (let i = 0; i < displayedImages.length; i++) {
        const imageUrl = displayedImages[i];

        try {
          let blob: Blob;

          // Verificar se é base64 ou URL
          if (imageUrl.startsWith('data:')) {
            // Converter base64 para blob
            const response = await fetch(imageUrl);
            blob = await response.blob();
          } else {
            // Baixar da URL
            const response = await fetch(imageUrl);
            blob = await response.blob();
          }

          // Nome da imagem baseado nos títulos Long Tail ou índice
          let fileName: string;
          if (longTailTitles && longTailTitles[i]) {
            const sanitizedTitle = sanitizeFileName(longTailTitles[i]);
            fileName = `${String(i + 1).padStart(2, '0')}-${sanitizedTitle}.png`;
          } else {
            fileName = `${String(i + 1).padStart(2, '0')}-${folderName}-imagem.png`;
          }

          folder?.file(fileName, blob);
          console.log(`✅ Adicionada ao ZIP: ${fileName}`);
        } catch (error) {
          console.error(`❌ Erro ao baixar imagem ${i + 1}:`, error);
        }
      }

      // Gerar e baixar ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success(`📦 ZIP baixado com ${displayedImages.length} imagens!`);
    } catch (error) {
      console.error('Erro ao criar ZIP:', error);
      toast.dismiss(toastId);
      toast.error('Erro ao criar arquivo ZIP');
    }
  };

  if (displayedImages.length === 0) {
    return (
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imagens do Produto
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          {/* Área de upload compacta quando não há imagens */}
          <div
            {...getRootProps()}
            className={`h-32 rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${isDragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-purple-200 bg-gradient-to-br from-purple-100 to-indigo-100 hover:border-purple-400'
              }`}
          >
            <input {...getInputProps()} />
            <div className="text-center text-purple-500">
              <Upload className="h-8 w-8 mx-auto mb-2" />
              {isDragActive ? (
                <p className="text-sm font-medium">Solte as imagens aqui...</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Arraste imagens ou clique para fazer upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
        <CardTitle className="flex items-center gap-2 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-purple-600" />
            <span className="text-xl font-bold gradient-text">Galeria do Produto</span>
            <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
              {displayedImages.length} imagem(ns)
            </Badge>
            {uploadedImages.length > 0 && (
              <Badge className="bg-green-600 text-white">
                +{uploadedImages.length} upload(s)
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {/* Indicador de qualidade */}
            {qualityStats.total > 0 && (
              <div className="flex items-center gap-2">
                {qualityStats.good > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {qualityStats.good} OK
                  </Badge>
                )}
                {qualityStats.needsImprovement > 0 && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {qualityStats.needsImprovement} baixa resolução
                  </Badge>
                )}
              </div>
            )}
            {/* Botão de Download ZIP - após automação completa */}
            {isAutomationComplete && displayedImages.length > 0 && (
              <Button
                size="sm"
                onClick={handleDownloadAllZip}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Todas ({displayedImages.length}) ZIP
              </Button>
            )}
            {/* Botão de Upload */}
            <Button
              size="sm"
              variant="outline"
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                open();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Imagens
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Área de drop */}
        <div
          {...getRootProps()}
          className={`mb-4 p-4 border-2 border-dashed rounded-lg text-center transition-all cursor-pointer ${isDragActive
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-6 w-6 mx-auto mb-2 text-purple-400" />
          {isDragActive ? (
            <p className="text-sm text-purple-600 font-medium">Solte as imagens aqui...</p>
          ) : (
            <p className="text-sm text-gray-500">Arraste imagens aqui ou clique para fazer upload</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {displayedImages.map((imageUrl, index) => {
            const isReferenceImage = referenceImageUrls.includes(imageUrl);

            return (
              <ImageGridItem
                key={`${imageUrl.substring(0, 50)}-${index}`}
                imageUrl={imageUrl}
                index={index}
                productName={productName}
                productId={productId}
                onClick={() => handleZoomImage(index)}
                isReordering={false}
                onMoveLeft={() => { }}
                onMoveRight={() => { }}
                onSetPrimary={() => { }}
                isFirst={index === 0}
                isLast={index === displayedImages.length - 1}
                quality={imageQualities[imageUrl]}
                onDelete={() => handleDeleteImage(index)}
                canDelete={true}
                isReferenceImage={isReferenceImage}
              />
            );
          })}
        </div>

        {/* Modal de Galeria com Navegação */}
        <ImageGalleryModal
          isOpen={selectedImageIndex !== null}
          onClose={() => setSelectedImageIndex(null)}
          images={displayedImages}
          productName={productName}
          initialIndex={selectedImageIndex || 0}
        />
      </CardContent>
    </Card>
  );
};