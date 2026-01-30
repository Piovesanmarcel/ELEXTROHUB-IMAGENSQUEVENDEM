
import { toast } from "sonner";
import { ProcessedImage, UploadedImage } from "@/pages/BulkImageEnhancement";
import { safeBlobDownload } from "@/utils/safeDownload";

export const useBulkDownloadManager = () => {
  const downloadAllResults = async (
    processedImages: ProcessedImage[],
    images: UploadedImage[],
    processingType: 'enhance' | 'background'
  ) => {
    try {
      const completedImages = processedImages.filter(img => img.status === 'completed');
      
      if (completedImages.length === 0) {
        toast.error("Nenhuma imagem processada para download");
        return;
      }

      toast.info("Preparando download das imagens...");

      const imagePromises = completedImages.map(async (item, index) => {
        const processedUrl = processingType === 'enhance' ? item.enhanced : item.backgroundRemoved;
        if (!processedUrl) return null;

        const response = await fetch(processedUrl);
        const blob = await response.blob();
        const originalImage = images.find(img => img.id === item.id);
        const baseName = originalImage?.name.split('.')[0] || `image_${index + 1}`;
        const suffix = processingType === 'enhance' ? 'deepai_enhanced' : 'background_removed';
        
        return {
          name: `${baseName}_${suffix}.${processingType === 'background' ? 'png' : 'jpg'}`,
          blob
        };
      });

      const imageFiles = (await Promise.all(imagePromises)).filter(Boolean);

      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      imageFiles.forEach(({ name, blob }) => {
        zip.file(name, blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const fileName = `imagens_${processingType === 'enhance' ? 'melhoradas' : 'sem_fundo'}_${Date.now()}.zip`;
      await safeBlobDownload(zipBlob, fileName);

      toast.success(`Download de ${imageFiles.length} imagens concluído!`);
    } catch (error) {
      console.error('Erro ao criar arquivo zip:', error);
      toast.error('Erro ao criar arquivo zip');
    }
  };

  return { downloadAllResults };
};
