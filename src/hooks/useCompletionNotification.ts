import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook para notificações de conclusão
 * Inclui som sutil e notificação do browser
 */
export function useCompletionNotification() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Criar audio element uma vez
  useEffect(() => {
    // Criar um beep simples usando Web Audio API (não precisa de arquivo)
    return () => {
      audioRef.current = null;
    };
  }, []);

  const playSound = useCallback(() => {
    try {
      // Criar um beep usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Som agradável de "sucesso" - duas notas
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Volume baixo
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      // Ignorar se não puder tocar som
      console.log('[CompletionNotification] Som não disponível:', err);
    }
  }, []);

  const showBrowserNotification = useCallback((title: string, body?: string) => {
    // Verificar se notificações são suportadas e permitidas
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body || 'Sua geração foi concluída!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'generation-complete', // Evita duplicatas
        requireInteraction: false
      });
    } else if (Notification.permission !== 'denied') {
      // Pedir permissão
      Notification.requestPermission();
    }
  }, []);

  const notifyCompletion = useCallback((options?: { 
    title?: string; 
    body?: string; 
    playSound?: boolean;
    showNotification?: boolean;
  }) => {
    const {
      title = 'Anúncios Que Vende',
      body = 'Sua imagem foi gerada com sucesso! 🎉',
      playSound: shouldPlaySound = true,
      showNotification = true
    } = options || {};

    if (shouldPlaySound) {
      playSound();
    }

    // Só mostrar notificação se a aba não estiver visível
    if (showNotification && document.hidden) {
      showBrowserNotification(title, body);
    }
  }, [playSound, showBrowserNotification]);

  // Solicitar permissão de notificação quando o hook é usado
  const requestNotificationPermission = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    playSound,
    showBrowserNotification,
    notifyCompletion,
    requestNotificationPermission
  };
}
