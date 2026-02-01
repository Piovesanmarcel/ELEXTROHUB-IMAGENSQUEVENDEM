import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2, Package, Settings2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createCompleteZipPackage } from '@/utils/completePackageGenerator';
import { PDF_TEMPLATES } from '@/utils/ebookTemplates';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Tipos
interface SimpleProduct {
  nome: string;
  descricao?: string | null;
  sku?: string;
}

import { UnifiedAIResponse } from '@/components/product/ai-enhancer/types';

interface EbookDownloadButtonProps {
  product: SimpleProduct;
  unifiedData?: UnifiedAIResponse | null;
  copywritingText?: string;
  images?: Array<{ url: string; type?: string }>;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showOptions?: boolean;
  forceEnabled?: boolean;
  customTrigger?: React.ReactNode;
}

const EbookDownloadButton: React.FC<EbookDownloadButtonProps> = ({
  product,
  unifiedData,
  copywritingText,
  images = [],
  variant = 'default',
  size = 'default',
  className = '',
  showOptions = true,
  forceEnabled = false,
  customTrigger
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [includeImages, setIncludeImages] = useState(true);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const handleDownload = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setOptionsOpen(false);

    const toastId = toast.loading('Preparando Kit Completo...', {
      description: 'Gerando eBook e organizando arquivos'
    });

    try {
      setProgress(10);
      toast.loading('Gerando eBook PDF...', { id: toastId });

      await createCompleteZipPackage({
        product,
        unifiedData,
        copywritingText,
        images,
        templateId: selectedTemplate,
        includeImagesInPDF: includeImages,
        onProgress: (stage, percent) => {
          setProgress(percent);
          toast.loading(`${stage}...`, {
            id: toastId,
            description: `${percent}% concluído`
          });
        }
      });

      setProgress(100);
      toast.success('Download iniciado!', {
        id: toastId,
        description: 'Kit completo com eBook, imagens e textos'
      });

    } catch (error) {
      console.error('Erro ao gerar kit:', error);
      toast.error('Erro ao gerar kit', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Tente novamente'
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // Verificar se há conteúdo para download
  const hasContent = !!(
    unifiedData?.topicos_conversao ||
    unifiedData?.palavras_chave_seo ||
    unifiedData?.perguntas_respostas ||
    unifiedData?.kits_criativos ||
    copywritingText ||
    product.descricao ||
    images.length > 0
  );

  const selectedTemplateData = PDF_TEMPLATES.find(t => t.id === selectedTemplate) || PDF_TEMPLATES[0];

  // 1. Caso Custom Trigger (botão personalizado)
  if (customTrigger) {
    return (
      <div onClick={(!isGenerating && (hasContent || forceEnabled)) ? handleDownload : undefined} className={className}>
        {customTrigger}
      </div>
    );
  }

  // 2. Versão simples sem opções
  if (!showOptions) {
    return (
      <Button
        onClick={handleDownload}
        disabled={isGenerating || (!hasContent && !forceEnabled)}
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Gerando... {progress}%</span>
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            <span>Baixar Kit Completo</span>
          </>
        )}
      </Button>
    );
  }

  // Versão completa com opções
  return (
    <div className="flex items-center gap-2">
      <Popover open={optionsOpen} onOpenChange={setOptionsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size={size}
            className="gap-2"
            disabled={isGenerating || (!hasContent && !forceEnabled)}
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Opções</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-background border" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Estilo do PDF</h4>
              <RadioGroup
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                className="space-y-2"
              >
                {PDF_TEMPLATES.map(template => (
                  <div key={template.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={template.id} id={template.id} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={template.id} className="font-medium cursor-pointer">
                        {template.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <div className="flex gap-1 mt-1">
                        {['primary', 'secondary', 'accent'].map(colorKey => {
                          const color = template.colors[colorKey as keyof typeof template.colors];
                          return (
                            <div
                              key={colorKey}
                              className="w-4 h-4 rounded-full border border-border"
                              style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-sm">Opções de Conteúdo</h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="include-images" className="text-sm cursor-pointer">
                    Incluir imagens no PDF
                  </Label>
                </div>
                <Switch
                  id="include-images"
                  checked={includeImages}
                  onCheckedChange={setIncludeImages}
                />
              </div>

              {images.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {images.length} {images.length === 1 ? 'imagem disponível' : 'imagens disponíveis'}
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleDownload}
        disabled={isGenerating || (!hasContent && !forceEnabled)}
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Gerando... {progress}%</span>
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            <span>Baixar Kit Completo</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default EbookDownloadButton;
