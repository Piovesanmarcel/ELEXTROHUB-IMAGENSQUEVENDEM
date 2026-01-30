import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Loader2, Cloud, X, ImageIcon } from 'lucide-react';
import { useHostedImages, HostedImage } from '@/hooks/useHostedImages';

interface ManualImageUploaderProps {
  productId: string;
  productName: string;
  onImagesUploaded?: () => void;
}

const ManualImageUploader = ({ productId, productName, onImagesUploaded }: ManualImageUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [currentUpload, setCurrentUpload] = useState<string>('');
  
  const { saveHostedImage, fetchHostedImages } = useHostedImages();

  // Função para ler dimensões reais da imagem
  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao ler dimensões da imagem'));
      };
      
      img.src = url;
    });
  };

  // Handler para selecionar arquivos
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      // Validar tipo de arquivo
      if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
        toast.error(`❌ ${file.name}: formato não suportado. Use JPG, PNG ou WEBP.`);
        return;
      }
      
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`❌ ${file.name}: tamanho máximo 10MB.`);
        return;
      }
      
      validFiles.push(file);
      
      // Criar preview
      const previewUrl = URL.createObjectURL(file);
      newPreviews.push(previewUrl);
    });
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
      toast.success(`✅ ${validFiles.length} imagens selecionadas`);
    }
  }, []);

  // Handler para remover arquivo da seleção
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Handler para processar imagens (sem R2 - usa blob URL direta)
  const handleProcessImages = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setCurrentUpload(file.name);
        setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
        
        try {
          console.log(`📤 [MANUAL-UPLOAD] Processando ${file.name}...`);
          
          // Criar blob URL
          const blobUrl = URL.createObjectURL(file);
          
          // Obter dimensões reais da imagem
          let dimensions = { width: 1024, height: 1024 };
          try {
            dimensions = await getImageDimensions(file);
          } catch (err) {
            console.warn('⚠️ Não foi possível obter dimensões, usando padrão');
          }
          
          // Salvar em hosted_images com blob URL
          await saveHostedImage({
            url: blobUrl,
            r2_path: blobUrl,
            filename: file.name,
            original_filename: file.name,
            file_type: file.type,
            file_size: file.size,
            width: dimensions.width,
            height: dimensions.height,
            description: `${productName} - Upload Manual`,
            tags: [
              `product:${productId}`,
              'source:manual-upload',
              'ai-source:manual',
              'quality:original',
              'temporary-blob'
            ]
          });
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          toast.success(`✅ ${file.name} processada!`);
          
        } catch (error) {
          console.error(`❌ [MANUAL-UPLOAD] Erro ao processar ${file.name}:`, error);
          toast.error(`❌ Erro ao processar ${file.name}`);
        }
      }
      
      // Limpar e atualizar
      setSelectedFiles([]);
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
      setUploadProgress({});
      setCurrentUpload('');
      
      // Recarregar galeria
      await fetchHostedImages(productId);
      
      toast.success(`🎉 ${selectedFiles.length} imagens processadas!`);
      
      // Notificar componente pai
      if (onImagesUploaded) {
        onImagesUploaded();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          Upload Manual de Imagens
        </CardTitle>
        <CardDescription>
          Anexe suas próprias imagens para usar em anúncios
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => document.getElementById('manual-upload')?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFileSelect(e.dataTransfer.files);
          }}
        >
          <input 
            type="file" 
            multiple 
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="manual-upload"
          />
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600 font-medium">
            Clique ou arraste imagens para anexar
          </p>
          <p className="text-xs text-gray-400 mt-2">
            JPG, PNG ou WEBP - Máximo 10MB por imagem
          </p>
        </div>
        
        {/* Preview das imagens selecionadas */}
        {previews.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'imagem selecionada' : 'imagens selecionadas'}
              </p>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFiles([]);
                    previews.forEach(url => URL.revokeObjectURL(url));
                    setPreviews([]);
                  }}
                >
                  Limpar todas
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square group">
                  <img 
                    src={preview} 
                    alt={selectedFiles[index].name} 
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                  />
                  
                  {/* Botão de remover */}
                  {!uploading && (
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* Progress overlay durante upload */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg">
                      {currentUpload === selectedFiles[index].name ? (
                        <>
                          <Loader2 className="h-6 w-6 text-white animate-spin mb-2" />
                          <p className="text-xs text-white">
                            {uploadProgress[selectedFiles[index].name] || 0}%
                          </p>
                        </>
                      ) : uploadProgress[selectedFiles[index].name] === 100 ? (
                        <Cloud className="h-6 w-6 text-green-400" />
                      ) : null}
                    </div>
                  )}
                  
                  {/* Nome do arquivo */}
                  <p className="text-xs text-gray-600 mt-1 truncate" title={selectedFiles[index].name}>
                    {selectedFiles[index].name}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Progress total durante upload */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Processando imagens...</span>
                  <span className="text-gray-500">{currentUpload}</span>
                </div>
                <Progress 
                  value={(Object.keys(uploadProgress).length / selectedFiles.length) * 100} 
                  className="h-2"
                />
              </div>
            )}
            
            {/* Botão de processar */}
            <Button 
              onClick={handleProcessImages}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando {Object.keys(uploadProgress).length} de {selectedFiles.length}...
                </>
              ) : (
                <>
                  <Cloud className="h-4 w-4 mr-2" />
                  Processar {selectedFiles.length} {selectedFiles.length === 1 ? 'Imagem' : 'Imagens'}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManualImageUploader;
