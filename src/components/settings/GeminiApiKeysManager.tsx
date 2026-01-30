import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, CheckCircle2, AlertTriangle, XCircle, Eye, EyeOff, TestTube } from 'lucide-react';
import { useGeminiApiKeys, GeminiApiKey } from '@/hooks/useGeminiApiKeys';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

export const GeminiApiKeysManager = () => {
  const { 
    apiKeys, 
    isLoading, 
    addApiKey, 
    removeApiKey, 
    testApiKey 
  } = useGeminiApiKeys();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      return;
    }

    setIsAdding(true);
    const success = await addApiKey(newKeyName.trim(), newKeyValue.trim());
    setIsAdding(false);

    if (success) {
      setShowAddDialog(false);
      setNewKeyName('');
      setNewKeyValue('');
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

  const getStatusBadge = (key: GeminiApiKey) => {
    if (key.is_exhausted) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Exausta
        </Badge>
      );
    }
    if (!key.is_active) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Inativa
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600">
        <CheckCircle2 className="w-3 h-3" />
        Ativa
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔑 API Keys do Google Gemini
        </CardTitle>
        <CardDescription>
          Gerencie até 5 API keys para alternar quando uma atingir o limite diário.
          Obtenha sua key em{' '}
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Google AI Studio
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lista de API Keys */}
        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma API key cadastrada.</p>
            <p className="text-sm mt-1">A key padrão do sistema será usada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div 
                key={key.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    {key.exhausted_at && (
                      <p className="text-xs text-muted-foreground">
                        Exausta em: {new Date(key.exhausted_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                    {key.last_used_at && (
                      <p className="text-xs text-muted-foreground">
                        Último uso: {new Date(key.last_used_at).toLocaleString('pt-BR')}
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
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                    disabled={deletingKeyId === key.id}
                  >
                    {deletingKeyId === key.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botão Adicionar */}
        <Button
          onClick={() => setShowAddDialog(true)}
          disabled={apiKeys.length >= 5}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar API Key ({apiKeys.length}/5)
        </Button>

        {/* Dialog para adicionar nova key */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova API Key</DialogTitle>
              <DialogDescription>
                Adicione uma API key do Google Gemini para usar quando outra atingir o limite.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Nome da Key</Label>
                <Input
                  id="keyName"
                  placeholder="Ex: Key Principal, Backup 1, etc."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyValue">API Key</Label>
                <div className="relative">
                  <Input
                    id="keyValue"
                    type={showKeyValue ? 'text' : 'password'}
                    placeholder="AIza..."
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowKeyValue(!showKeyValue)}
                  >
                    {showKeyValue ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha em{' '}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddKey} 
                disabled={isAdding || !newKeyName.trim() || !newKeyValue.trim()}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
