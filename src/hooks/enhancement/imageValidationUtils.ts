
import { toast } from "sonner";

export const validateImages = (images: string[]) => {
  console.log('=== VALIDANDO IMAGENS ===');
  
  if (images.length === 0) {
    toast.info("Não há imagens para melhorar");
    return { isValid: false, validImages: [] };
  }

  const validImages = images.filter(img => {
    const isValid = img && img.trim() !== '' && img !== 'null' && img !== 'undefined';
    return isValid;
  });

  if (validImages.length === 0) {
    toast.error("Nenhuma imagem válida encontrada para processar");
    return { isValid: false, validImages: [] };
  }

  console.log(`Imagens válidas encontradas: ${validImages.length} de ${images.length}`);
  return { isValid: true, validImages };
};

export const validateCredits = (usage: any, neededCredits: number) => {
  if (!usage || usage.enhancements_available < neededCredits) {
    const needed = neededCredits;
    const available = usage?.enhancements_available || 0;
    toast.error(`Créditos insuficientes! Você precisa de ${needed} créditos mas tem apenas ${available} disponíveis.`, {
      duration: 8000,
      action: {
        label: "Comprar Créditos",
        onClick: () => {
          toast.info("Sistema de compra em desenvolvimento");
        }
      }
    });
    return false;
  }
  return true;
};
