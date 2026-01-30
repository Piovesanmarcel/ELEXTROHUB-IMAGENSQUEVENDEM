import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { TemplateSource } from '@/types/ad-config';
import { supabase } from '@/integrations/supabase/client';

interface TemplateSourceSelectorProps {
  sources: TemplateSource[];
  onChange: (sources: TemplateSource[]) => void;
}

interface TemplateCategory {
  category: string;
  count: number;
}

export function TemplateSourceSelector({ sources, onChange }: TemplateSourceSelectorProps) {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    // Using type assertion since marketing_templates table may not exist in types
    const { data, error } = await (supabase as any)
      .from('marketing_templates')
      .select('category');

    if (!error && data) {
      const categoryMap = new Map<string, number>();
      (data as Array<{ category?: string }>).forEach(t => {
        const cat = t.category || 'Geral';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      
      const cats: TemplateCategory[] = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => a.category.localeCompare(b.category));
      
      setCategories(cats);
    }
  };

  const addTemplateSource = () => {
    const newSource: TemplateSource = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      useProductCategory: true,
      quantity: 2,
      order: sources.length + 1,
    };
    onChange([...sources, newSource]);
  };

  const removeSource = (id: string) => {
    const updated = sources.filter(s => s.id !== id);
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    onChange(reordered);
  };

  const updateSource = (id: string, updates: Partial<TemplateSource>) => {
    onChange(sources.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Templates de Marketing</span>
        <Button
          variant="outline"
          size="sm"
          onClick={addTemplateSource}
          className="h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar Template
        </Button>
      </div>

      <div className="space-y-3 max-h-[200px] overflow-y-auto">
        {sources.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum template adicionado.
          </p>
        ) : (
          sources.map((source) => (
            <div 
              key={source.id} 
              className="p-3 bg-muted/50 rounded-md border border-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={source.useProductCategory}
                    onCheckedChange={(checked) => updateSource(source.id, { 
                      useProductCategory: checked,
                      specificCategory: checked ? undefined : categories[0]?.category
                    })}
                  />
                  <Label className="text-xs">Usar categoria do produto</Label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeSource(source.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {!source.useProductCategory && (
                <Select
                  value={source.specificCategory || ''}
                  onValueChange={(v) => updateSource(source.id, { specificCategory: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.category} value={cat.category} className="text-xs">
                        {cat.category} ({cat.count} templates)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-2">
                <Label className="text-xs">Quantidade:</Label>
                <Select
                  value={source.quantity.toString()}
                  onValueChange={(v) => updateSource(source.id, { quantity: parseInt(v) })}
                >
                  <SelectTrigger className="w-[70px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                      <SelectItem key={n} value={n.toString()} className="text-xs">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
