import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Copy, Download, Upload, X, Save, ImageOff } from 'lucide-react';
import { TemplateZone, TemplateConfig } from '@/types/marketing-templates';
import { toast } from 'sonner';
import { useMarketingTemplates } from '@/hooks/useMarketingTemplates';

interface TemplateMapperProps {
  initialTemplate?: TemplateConfig | null;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
  onSave?: (id: string, updates: Partial<TemplateConfig>) => Promise<boolean>;
}

export const TemplateMapper = ({ initialTemplate, onCancel, mode = 'create', onSave }: TemplateMapperProps) => {
  // Usar onSave do pai se fornecido, senão usar hook próprio (compatibilidade)
  const { updateTemplate: hookUpdateTemplate } = useMarketingTemplates();
  const updateTemplate = onSave ?? hookUpdateTemplate;
  const [isSaving, setIsSaving] = useState(false);
  
  // ID original do banco - não pode ser editado em modo edição
  const [originalId, setOriginalId] = useState<string | null>(initialTemplate?.id || null);
  
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(
    initialTemplate || {
      id: '',
      name: '',
      baseImage: '',
      dimensions: { width: 1200, height: 1200 },
      zones: [],
      category: 'Geral 01',
      disableGlobalLogo: false
    }
  );
  
  const [selectedZone, setSelectedZone] = useState<TemplateZone | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTemplate) {
      setTemplateConfig(initialTemplate);
      setOriginalId(initialTemplate.id); // Preservar UUID original
      setSelectedZone(null);
    }
  }, [initialTemplate]);

  useEffect(() => {
    if (canvasRef.current && templateConfig.baseImage) {
      drawCanvas();
    }
  }, [templateConfig.zones, selectedZone, templateConfig.baseImage]);

  const drawCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base image
    if (templateConfig.baseImage) {
      const img = new Image();
      img.src = templateConfig.baseImage;
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(null);
        };
      });
    }

    // Draw zones
    templateConfig.zones.forEach(zone => {
      const isSelected = selectedZone?.id === zone.id;
      
      ctx.strokeStyle = isSelected ? '#10b981' : '#3b82f6';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(isSelected ? [] : [5, 5]);
      ctx.strokeRect(zone.position.x, zone.position.y, zone.position.width, zone.position.height);

      // Draw zone label
      ctx.fillStyle = isSelected ? '#10b981' : '#3b82f6';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(zone.id, zone.position.x + 5, zone.position.y + 15);
      
      ctx.setLineDash([]);
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on existing zone
    const clickedZone = templateConfig.zones.find(zone => 
      x >= zone.position.x && x <= zone.position.x + zone.position.width &&
      y >= zone.position.y && y <= zone.position.y + zone.position.height
    );

    if (clickedZone) {
      setSelectedZone(clickedZone);
    } else {
      // Start drawing new zone
      setIsDrawing(true);
      setDrawStart({ x, y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Preview rectangle
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawCanvas();
    
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
      drawStart.x,
      drawStart.y,
      x - drawStart.x,
      y - drawStart.y
    );
    ctx.setLineDash([]);
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawStart) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newZone: TemplateZone = {
      id: `zone-${Date.now()}`,
      type: 'text',
      position: {
        x: Math.min(drawStart.x, x),
        y: Math.min(drawStart.y, y),
        width: Math.abs(x - drawStart.x),
        height: Math.abs(y - drawStart.y)
      },
      zIndex: templateConfig.zones.length,
      dataSource: '',
      style: {
        fontSize: '16px',
        fontFamily: 'Inter, sans-serif',
        color: '#000000'
      }
    };

    setTemplateConfig(prev => ({
      ...prev,
      zones: [...prev.zones, newZone]
    }));

    setSelectedZone(newZone);
    setIsDrawing(false);
    setDrawStart(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setTemplateConfig(prev => ({ ...prev, baseImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const updateSelectedZone = (updates: Partial<TemplateZone>) => {
    if (!selectedZone) return;

    setTemplateConfig(prev => ({
      ...prev,
      zones: prev.zones.map(zone => 
        zone.id === selectedZone.id ? { ...zone, ...updates } : zone
      )
    }));

    setSelectedZone(prev => prev ? { ...prev, ...updates } : null);
  };

  const deleteZone = (zoneId: string) => {
    setTemplateConfig(prev => ({
      ...prev,
      zones: prev.zones.filter(z => z.id !== zoneId)
    }));
    setSelectedZone(null);
  };

  const exportConfig = () => {
    const json = JSON.stringify(templateConfig, null, 2);
    navigator.clipboard.writeText(json);
    toast.success('Configuração copiada para clipboard!');
  };

  const handleSaveToDatabase = async () => {
    // Usar o ID original para updates (UUID do banco)
    const idToUse = originalId || templateConfig.id;
    
    if (!idToUse) {
      toast.error('ID do template é obrigatório');
      return;
    }
    
    console.log('💾 Salvando template:', {
      id: idToUse,
      disableGlobalLogo: templateConfig.disableGlobalLogo,
      name: templateConfig.name
    });
    
    setIsSaving(true);
    try {
      await updateTemplate(idToUse, {
        name: templateConfig.name,
        category: templateConfig.category,
        disableGlobalLogo: templateConfig.disableGlobalLogo,
        zones: templateConfig.zones,
        baseImage: templateConfig.baseImage,
        dimensions: templateConfig.dimensions,
      });
      toast.success('Template salvo no banco de dados!');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadConfig = () => {
    const json = JSON.stringify(templateConfig, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateConfig.id || 'template'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setTemplateConfig({
      id: '',
      name: '',
      baseImage: '',
      dimensions: { width: 1200, height: 1200 },
      zones: [],
      category: 'Geral 01',
      disableGlobalLogo: false
    });
    setSelectedZone(null);
    onCancel?.();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Canvas Area */}
      <Card className="lg:col-span-2 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {mode === 'edit' ? 'Editando Template' : 'Novo Template'}
              </h3>
              {mode === 'edit' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Editando: {templateConfig.name}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {mode === 'edit' && (
                <Button size="sm" variant="outline" onClick={handleReset}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar Edição
                </Button>
              )}
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Base
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          <div className="border rounded-lg overflow-hidden bg-muted">
            <canvas
              ref={canvasRef}
              width={1200}
              height={1200}
              className="max-w-full h-auto cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Clique e arraste para criar zonas. Clique em uma zona existente para selecioná-la.
          </p>
        </div>
      </Card>

      {/* Configuration Panel */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Configuração do Template</h3>
            
            <div className="space-y-4">
              <div>
                <Label>ID do Template</Label>
                <Input
                  value={templateConfig.id}
                  onChange={(e) => setTemplateConfig(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="template-01"
                  disabled={mode === 'edit'}
                  className={mode === 'edit' ? 'bg-muted cursor-not-allowed' : ''}
                />
                {mode === 'edit' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    O ID não pode ser alterado em modo edição
                  </p>
                )}
              </div>

              <div>
                <Label>Nome do Template</Label>
                <Input
                  value={templateConfig.name}
                  onChange={(e) => setTemplateConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome descritivo"
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <Select 
                  value={templateConfig.category || 'Geral 01'} 
                  onValueChange={(value) => setTemplateConfig({...templateConfig, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geral 01">Geral 01</SelectItem>
                    <SelectItem value="Geral 02">Geral 02</SelectItem>
                    <SelectItem value="Brinquedos">Brinquedos</SelectItem>
                    <SelectItem value="Cafeteiras">Cafeteiras</SelectItem>
                    <SelectItem value="Utilidades">Utilidades</SelectItem>
                    <SelectItem value="Pet Shop">Pet Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle para desativar logo global */}
              <div className="border rounded-lg p-3 bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ImageOff className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Desativar Logo Global</Label>
                      <p className="text-xs text-muted-foreground">
                        Marque se a logo já está na imagem base
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={templateConfig.disableGlobalLogo ?? false}
                    onCheckedChange={(checked) => 
                      setTemplateConfig(prev => ({ ...prev, disableGlobalLogo: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {selectedZone && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Zona: {selectedZone.id}</h4>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteZone(selectedZone.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={selectedZone.type}
                  onValueChange={(value: any) => updateSelectedZone({ type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fonte de Dados</Label>
                <Select
                  value={selectedZone.dataSource}
                  onValueChange={(value) => updateSelectedZone({ dataSource: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Imagens AI */}
                    <SelectItem value="aiImages[0]">Imagem AI 1</SelectItem>
                    <SelectItem value="aiImages[1]">Imagem AI 2</SelectItem>
                    <SelectItem value="aiImages[2]">Imagem AI 3</SelectItem>
                    
                    {/* Copywriting Profissional - Seções Específicas */}
                    <SelectItem value="copywriting.characteristics">📝 Seção 3 - Características</SelectItem>
                    <SelectItem value="copywriting.benefits">📝 Seção 5 - Benefícios Cliente</SelectItem>
                    <SelectItem value="copywriting.environments">📝 Seção 9 - Ambientes Ideais</SelectItem>
                    
                    {/* Dados Unificados */}
                    <SelectItem value="unified.topicos_conversao.benefits[0]">Benefício Unificado 1</SelectItem>
                    <SelectItem value="unified.topicos_conversao.benefits[1]">Benefício Unificado 2</SelectItem>
                    <SelectItem value="unified.topicos_conversao.benefits[2]">Benefício Unificado 3</SelectItem>
                    <SelectItem value="unified.palavras_chave_seo.keywords[0]">Palavra-chave 1</SelectItem>
                    
                    {/* Produto */}
                    <SelectItem value="product.name">Nome do Produto</SelectItem>
                    <SelectItem value="static:Texto Fixo">Texto Estático</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Z-Index</Label>
                <Input
                  type="number"
                  value={selectedZone.zIndex}
                  onChange={(e) => updateSelectedZone({ zIndex: parseInt(e.target.value) })}
                />
              </div>
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            {mode === 'edit' && (
              <Button 
                className="w-full" 
                variant="default" 
                onClick={handleSaveToDatabase}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar no Banco'}
              </Button>
            )}
            <Button className="w-full" onClick={exportConfig}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar JSON
            </Button>
            <Button className="w-full" variant="outline" onClick={downloadConfig}>
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
