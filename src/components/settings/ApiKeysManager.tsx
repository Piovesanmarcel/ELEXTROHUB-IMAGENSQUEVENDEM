import { useState } from 'react';
import { useApiKeys, ApiProvider } from '@/hooks/useApiKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, TestTube2, Eye, EyeOff, ExternalLink, Loader2, Key } from 'lucide-react';

interface ProviderConfig {
  name: string;
  icon: string;
  getKeyUrl: string;
  placeholder: string;
  maxKeys: number;
  description: string;
}

const API_PROVIDERS: Record<ApiProvider, ProviderConfig> = {
  gemini: {
    name: 'Google Gemini',
    icon: '🤖',
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIza...',
    maxKeys: 5,
    description: 'IA para análise de imagens e geração de texto'
  },
  openai: {
    name: 'OpenAI',
    icon: '🧠',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
    maxKeys: 3,
    description: 'GPT-4 e DALL-E para texto e imagens'
  },
  runware: {
    name: 'Runware',
    icon: '🖼️',
    getKeyUrl: 'https://runware.ai/dashboard',
    placeholder: 'rw-...',
    maxKeys: 3,
    description: 'Geração de imagens de alta qualidade'
  },
  stability: {
    name: 'Stability AI',
    icon: '🎨',
    getKeyUrl: 'https://platform.stability.ai/account/keys',
    placeholder: 'sk-...',
    maxKeys: 3,
    description: 'Stable Diffusion para geração de imagens'
  },
  replicate: {
    name: 'Replicate',
    icon: '🔄',
    getKeyUrl: 'https://replicate.com/account/api-tokens',
    placeholder: 'r8_...',
    maxKeys: 3,
    description: 'Modelos diversos de IA'
  }
};

interface ProviderKeysManagerProps {
  provider: ApiProvider;
  config: ProviderConfig;
}

function ProviderKeysManager({ provider, config }: ProviderKeysManagerProps) {
  const { apiKeys, isLoading, addApiKey, removeApiKey, testApiKey } = useApiKeys(provider);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    
    setIsAdding(true);
    const success = await addApiKey(newKeyName.trim(), newKeyValue.trim());
    setIsAdding(false);
    
    if (success) {
      setNewKeyName('');
      setNewKeyValue('');
      setIsAddDialogOpen(false);
    }
  };

  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    await testApiKey(keyId);
    setTestingKeyId(null);
  };

  const handleDeleteKey = async (keyId: string) => {
    setDeletingKeyId(keyId);
    await removeApiKey(keyId);
    setDeletingKeyId(null);
  };

  const getStatusBadge = (key: { isActive: boolean; isExhausted: boolean }) => {
    if (key.isExhausted) {
      return <Badge variant="destructive">Esgotada</Badge>;
    }
    if (!key.isActive) {
      return <Badge variant="secondary">Inativa</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Ativa</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{config.description}</p>
        <a 
          href={config.getKeyUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Obter API Key <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {apiKeys.length > 0 ? (
        <div className="space-y-2">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{config.icon}</span>
                <div>
                  <p className="font-medium text-sm">{key.name}</p>
                  {key.lastUsedAt && (
                    <p className="text-xs text-muted-foreground">
                      Último uso: {new Date(key.lastUsedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                {getStatusBadge(key)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestKey(key.id)}
                  disabled={testingKeyId === key.id}
                >
                  {testingKeyId === key.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteKey(key.id)}
                  disabled={deletingKeyId === key.id}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingKeyId === key.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border rounded-lg border-dashed">
          <Key className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma chave configurada</p>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full"
            disabled={apiKeys.length >= config.maxKeys}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Chave ({apiKeys.length}/{config.maxKeys})
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{config.icon}</span>
              Adicionar Chave {config.name}
            </DialogTitle>
            <DialogDescription>
              Insira sua API Key para usar recursos de {config.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Nome da Chave</Label>
              <Input
                id="keyName"
                placeholder="Ex: Chave Principal"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyValue">API Key</Label>
              <div className="relative">
                <Input
                  id="keyValue"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={config.placeholder}
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddKey}
              disabled={!newKeyName.trim() || !newKeyValue.trim() || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Chave'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ApiKeysManager() {
  const providers = Object.keys(API_PROVIDERS) as ApiProvider[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Gerenciamento de API Keys
        </CardTitle>
        <CardDescription>
          Configure suas chaves de API para diferentes provedores de IA. 
          Ter múltiplas chaves permite fallback automático quando uma quota é atingida.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gemini" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            {providers.map((provider) => (
              <TabsTrigger key={provider} value={provider} className="text-xs">
                <span className="mr-1">{API_PROVIDERS[provider].icon}</span>
                <span className="hidden sm:inline">{API_PROVIDERS[provider].name.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {providers.map((provider) => (
            <TabsContent key={provider} value={provider}>
              <ProviderKeysManager provider={provider} config={API_PROVIDERS[provider]} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
