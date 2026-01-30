
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  showNavigation: boolean;
}

export const GalleryNavigation = ({
  onPrevious,
  onNext,
  showNavigation
}: GalleryNavigationProps) => {
  if (!showNavigation) return null;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={onPrevious}
        className="absolute left-3 z-40 h-10 w-10 p-0 bg-black/50 border-white/20 text-white hover:bg-black/70"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={onNext}
        className="absolute right-3 z-40 h-10 w-10 p-0 bg-black/50 border-white/20 text-white hover:bg-black/70"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </>
  );
};
