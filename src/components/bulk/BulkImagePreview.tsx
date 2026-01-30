
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Eye, Check, AlertCircle, Loader2 } from "lucide-react";
import { UploadedImage, ProcessedImage } from "@/pages/BulkImageEnhancement";

interface BulkImagePreviewProps {
  images: UploadedImage[];
  processedImages: ProcessedImage[];
  onRemoveImage: (imageId: string) => void;
}

export const BulkImagePreview = ({ 
  images, 
  processedImages, 
  onRemoveImage 
}: BulkImagePreviewProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getProcessedStatus = (imageId: string) => {
    return processedImages.find(img => img.id === imageId);
  };

  const getStatusIcon = (status: ProcessedImage['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ProcessedImage['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status: ProcessedImage['status']) => {
    switch (status) {
      case 'pending':
        return 'Aguardando';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluído';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <Card className="glass-effect shadow-lg mb-6">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold gradient-text">
            Preview das Imagens ({images.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {images.map((image) => {
            const processedStatus = getProcessedStatus(image.id);
            
            return (
              <div
                key={image.id}
                className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Status Overlay */}
                  {processedStatus && (
                    <div className="absolute top-2 left-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(processedStatus.status)}`}>
                        {getStatusIcon(processedStatus.status)}
                        <span>{getStatusText(processedStatus.status)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveImage(image.id)}
                    className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/90 hover:bg-red-50 border-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
                
                {/* Info */}
                <div className="p-3 bg-white border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-700 truncate mb-1">
                    {image.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(image.size)}
                  </div>
                  
                  {/* Error Message */}
                  {processedStatus?.status === 'error' && processedStatus.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-1 rounded truncate">
                      {processedStatus.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
