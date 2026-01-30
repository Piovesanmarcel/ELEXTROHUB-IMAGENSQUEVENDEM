import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Image as ImageIcon } from 'lucide-react';
import { 
  ImageSource, 
  ImageSourceType, 
  IMAGE_SOURCE_LABELS, 
  MarketingType, 
  GeminiModel,
  MARKETING_TYPE_LABELS,
  GEMINI_MODEL_LABELS 
} from '@/types/ad-config';
import { TemplatePickerDialog } from './TemplatePickerDialog';

interface ImageSourceSelectorProps {
  sources: ImageSource[];
  onChange: (sources: ImageSource[]) => void;
}

const SOURCE_TYPES: ImageSourceType[] = [
  'runware',
  'geminiWhite',
  'geminiBackground',
  'bfl',
  'bflWhite',
  'runway',
  'deepai',
  'carousel',
  'marketingDescription',
  'marketingFeatures',
  'marketingBenefits',
  'showcase',
  'canvaTemplate',
];

export function ImageSourceSelector({ sources, onChange }: ImageSourceSelectorProps) {
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  const handleSourceSelect = (type: ImageSourceType) => {
    if (type === 'canvaTemplate') {
      // Open template picker for new canvaTemplate source
      setEditingSourceId(null);
      setTemplatePickerOpen(true);
    } else {
      addSource(type);
    }
  };

  const addSource = (type: ImageSourceType, extraProps?: Partial<ImageSource>) => {
    const newSource: ImageSource = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: type,
      quantity: 1,
      order: sources.length + 1,
      ...extraProps,
    };
    onChange([...sources, newSource]);
  };

  const handleTemplateConfirm = (selectedIds: string[], useProductCategory: boolean) => {
    if (editingSourceId) {
      // Editing existing source
      onChange(sources.map(s => 
        s.id === editingSourceId 
          ? { ...s, selectedTemplateIds: selectedIds, useProductCategory, quantity: selectedIds.length || 1 }
          : s
      ));
    } else {
      // Adding new source
      addSource('canvaTemplate', {
        selectedTemplateIds: selectedIds,
        useProductCategory,
        quantity: selectedIds.length || 1,
      });
    }
    setEditingSourceId(null);
  };

  const openTemplateEditor = (source: ImageSource) => {
    setEditingSourceId(source.id);
    setTemplatePickerOpen(true);
  };

  const removeSource = (id: string) => {
    const updated = sources.filter(s => s.id !== id);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChange(reordered);
  };

  const updateQuantity = (id: string, quantity: number | 'all') => {
    onChange(sources.map(s => s.id === id ? { ...s, quantity } : s));
  };

  const updateMarketingType = (id: string, marketingType: MarketingType) => {
    onChange(sources.map(s => s.id === id ? { ...s, marketingType } : s));
  };

  const updateGeminiModel = (id: string, geminiModel: GeminiModel) => {
    onChange(sources.map(s => s.id === id ? { ...s, geminiModel } : s));
  };

  const isMarketingSource = (type: ImageSourceType) => 
    ['marketingDescription', 'marketingFeatures', 'marketingBenefits'].includes(type);

  const isGeminiBackgroundSource = (type: ImageSourceType) => 
    type === 'geminiBackground';

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sources];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChange(reordered);
  };

  const moveDown = (index: number) => {
    if (index === sources.length - 1) return;
    const updated = [...sources];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChange(reordered);
  };

  // Get current editing source for initial values
  const editingSource = editingSourceId 
    ? sources.find(s => s.id === editingSourceId) 
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Fontes de Imagem</span>
        <Select onValueChange={(value) => handleSourceSelect(value as ImageSourceType)} value="">
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Adicionar fonte..." />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_TYPES.map(type => (
              <SelectItem key={type} value={type} className="text-xs">
                {IMAGE_SOURCE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {sources.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma fonte adicionada. Clique em "Adicionar fonte" acima.
          </p>
        ) : (
          sources.map((source, index) => (
            <div 
              key={source.id} 
              className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border border-border"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === sources.length - 1}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium truncate block">
                  {IMAGE_SOURCE_LABELS[source.source]}
                </span>
                
                {/* Show template info for canvaTemplate */}
                {source.source === 'canvaTemplate' && (
                  <div className="flex items-center gap-1 mt-1">
                    {source.useProductCategory && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        Auto-categoria
                      </span>
                    )}
                    {source.selectedTemplateIds && source.selectedTemplateIds.length > 0 && (
                      <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {source.selectedTemplateIds.length} selecionado{source.selectedTemplateIds.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 px-1.5 text-[10px]"
                      onClick={() => openTemplateEditor(source)}
                    >
                      <ImageIcon className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </div>
                )}

                {/* Show type selector for Marketing sources */}
                {isMarketingSource(source.source) && (
                  <div className="flex items-center gap-1 mt-1">
                    <Select 
                      value={source.marketingType || 'all'}
                      onValueChange={(v) => updateMarketingType(source.id, v as MarketingType)}
                    >
                      <SelectTrigger className="h-5 text-[10px] w-auto min-w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MARKETING_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Show model selector for Gemini Background */}
                {isGeminiBackgroundSource(source.source) && (
                  <div className="flex items-center gap-1 mt-1">
                    <Select 
                      value={source.geminiModel || 'all'}
                      onValueChange={(v) => updateGeminiModel(source.id, v as GeminiModel)}
                    >
                      <SelectTrigger className="h-5 text-[10px] w-auto min-w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GEMINI_MODEL_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {source.source !== 'canvaTemplate' && (
                  <Select 
                    value={source.quantity === 'all' ? 'all' : source.quantity.toString()}
                    onValueChange={(v) => updateQuantity(source.id, v === 'all' ? 'all' : parseInt(v))}
                  >
                    <SelectTrigger className="w-[70px] h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todas</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <SelectItem key={n} value={n.toString()} className="text-xs">{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeSource(source.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <TemplatePickerDialog
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onConfirm={handleTemplateConfirm}
        initialSelectedIds={editingSource?.selectedTemplateIds || []}
        initialUseProductCategory={editingSource?.useProductCategory || false}
      />
    </div>
  );
}