import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { AIAnalysisResult } from '@/hooks/useTemplateAIMapper';

interface ZonePreviewCanvasProps {
  imageUrl: string;
  analysisResult: AIAnalysisResult | null;
}

export const ZonePreviewCanvas = ({ imageUrl, analysisResult }: ZonePreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisResult || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = analysisResult.dimensions.width;
      canvas.height = analysisResult.dimensions.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw zones
      analysisResult.zones.forEach((zone) => {
        const isHovered = zone.id === hoveredZone;
        
        // Set color based on classification
        let color;
        switch (zone.classification) {
          case 'product':
            color = isHovered ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)';
            break;
          case 'background':
            color = isHovered ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.2)';
            break;
          case 'text':
            color = isHovered ? 'rgba(234, 179, 8, 0.4)' : 'rgba(234, 179, 8, 0.2)';
            break;
          default:
            color = isHovered ? 'rgba(156, 163, 175, 0.4)' : 'rgba(156, 163, 175, 0.2)';
        }

        // Fill zone
        ctx.fillStyle = color;
        ctx.fillRect(zone.position.x, zone.position.y, zone.position.width, zone.position.height);

        // Draw border
        ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.strokeRect(zone.position.x, zone.position.y, zone.position.width, zone.position.height);

        // Draw label
        if (isHovered) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(zone.position.x, zone.position.y - 25, 150, 25);
          ctx.fillStyle = 'white';
          ctx.font = '12px sans-serif';
          ctx.fillText(zone.id, zone.position.x + 5, zone.position.y - 8);
        }
      });
    };
    img.src = imageUrl;
  }, [analysisResult, imageUrl, hoveredZone]);

  if (!analysisResult) {
    return null;
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'product': return 'border-blue-500 bg-blue-500/10';
      case 'background': return 'border-green-500 bg-green-500/10';
      case 'text': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Preview com Zonas Detectadas</h3>
        <div className="relative max-w-full overflow-auto border rounded-lg bg-muted">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
          />
        </div>
        
        <div className="mt-4 flex gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500" />
            <span>Produtos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500" />
            <span>Backgrounds</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500" />
            <span>Textos</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Zonas Detectadas ({analysisResult.zones.length})</h3>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {analysisResult.zones.map((zone) => (
              <div
                key={zone.id}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-colors
                  ${getClassificationColor(zone.classification)}
                  ${hoveredZone === zone.id ? 'ring-2 ring-primary' : ''}
                `}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm">{zone.id}</p>
                  <Badge variant="outline" className="text-xs">
                    {zone.classification}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Tipo:</strong> {zone.type}</p>
                  <p><strong>DataSource:</strong> {zone.dataSource}</p>
                  <p><strong>Posição:</strong> x:{zone.position.x}, y:{zone.position.y}</p>
                  <p><strong>Tamanho:</strong> {zone.position.width}x{zone.position.height}px</p>
                  <p><strong>Z-Index:</strong> {zone.zIndex}</p>
                  
                  {zone.style && Object.keys(zone.style).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">Estilos</summary>
                      <div className="mt-1 pl-2 space-y-0.5">
                        {Object.entries(zone.style).map(([key, value]) => (
                          <p key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
