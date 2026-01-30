import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Type, Image, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  backgroundColor: string;
  backgroundOpacity: number;
}

export interface ImagePosition {
  imageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ShowcaseEditorPanelProps {
  textElements: TextElement[];
  onAddText: () => void;
  onUpdateText: (id: string, updates: Partial<TextElement>) => void;
  onDeleteText: (id: string) => void;
  selectedTextId: string | null;
  onSelectText: (id: string | null) => void;
}

export const ShowcaseEditorPanel = ({
  textElements,
  onAddText,
  onUpdateText,
  onDeleteText,
  selectedTextId,
  onSelectText,
}: ShowcaseEditorPanelProps) => {
  const selectedText = textElements.find(t => t.id === selectedTextId);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm">Editor de Showcase</h4>
        </div>
        <Button
          size="sm"
          onClick={onAddText}
          className="gap-2"
        >
          <Plus className="h-3 w-3" />
          Adicionar Texto
        </Button>
      </div>

      {textElements.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Elementos de Texto ({textElements.length})</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {textElements.map((element) => (
              <div
                key={element.id}
                className={`p-2 border rounded-md cursor-pointer hover:bg-accent transition-colors ${
                  selectedTextId === element.id ? 'bg-accent border-primary' : ''
                }`}
                onClick={() => onSelectText(element.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate flex-1">
                    {element.text || 'Texto vazio'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteText(element.id);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedText && (
        <div className="space-y-3 pt-3 border-t">
          <h5 className="text-xs font-semibold">Editar Texto Selecionado</h5>
          
          <div className="space-y-2">
            <Label className="text-xs">Texto</Label>
            <Input
              value={selectedText.text}
              onChange={(e) => onUpdateText(selectedText.id, { text: e.target.value })}
              placeholder="Digite o texto..."
              className="text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Tamanho</Label>
              <Slider
                value={[selectedText.fontSize]}
                onValueChange={(value) => onUpdateText(selectedText.id, { fontSize: value[0] })}
                min={12}
                max={120}
                step={2}
                className="py-2"
              />
              <span className="text-xs text-muted-foreground">{selectedText.fontSize}px</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Cor</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={selectedText.color}
                  onChange={(e) => onUpdateText(selectedText.id, { color: e.target.value })}
                  className="w-12 h-9 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={selectedText.color}
                  onChange={(e) => onUpdateText(selectedText.id, { color: e.target.value })}
                  className="flex-1 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Fonte</Label>
            <Select
              value={selectedText.fontFamily}
              onValueChange={(value) => onUpdateText(selectedText.id, { fontFamily: value })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Helvetica">Helvetica</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Verdana">Verdana</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
                <SelectItem value="Impact">Impact</SelectItem>
                <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Peso</Label>
            <Select
              value={selectedText.fontWeight}
              onValueChange={(value: 'normal' | 'bold') => onUpdateText(selectedText.id, { fontWeight: value })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="bold">Negrito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Fundo do Texto</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Cor</Label>
                <Input
                  type="color"
                  value={selectedText.backgroundColor}
                  onChange={(e) => onUpdateText(selectedText.id, { backgroundColor: e.target.value })}
                  className="w-full h-9 p-1 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Opacidade</Label>
                <Slider
                  value={[selectedText.backgroundOpacity * 100]}
                  onValueChange={(value) => onUpdateText(selectedText.id, { backgroundOpacity: value[0] / 100 })}
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                />
                <span className="text-xs text-muted-foreground">{Math.round(selectedText.backgroundOpacity * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {textElements.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhum texto adicionado. Clique em "Adicionar Texto" para começar.
        </p>
      )}
    </Card>
  );
};
