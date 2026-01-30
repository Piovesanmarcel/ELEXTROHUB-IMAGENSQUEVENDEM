
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 12 }: ProductGridSkeletonProps) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-square p-4">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
