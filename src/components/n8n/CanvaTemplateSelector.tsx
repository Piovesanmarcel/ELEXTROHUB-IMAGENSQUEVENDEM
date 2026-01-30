import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layout, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { TemplateConfig, TEMPLATE_CATEGORIES } from '@/types/marketing-templates';
import { cn } from '@/lib/utils';

interface CanvaTemplateSelectorProps {
  templates: TemplateConfig[];
  isLoading: boolean;
  selectedTemplate: TemplateConfig | null;
  onSelectTemplate: (template: TemplateConfig) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CanvaTemplateSelector({
  templates,
  isLoading,
  selectedTemplate,
  onSelectTemplate,
  selectedCategory,
  onCategoryChange,
}: CanvaTemplateSelectorProps) {
  // Filtrar templates pela categoria
  const filteredTemplates = templates.filter(t => 
    (t.category || 'Geral 01') === selectedCategory
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Selecionar Template</CardTitle>
          </div>
          <Badge variant="secondary">
            {filteredTemplates.length} templates
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor de categoria */}
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid de templates */}
        <ScrollArea className="h-[300px] pr-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhum template nesta categoria</p>
              <p className="text-xs mt-1">Selecione outra categoria ou crie um novo template</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className={cn(
                    "relative rounded-lg overflow-hidden border-2 transition-all hover:shadow-md",
                    selectedTemplate?.id === template.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-muted relative">
                    {template.baseImage ? (
                      <img
                        src={template.baseImage}
                        alt={template.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layout className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    
                    {/* Check mark overlay */}
                    {selectedTemplate?.id === template.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2 bg-card">
                    <p className="text-xs font-medium truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.dimensions.width}×{template.dimensions.height}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Template selecionado info */}
        {selectedTemplate && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Template selecionado</span>
            </div>
            <p className="text-sm">{selectedTemplate.name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedTemplate.dimensions.width}×{selectedTemplate.dimensions.height}px • {selectedTemplate.zones.length} zonas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
