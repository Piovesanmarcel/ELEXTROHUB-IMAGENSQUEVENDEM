import { toast } from 'sonner';

// Set em memória para controlar toasts já exibidos na sessão
const shownToasts = new Set<string>();

/**
 * Exibe o toast de copywriting apenas uma vez por produto por sessão
 * Usa sessionStorage + memória para garantir unicidade
 */
export const showCopywritingToastOnce = (
  productId: string, 
  stats: { env: number; scenarios: number; keywords: number }
) => {
  const storageKey = `copywriting-toast:${productId}`;
  
  // Verifica se já foi mostrado na sessão atual
  if (shownToasts.has(storageKey)) {
    console.log('🔕 [TOAST-CONTROL] Toast já exibido nesta sessão - skip:', productId);
    return;
  }
  
  // Verifica se já foi mostrado no sessionStorage
  const alreadyShown = sessionStorage.getItem(storageKey);
  if (alreadyShown === 'true') {
    console.log('🔕 [TOAST-CONTROL] Toast já exibido no sessionStorage - skip:', productId);
    shownToasts.add(storageKey); // adiciona ao Set para futuras verificações
    return;
  }
  
  // Marca como exibido
  shownToasts.add(storageKey);
  sessionStorage.setItem(storageKey, 'true');
  
  console.log('✅ [TOAST-CONTROL] Exibindo toast pela primeira vez:', productId);
  
  // Exibe o toast
  toast.success(
    '🎯 Sistema de Variações Ativo!', 
    { 
      description: `✅ ${stats.env} ambientes • ${stats.scenarios} cenários • ${stats.keywords} keywords`,
      duration: 4000 
    }
  );
};

/**
 * Limpa o controle de toasts (útil para testes ou logout)
 */
export const clearToastControl = () => {
  shownToasts.clear();
  // Limpar todas as chaves de copywriting do sessionStorage
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('copywriting-toast:')) {
      sessionStorage.removeItem(key);
    }
  });
  console.log('🧹 [TOAST-CONTROL] Controle de toasts limpo');
};
