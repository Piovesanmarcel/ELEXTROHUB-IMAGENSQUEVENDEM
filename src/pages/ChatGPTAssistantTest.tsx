import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, Bot, User, Upload, FileText, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatGPTAssistantTest = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  
  // Estados para a nova funcionalidade de OpenAI normal
  const [normalMessages, setNormalMessages] = useState<Message[]>([]);
  const [normalInput, setNormalInput] = useState('');
  const [isNormalLoading, setIsNormalLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<{name: string, content: string}[]>([]);
  
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      console.log('🚀 Enviando mensagem para o assistente...', {
        message: messageToSend.substring(0, 100),
        threadId,
        assistantId: 'asst_4xlvTGZq7nTOlfDUh00aCqEL'
      });

      // Primeiro, vamos tentar com o cliente Supabase
      console.log('📡 Tentando via Supabase client...');
      let data, error;
      
      try {
        const response = await supabase.functions.invoke('openai-assistant-chat', {
          body: {
            message: messageToSend,
            threadId: threadId,
            assistantId: 'asst_4xlvTGZq7nTOlfDUh00aCqEL'
          }
        });
        data = response.data;
        error = response.error;
      } catch (supabaseError) {
        console.log('❌ Erro com Supabase client:', supabaseError);
        error = supabaseError;
      }

      console.log('📦 Resposta recebida:', { 
        data, 
        error,
        dataType: typeof data,
        hasResponse: data?.response ? 'SIM' : 'NÃO',
        responseLength: data?.response?.length || 0
      });

      if (error) {
        console.error('❌ Erro da edge function:', error);
        throw new Error(`Edge function error: ${error.message || 'Erro desconhecido'}`);
      }

      if (!data || !data.response) {
        console.error('❌ Resposta vazia ou inválida:', data);
        throw new Error('Resposta do assistente está vazia ou inválida');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.threadId && !threadId) {
        console.log('💾 Salvando threadId:', data.threadId);
        setThreadId(data.threadId);
      }

      toast({
        title: "✅ Resposta recebida",
        description: `Assistente respondeu com ${data.response.length} caracteres.`,
      });

    } catch (error) {
      console.error('❌ Erro completo ao enviar mensagem:', error);
      
      // Adicionar mensagem de erro no chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ Erro: ${error.message}. Verifique os logs do console para mais detalhes.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "❌ Erro na comunicação",
        description: `Falha ao comunicar com o assistente: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setThreadId(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (!file.name.endsWith('.txt')) {
        toast({
          title: "❌ Formato inválido",
          description: `Arquivo ${file.name} ignorado. Apenas arquivos .txt são aceitos.`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedDocuments(prev => [...prev, { name: file.name, content }]);
        toast({
          title: "✅ Documento adicionado",
          description: `Arquivo ${file.name} foi carregado com sucesso`,
        });
      };
      reader.readAsText(file);
    });
    
    // Limpar o input para permitir upload do mesmo arquivo novamente
    event.target.value = '';
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllDocuments = () => {
    setUploadedDocuments([]);
  };

  const sendNormalMessage = async () => {
    if (!normalInput.trim() || isNormalLoading) return;

    if (uploadedDocuments.length === 0) {
      toast({
        title: "❌ Documentos necessários",
        description: "Por favor, faça upload de pelo menos um documento .txt primeiro",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: normalInput,
      timestamp: new Date()
    };

    setNormalMessages(prev => [...prev, userMessage]);
    const messageToSend = normalInput;
    setNormalInput('');
    setIsNormalLoading(true);

    try {
      console.log('🚀 Enviando mensagem para OpenAI normal...', {
        message: messageToSend.substring(0, 100),
        documentsCount: uploadedDocuments.length,
        totalDocumentsLength: uploadedDocuments.reduce((sum, doc) => sum + doc.content.length, 0)
      });

      const { data, error: invokeError } = await supabase.functions.invoke('openai-normal-chat', {
        body: {
          message: messageToSend,
          documents: uploadedDocuments
        }
      });

      if (invokeError) {
        throw new Error(`API Error: ${invokeError.message}`);
      }

      if (!data || !data.response) {
        throw new Error('Resposta vazia ou inválida da API');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setNormalMessages(prev => [...prev, assistantMessage]);

      toast({
        title: "✅ Resposta recebida",
        description: `IA especializada respondeu com ${data.response.length} caracteres.`,
      });

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ Erro: ${error.message}. Verifique os logs do console para mais detalhes.`,
        timestamp: new Date()
      };
      setNormalMessages(prev => [...prev, errorMessage]);

      toast({
        title: "❌ Erro na comunicação",
        description: `Falha ao comunicar com a IA: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsNormalLoading(false);
    }
  };

  const clearNormalChat = () => {
    setNormalMessages([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Teste do Assistente VisualPrompt ProM
          </CardTitle>
          <p className="text-muted-foreground">
            Teste do assistente ChatGPT VisualPrompt ProM (ID: asst_4xlvTGZq7nTOlfDUh00aCqEL)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Área de mensagens */}
          <div className="min-h-[400px] max-h-[500px] overflow-y-auto border rounded-lg p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Inicie uma conversa com o assistente VisualPrompt ProM</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg p-3 bg-secondary text-secondary-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Assistente está digitando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Área de input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Digite sua mensagem para o assistente VisualPrompt ProM..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
              className="min-h-[80px]"
            />
            <div className="flex gap-2 justify-between">
              <Button
                variant="outline"
                onClick={clearChat}
                disabled={messages.length === 0}
              >
                Limpar Chat
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>

          {threadId && (
            <div className="text-xs text-muted-foreground">
              Thread ID: {threadId}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nova seção para OpenAI Normal com upload de documentos */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            IA Especializada com Documentos
          </CardTitle>
          <p className="text-muted-foreground">
            Faça upload de documentos .txt para especializar a IA e gerar prompts baseados no seu produto
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Área de upload de documento */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".txt"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload">
                <Button variant="outline" className="cursor-pointer flex items-center gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Upload Documentos .txt
                  </span>
                </Button>
              </label>
              
              {uploadedDocuments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeAllDocuments}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover Todos
                </Button>
              )}
            </div>
            
            {uploadedDocuments.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Documentos carregados ({uploadedDocuments.length}):
                </div>
                <div className="grid gap-2 max-h-32 overflow-y-auto">
                  {uploadedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary/50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{doc.name}</span>
                        <span className="text-xs text-muted-foreground">({doc.content.length} chars)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: {uploadedDocuments.reduce((sum, doc) => sum + doc.content.length, 0)} caracteres
                </div>
              </div>
            )}
          </div>

          {/* Área de mensagens */}
          <div className="min-h-[400px] max-h-[500px] overflow-y-auto border rounded-lg p-4 space-y-4">
            {normalMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Faça upload de documentos e inicie uma conversa com a IA especializada</p>
              </div>
            ) : (
              normalMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {isNormalLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg p-3 bg-secondary text-secondary-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">IA está analisando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Área de input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Descreva seu produto para receber prompts especializados..."
              value={normalInput}
              onChange={(e) => setNormalInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendNormalMessage();
                }
              }}
              disabled={isNormalLoading || uploadedDocuments.length === 0}
              className="min-h-[80px]"
            />
            <div className="flex gap-2 justify-between">
              <Button
                variant="outline"
                onClick={clearNormalChat}
                disabled={normalMessages.length === 0}
              >
                Limpar Chat
              </Button>
              <Button
                onClick={sendNormalMessage}
                disabled={!normalInput.trim() || isNormalLoading || uploadedDocuments.length === 0}
                className="flex items-center gap-2"
              >
                {isNormalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatGPTAssistantTest;