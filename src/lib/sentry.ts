/**
 * Sentry Error Tracking Configuration
 *
 * Monitoramento de erros em produção
 * Docs: https://docs.sentry.io/platforms/javascript/guides/react/
 */

import * as Sentry from "@sentry/react";

/**
 * Inicializa o Sentry para tracking de erros
 *
 * IMPORTANTE: Configure a variável de ambiente VITE_SENTRY_DSN
 * no painel do Lovable Cloud ou no arquivo .env
 */
export function initSentry() {
  // Só inicializar em produção
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,

      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true, // Não capturar texto sensível
          blockAllMedia: true, // Não capturar imagens/vídeos
        }),
      ],

      // Performance Monitoring - capturar 10% das transações
      tracesSampleRate: 0.1,

      // Session Replay - capturar 10% das sessões
      replaysSessionSampleRate: 0.1,

      // Replay de 100% das sessões com erros
      replaysOnErrorSampleRate: 1.0,

      // Ambiente
      environment: import.meta.env.MODE,

      // Ignorar erros conhecidos/esperados
      ignoreErrors: [
        // Erros de rede (esperados)
        "NetworkError",
        "Failed to fetch",
        "Network request failed",

        // Erros de extensões do navegador
        "chrome-extension://",
        "moz-extension://",

        // Erros de ad blockers
        "adsbygoogle",

        // Cancelamento de requisições (esperado)
        "AbortError",
        "The user aborted a request",
      ],

      // Filtrar breadcrumbs (logs) sensíveis
      beforeBreadcrumb(breadcrumb) {
        // Não enviar breadcrumbs de console.log em produção
        if (breadcrumb.category === "console") {
          return null;
        }

        // Não enviar dados de formulários
        if (breadcrumb.category === "ui.input") {
          delete breadcrumb.message;
        }

        return breadcrumb;
      },

      // Filtrar eventos antes de enviar
      beforeSend(event, hint) {
        // Não enviar erros de development
        if (import.meta.env.DEV) {
          return null;
        }

        // Filtrar informações sensíveis dos headers
        if (event.request?.headers) {
          delete event.request.headers["Authorization"];
          delete event.request.headers["Cookie"];
        }

        // Adicionar contexto do usuário (sem PII)
        if (event.user) {
          // Remover email e outras informações sensíveis
          delete event.user.email;
          delete event.user.username;
          delete event.user.ip_address;
        }

        return event;
      },
    });

    console.log("✅ Sentry inicializado");
  } else if (import.meta.env.DEV) {
    console.log("ℹ️ Sentry desabilitado em desenvolvimento");
  } else {
    console.warn("⚠️ Sentry DSN não configurado. Configure VITE_SENTRY_DSN no .env");
  }
}

/**
 * Capturar erro manualmente
 *
 * @example
 * try {
 *   // código que pode falhar
 * } catch (error) {
 *   captureError(error, { extra: { userId: user.id } });
 * }
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("Erro capturado:", error, context);
  }
}

/**
 * Definir contexto do usuário
 * Chamar após login bem-sucedido
 *
 * @example
 * setUserContext({ id: user.id });
 */
export function setUserContext(user: { id: string }) {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser({
      id: user.id,
      // NÃO adicionar email ou outras PII aqui
    });
  }
}

/**
 * Limpar contexto do usuário
 * Chamar após logout
 */
export function clearUserContext() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Adicionar breadcrumb customizado (log de eventos)
 *
 * @example
 * addBreadcrumb({
 *   message: 'Usuário iniciou geração de imagem',
 *   category: 'user-action',
 *   level: 'info'
 * });
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, any>;
}) {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.addBreadcrumb(breadcrumb);
  }
}
