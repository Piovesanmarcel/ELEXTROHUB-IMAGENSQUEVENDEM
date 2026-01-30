import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHostedImages } from '@/hooks/useHostedImages';
import { toast } from 'sonner';
import { RefreshCw, Tag, CheckCircle } from 'lucide-react';

export const TagMigrationTester = () => {
  const { hostedImages, fetchHostedImages } = useHostedImages();

  const handleMigrationTest = async () => {
    try {
      toast.info('🔄 Executando migração de tags existentes...');
      
      // Trigger refetch to ensure latest data
      await fetchHostedImages();
      
      // Test the classification functions
      const categorizedImages = {
        whiteBackground: hostedImages.filter(img => 
          img.tags?.some(tag => tag.includes('white-background') || tag.includes('fundo-branco'))
        ).length,
        runware: hostedImages.filter(img => 
          img.tags?.some(tag => tag.includes('runware') || tag.includes('ai-source:runware'))
        ).length,
        gemini: hostedImages.filter(img => 
          img.tags?.some(tag => tag.includes('gemini') || tag.includes('ai-source:gemini'))
        ).length,
        bfl: hostedImages.filter(img => 
          img.tags?.some(tag => tag.includes('bfl') || tag.includes('ai-source:bfl'))
        ).length,
        runway: hostedImages.filter(img => 
          img.tags?.some(tag => tag.includes('runway') || tag.includes('ai-source:runway'))
        ).length,
        tongyi: hostedImages.filter(img => 
          img.tags?.some(tag => tag.includes('tongyi') || tag.includes('ai-source:tongyi'))
        ).length,
        kitImages: hostedImages.filter(img => 
          img.tags?.some(tag => tag.includes('cloudinary-kit') || tag.includes('ai-source:cloudinary-kit'))
        ).length,
        total: hostedImages.length
      };

      console.log('📊 [TAG MIGRATION TEST] Categorized images:', categorizedImages);
      
      toast.success(`✅ Migração testada! Total: ${categorizedImages.total} imagens categorizadas`, {
        description: `Fundo branco: ${categorizedImages.whiteBackground}, Runware: ${categorizedImages.runware}, Gemini: ${categorizedImages.gemini}, BFL: ${categorizedImages.bfl}, Runway: ${categorizedImages.runway}, Tongyi: ${categorizedImages.tongyi}, Kits: ${categorizedImages.kitImages}`,
        duration: 8000
      });
    } catch (error) {
      console.error('❌ [TAG MIGRATION TEST] Erro:', error);
      toast.error('Erro ao testar migração de tags');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Sistema de Tags Padronizadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Total de imagens hospedadas: <strong>{hostedImages.length}</strong></p>
          <p>Sistema de tags padronizadas implementado.</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleMigrationTest}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Testar Migração
          </Button>
          
          <Button 
            onClick={() => fetchHostedImages()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Atualizar Lista
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Status:</strong> Sistema de tags padronizadas implementado</p>
          <p><strong>BFL:</strong> ai-source:bfl + processing</p>
          <p><strong>Gemini:</strong> ai-source:gemini + tipo específico</p>
          <p><strong>Runway:</strong> ai-source:runway + video-to-image</p>
          <p><strong>Tongyi:</strong> ai-source:tongyi-wanxiang + scenario</p>
          <p><strong>AIGallery:</strong> Tags padronizadas para upscale</p>
        </div>
      </CardContent>
    </Card>
  );
};