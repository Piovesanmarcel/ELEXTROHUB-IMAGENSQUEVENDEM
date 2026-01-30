import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton específico para a página do Gerador de Imagens
 */
export const GeneratorSkeleton = () => (
  <div className="container mx-auto p-4 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Tabs */}
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Product Selection */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded border">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Center Panel - Scene Selection */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <Skeleton className="h-20 w-full rounded" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Preview */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

/**
 * Skeleton para a galeria de imagens geradas
 */
export const GallerySkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <Skeleton className="aspect-square w-full" />
        <CardContent className="p-3 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

/**
 * Skeleton para o monitor de jobs
 */
export const JobMonitorSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-24" />
    </div>
    
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default GeneratorSkeleton;
