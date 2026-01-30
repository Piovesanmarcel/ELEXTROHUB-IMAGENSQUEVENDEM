
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, Image, AlertCircle, FileImage } from "lucide-react";
import { toast } from "sonner";

interface BulkImageUploaderProps {
  onImagesUpload: (files: File[]) => void;
}

export const BulkImageUploader = ({ onImagesUpload }: BulkImageUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => {
        const error = rejection.errors[0];
        return `${rejection.file.name}: ${error.message}`;
      });
      toast.error(`Alguns arquivos foram rejeitados:\n${errors.join('\n')}`);
    }

    if (acceptedFiles.length > 0) {
      // Filtrar apenas imagens válidas
      const validImages = acceptedFiles.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
        
        if (!isValidType) {
          toast.error(`${file.name} não é uma imagem válida`);
          return false;
        }
        
        if (!isValidSize) {
          toast.error(`${file.name} é muito grande (máximo 10MB)`);
          return false;
        }
        
        return true;
      });

      if (validImages.length > 0) {
        onImagesUpload(validImages);
      }
    }
  }, [onImagesUpload]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    noClick: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false)
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragActive || dragActive
            ? 'border-purple-400 bg-purple-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-purple-300 hover:bg-purple-25'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className={`mx-auto p-4 rounded-full transition-all duration-300 ${
            isDragActive || dragActive 
              ? 'bg-purple-200 text-purple-700' 
              : 'bg-gray-100 text-gray-500'
          }`}>
            {isDragActive || dragActive ? (
              <Upload className="h-12 w-12" />
            ) : (
              <FileImage className="h-12 w-12" />
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isDragActive || dragActive 
                ? 'Solte as imagens aqui!' 
                : 'Arraste e solte suas imagens aqui'
              }
            </h3>
            <p className="text-gray-500 mb-4">
              Ou clique no botão abaixo para selecionar arquivos
            </p>
            
            <Button
              onClick={open}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Image className="h-4 w-4 mr-2" />
              Selecionar Imagens
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span>Máximo 10MB por imagem</span>
            </div>
            <div>•</div>
            <div>PNG, JPG, JPEG, GIF, BMP, WEBP</div>
          </div>
        </div>
        
        {(isDragActive || dragActive) && (
          <div className="absolute inset-0 bg-purple-100 bg-opacity-50 rounded-xl flex items-center justify-center">
            <div className="text-purple-700 font-semibold text-lg">
              Solte para fazer upload!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
