import { useState } from 'react';
import { useMarketingTemplates } from '@/hooks/useMarketingTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Image as ImageIcon, Layers, Calendar, Edit } from 'lucide-react';
import type { TemplateConfig } from '@/types/marketing-templates';
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
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SavedTemplatesListProps {
  templates?: TemplateConfig[];
  isLoading?: boolean;
  onEditTemplate?: (template: TemplateConfig) => void;
  onDeleteTemplate?: (templateId: string) => Promise<boolean>;
  onReload?: () => Promise<void>;
}

export const SavedTemplatesList = ({ 
  templates: propTemplates,
  isLoading: propIsLoading,
  onEditTemplate,
  onDeleteTemplate,
  onReload
}: SavedTemplatesListProps) => {
  // Usar props se fornecidas, senão usar hook próprio (compatibilidade)
  const hookData = useMarketingTemplates();
  const templates = propTemplates ?? hookData.templates;
  const isLoading = propIsLoading ?? hookData.isLoading;
  const deleteTemplateFn = onDeleteTemplate ?? hookData.deleteTemplate;
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('Todas');

  const filteredTemplates = selectedFilter === 'Todas' 
    ? templates 
    : templates.filter(t => (t.category || 'Geral 01') === selectedFilter);

  const handleDeleteClick = (id: string, name: string) => {
    setTemplateToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    
    setIsDeleting(true);
    const success = await deleteTemplateFn(templateToDelete.id);
    setIsDeleting(false);
    
    if (success) {
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum template salvo</h3>
        <p className="text-muted-foreground max-w-md">
          Crie seu primeiro template usando o editor abaixo. Mapeie zonas de imagens e textos para gerar peças de marketing automaticamente.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {['Todas', 'Geral 01', 'Geral 02', 'Brinquedos', 'Cafeteiras', 'Utilidades', 'Pet Shop'].map((cat) => (
          <Button
            key={cat}
            variant={selectedFilter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-square bg-muted">
              <img
                src={template.baseImage}
                alt={template.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => onEditTemplate?.(template)}
                  title="Editar template"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteClick(template.id, template.name)}
                  title="Excluir template"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg truncate">{template.name}</CardTitle>
              <div className="mt-2">
                <Badge variant="secondary">
                  {template.category || 'Geral 01'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>{template.dimensions.width} × {template.dimensions.height}px</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>{template.zones.length} zona{template.zones.length !== 1 ? 's' : ''} mapeada{template.zones.length !== 1 ? 's' : ''}</span>
              </div>
              
              {template.id && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>ID: {template.id.slice(0, 8)}...</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template <strong>{templateToDelete?.name}</strong> será permanentemente removido do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
