import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Upload, Trash2, ImageIcon } from 'lucide-react';
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { cn } from '@/lib/utils';

const POSITION_OPTIONS = [
  { value: 'top-left', label: 'Superior Esquerdo' },
  { value: 'top-right', label: 'Superior Direito' },
  { value: 'bottom-left', label: 'Inferior Esquerdo' },
  { value: 'bottom-right', label: 'Inferior Direito' },
] as const;

export const GlobalLogoSettings = () => {
  const { brandSettings, isLoading, updateBrandSettings, uploadLogo, removeLogo } = useBrandSettings();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await uploadLogo(file);
    setUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePositionChange = (position: string) => {
    updateBrandSettings({ logo_position: position as any });
  };

  const handleSizeChange = (value: number[]) => {
    updateBrandSettings({ logo_size: value[0] });
  };

  const handleToggle = (checked: boolean) => {
    updateBrandSettings({ show_logo_on_templates: checked });
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Logo Global</h3>
          <p className="text-xs text-muted-foreground">Aplicada automaticamente em todos os templates</p>
        </div>
        <Switch
          checked={brandSettings?.show_logo_on_templates ?? true}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Logo Preview/Upload */}
      <div className="space-y-2">
        <Label className="text-xs">Logo da Marca</Label>
        
        {brandSettings?.logo_url ? (
          <div className="relative group">
            <div className="border rounded-lg p-3 bg-muted/30 flex items-center justify-center min-h-[80px]">
              <img 
                src={brandSettings.logo_url} 
                alt="Logo" 
                className="max-h-16 max-w-full object-contain"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-3 h-3 mr-1" />
                Trocar
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={removeLogo}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full h-20 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <div className="flex flex-col items-center gap-1">
              {uploading ? (
                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {uploading ? 'Enviando...' : 'Clique para enviar logo'}
              </span>
            </div>
          </Button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Position Selector */}
      <div className="space-y-2">
        <Label className="text-xs">Posição</Label>
        <div className="grid grid-cols-2 gap-2">
          {POSITION_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant="outline"
              size="sm"
              className={cn(
                "text-xs h-8",
                brandSettings?.logo_position === option.value && "border-primary bg-primary/10"
              )}
              onClick={() => handlePositionChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Size Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Tamanho</Label>
          <span className="text-xs text-muted-foreground">{brandSettings?.logo_size ?? 100}px</span>
        </div>
        <Slider
          value={[brandSettings?.logo_size ?? 100]}
          onValueChange={handleSizeChange}
          min={50}
          max={200}
          step={10}
          className="w-full"
        />
      </div>

      {/* Preview */}
      {brandSettings?.logo_url && brandSettings?.show_logo_on_templates && (
        <div className="space-y-2">
          <Label className="text-xs">Preview</Label>
          <div className="border rounded-lg p-2 bg-muted/20 relative aspect-square max-w-[120px]">
            <div 
              className={cn(
                "absolute",
                brandSettings.logo_position === 'top-left' && "top-1 left-1",
                brandSettings.logo_position === 'top-right' && "top-1 right-1",
                brandSettings.logo_position === 'bottom-left' && "bottom-1 left-1",
                brandSettings.logo_position === 'bottom-right' && "bottom-1 right-1"
              )}
            >
              <img 
                src={brandSettings.logo_url} 
                alt="Preview" 
                style={{ 
                  width: `${Math.min(brandSettings.logo_size / 3, 40)}px`,
                  height: 'auto'
                }}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
