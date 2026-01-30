import { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';
import { TextElement, ImagePosition } from './ShowcaseEditorPanel';
import { Card } from '@/components/ui/card';

interface ShowcasePreviewProps {
  width: number;
  height: number;
  mainImage: string | null;
  aiImages: string[];
  textElements: TextElement[];
  imagePositions: ImagePosition[];
  onUpdateTextPosition: (id: string, x: number, y: number) => void;
  onUpdateImagePosition: (index: number, x: number, y: number) => void;
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
}

export const ShowcasePreview = ({
  width,
  height,
  mainImage,
  aiImages,
  textElements,
  imagePositions,
  onUpdateTextPosition,
  onUpdateImagePosition,
  selectedTextId,
  onSelectText,
}: ShowcasePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const newScale = Math.min(containerWidth / width, 1);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [width]);

  return (
    <Card className="p-4 overflow-auto">
      <div ref={containerRef} className="w-full">
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            border: '1px solid #e0e0e0',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSelectText(null);
            }
          }}
        >
          {mainImage && (
            <img
              src={mainImage}
              alt="Main product"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '70%',
                maxHeight: '70%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
          )}

          {aiImages.map((img, index) => {
            const position = imagePositions.find(p => p.imageIndex === index);
            const defaultX = 100 + (index * 150);
            const defaultY = 100 + (index * 50);
            
            return (
              <Draggable
                key={`ai-img-${index}`}
                position={{ x: position?.x || defaultX, y: position?.y || defaultY }}
                onStop={(e, data) => {
                  onUpdateImagePosition(index, data.x, data.y);
                }}
                bounds="parent"
              >
                <div
                  style={{
                    position: 'absolute',
                    width: position?.width || 150,
                    height: position?.height || 150,
                    cursor: 'move',
                    border: '2px dashed rgba(59, 130, 246, 0.5)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={img}
                    alt={`AI image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </Draggable>
            );
          })}

          {textElements.map((element) => (
            <Draggable
              key={element.id}
              position={{ x: element.x, y: element.y }}
              onStop={(e, data) => {
                onUpdateTextPosition(element.id, data.x, data.y);
              }}
              bounds="parent"
            >
              <div
                style={{
                  position: 'absolute',
                  fontSize: `${element.fontSize}px`,
                  fontFamily: element.fontFamily,
                  color: element.color,
                  fontWeight: element.fontWeight,
                  cursor: 'move',
                  padding: '8px 12px',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  border: selectedTextId === element.id ? '2px solid #3b82f6' : '2px dashed transparent',
                  borderRadius: '4px',
                  backgroundColor: selectedTextId === element.id 
                    ? 'rgba(59, 130, 246, 0.1)' 
                    : `${element.backgroundColor}${Math.round(element.backgroundOpacity * 255).toString(16).padStart(2, '0')}`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectText(element.id);
                }}
              >
                {element.text || 'Texto vazio'}
              </div>
            </Draggable>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-4 text-center">
        💡 Arraste texto e imagens para reposicionar. Clique nos elementos para editar.
      </p>
    </Card>
  );
};
