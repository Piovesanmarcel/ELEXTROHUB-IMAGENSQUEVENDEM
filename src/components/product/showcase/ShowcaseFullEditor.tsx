import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Save, ArrowLeft } from 'lucide-react';
import { ShowcaseEditorPanel } from './ShowcaseEditorPanel';
import { ShowcasePreview } from './ShowcasePreview';
import { DraftShowcase } from './types';
import { TextElement, ImagePosition } from './ShowcaseEditorPanel';

interface ShowcaseFullEditorProps {
  showcase: DraftShowcase;
  onSave: (id: string, textElements: TextElement[], imagePositions: ImagePosition[]) => void;
  onClose: () => void;
}

export const ShowcaseFullEditor = ({
  showcase,
  onSave,
  onClose,
}: ShowcaseFullEditorProps) => {
  const [textElements, setTextElements] = useState<TextElement[]>(showcase.textElements);
  const [imagePositions, setImagePositions] = useState<ImagePosition[]>(showcase.imagePositions);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  const handleAddText = () => {
    const newText: TextElement = {
      id: `text-${Date.now()}`,
      text: 'Novo Texto',
      x: 100,
      y: 100,
      fontSize: 48,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'bold',
      backgroundColor: '#ffffff',
      backgroundOpacity: 0,
    };
    setTextElements([...textElements, newText]);
    setSelectedTextId(newText.id);
  };

  const handleUpdateText = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteText = (id: string) => {
    setTextElements(textElements.filter(t => t.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  const handleUpdateTextPosition = (id: string, x: number, y: number) => {
    handleUpdateText(id, { x, y });
  };

  const handleUpdateImagePosition = (index: number, x: number, y: number) => {
    setImagePositions(prev => {
      const existing = prev.find(p => p.imageIndex === index);
      if (existing) {
        return prev.map(p => p.imageIndex === index ? { ...p, x, y } : p);
      }
      return [...prev, { imageIndex: index, x, y, width: 150, height: 150 }];
    });
  };

  const handleSave = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('🔒 [SHOWCASE-SAVE] Iniciando salvamento sem reload...');
    console.log('🔒 [SHOWCASE-SAVE] Event:', e);
    console.log('🔒 [SHOWCASE-SAVE] PreventDefault aplicado:', e?.defaultPrevented);
    onSave(showcase.id, textElements, imagePositions);
  };

  // Proteção global contra reload acidental durante edição
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Você tem alterações não salvas. Deseja sair?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h2 className="font-semibold">Editor de Showcase</h2>
            <p className="text-sm text-muted-foreground">
              {showcase.layoutName.replace(/-/g, ' ')}
            </p>
          </div>
        </div>
        <Button type="button" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Salvar na Galeria de IA
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Editor */}
        <div className="w-80 border-r overflow-y-auto p-4">
          <ShowcaseEditorPanel
            textElements={textElements}
            selectedTextId={selectedTextId}
            onAddText={handleAddText}
            onUpdateText={handleUpdateText}
            onDeleteText={handleDeleteText}
            onSelectText={setSelectedTextId}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 overflow-auto p-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <ShowcasePreview
              width={1200}
              height={1200}
              mainImage={showcase.preview}
              aiImages={[]}
              textElements={textElements}
              imagePositions={imagePositions}
              onUpdateTextPosition={handleUpdateTextPosition}
              onUpdateImagePosition={handleUpdateImagePosition}
              selectedTextId={selectedTextId}
              onSelectText={setSelectedTextId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
