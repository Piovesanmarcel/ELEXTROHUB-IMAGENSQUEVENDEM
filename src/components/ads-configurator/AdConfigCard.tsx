import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Edit2, Check, X, Trash2 } from 'lucide-react';
import { AdConfig, IMAGE_SOURCE_LABELS } from '@/types/ad-config';
import { ImageSourceSelector } from './ImageSourceSelector';
import { TemplateSourceSelector } from './TemplateSourceSelector';
import { cn } from '@/lib/utils';

interface AdConfigCardProps {
  config: AdConfig;
  onChange: (config: AdConfig) => void;
  onRemove?: () => void;
}

export function AdConfigCard({ config, onChange, onRemove }: AdConfigCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(config.name);

  const handleToggleEnabled = () => {
    onChange({ ...config, enabled: !config.enabled });
  };

  const handleSaveName = () => {
    onChange({ ...config, name: editName });
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditName(config.name);
    setIsEditingName(false);
  };

  const totalImages = config.imageSources.reduce((sum, s) => {
    if (s.quantity === 'all') return sum + 10; // Estimate
    return sum + s.quantity;
  }, 0);

  const totalTemplates = config.templateSources.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <Card className={cn(
      "transition-all duration-200",
      !config.enabled && "opacity-50",
      isExpanded && "ring-2 ring-primary/50"
    )}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggleEnabled}
            />
            
            <span className="text-xs font-bold text-muted-foreground">
              #{config.id}
            </span>

            {isEditingName ? (
              <div className="flex items-center gap-1 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 text-sm flex-1"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveName}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CardTitle className="text-sm truncate">{config.name}</CardTitle>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 shrink-0"
                  onClick={() => setIsEditingName(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-xs text-muted-foreground hidden sm:block">
              📷 {totalImages} | 📋 {totalTemplates}
            </div>
            
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {!isExpanded && (
          <div className="flex flex-wrap gap-1 mt-2">
            {config.imageSources.slice(0, 4).map(source => (
              <span 
                key={source.id} 
                className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded"
              >
                {IMAGE_SOURCE_LABELS[source.source].split(' ')[0]} 
                {source.quantity !== 'all' && `: ${source.quantity}`}
                {source.quantity === 'all' && ': *'}
              </span>
            ))}
            {config.imageSources.length > 4 && (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                +{config.imageSources.length - 4} mais
              </span>
            )}
            {config.templateSources.length > 0 && (
              <span className="text-[10px] bg-secondary/10 text-secondary-foreground px-1.5 py-0.5 rounded">
                📋 {config.templateSources.length} template(s)
              </span>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4">
          <ImageSourceSelector
            sources={config.imageSources}
            onChange={(sources) => onChange({ ...config, imageSources: sources })}
          />
          
          <TemplateSourceSelector
            sources={config.templateSources}
            onChange={(sources) => onChange({ ...config, templateSources: sources })}
          />
        </CardContent>
      )}
    </Card>
  );
}
