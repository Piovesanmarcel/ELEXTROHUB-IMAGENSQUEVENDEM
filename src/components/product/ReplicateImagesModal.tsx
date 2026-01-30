import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Copy, Package, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useReplicateImages } from '@/hooks/useReplicateImages';
import { HostedImage } from '@/hooks/useHostedImages';

interface Product {
  id: string;
  nome: string;
  sku: string;
  imagem_original: string | null;
}

interface ReplicateImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProductId: string;
  sourceProductName?: string;
  imagesToReplicate: HostedImage[];
}

export const ReplicateImagesModal = ({
  isOpen,
  onClose,
  sourceProductId,
  sourceProductName,
  imagesToReplicate
}: ReplicateImagesModalProps) => {
  const { replicateImages, searchProducts, isReplicating } = useReplicateImages();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Debug log para verificar imagens recebidas
  useEffect(() => {
    if (isOpen) {
      console.log('[REPLICATE] Modal aberto');
      console.log('[REPLICATE] sourceProductId:', sourceProductId);
      console.log('[REPLICATE] imagesToReplicate:', imagesToReplicate);
      console.log('[REPLICATE] Total de imagens:', imagesToReplicate.length);
    }
  }, [isOpen, sourceProductId, imagesToReplicate]);

  const handleImageError = (imageId: string) => {
    setImageErrors(prev => new Set([...prev, imageId]));
  };

  // Search products when search term changes
  const handleSearch = useCallback(async () => {
    if (searchTerm.length < 2) {
      setProducts([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchProducts(searchTerm, sourceProductId);
      setProducts(results);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, sourceProductId, searchProducts]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [handleSearch]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setProducts([]);
      setSelectedProducts([]);
    }
  }, [isOpen]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleReplicate = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Selecione pelo menos um produto de destino');
      return;
    }

    const result = await replicateImages(sourceProductId, selectedProducts, imagesToReplicate);

    if (result.success) {
      const skusList = result.targetProductSkus.join(', ');
      const aiMessage = result.aiDataReplicated ? '📝 Comando Unificado + Copywriting copiados | ' : '';
      const stockMessage = result.stockSynced && result.syncedStock !== null
        ? `📦 Estoque sincronizado: ${result.syncedStock} un (${result.stockSourceSku}) | `
        : '';
      toast.success(
        `${result.replicatedCount} imagens replicadas para ${result.targetProductsCount} produto(s)!`,
        {
          description: `SKUs: ${skusList} | ${aiMessage}${stockMessage}✨ Prontos para anúncios premium!`,
          duration: 8000
        }
      );
      onClose();
    } else {
      if (result.replicatedCount > 0) {
        toast.warning(
          `${result.replicatedCount} imagens replicadas, mas houve ${result.errors.length} erro(s)`
        );
      } else {
        toast.error('Erro ao replicar imagens');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Replicar Imagens para Outros SKUs
          </DialogTitle>
          {sourceProductName && (
            <p className="text-sm text-muted-foreground">
              Origem: {sourceProductName}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Images Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {imagesToReplicate.length} {imagesToReplicate.length === 1 ? 'imagem será replicada' : 'imagens serão replicadas'}
              </span>
            </div>
            {imagesToReplicate.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <ImageIcon className="h-8 w-8 mr-2 opacity-50" />
                <span className="text-sm">Nenhuma imagem disponível para replicar</span>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {imagesToReplicate.slice(0, 10).map((image) => (
                  <div
                    key={image.id}
                    className="relative h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden border border-border bg-background"
                  >
                    {imageErrors.has(image.id) ? (
                      <div className="h-full w-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                        <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                        <span className="text-[10px]">Erro</span>
                      </div>
                    ) : (
                      <img
                        src={image.url}
                        alt={image.filename || 'Imagem'}
                        className="h-full w-full object-cover"
                        onError={() => handleImageError(image.id)}
                      />
                    )}
                  </div>
                ))}
                {imagesToReplicate.length > 10 && (
                  <div className="h-24 w-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 border border-border">
                    <span className="text-sm font-medium text-muted-foreground">+{imagesToReplicate.length - 10}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, SKU ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
            )}
          </div>

          {/* Products List */}
          <ScrollArea className="h-[400px] border rounded-lg">
            <div className="p-3">
              {searchTerm.length < 2 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Digite pelo menos 2 caracteres para buscar produtos</p>
                </div>
              ) : products.length === 0 && !isSearching ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="space-y-2 pr-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedProducts.includes(product.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                        {product.imagem_original ? (
                          <img
                            src={product.imagem_original}
                            alt={product.nome}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-full w-full flex items-center justify-center ${product.imagem_original ? 'hidden' : ''}`}>
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {product.sku}
                          </Badge>
                        </div>
                      </div>
                      {selectedProducts.includes(product.id) && (
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Selected Count */}
          {selectedProducts.length > 0 && (
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <p className="text-sm">
                <span className="font-semibold">{imagesToReplicate.length} imagens</span>
                {' serão replicadas para '}
                <span className="font-semibold">{selectedProducts.length} produto(s)</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {imagesToReplicate.length * selectedProducts.length} novos registros
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isReplicating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleReplicate} 
            disabled={selectedProducts.length === 0 || isReplicating}
            className="gap-2"
          >
            {isReplicating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Replicando...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Replicar para {selectedProducts.length} produto(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
