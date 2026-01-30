import { useCallback, useRef } from 'react';

export const useSafeDOMManipulation = () => {
  const elementsRef = useRef<Set<HTMLElement>>(new Set());

  const createTemporaryElement = useCallback((element: HTMLElement): HTMLElement => {
    try {
      // Track the element for cleanup
      elementsRef.current.add(element);
      return element;
    } catch (error) {
      console.error('Erro ao criar elemento temporário:', error);
      throw error;
    }
  }, []);

  const cleanupElement = useCallback((element: HTMLElement) => {
    if (!element) return;
    
    try {
      // Verificações múltiplas de segurança
      if (element && 
          element.isConnected && 
          element.parentNode && 
          element.parentNode.contains(element)) {
        element.remove();
        elementsRef.current.delete(element);
        console.log('🧹 Elemento temporário limpo com segurança');
      }
    } catch (error) {
      console.warn('Erro ao limpar elemento temporário:', error);
      // Fallback seguro
      try {
        if (element.parentNode && element.parentNode.contains(element)) {
          element.parentNode.removeChild(element);
          elementsRef.current.delete(element);
          console.log('🧹 Cleanup realizado via fallback');
        }
      } catch (fallbackError) {
        console.warn('Erro no fallback de cleanup:', fallbackError);
      }
    }
  }, []);

  const cleanupAllElements = useCallback(() => {
    elementsRef.current.forEach(element => {
      if (!element) return;
      
      try {
        // Verificações múltiplas de segurança
        if (element && 
            element.isConnected && 
            element.parentNode && 
            element.parentNode.contains(element)) {
          element.remove();
        }
      } catch (error) {
        console.warn('Erro ao limpar elemento durante cleanup:', error);
        // Fallback seguro
        try {
          if (element.parentNode && element.parentNode.contains(element)) {
            element.parentNode.removeChild(element);
          }
        } catch (fallbackError) {
          console.warn('Erro no fallback durante cleanup:', fallbackError);
        }
      }
    });
    elementsRef.current.clear();
    console.log('🧹 Todos os elementos temporários limpos');
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    cleanupAllElements();
  }, [cleanupAllElements]);

  return {
    createTemporaryElement,
    cleanupElement,
    cleanupAllElements,
    cleanup
  };
};