
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

interface ProductDetailsActionsProps {
  showMarketingGenerator: boolean;
  onToggleMarketing: () => void;
}

export const ProductDetailsActions = ({ 
  showMarketingGenerator, 
  onToggleMarketing 
}: ProductDetailsActionsProps) => {
  return (
    <div className="flex justify-center mt-8">
      <Button
        onClick={onToggleMarketing}
        className="relative overflow-hidden group bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 text-white px-10 py-4 rounded-xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-500 transform hover:scale-105 active:scale-95 border-0"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        <div className="relative flex items-center gap-3">
          <Palette className="h-6 w-6 animate-pulse" />
          <span className="text-lg font-bold tracking-wide">
            {showMarketingGenerator ? "🎨 Ocultar Marketing" : "✨ Gerar Marketing"}
          </span>
        </div>

        <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-200"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-400"></div>
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-600"></div>
      </Button>
    </div>
  );
};
