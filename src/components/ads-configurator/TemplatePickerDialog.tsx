import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Check, Image as ImageIcon } from 'lucide-react';
import { useMarketingTemplates } from '@/hooks/useMarketingTemplates';

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedIds: string[], useProductCategory: boolean) => void;
  initialSelectedIds?: string[];
  initialUseProductCategory?: boolean;
}

export function TemplatePickerDialog({
  open,
  onOpenChange,
  onConfirm,
  initialSelectedIds = [],
  initialUseProductCategory = false,
}: TemplatePickerDialogProps) {
  const { templates, isLoading } = useMarketingTemplates();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [useProductCategory, setUseProductCategory] = useState(initialUseProductCategory);
  const [activeCategory, setActiveCategory] = useState('all');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds);
      setUseProductCategory(initialUseProductCategory);
    }
  }, [open, initialSelectedIds, initialUseProductCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category || 'Geral 01'));
    return ['all', ...Array.from(cats).sort()];
  }, [templates]);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'all') return templates;
    return templates.filter(t => t.category === activeCategory);
  }, [templates, activeCategory]);

  const toggleTemplate = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(filteredTemplates.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedIds, useProductCategory);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Selecionar Templates Canva
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Switch 
              id="use-product-category" 
              checked={useProductCategory}
              onCheckedChange={setUseProductCategory}
            />
            <Label htmlFor="use-product-category" className="text-sm cursor-pointer">
              Usar categoria do produto (auto-filtrar)
            </Label>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Selecionar todos
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              Limpar seleção
            </Button>
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex flex-col min-h-0">
          <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0 mb-3">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs px-3 py-1.5"
              >
                {cat === 'all' ? 'Todas' : cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
                {filteredTemplates.map(template => {
                  const isSelected = selectedIds.includes(template.id);
                  return (
                    <div
                      key={template.id}
                      onClick={() => toggleTemplate(template.id)}
                      className={`
                        relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                        ${isSelected 
                          ? 'border-primary ring-2 ring-primary/30' 
                          : 'border-border hover:border-muted-foreground/50'
                        }
                      `}
                    >
                      <div className="aspect-square relative bg-muted">
                        <img
                          src={template.baseImage}
                          alt={template.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="bg-primary rounded-full p-1">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-1.5 bg-background">
                        <p className="text-[10px] text-muted-foreground truncate text-center">
                          {template.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </Tabs>

        <DialogFooter className="flex items-center justify-between border-t border-border pt-4">
          <Badge variant="secondary" className="text-xs">
            {selectedIds.length} template{selectedIds.length !== 1 ? 's' : ''} selecionado{selectedIds.length !== 1 ? 's' : ''}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={selectedIds.length === 0 && !useProductCategory}>
              Confirmar Seleção
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}