import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Trash2, Edit } from 'lucide-react';
import { DraftShowcase } from './types';

interface ShowcaseEditGalleryProps {
  draftShowcases: DraftShowcase[];
  onEditShowcase: (id: string) => void;
  onSaveAll: (e?: React.MouseEvent) => void;
  onDiscardAll: (e?: React.MouseEvent) => void;
}

export const ShowcaseEditGallery = ({
  draftShowcases,
  onEditShowcase,
  onSaveAll,
  onDiscardAll,
}: ShowcaseEditGalleryProps) => {
  const savedCount = draftShowcases.filter(s => s.saved).length;
  const totalCount = draftShowcases.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Showcases Gerados</h3>
          <p className="text-sm text-muted-foreground">
            {savedCount} de {totalCount} salvos • Clique para editar antes de salvar
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔒 [NO-RELOAD] Descartar Todos - preventDefault aplicado');
              onDiscardAll(e);
            }}
            variant="outline"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Descartar Todos
          </Button>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔒 [NO-RELOAD] Salvar Todos na Galeria - preventDefault aplicado');
              onSaveAll(e);
            }}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Todos na Galeria
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {draftShowcases.map((showcase) => (
          <Card
            key={showcase.id}
            className="p-2 hover:shadow-lg transition-shadow cursor-pointer relative group"
            onClick={() => onEditShowcase(showcase.id)}
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={showcase.preview}
                alt={`Showcase ${showcase.layoutName}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="secondary" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
              {showcase.saved && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Salvo
                </div>
              )}
            </div>
            <p className="text-xs text-center mt-2 text-muted-foreground">
              {showcase.layoutName.replace(/-/g, ' ')}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
