import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Save, RotateCcw, Download, Upload, Plus } from 'lucide-react';
import { AdConfigCard } from '@/components/ads-configurator/AdConfigCard';
import { ModelSaveDialog } from '@/components/ads-configurator/ModelSaveDialog';
import { ModelSelector } from '@/components/ads-configurator/ModelSelector';
import { useAdConfigs } from '@/hooks/useAdConfigs';
import { AdConfig } from '@/types/ad-config';
import { toast } from 'sonner';

export default function AdsConfigurator() {
  const navigate = useNavigate();
  const {
    models,
    currentConfig,
    setCurrentConfig,
    isLoading,
    saveModel,
    updateModel,
    deleteModel,
    loadModelConfig,
    resetToDefault,
    addNewAd,
    removeAd,
  } = useAdConfigs();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfigChange = (adId: number, updatedConfig: AdConfig) => {
    setCurrentConfig(prev => prev.map(c => c.id === adId ? updatedConfig : c));
  };

  const handleSaveModel = async (name: string, isDefault: boolean) => {
    setIsSaving(true);
    try {
      await saveModel(name, currentConfig, isDefault);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectModel = (model: any) => {
    if (model) {
      loadModelConfig(model);
      setSelectedModelId(model.id);
    } else {
      resetToDefault();
      setSelectedModelId(null);
    }
  };

  const handleUpdateCurrentModel = async () => {
    if (!selectedModelId) {
      toast.error('Selecione um modelo para atualizar');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateModel(selectedModelId, { ads: currentConfig });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (id: string): Promise<boolean> => {
    return await updateModel(id, { isDefault: true });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(currentConfig, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'ads-config.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Configuração exportada!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string);
          if (Array.isArray(config)) {
            setCurrentConfig(config);
            toast.success('Configuração importada!');
          } else {
            toast.error('Arquivo inválido');
          }
        } catch {
          toast.error('Erro ao ler arquivo');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const enabledCount = currentConfig.filter(c => c.enabled).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Configurador de Anúncios Premium</h1>
              <p className="text-xs text-muted-foreground">
                {enabledCount} de {currentConfig.length} anúncios habilitados
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onSelect={handleSelectModel}
              onDelete={deleteModel}
              onSetDefault={handleSetDefault}
            />
          </div>
        </div>
      </header>

      <div className="container py-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetToDefault}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Padrão
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleImport}
          >
          <Upload className="h-4 w-4 mr-2" />
            Importar JSON
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onClick={addNewAd}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Anúncio
          </Button>

          <div className="flex-1" />

          {selectedModelId && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleUpdateCurrentModel}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Atualizar Modelo
            </Button>
          )}
          
          <Button 
            size="sm" 
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Novo Modelo
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="grid gap-3 pb-4">
            {currentConfig.map(config => (
              <AdConfigCard
                key={config.id}
                config={config}
                onChange={(updated) => handleConfigChange(config.id, updated)}
                onRemove={() => removeAd(config.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      <ModelSaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveModel}
        isLoading={isSaving}
      />
    </div>
  );
}
