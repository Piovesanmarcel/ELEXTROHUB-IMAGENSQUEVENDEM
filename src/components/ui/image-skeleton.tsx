import { Skeleton } from "@/components/ui/skeleton";

export const ImageSkeleton = () => {
  return (
    <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
      <Skeleton className="w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
      </div>
    </div>
  );
};