import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandler } from "./utils/safeErrorHandler";
import { SafeErrorBoundary } from "./components/SafeErrorBoundary";
import { initSentry } from "./lib/sentry";

// Inicializar Sentry para tracking de erros em produção
initSentry();

// Configurar interceptação global de erros DOM
setupGlobalErrorHandler();

// Render com ErrorBoundary global no nível mais alto
createRoot(document.getElementById("root")!).render(
  <SafeErrorBoundary>
    <App />
  </SafeErrorBoundary>
);

// Registrar Service Worker para cache de imagens (apenas em produção)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        console.log('✅ Service Worker registrado:', reg.scope);
      })
      .catch(err => {
        console.error('❌ Erro ao registrar Service Worker:', err);
      });
  });
}
