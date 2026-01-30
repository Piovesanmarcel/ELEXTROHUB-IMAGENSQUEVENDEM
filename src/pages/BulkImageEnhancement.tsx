
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { BulkImageProcessor } from "@/components/bulk/BulkImageProcessor";
import { BulkImageUploader } from "@/components/bulk/BulkImageUploader";
import { BulkImagePreview } from "@/components/bulk/BulkImagePreview";
import { HeaderSection } from "@/components/bulk/HeaderSection";
import { TabSection } from "@/components/bulk/TabSection";
import { DemoSection, DownloadExamplesSection } from "@/components/bulk/DemoSection";
import { MarketplaceBenefitsSection } from "@/components/bulk/MarketplaceBenefitsSection";

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
}

export interface ProcessedImage {
  id: string;
  original: string;
  enhanced?: string;
  backgroundRemoved?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export default function BulkImageEnhancement() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'enhance' | 'background'>('enhance');

  const handleImagesUpload = useCallback((files: File[]) => {
    const newImages: UploadedImage[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    
    // Initialize processed images
    const initialProcessed: ProcessedImage[] = newImages.map(img => ({
      id: img.id,
      original: img.preview,
      status: 'pending'
    }));
    
    setProcessedImages(prev => [...prev, ...initialProcessed]);
    
    toast.success(`${files.length} imagem(ns) carregada(s) com sucesso!`);
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
    
    setProcessedImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  const handleClearAll = useCallback(() => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setProcessedImages([]);
    toast.info("Todas as imagens foram removidas");
  }, [uploadedImages]);

  const handleTabChange = useCallback((tab: 'enhance' | 'background') => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <HeaderSection />

        {/* Demo Section with Benefits */}
        <DemoSection activeTab={activeTab} />

        {/* Action Tabs - Above Upload Area */}
        <div className="mb-6">
          <TabSection activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Upload Area */}
        <div className="mb-6">
          <Card className="glass-effect shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-6 w-6 text-purple-600" />
                <span className="text-xl font-bold gradient-text">Upload de Imagens</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BulkImageUploader onImagesUpload={handleImagesUpload} />
              {uploadedImages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar Todas ({uploadedImages.length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Image Preview */}
        {uploadedImages.length > 0 && (
          <BulkImagePreview
            images={uploadedImages}
            processedImages={processedImages}
            onRemoveImage={handleRemoveImage}
          />
        )}

        {/* Processor */}
        {uploadedImages.length > 0 && (
          <BulkImageProcessor
            images={uploadedImages}
            processedImages={processedImages}
            onProcessedImagesUpdate={setProcessedImages}
            processingType={activeTab}
            isProcessing={isProcessing}
            onProcessingChange={setIsProcessing}
          />
        )}

        {/* Download Examples Section - Only show when enhance tab is active */}
        {activeTab === 'enhance' && <DownloadExamplesSection />}

        {/* Marketplace Benefits Section + Dica Profissional - SEMPRE NO FINAL DA PÁGINA */}
        <MarketplaceBenefitsSection />
      </div>
    </div>
  );
}
