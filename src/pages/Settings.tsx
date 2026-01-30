import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlobalLogoSettings } from "@/components/marketing/GlobalLogoSettings";
import { ApiKeysManager } from "@/components/settings/ApiKeysManager";
import { PageRoutesManager } from "@/components/settings/PageRoutesManager";
import { N8NWebhooksManager } from "@/components/settings/N8NWebhooksManager";
import SiteConfigManager from "@/components/settings/SiteConfigManager";
import { Settings2, Key, CreditCard, Palette, Globe, Youtube, Webhook } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, isLoading: isAdminLoading } = useAdminAuth();

  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        // Verificar sessão do usuário
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ Usuário autenticado:', user.email);
        }
      } catch (error) {
        console.error("Error checking status:", error);
        toast.error("Erro ao verificar configurações");
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure sua conta, marca e preferências</p>
      </div>

      <Tabs defaultValue="geral" className="max-w-4xl">
        <TabsList className={`grid w-full mb-6 ${isAdmin ? 'grid-cols-6' : 'grid-cols-4'}`}>
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="n8n" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            N8N
          </TabsTrigger>
          <TabsTrigger value="marca" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Marca
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="site" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              Site
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="paginas" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Páginas
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Assinatura</CardTitle>
              <CardDescription>
                Visualize e gerencie seu plano de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.location.href = '/planos'}
                variant="outline"
              >
                Ver Planos e Assinatura
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Comprar Créditos
              </CardTitle>
              <CardDescription>
                Adicione créditos para geração de imagens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => window.location.href = '/comprar-creditos'}
                variant="outline"
              >
                Comprar Créditos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <ApiKeysManager />
        </TabsContent>

        <TabsContent value="n8n" className="space-y-6">
          <N8NWebhooksManager />
        </TabsContent>

        <TabsContent value="marca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Marca</CardTitle>
              <CardDescription>
                Configure sua logo global para aplicar automaticamente em todos os templates de marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GlobalLogoSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Site - Admin Only */}
        {isAdmin && (
          <TabsContent value="site" className="space-y-6">
            <SiteConfigManager />
          </TabsContent>
        )}

        {/* Tab Páginas - Admin Only */}
        {isAdmin && (
          <TabsContent value="paginas" className="space-y-6">
            <PageRoutesManager />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
