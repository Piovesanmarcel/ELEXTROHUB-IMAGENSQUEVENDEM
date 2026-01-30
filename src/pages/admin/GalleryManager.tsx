import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Image, 
  Search, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  Globe,
  Lock
} from 'lucide-react';

interface HostedImage {
  id: string;
  url: string;
  filename: string;
  is_public: boolean;
  user_id: string;
  uploaded_at: string;
}

const ITEMS_PER_PAGE = 24;

const GalleryManager = () => {
  const [images, setImages] = useState<HostedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchImages();
  }, [filter, page]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchImages();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('hosted_images')
        .select('id, url, filename, is_public, user_id, uploaded_at', { count: 'exact' })
        .like('url', 'https://%')
        .order('uploaded_at', { ascending: false });

      if (filter === 'public') query = query.eq('is_public', true);
      if (filter === 'private') query = query.eq('is_public', false);
      if (searchQuery) query = query.ilike('filename', `%${searchQuery}%`);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      
      setImages(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Erro ao carregar imagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map(img => img.id)));
    }
  };

  const handleBulkAction = async (makePublic: boolean) => {
    if (selectedIds.size === 0) {
      toast.error('Selecione pelo menos uma imagem');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('hosted_images')
        .update({ is_public: makePublic })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedIds.size} imagem(ns) ${makePublic ? 'tornada(s) pública(s)' : 'tornada(s) privada(s)'}`);
      setSelectedIds(new Set());
      fetchImages();
    } catch (error) {
      console.error('Error updating images:', error);
      toast.error('Erro ao atualizar imagens');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleSingle = async (id: string, currentPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('hosted_images')
        .update({ is_public: !currentPublic })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Imagem ${!currentPublic ? 'tornada pública' : 'tornada privada'}`);
      fetchImages();
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Erro ao atualizar imagem');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Image className="h-6 w-6 text-primary" />
              Gerenciar Galeria
            </h1>
            <p className="text-muted-foreground">
              Controle quais imagens aparecem na galeria pública da homepage
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {totalCount.toLocaleString()} imagens no total
          </Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome do arquivo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={(v) => { setFilter(v as typeof filter); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as imagens</SelectItem>
                  <SelectItem value="public">Apenas públicas</SelectItem>
                  <SelectItem value="private">Apenas privadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="gap-2"
              >
                {selectedIds.size === images.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedIds.size === images.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </Button>

              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} selecionada(s)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleBulkAction(true)}
                      disabled={isUpdating}
                      className="gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Tornar Pública
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBulkAction(false)}
                      disabled={isUpdating}
                      className="gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Tornar Privada
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium">Nenhuma imagem encontrada</h3>
              <p className="text-muted-foreground text-sm">
                Tente ajustar os filtros ou a busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((image) => (
              <Card 
                key={image.id} 
                className={`group relative overflow-hidden cursor-pointer transition-all ${
                  selectedIds.has(image.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleToggleSelect(image.id)}
              >
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Selection Overlay */}
                  <div className={`absolute inset-0 bg-black/40 transition-opacity ${
                    selectedIds.has(image.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <Checkbox
                      checked={selectedIds.has(image.id)}
                      className="absolute top-2 left-2 bg-white"
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => handleToggleSelect(image.id)}
                    />
                  </div>

                  {/* Status Badge */}
                  <div 
                    className="absolute top-2 right-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSingle(image.id, image.is_public);
                    }}
                  >
                    <Badge 
                      variant={image.is_public ? 'default' : 'secondary'}
                      className="gap-1 cursor-pointer hover:opacity-80"
                    >
                      {image.is_public ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Pública
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Privada
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs truncate text-muted-foreground">
                    {image.filename}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
  );
};

export default GalleryManager;
