
import { toast } from "sonner";
import { ProcessImageResult } from "./types";

export const handleProcessingErrors = (
  data: ProcessImageResult, 
  imageIndex: number, 
  attempt: number
): { success: boolean; shouldStop?: boolean } => {
  if (data && data.success === false) {
    console.error(`❌ Falha no processamento da imagem ${imageIndex + 1} (tentativa ${attempt}):`, data);
    
    if (data.error && data.error.includes('CRÉDITOS DEEPAI ESGOTADOS')) {
      toast.error(`⚠️ CRÉDITOS DEEPAI ESGOTADOS`, {
        description: 'Adicione créditos em https://deepai.org/dashboard',
        duration: 15000,
        action: {
          label: "Abrir Dashboard DeepAI",
          onClick: () => window.open('https://deepai.org/dashboard', '_blank')
        }
      });
      return { success: false, shouldStop: true };
    }
    
    if (data.error && data.error.includes('Chave da API DeepAI inválida')) {
      toast.error(`🔑 API Key DeepAI inválida`, {
        description: 'Verifique se a chave está correta nas configurações',
        duration: 10000
      });
      return { success: false, shouldStop: true };
    }
    
    if (data.troubleshooting) {
      const troubleshoot = data.troubleshooting;
      toast.error(troubleshoot.issue, {
        description: troubleshoot.solution,
        duration: 12000,
        action: data.dashboard_url ? {
          label: "Dashboard DeepAI",
          onClick: () => window.open(data.dashboard_url, '_blank')
        } : undefined
      });
      return { success: false, shouldStop: true };
    }
  }
  
  return { success: false };
};
