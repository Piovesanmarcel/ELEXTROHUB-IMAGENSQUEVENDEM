import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface ProductReadyForAdsToggleProps {
  productId: string;
  isReady: boolean;
  onUpdate?: () => void;
}

export const ProductReadyForAdsToggle = ({ 
  productId, 
  isReady, 
  onUpdate 
}: ProductReadyForAdsToggleProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ ready_for_ads: checked })
        .eq('id', productId);

      if (error) throw error;

      toast.success(
        checked 
          ? "✅ Produto marcado como pronto para anúncios" 
          : "Produto desmarcado"
      );
      
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao atualizar flag:', error);
      toast.error("Erro ao atualizar produto");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 p-4 border border-border rounded-lg bg-card">
      <CheckCircle2 className={`h-5 w-5 ${isReady ? 'text-green-500' : 'text-muted-foreground'}`} />
      <div className="flex-1">
        <Label htmlFor="ready-for-ads" className="text-sm font-medium">
          Pronto para gerar anúncios premium
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          Marque quando o produto estiver com todas as imagens e dados necessários
        </p>
      </div>
      <Switch
        id="ready-for-ads"
        checked={isReady}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
      />
    </div>
  );
};
