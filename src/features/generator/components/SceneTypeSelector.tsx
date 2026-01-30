import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2 } from "lucide-react";
import { SCENE_TYPES, type SceneType } from "../types";

interface SceneTypeSelectorProps {
  generateMode: 'single' | 'multiple';
  onGenerateModeChange: (mode: 'single' | 'multiple') => void;
  selectedSceneTypes: SceneType[];
  onSelectedSceneTypesChange: (types: SceneType[]) => void;
  isGeneratingImage: boolean;
  imageGenProgress: { total: number; completed: number; failed: number };
  onGenerateImage: () => void;
  webhookConfigured: boolean;
  hasProductName: boolean;
  hasProductImages: boolean;
}

export function SceneTypeSelector({
  generateMode,
  onGenerateModeChange,
  selectedSceneTypes,
  onSelectedSceneTypesChange,
  isGeneratingImage,
  imageGenProgress,
  onGenerateImage,
  webhookConfigured,
  hasProductName,
  hasProductImages,
}: SceneTypeSelectorProps) {
  const canGenerate = webhookConfigured && hasProductName && hasProductImages && !isGeneratingImage;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          Geração de Imagem via N8N
        </CardTitle>
        <CardDescription>
          Selecione os tipos de cena para geração
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={generateMode === 'single' ? 'default' : 'outline'}
            onClick={() => onGenerateModeChange('single')}
          >
            Único
          </Button>
          <Button
            size="sm"
            variant={generateMode === 'multiple' ? 'default' : 'outline'}
            onClick={() => onGenerateModeChange('multiple')}
          >
            Múltiplo
          </Button>
          <Badge variant="secondary" className="ml-auto self-center">
            {selectedSceneTypes.length} selecionado(s)
          </Badge>
        </div>

        {/* Scene Type Grid */}
        <div className="grid grid-cols-2 gap-2">
          {SCENE_TYPES.map((scene) => {
            const isSelected = selectedSceneTypes.includes(scene.id);
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => {
                  if (generateMode === 'single') {
                    onSelectedSceneTypesChange([scene.id]);
                  } else {
                    if (isSelected) {
                      onSelectedSceneTypesChange(selectedSceneTypes.filter(id => id !== scene.id));
                    } else {
                      onSelectedSceneTypesChange([...selectedSceneTypes, scene.id]);
                    }
                  }
                }}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted hover:border-muted-foreground/50'}
                `}
              >
                <div className="font-medium text-sm">{scene.label}</div>
                <div className="text-xs text-muted-foreground">{scene.description}</div>
              </button>
            );
          })}
        </div>

        {/* Mode Info */}
        <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
          {generateMode === 'single' ? (
            <p>📍 <strong>Modo Único:</strong> Envia 1 requisição com <code className="bg-muted px-1">sceneType</code> para o Switch node no n8n.</p>
          ) : (
            <p>🚀 <strong>Modo Múltiplo:</strong> Envia <strong>{selectedSceneTypes.length} requisições paralelas</strong>, cada uma com seu <code className="bg-muted px-1">sceneType</code> individual.</p>
          )}
        </div>
        
        {/* Generate Button */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={onGenerateImage}
              disabled={!canGenerate || selectedSceneTypes.length === 0}
              className="gap-2"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {imageGenProgress.total > 0 
                    ? `Gerando... (${imageGenProgress.completed + imageGenProgress.failed}/${imageGenProgress.total})`
                    : 'Gerando...'
                  }
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar {generateMode === 'multiple' && selectedSceneTypes.length > 1 
                    ? `${selectedSceneTypes.length} Imagens` 
                    : 'Imagem'}
                </>
              )}
            </Button>
            
            {!webhookConfigured && (
              <Badge variant="outline" className="text-xs">Configure o Webhook</Badge>
            )}
            {!hasProductImages && (
              <Badge variant="outline" className="text-xs">Adicione imagem de referência</Badge>
            )}
          </div>
          
          {/* Progress indicator */}
          {isGeneratingImage && imageGenProgress.total > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Progress value={(imageGenProgress.completed + imageGenProgress.failed) / imageGenProgress.total * 100} className="h-1.5 flex-1" />
              <span className="whitespace-nowrap">
                ✅ {imageGenProgress.completed} | ❌ {imageGenProgress.failed}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
