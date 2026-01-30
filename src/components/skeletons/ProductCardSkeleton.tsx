import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ProductCardSkeletonProps {
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * Skeleton específico para ProductCard
 * Melhora a percepção de carregamento mostrando estrutura real
 */
export const ProductCardSkeleton = ({ variant = 'default' }: ProductCardSkeletonProps) => {
  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="h-48 w-full rounded-none" />
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-2/3 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardContent className="pt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Grid de skeletons de produtos
 */
export const ProductGridSkeleton = ({ 
  count = 8, 
  variant = 'default' 
}: { 
  count?: number; 
  variant?: 'default' | 'compact' | 'detailed';
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} variant={variant} />
    ))}
  </div>
);

/**
 * Lista de skeletons de produtos (modo compacto)
 */
export const ProductListSkeleton = ({ count = 10 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} variant="compact" />
    ))}
  </div>
);

export default ProductCardSkeleton;
