import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SafeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SafeErrorBoundary capturou um erro:', error, errorInfo);
    
    // Se o erro é relacionado a DOM manipulation, loggar especificamente
    if (error.message.includes('removeChild') || 
        error.message.includes('appendChild') || 
        error.message.includes('insertBefore')) {
      console.error('🚨 ERRO DE DOM MANIPULATION DETECTADO:', error.message);
    }

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Se tiver fallback customizado, usar
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 🛡️ Fallback padrão - SEMPRE mostrar algo visível
      return (
        <Card className="w-full max-w-md mx-auto mt-8 border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Erro de Carregamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Houve um problema ao carregar este componente. Isso pode ser temporário.
            </p>
            
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded font-mono overflow-auto max-h-24">
              {this.state.error?.message || 'Erro desconhecido'}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} size="sm" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook para usar o ErrorBoundary programaticamente
export const useSafeErrorHandler = () => {
  return {
    handleError: (error: Error) => {
      console.error('Erro capturado pelo hook:', error);
      
      // Se for erro de DOM, tentar recuperação
      if (error.message.includes('removeChild') || 
          error.message.includes('appendChild') || 
          error.message.includes('insertBefore')) {
        console.warn('🔧 Tentando recuperação de erro DOM...');
        
        // Forçar limpeza de eventos e re-render
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      }
    }
  };
};