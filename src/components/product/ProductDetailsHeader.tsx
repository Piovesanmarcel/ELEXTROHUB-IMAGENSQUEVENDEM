
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProductDetailsHeaderProps {
  product: any;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onProductRefreshed?: () => void;
}

export const ProductDetailsHeader = ({ 
  product, 
  isEditMode, 
  onToggleEditMode 
}: ProductDetailsHeaderProps) => {
  const navigate = useNavigate();

  const hasEnhancedImages = !!(product as any).enhanced_at;

  const handlePremiumAdGenerator = async () => {
    if (!hasEnhancedImages) {
      toast.error("Este produto não possui imagens melhoradas. Primeiro faça o enhancement das imagens.");
      return;
    }

      // 🚀 NOVA ORDEM: Iniciar com BFL primeiro para analisar problema
      const bflEvent = new CustomEvent('triggerBflAutomation', {
        detail: {
          productId: product.id,
          productName: product.nome,
          source: 'premium-ad-generator',
          timestamp: Date.now()
        }
      });
      
      console.log('🚀 [NOVA ORDEM] Iniciando automação com BFL primeiro:', bflEvent.detail);
      console.log('🚀 [DEBUG EVENT] Disparando triggerBflAutomation...');
      toast.info('🚀 Iniciando sequência completa: BFL → Gemini → Runware... (Tongyi pausado)', { duration: 8000 });
      window.dispatchEvent(bflEvent);
      console.log('✅ [DEBUG EVENT] Evento triggerBflAutomation disparado!');
      
      // Verificar se existem listeners registrados
      setTimeout(() => {
        console.log('🔍 [DEBUG] Verificando se automação foi iniciada...');
      }, 1000);
    
    toast.success("🚀 Automação Premium iniciada: BFL → Gemini → Runware (Tongyi pausado)!");
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/produtos')}
          className="bg-white/80 border-purple-200 hover:bg-purple-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        {hasEnhancedImages && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
            ✨ Imagens Melhoradas Disponíveis
          </Badge>
        )}
      </div>

      {/* Botões ocultados conforme solicitação */}
      <div className="flex flex-wrap gap-2">
        {/* Botões de atualizar, editar e gerador premium foram removidos */}
      </div>
    </div>
  );
};
