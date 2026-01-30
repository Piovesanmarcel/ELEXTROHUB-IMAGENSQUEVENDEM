import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Image, Type, Layers } from 'lucide-react';
import type { AIAnalysisResult } from '@/hooks/useTemplateAIMapper';

interface AIAnalysisPanelProps {
  isAnalyzing: boolean;
  progress: number;
  currentStatus: string;
  analysisResult: AIAnalysisResult | null;
  error: string | null;
}

export const AIAnalysisPanel = ({
  isAnalyzing,
  progress,
  currentStatus,
  analysisResult,
  error,
}: AIAnalysisPanelProps) => {
  if (!isAnalyzing && !analysisResult && !error) {
    return null;
  }

  const getStatusIcon = () => {
    if (error) return <XCircle className="h-5 w-5 text-destructive" />;
    if (analysisResult) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
  };

  const getZoneCounts = () => {
    if (!analysisResult) return null;

    const products = analysisResult.zones.filter(z => z.classification === 'product').length;
    const backgrounds = analysisResult.zones.filter(z => z.classification === 'background').length;
    const texts = analysisResult.zones.filter(z => z.classification === 'text').length;

    return { products, backgrounds, texts };
  };

  const counts = getZoneCounts();

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-semibold">
            {error ? 'Erro na Análise' : analysisResult ? 'Análise Completa' : 'Analisando Template'}
          </h3>
          <p className="text-sm text-muted-foreground">{currentStatus}</p>
        </div>
      </div>

      {isAnalyzing && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{progress}%</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1.5">
              <Layers className="h-3 w-3" />
              {analysisResult.zones.length} zonas detectadas
            </Badge>
            
            {counts && (
              <>
                {counts.products > 0 && (
                  <Badge variant="outline" className="gap-1.5 border-blue-500/50 text-blue-600">
                    <Image className="h-3 w-3" />
                    {counts.products} produto{counts.products > 1 ? 's' : ''}
                  </Badge>
                )}
                {counts.backgrounds > 0 && (
                  <Badge variant="outline" className="gap-1.5 border-green-500/50 text-green-600">
                    <Layers className="h-3 w-3" />
                    {counts.backgrounds} background{counts.backgrounds > 1 ? 's' : ''}
                  </Badge>
                )}
                {counts.texts > 0 && (
                  <Badge variant="outline" className="gap-1.5 border-yellow-500/50 text-yellow-600">
                    <Type className="h-3 w-3" />
                    {counts.texts} texto{counts.texts > 1 ? 's' : ''}
                  </Badge>
                )}
              </>
            )}
          </div>

          {analysisResult.detectedFonts && analysisResult.detectedFonts.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-1">Fontes detectadas:</p>
              <div className="flex gap-2 flex-wrap">
                {analysisResult.detectedFonts.map((font, idx) => (
                  <Badge key={idx} variant="outline">{font}</Badge>
                ))}
              </div>
            </div>
          )}

          {analysisResult.colorScheme && (
            <div className="text-sm">
              <p className="font-medium mb-2">Paleta de cores:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(analysisResult.colorScheme).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-muted-foreground capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
