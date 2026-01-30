
import { toast } from "sonner";
import { ImageGalleryItem } from "./results/ImageGalleryItem";
import { EnhancementResultsHeader } from "./results/EnhancementResultsHeader";

interface EnhancedImage {
  original: string;
  enhanced: string;
  metadata?: any;
}

interface EnhancementResultsProps {
  enhancedImages: EnhancedImage[];
  productName: string;
  productSku: string;
  onViewImage: (url: string) => void;
  onDownloadImage: (url: string, index: number) => void;
  onOpenGallery?: (index: number) => void;
}

export const EnhancementResults = ({ 
  enhancedImages, 
  productName, 
  productSku,
  onViewImage, 
  onDownloadImage,
  onOpenGallery
}: EnhancementResultsProps) => {
  console.log(`🎨 EnhancementResults: Renderizando ${enhancedImages.length} imagens`);
  console.log(`🔗 onOpenGallery está definido:`, !!onOpenGallery);
  
  // Sempre renderizar para evitar problemas de reconciliação do React
  if (enhancedImages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p>Aguardando processamento das imagens...</p>
      </div>
    );
  }

  const downloadSingleImage = async (imageUrl: string, index: number) => {
    try {
      console.log(`🔽 Iniciando download da imagem ${index + 1} com SKU: ${productSku}`);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erro ao baixar imagem: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Criar nome do arquivo com SKU
      const fileName = `${productSku}_enhanced_${index + 1}.jpg`;
      
      // Importar e usar o método seguro de download
      const { safeBlobDownload } = await import('@/utils/safeDownload');
      await safeBlobDownload(blob, fileName);
      
      console.log(`✅ Imagem ${index + 1} baixada como: ${fileName}`);
      toast.success(`Imagem ${index + 1} baixada: ${fileName}`);
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      toast.error(`Erro ao baixar imagem ${index + 1}: ${error.message}`);
    }
  };

  const downloadAllAsZip = async () => {
    try {
      toast.info("Preparando download das imagens...");
      
      // Criar um array de promises para baixar todas as imagens
      const imagePromises = enhancedImages.map(async (item, index) => {
        const response = await fetch(item.enhanced);
        const blob = await response.blob();
        return {
          name: `${productSku}_enhanced_${index + 1}.jpg`,
          blob
        };
      });

      const imageFiles = await Promise.all(imagePromises);

      // Importar JSZip dinamicamente
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Adicionar todas as imagens ao zip
      imageFiles.forEach(({ name, blob }) => {
        zip.file(name, blob);
      });

      // Gerar o arquivo zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Usar método seguro para download do ZIP
      const { safeBlobDownload } = await import('@/utils/safeDownload');
      await safeBlobDownload(zipBlob, `${productSku}_imagens_melhoradas.zip`);
      
      console.log(`✅ ZIP baixado: ${productSku}_imagens_melhoradas.zip`);
      toast.success(`Download de ${enhancedImages.length} imagens concluído!`);
    } catch (error) {
      console.error('Erro ao criar arquivo zip:', error);
      toast.error('Erro ao criar arquivo zip. Tente baixar as imagens individualmente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-green-200 rounded-lg p-6 shadow-sm">
        <EnhancementResultsHeader
          imageCount={enhancedImages.length}
          productSku={productSku}
          onDownloadAll={downloadAllAsZip}
        />
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-6">
          {enhancedImages.map((item, index) => (
            <ImageGalleryItem
              key={`enhanced-result-${index}-${item.enhanced?.substring?.(item.enhanced.length - 10) || `fallback-${index}`}`}
              item={item}
              index={index}
              productName={productName}
              productSku={productSku}
              onViewImage={onViewImage}
              onDownloadImage={downloadSingleImage}
              onOpenGallery={onOpenGallery}
            />
          ))}
        </div>
        
        <div className="text-sm text-green-600 bg-green-50 p-4 rounded-md border border-green-200">
          💡 <strong>Dica:</strong> As imagens melhoradas serão baixadas com o nome do SKU "{productSku}". Use o botão "Baixar Todas em ZIP" para obter todas as imagens organizadas em uma pasta compactada. <strong>Clique diretamente nas imagens para abrir a galeria completa com zoom, navegação e controles avançados!</strong>
        </div>
      </div>
    </div>
  );
};
