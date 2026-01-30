import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PageRoute {
  path: string;
  name: string;
  description: string;
  isActive: boolean;
  isProtected: boolean;
  category: 'main' | 'admin' | 'auth' | 'tools';
}

// Definição estática das rotas do sistema
const SYSTEM_ROUTES: Omit<PageRoute, 'isActive'>[] = [
  // Main routes
  { path: '/', name: 'Home / Dashboard', description: 'Página inicial do painel', isProtected: true, category: 'main' },
  { path: '/painel', name: 'Painel', description: 'Dashboard principal do usuário', isProtected: true, category: 'main' },
  { path: '/produtos', name: 'Produtos', description: 'Lista de produtos', isProtected: true, category: 'main' },
  { path: '/pedidos', name: 'Pedidos', description: 'Gerenciamento de pedidos', isProtected: true, category: 'main' },
  { path: '/configuracoes', name: 'Configurações', description: 'Configurações da conta', isProtected: true, category: 'main' },
  { path: '/planos', name: 'Planos', description: 'Planos de assinatura', isProtected: true, category: 'main' },
  { path: '/comprar-creditos', name: 'Comprar Créditos', description: 'Loja de créditos', isProtected: true, category: 'main' },
  
  // Tools routes
  { path: '/gerador-completo', name: 'Gerador Completo N8N', description: 'Gerador de imagens com n8n', isProtected: true, category: 'tools' },
  { path: '/canva-template-n8n', name: 'Templates Canva N8N', description: 'Templates de marketing', isProtected: true, category: 'tools' },
  { path: '/melhorar-em-lote', name: 'Melhorar em Lote', description: 'Processamento em lote', isProtected: true, category: 'tools' },
  { path: '/hospedagem-imagens', name: 'Hospedagem de Imagens', description: 'Upload e hospedagem', isProtected: true, category: 'tools' },
  { path: '/debug/n8n-stream', name: 'Debug N8N Stream', description: 'Monitor de debug n8n', isProtected: true, category: 'tools' },
  
  // Admin routes
  { path: '/admin', name: 'Admin Dashboard', description: 'Painel administrativo', isProtected: true, category: 'admin' },
  { path: '/admin/queue-monitor', name: 'Monitor de Fila', description: 'Monitor de jobs da fila', isProtected: true, category: 'admin' },
  { path: '/admin/users', name: 'Usuários', description: 'Gerenciamento de usuários', isProtected: true, category: 'admin' },
  { path: '/admin/metrics', name: 'Métricas', description: 'Métricas do sistema', isProtected: true, category: 'admin' },
  
  // Auth routes
  { path: '/login', name: 'Login', description: 'Página de login', isProtected: false, category: 'auth' },
  { path: '/auth/callback', name: 'Auth Callback', description: 'Callback de autenticação', isProtected: false, category: 'auth' },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  main: { label: 'Principal', color: 'bg-blue-500' },
  admin: { label: 'Administração', color: 'bg-amber-500' },
  auth: { label: 'Autenticação', color: 'bg-gray-500' },
  tools: { label: 'Ferramentas', color: 'bg-green-500' },
};

export const PageRoutesManager: React.FC = () => {
  const [routes, setRoutes] = useState<PageRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRoute, setSavingRoute] = useState<string | null>(null);

  useEffect(() => {
    loadRouteSettings();
  }, []);

  const loadRouteSettings = async () => {
    setIsLoading(true);
    try {
      // Carregar configurações salvas do localStorage (temporário até ter tabela)
      const savedSettings = localStorage.getItem('page_routes_config');
      const savedConfig: Record<string, boolean> = savedSettings ? JSON.parse(savedSettings) : {};

      const routesWithStatus = SYSTEM_ROUTES.map(route => ({
        ...route,
        isActive: savedConfig[route.path] ?? true, // Por padrão, todas ativas
      }));

      setRoutes(routesWithStatus);
    } catch (error) {
      console.error('Erro ao carregar configurações de rotas:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRoute = async (path: string, isActive: boolean) => {
    // Não permitir desativar rotas críticas
    const criticalRoutes = ['/', '/login', '/configuracoes', '/admin'];
    if (criticalRoutes.includes(path) && !isActive) {
      toast.error('Esta rota não pode ser desativada');
      return;
    }

    setSavingRoute(path);
    
    try {
      // Salvar no localStorage (temporário)
      const savedSettings = localStorage.getItem('page_routes_config');
      const savedConfig: Record<string, boolean> = savedSettings ? JSON.parse(savedSettings) : {};
      savedConfig[path] = isActive;
      localStorage.setItem('page_routes_config', JSON.stringify(savedConfig));

      // Atualizar estado local
      setRoutes(prev => prev.map(route => 
        route.path === path ? { ...route, isActive } : route
      ));

      toast.success(isActive ? 'Página ativada' : 'Página desativada');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSavingRoute(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Agrupar rotas por categoria
  const groupedRoutes = routes.reduce((acc, route) => {
    if (!acc[route.category]) acc[route.category] = [];
    acc[route.category].push(route);
    return acc;
  }, {} as Record<string, PageRoute[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-500" />
          <CardTitle>Gerenciador de Páginas</CardTitle>
        </div>
        <CardDescription>
          Ative ou desative páginas do sistema. Páginas desativadas não serão acessíveis pelos usuários.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedRoutes).map(([category, categoryRoutes]) => {
          const categoryInfo = CATEGORY_LABELS[category] || { label: category, color: 'bg-gray-500' };
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${categoryInfo.color}`} />
                <h3 className="font-semibold text-sm">{categoryInfo.label}</h3>
                <Badge variant="outline" className="text-xs">
                  {categoryRoutes.filter(r => r.isActive).length}/{categoryRoutes.length} ativas
                </Badge>
              </div>
              
              <div className="space-y-2 pl-4">
                {categoryRoutes.map(route => (
                  <div
                    key={route.path}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-muted">
                        {route.isProtected ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{route.name}</span>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {route.path}
                          </code>
                        </div>
                        <p className="text-xs text-muted-foreground">{route.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {route.isActive ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <Eye className="h-3 w-3 mr-1" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativa
                        </Badge>
                      )}
                      
                      {savingRoute === route.path ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={route.isActive}
                          onCheckedChange={(checked) => handleToggleRoute(route.path, checked)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            ⚠️ Rotas críticas (Home, Login, Configurações, Admin) não podem ser desativadas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PageRoutesManager;
