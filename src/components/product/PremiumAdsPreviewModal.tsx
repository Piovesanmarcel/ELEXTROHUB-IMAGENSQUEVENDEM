import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye } from "lucide-react";
import { PremiumAdProduct } from "@/utils/premiumAdsUtils";

interface PremiumAdsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDownload: () => void;
  onConfirmDownloadWEBC?: () => void;
  ads: PremiumAdProduct[];
  isDownloading: boolean;
  productName: string;
}

export const PremiumAdsPreviewModal = ({
  isOpen,
  onClose,
  onConfirmDownload,
  onConfirmDownloadWEBC,
  ads,
  isDownloading,
  productName
}: PremiumAdsPreviewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Visualizar Anúncios Premium - {productName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {ads.map((ad, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-4 bg-gradient-to-r from-purple-50/50 to-yellow-50/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-2">
                      Anúncio {index + 1}
                    </span>
                    <h3 className="font-medium text-gray-900 leading-tight">
                      {ad.nome}
                    </h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-8 gap-2">
                  {ad.imageUrls.map((imageUrl, imgIndex) => (
                    <div 
                      key={imgIndex}
                      className="aspect-square bg-gray-100 rounded-md overflow-hidden border"
                    >
                      <img 
                        src={imageUrl} 
                        alt={`Imagem ${imgIndex + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                          e.currentTarget.alt = 'Falha ao carregar';
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">{ad.imageUrls.length}</span> imagens • 
                  <span className="ml-1">SKU: {ad.sku}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDownloading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirmDownload}
            disabled={isDownloading}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Planilha Bling
              </>
            )}
          </Button>
          {onConfirmDownloadWEBC && (
            <Button 
              onClick={onConfirmDownloadWEBC}
              disabled={isDownloading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Planilha WEBC
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};