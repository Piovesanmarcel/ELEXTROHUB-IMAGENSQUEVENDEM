import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Rocket, Image as ImageIcon, Package, Settings2, Plus, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

import { N8NWebhookConfig } from '@/components/n8n/N8NWebhookConfig';
import { CanvaTemplateSelector } from '@/components/n8n/CanvaTemplateSelector';
import { N8NResultDisplay } from '@/components/n8n/N8NResultDisplay';
import { N8NResultGallery, N8NGeneratedImage } from '@/components/n8n/N8NResultGallery';
import { useMarketingTemplates } from '@/hooks/useMarketingTemplates';
import { useCanvaTemplateN8N } from '@/hooks/useCanvaTemplateN8N';
import { TemplateConfig } from '@/types/marketing-templates';
import { cn } from '@/lib/utils';

export default function CanvaTemplateN8NPage() {
  // Hook de templates do banco
  const { templates, isLoading: isLoadingTemplates } = useMarketingTemplates();
  
  // Hook de integração n8n
  const {
    webhookUrl,
    setWebhookUrl,
    jobStatus,
    response,
    processingTime,
    generateTemplate,
    resetState,
  } = useCanvaTemplateN8N();

  // Estado para imagens geradas pelo n8n
  const [n8nGeneratedImages, setN8nGeneratedImages] = useState<N8NGeneratedImage[]>([]);

  // Estados locais
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Geral 01');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  // Dados do produto
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productBenefits, setProductBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState('');
  const [callToAction, setCallToAction] = useState('');
  
  // Configurações de geração
  const [quality, setQuality] = useState<'standard' | 'HD'>('HD');
  const [promptMode, setPromptMode] = useState<'complete' | 'reduced' | 'minimal'>('complete');
  const [incluirLogo, setIncluirLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  // Dropzone para upload de imagens
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedImages(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${acceptedFiles.length} imagem(ns) carregada(s)`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 5
  });

  // Handlers
  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setProductBenefits(prev => [...prev, newBenefit.trim()]);
      setNewBenefit('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setProductBenefits(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearGeneratedImages = () => {
    setN8nGeneratedImages([]);
    toast.success('Galeria limpa');
  };

  const handleRemoveGeneratedImage = (id: string) => {
    setN8nGeneratedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Selecione um template!');
      return;
    }

    if (!productName) {
      toast.error('Preencha o nome do produto!');
      return;
    }

    if (selectedImages.length === 0) {
      toast.error('Selecione pelo menos uma imagem!');
      return;
    }

    const result = await generateTemplate(
      selectedTemplate,
      {
        name: productName,
        description: productDescription,
        benefits: productBenefits.length > 0 ? productBenefits : undefined,
        callToAction: callToAction || undefined,
      },
      selectedImages,
      {
        quality,
        promptMode,
        incluir_logo: incluirLogo,
        logo_url: incluirLogo && logoUrl ? logoUrl : undefined,
      }
    );

    // Se sucesso, adicionar à galeria de resultados
    if (result?.success && result?.imageUrl) {
      const newImage: N8NGeneratedImage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        imageUrl: result.imageUrl,
        generatedAt: new Date().toISOString(),
        productName: productName,
      };
      setN8nGeneratedImages(prev => [newImage, ...prev]);
    }
  };

  const canGenerate = webhookUrl && selectedTemplate && productName && selectedImages.length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Templates de Marketing via n8n
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere templates de marketing estilo Canva usando workflows n8n
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Integração n8n
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Configuração e Template */}
        <div className="space-y-6">
          {/* Config n8n */}
          <N8NWebhookConfig
            webhookUrl={webhookUrl}
            onWebhookUrlChange={setWebhookUrl}
          />

          {/* Seletor de Template */}
          <CanvaTemplateSelector
            templates={templates}
            isLoading={isLoadingTemplates}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Coluna 2: Produto e Imagens */}
        <div className="space-y-6">
          {/* Dados do Produto */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Dados do Produto</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nome do Produto *</Label>
                <Input
                  id="product-name"
                  placeholder="Ex: Caixa Plástica Organizadora"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Descrição</Label>
                <Textarea
                  id="product-description"
                  placeholder="Descrição detalhada do produto..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Benefícios</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar benefício..."
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()}
                  />
                  <Button size="icon" onClick={handleAddBenefit}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {productBenefits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {productBenefits.map((benefit, index) => (
                      <Badge key={index} variant="secondary" className="pr-1">
                        {benefit}
                        <button
                          onClick={() => handleRemoveBenefit(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta">Call to Action</Label>
                <Input
                  id="cta"
                  placeholder="Ex: Compre agora!"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Imagens */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Imagens do Produto</CardTitle>
                </div>
                <Badge variant="secondary">
                  {selectedImages.length} selecionadas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone para Upload */}
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-sm text-primary">Solte as imagens aqui...</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Arraste imagens ou clique para upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, WEBP (máx. 5 imagens)
                    </p>
                  </>
                )}
              </div>

              {/* Imagens Selecionadas */}
              {selectedImages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Imagens selecionadas</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedImages([])}
                      className="text-xs h-7"
                    >
                      Limpar
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedImages.map((img, index) => (
                      <div 
                        key={index} 
                        className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                      >
                        <img
                          src={img}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveSelectedImage(index)}
                          className="absolute top-1 right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações de Geração */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Configurações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Qualidade</Label>
                  <Select value={quality} onValueChange={(v: 'standard' | 'HD') => setQuality(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="HD">HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Modo do Prompt</Label>
                  <Select 
                    value={promptMode} 
                    onValueChange={(v: 'complete' | 'reduced' | 'minimal') => setPromptMode(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="complete">Completo</SelectItem>
                      <SelectItem value="reduced">Reduzido</SelectItem>
                      <SelectItem value="minimal">Mínimo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 3: Geração e Resultado */}
        <div className="space-y-6">
          {/* Botão de Geração */}
          <Card>
            <CardContent className="pt-6">
              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerate}
                disabled={!canGenerate || jobStatus === 'sending' || jobStatus === 'processing'}
              >
                <Rocket className="h-5 w-5 mr-2" />
                {jobStatus === 'sending' || jobStatus === 'processing'
                  ? 'Gerando...'
                  : 'Gerar via n8n'
                }
              </Button>

              {!canGenerate && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  {!webhookUrl && <p>⚠️ Configure o webhook n8n</p>}
                  {!selectedTemplate && <p>⚠️ Selecione um template</p>}
                  {!productName && <p>⚠️ Preencha o nome do produto</p>}
                  {selectedImages.length === 0 && <p>⚠️ Selecione imagens</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resultado Direto */}
          <N8NResultDisplay
            response={response}
            processingTime={processingTime}
            jobStatus={jobStatus}
            productName={productName}
            templateName={selectedTemplate?.name || ''}
            onRetry={handleGenerate}
          />

          {/* Resultados em Tempo Real */}
          <N8NResultGallery
            images={n8nGeneratedImages}
            onClearAll={handleClearGeneratedImages}
            onRemoveImage={handleRemoveGeneratedImage}
          />
        </div>
      </div>

    </div>
  );
}
