import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Images, 
  Download, 
  Trash2, 
  ExternalLink, 
  Calendar,
  Layers,
  RefreshCw,
  Sparkles,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { safeBlobDownload } from '@/utils/safeDownload';
import { aiImagesCache } from '@/services/AIImagesSessionCache';
import { useBatchResults } from '@/hooks/useBatchResults';
import { BatchProgressBar } from './BatchProgressBar';

interface ProductImage {
  id: string;
  url: string;
  filename: string;
  template_id: string | null;
  uploaded_at: string;
  template_name?: string;
}

interface SessionImage {
  id: string;
  url: string;
  source: string;
  timestamp: number;
}

interface ProductMarketingGalleryProps {
  productId: string;
  productName: string;
}

// Agrupar sources por categoria
const SOURCE_CATEGORIES: Record<string, string> = {
  'intro-processed': 'Gatilhos Marketing',
  'authority-processed': 'Gatilhos Marketing',
  'benefits-processed': 'Gatilhos Marketing',
  'urgency-processed': 'Gatilhos Marketing',
  'features-processed': 'Gatilhos Marketing',
  'marketing-gatilhos-gemini': 'Gatilhos Gemini',
  'marketing-gatilhos-runware': 'Gatilhos Runware',
  'marketing-gatilhos-bfl': 'Gatilhos BFL',
  'gemini-background': 'Fundos Gemini',
  'runware': 'Runware IA',
  'bfl': 'BFL IA',
  'bfl-white-bg': 'BFL Fundo Branco',
  'showcase': 'Showcases',
  'n8n-stream': 'n8n Streaming',
};

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'intro-processed': 'Introdução Captadora',
  'authority-processed': 'Dor x Solução',
  'benefits-processed': 'Benefícios',
  'urgency-processed': 'Escassez/Urgência',
  'features-processed': 'Características',
  'marketing-gatilhos-gemini': 'Gatilhos Gemini',
  'marketing-gatilhos-runware': 'Gatilhos Runware',
  'marketing-gatilhos-bfl': 'Gatilhos BFL',
  'gemini-background': 'Fundos Gemini',
  'runware': 'Runware',
  'bfl': 'BFL',
  'bfl-white-bg': 'Fundo Branco',
  'showcase': 'Showcase',
  'n8n-stream': 'Templates n8n',
};

export const ProductMarketingGallery = ({ productId, productName }: ProductMarketingGalleryProps) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [sessionImages, setSessionImages] = useState<SessionImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<Map<string, string>>(new Map());
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // Hook para progresso do batch
  const { activeBatchProgress, clearBatchProgress } = useBatchResults();

  // Converter data:image para blob: URL
  const convertDataUrlToBlob = useCallback(async (dataUrl: string): Promise<string> => {
    if (!dataUrl.startsWith('data:')) return dataUrl;
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Erro ao converter data URL:', error);
      return dataUrl;
    }
  }, []);

  // Carregar imagens do cache de sessão no mount
  const loadSessionCache = useCallback(() => {
    const sources = [
      'intro-processed', 'authority-processed', 'benefits-processed', 
      'urgency-processed', 'features-processed',
      'marketing-gatilhos-gemini', 'marketing-gatilhos-runware', 'marketing-gatilhos-bfl',
      'gemini-background', 'runware', 'bfl', 'bfl-white-bg', 'showcase'
    ];
    
    const cachedImages: SessionImage[] = [];
    
    sources.forEach(source => {
      const cached = aiImagesCache.loadImages(productId, source);
      if (cached && cached.length > 0) {
        cached.forEach((url, index) => {
          cachedImages.push({
            id: `cached-${source}-${index}-${Date.now()}`,
            url,
            source,
            timestamp: Date.now()
          });
        });
      }
    });
    
    if (cachedImages.length > 0) {
      console.log(`📦 [GALERIA] ${cachedImages.length} imagens carregadas do cache de sessão`);
      setSessionImages(prev => {
        // Evitar duplicatas
        const existingUrls = new Set(prev.map(img => img.url));
        const newImages = cachedImages.filter(img => !existingUrls.has(img.url));
        return [...prev, ...newImages];
      });
    }
  }, [productId]);

  // Escutar eventos imageGenerated - NORMALIZADO para aceitar images[] ou imageUrl
  useEffect(() => {
    const handleImageGenerated = async (event: CustomEvent) => {
      const { source, images: eventImages, imageUrl, productId: eventProductId, aiOrigin } = event.detail;
      
      // Verificar productId
      if (eventProductId !== productId) {
        console.log(`📸 [GALERIA] Ignorando evento - productId diferente: ${eventProductId} vs ${productId}`);
        return;
      }
      
      // ✅ NORMALIZAR: aceitar images[] OU imageUrl (converter para array)
      let newImages: string[] = [];
      if (eventImages && Array.isArray(eventImages)) {
        newImages = eventImages;
      } else if (imageUrl && typeof imageUrl === 'string') {
        newImages = [imageUrl];
      }
      
      if (newImages.length === 0) {
        console.warn(`⚠️ [GALERIA] Evento sem imagens válidas: source=${source}`);
        return;
      }
      
      const logEntry = `[${new Date().toLocaleTimeString()}] ${source}: ${newImages.length} imagem(s)`;
      setEventLog(prev => [logEntry, ...prev.slice(0, 19)]);
      
      console.log(`📸 [GALERIA-SESSÃO] Recebido evento: source=${source}, qtd=${newImages.length}, aiOrigin=${aiOrigin || 'N/A'}`);
      
      // Processar cada imagem
      const processedImages: SessionImage[] = [];
      
      for (let i = 0; i < newImages.length; i++) {
        let url = newImages[i];
        
        // Converter data:image para blob: se necessário
        if (url.startsWith('data:')) {
          url = await convertDataUrlToBlob(url);
        }
        
        processedImages.push({
          id: `session-${source}-${i}-${Date.now()}-${Math.random()}`,
          url,
          source,
          timestamp: Date.now()
        });
      }
      
      // Atualizar estado
      setSessionImages(prev => {
        const existingUrls = new Set(prev.map(img => img.url));
        const uniqueNew = processedImages.filter(img => !existingUrls.has(img.url));
        console.log(`📸 [GALERIA-SESSÃO] Adicionando ${uniqueNew.length} imagens novas (${processedImages.length - uniqueNew.length} duplicatas)`);
        return [...uniqueNew, ...prev];
      });
      
      // ✅ MERGE no cache (não sobrescrever)
      const urls = processedImages.map(img => img.url);
      const existingCache = aiImagesCache.loadImages(productId, source) || [];
      const mergedUrls = [...new Set([...existingCache, ...urls])]; // Dedupe
      aiImagesCache.saveImages(productId, source, mergedUrls);
      
      toast.success(`✨ ${processedImages.length} imagem(s) de ${SOURCE_DISPLAY_NAMES[source] || source} adicionada(s)!`);
    };

    window.addEventListener('imageGenerated', handleImageGenerated as EventListener);
    
    // Carregar cache existente
    loadSessionCache();
    
    return () => {
      window.removeEventListener('imageGenerated', handleImageGenerated as EventListener);
    };
  }, [productId, convertDataUrlToBlob, loadSessionCache]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      console.log('📸 Carregando imagens do banco:', productId);
      
      // Buscar imagens pelo product_id
      const { data: imagesData, error: imagesError } = await (supabase as any)
        .from('hosted_images')
        .select('id, url, original_filename, template_id, uploaded_at')
        .eq('product_id', productId)
        .order('uploaded_at', { ascending: false });

      if (imagesError) throw imagesError;

      // Buscar nomes dos templates
      const templateIds = imagesData
        ?.map(img => img.template_id)
        .filter((id): id is string => !!id) || [];

      if (templateIds.length > 0) {
        const { data: templatesData } = await (supabase as any)
          .from('marketing_templates')
          .select('id, name')
          .in('id', templateIds);

        if (templatesData) {
          const templateMap = new Map<string, string>();
          templatesData.forEach(t => templateMap.set(t.id, t.name));
          setTemplates(templateMap);
        }
      }

      // Mapear imagens com nomes de templates
      const mappedImages: ProductImage[] = (imagesData || []).map(img => ({
        ...img,
        template_name: img.template_id ? templates.get(img.template_id) : undefined
      }));

      setImages(mappedImages);
      console.log(`✅ ${mappedImages.length} imagens do banco carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar imagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadImages();
    }
  }, [productId]);

  // Escutar evento de nova imagem salva no banco
  useEffect(() => {
    const handleNewImage = () => {
      console.log('📢 Nova imagem salva no banco, recarregando...');
      loadImages();
    };

    window.addEventListener('hostedImageSaved', handleNewImage);
    return () => window.removeEventListener('hostedImageSaved', handleNewImage);
  }, [productId]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await safeBlobDownload(blob, filename || 'imagem.jpg');
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro ao baixar:', error);
      toast.error('Erro ao baixar imagem');
    }
  };

  const handleDeleteSession = (imageId: string) => {
    setSessionImages(prev => prev.filter(img => img.id !== imageId));
    toast.success('Imagem removida da sessão');
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    try {
      const { error } = await supabase
        .from('hosted_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Imagem excluída!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir imagem');
    }
  };

  // Agrupar imagens de sessão por source
  const groupedSessionImages = sessionImages.reduce((acc, img) => {
    const key = img.source;
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {} as Record<string, SessionImage[]>);

  const groupedByTemplate = images.reduce((acc, img) => {
    const key = img.template_id || 'sem-template';
    if (!acc[key]) acc[key] = [];
    acc[key].push(img);
    return acc;
  }, {} as Record<string, ProductImage[]>);

  const totalSessionImages = sessionImages.length;
  const totalDbImages = images.length;

  if (isLoading && sessionImages.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (images.length === 0 && sessionImages.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Images className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <h4 className="font-medium text-lg mb-1">Nenhuma imagem de marketing</h4>
        <p className="text-sm text-muted-foreground">
          Gere imagens usando a automação IA e elas aparecerão aqui automaticamente.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {/* Progress Bar para Batch de Imagens */}
      {activeBatchProgress && (
        <div className="mb-4">
          <BatchProgressBar 
            progress={activeBatchProgress} 
            onComplete={clearBatchProgress}
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Images className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Galeria de Marketing</h4>
          {totalSessionImages > 0 && (
            <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
              <Sparkles className="w-3 h-3 mr-1" />
              {totalSessionImages} sessão
            </Badge>
          )}
          {totalDbImages > 0 && (
            <Badge variant="secondary">{totalDbImages} hospedadas</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDebug(!showDebug)}
            className={showDebug ? 'bg-muted' : ''}
          >
            <Activity className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={loadImages}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="mb-4 p-3 bg-muted rounded-lg text-xs font-mono">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">📊 Debug - Eventos Recebidos</span>
            <Badge variant="outline">{eventLog.length} eventos</Badge>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {eventLog.length === 0 ? (
              <p className="text-muted-foreground">Aguardando eventos...</p>
            ) : (
              eventLog.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))
            )}
          </div>
          <div className="mt-2 pt-2 border-t">
            <span className="text-muted-foreground">
              Sessão: {totalSessionImages} | Banco: {totalDbImages} | Total: {totalSessionImages + totalDbImages}
            </span>
          </div>
        </div>
      )}

      <ScrollArea className="h-[500px]">
        <div className="space-y-6">
          {/* SEÇÃO 1: Imagens da Sessão (Automação/Showcases) */}
          {Object.keys(groupedSessionImages).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-purple-700">Imagens da Sessão (Automação IA)</span>
              </div>
              
              {Object.entries(groupedSessionImages).map(([source, sourceImages]) => (
                <div key={source} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {SOURCE_DISPLAY_NAMES[source] || source}
                    </span>
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      {sourceImages.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {sourceImages.map(image => (
                      <div 
                        key={image.id} 
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-purple-200 bg-muted"
                      >
                        <img
                          src={image.url}
                          alt={`${source} image`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        
                        {/* Badge de sessão */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700">
                            Sessão
                          </Badge>
                        </div>
                        
                        {/* Overlay com ações */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            size="icon" 
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => handleDownload(image.url, `${source}-${Date.now()}.jpg`)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => window.open(image.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => handleDeleteSession(image.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SEÇÃO 2: Imagens Hospedadas (Banco) */}
          {Object.keys(groupedByTemplate).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Images className="w-4 h-4 text-primary" />
                <span className="font-semibold">Imagens Hospedadas</span>
              </div>
              
              {Object.entries(groupedByTemplate).map(([templateId, templateImages]) => (
                <div key={templateId} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {templateId === 'sem-template' 
                        ? 'Sem template associado' 
                        : templates.get(templateId) || `Template ${templateId.slice(0, 8)}...`}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {templateImages.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {templateImages.map(image => (
                      <div 
                        key={image.id} 
                        className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
                      >
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        
                        {/* Overlay com ações */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            size="icon" 
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => handleDownload(image.url, image.filename)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="secondary"
                            className="h-8 w-8"
                            onClick={() => window.open(image.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => handleDelete(image.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Data */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <div className="flex items-center gap-1 text-xs text-white/80">
                            <Calendar className="w-3 h-3" />
                            {new Date(image.uploaded_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
