import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TemplateUploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const TemplateUploadZone = ({ onFileSelect, disabled }: TemplateUploadZoneProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      
      // Get dimensions
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    disabled,
  });

  const clearPreview = () => {
    setPreview(null);
    setDimensions(null);
  };

  if (preview) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Imagem Carregada</p>
                {dimensions && (
                  <p className="text-sm text-muted-foreground">
                    {dimensions.width} x {dimensions.height}px
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearPreview}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative aspect-square max-w-md mx-auto rounded-lg overflow-hidden border-2 border-border">
            <img
              src={preview}
              alt="Template preview"
              className="w-full h-full object-contain bg-muted"
            />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      {...getRootProps()}
      className={`
        p-8 cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-dashed border-2'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-accent/5'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragActive ? 'Solte a imagem aqui' : 'Arraste a imagem do template'}
          </p>
          <p className="text-sm text-muted-foreground">
            ou clique para selecionar
          </p>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Formatos aceitos: PNG, JPG</p>
          <p>Dimensões recomendadas: 1200x1200px</p>
        </div>
      </div>
    </Card>
  );
};
