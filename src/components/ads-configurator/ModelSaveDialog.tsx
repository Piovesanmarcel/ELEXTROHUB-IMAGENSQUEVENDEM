import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ModelSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, isDefault: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function ModelSaveDialog({ open, onOpenChange, onSave, isLoading }: ModelSaveDialogProps) {
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    await onSave(name.trim(), isDefault);
    setName('');
    setIsDefault(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Salvar Modelo</DialogTitle>
          <DialogDescription>
            Salve sua configuração de anúncios como um modelo reutilizável.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Modelo</Label>
            <Input
              id="name"
              placeholder="Ex: Modelo Premium Cafeteiras"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="default" className="text-sm">
              Definir como modelo padrão
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Modelo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
