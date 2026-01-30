import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2, Star } from 'lucide-react';
import { AdModelConfig } from '@/types/ad-config';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ModelSelectorProps {
  models: AdModelConfig[];
  selectedModelId: string | null;
  onSelect: (model: AdModelConfig | null) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSetDefault: (id: string) => Promise<boolean>;
}

export function ModelSelector({ 
  models, 
  selectedModelId, 
  onSelect, 
  onDelete,
  onSetDefault 
}: ModelSelectorProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (modelToDelete) {
      await onDelete(modelToDelete);
      setDeleteDialogOpen(false);
      setModelToDelete(null);
    }
  };

  const selectedModel = models.find(m => m.id === selectedModelId);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedModelId || 'default'}
        onValueChange={(value) => {
          if (value === 'default') {
            onSelect(null);
          } else {
            const model = models.find(m => m.id === value);
            if (model) onSelect(model);
          }
        }}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Selecione um modelo..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">
            📋 Configuração Padrão
          </SelectItem>
          {models.map(model => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-center gap-2">
                {model.isDefault && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                {model.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedModel && (
        <>
          {!selectedModel.isDefault && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => onSetDefault(selectedModel.id)}
              title="Definir como padrão"
            >
              <Star className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setModelToDelete(selectedModel.id);
              setDeleteDialogOpen(true);
            }}
            title="Excluir modelo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
