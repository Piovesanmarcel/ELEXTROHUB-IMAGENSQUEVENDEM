import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Zap, Coins, Loader2, Download } from "lucide-react";
import { useEnhancementUsage } from "@/hooks/useEnhancementUsage";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import EbookDownloadButton from "@/components/download/EbookDownloadButton";
import type { UnifiedAIResponse } from "@/components/product/ai-enhancer/types";

interface GeneratorHeaderProps {
  userEmail: string | null;
  // Download button props
  hasDownloadableContent?: boolean;
  product?: {
    nome: string;
    descricao?: string;
    sku?: string;
  };
  unifiedData?: UnifiedAIResponse | null;
  copywritingText?: string;
  images?: Array<{ url: string; type: string }>;
  isHighlighted?: boolean;
}

export function GeneratorHeader({ 
  userEmail,
  hasDownloadableContent = false,
  product,
  unifiedData,
  copywritingText,
  images = [],
  isHighlighted = false,
}: GeneratorHeaderProps) {
  const { usage, isLoading } = useEnhancementUsage();
  
  const creditsAvailable = usage?.enhancements_available ?? 0;
  const isLowCredits = creditsAvailable <= 3 && creditsAvailable > 0;
  const isZeroCredits = creditsAvailable === 0;

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Gerador Completo via N8N
        </h1>
        <p className="text-muted-foreground">
          Executa Comando Unificado + Copywriting e envia dados combinados
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* Botão de Download - Sempre visível */}
        {product && (
          <EbookDownloadButton
            product={{
              nome: product.nome || '',
              descricao: product.descricao,
              sku: product.sku || `gerador_${Date.now()}`
            }}
            unifiedData={unifiedData}
            copywritingText={copywritingText}
            images={images}
            size="sm"
            showOptions={false}
            forceEnabled={hasDownloadableContent}
            className={cn(
              "gap-2 transition-all duration-300",
              hasDownloadableContent 
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" 
                : "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
              isHighlighted && "animate-pulse ring-2 ring-primary ring-offset-2"
            )}
          />
        )}

        {/* Badge de Créditos */}
        <Link to="/pricing" className="no-underline">
          <Badge 
            variant={isZeroCredits ? "destructive" : isLowCredits ? "outline" : "secondary"}
            className={cn(
              "gap-1.5 cursor-pointer transition-colors",
              isLowCredits && "border-warning text-warning hover:bg-warning/10",
              isZeroCredits && "animate-pulse"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Coins className="h-3 w-3" />
            )}
            {isLoading ? "..." : `${creditsAvailable} créditos`}
          </Badge>
        </Link>

        {userEmail && (
          <Badge variant="outline" className="gap-1">
            {userEmail}
          </Badge>
        )}
        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          3 Etapas
        </Badge>
      </div>
    </div>
  );
}
