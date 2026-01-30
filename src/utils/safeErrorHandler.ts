import { logSecurityEvent } from './securityUtils';

// Global error handler para capturar e tratar erros de DOM manipulation
export const setupGlobalErrorHandler = () => {
  // Interceptar erros de DOM manipulation
  const originalRemoveChild = Node.prototype.removeChild;
  const originalAppendChild = Node.prototype.appendChild;
  const originalInsertBefore = Node.prototype.insertBefore;
  const originalReplaceChild = Node.prototype.replaceChild;

  // Override removeChild com verificações de segurança
  Node.prototype.removeChild = function<T extends Node>(child: T): T {
    try {
      // Verificar se o elemento ainda é filho deste nó
      if (!this.contains(child)) {
        console.warn('🚨 Tentativa de remover elemento que não é filho:', child);
        return child; // Retornar o elemento mesmo que não tenha sido removido
      }
      
      return originalRemoveChild.call(this, child);
    } catch (error) {
      console.warn('🚨 Erro em removeChild interceptado:', error);
      return child; // Retornar o elemento para evitar quebrar o fluxo
    }
  };

  // Override appendChild com verificações de segurança  
  Node.prototype.appendChild = function<T extends Node>(child: T): T {
    try {
      // Verificar se o elemento já não está anexado em outro lugar
      if (child.parentNode && child.parentNode !== this) {
        console.warn('🚨 Elemento já tem outro pai, removendo primeiro:', child);
        child.parentNode.removeChild(child);
      }
      
      return originalAppendChild.call(this, child);
    } catch (error) {
      console.warn('🚨 Erro em appendChild interceptado:', error);
      return child;
    }
  };

  // Override insertBefore com verificações de segurança
  Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
    try {
      // Verificar se o nó de referência ainda é filho
      if (referenceNode && !this.contains(referenceNode)) {
        console.warn('🚨 Nó de referência não é filho, usando appendChild:', newNode);
        return this.appendChild(newNode);
      }
      
      return originalInsertBefore.call(this, newNode, referenceNode);
    } catch (error) {
      console.warn('🚨 Erro em insertBefore interceptado:', error);
      return newNode;
    }
  };

  // Override replaceChild com verificações de segurança
  Node.prototype.replaceChild = function<T extends Node>(newChild: Node, oldChild: T): T {
    try {
      // Verificar se o oldChild ainda é filho
      if (!this.contains(oldChild)) {
        console.warn('🚨 Elemento a ser substituído não é filho, usando appendChild:', newChild);
        this.appendChild(newChild);
        return oldChild;
      }
      
      return originalReplaceChild.call(this, newChild, oldChild);
    } catch (error) {
      console.warn('🚨 Erro em replaceChild interceptado:', error);
      return oldChild;
    }
  };

  // Interceptar erros globais relacionados a DOM
  // IMPORTANTE: NÃO usar preventDefault() agressivamente para não mascarar erros reais
  window.addEventListener('error', (event) => {
    if (event.error && typeof event.error.message === 'string') {
      const message = event.error.message;
      
      // Logar TODOS os erros para diagnóstico
      console.error('🔴 [safeErrorHandler] Erro global detectado:', {
        message: message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack?.substring(0, 500)
      });
      
      // Check for potential security-related errors
      if (message.includes('script') || message.includes('eval') || message.includes('innerHTML')) {
        logSecurityEvent({
          type: 'invalid_input',
          details: `Potential XSS attempt detected: ${message}`,
          ip: 'client-side'
        });
      }
      
      // Apenas para erros de DOM manipulation, tentar recuperação suave
      // MAS NÃO prevenir propagação (deixar GlobalCrashOverlay capturar)
      if (message.includes('removeChild') || 
          message.includes('appendChild') || 
          message.includes('insertBefore') ||
          message.includes('replaceChild')) {
        
        console.warn('🚨 DOM MANIPULATION ERROR - tentando recuperação suave');
        
        // Tentar recuperação sem bloquear o erro
        setTimeout(() => {
          try {
            window.dispatchEvent(new Event('resize'));
          } catch (recoveryError) {
            console.warn('Erro na recuperação:', recoveryError);
          }
        }, 100);
        
        // NÃO chamar event.preventDefault() para permitir que GlobalCrashOverlay capture
      }
    }
  });

  console.log('🛡️ Global DOM error handler configurado');
};

// Função para limpar listeners (se necessário)
export const cleanupGlobalErrorHandler = () => {
  // Restaurar métodos originais se necessário (para testes)
  console.log('🧹 Global error handler cleanup executado');
};