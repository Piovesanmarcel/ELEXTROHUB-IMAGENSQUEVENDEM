import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, MessageSquare, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useTongyiWanxiang } from '@/hooks/useTongyiWanxiang';

const TongyiWanxiang = () => {
  // ✅ CORRIGIDO: Usando Qwen-VL-Max e Qwen-Image-Edit
  const { analyzeImage, editImage, isProcessing, progress } = useTongyiWanxiang();
  
  // Estados para análise de imagem (Gemini 2.5 Flash Image Preview)
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  // Estados para edição de imagem (Gemini 2.5 Flash Image Preview)
  const [editPrompt, setEditPrompt] = useState('');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [editedImage, setEditedImage] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, setImage: (image: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!analysisImage) {
      toast.error('Selecione uma imagem para análise');
      return;
    }

    if (!analysisPrompt.trim()) {
      toast.error('Digite sua pergunta sobre a imagem');
      return;
    }

    try {
      // ✅ CORRIGIDO: Usando Qwen-VL-Max via hook
      const result = await analyzeImage(analysisImage, analysisPrompt);
      
      if (result.success && result.data?.response) {
        setAnalysisResult(result.data.response);
        toast.success('Análise concluída com Qwen-VL-Max!');
      } else {
        throw new Error(result.error || 'Resposta inválida do Qwen-VL-Max');
      }
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar imagem: ' + error.message);
    }
  };

  const handleEditImage = async () => {
    // Verifica se temos imagem (upload ou URL)
    const imageToEdit = inputImage || imageUrl;
    
    if (!imageToEdit) {
      toast.error('Selecione uma imagem ou cole uma URL');
      return;
    }
    
    if (!editPrompt.trim()) {
      toast.error('Digite um prompt para editar a imagem');
      return;
    }

    try {
      // ✅ CORRIGIDO: Usando Qwen-Image-Edit via hook
      const result = await editImage(imageToEdit, editPrompt);
      
      if (result.success && result.data?.image_url) {
        setEditedImage(result.data.image_url);
        toast.success('Edição concluída com Qwen-Image-Edit!');
      } else {
        throw new Error(result.error || 'Resposta inválida do Qwen-Image-Edit');
      }
    } catch (error) {
      console.error('Erro na edição:', error);
      toast.error('Erro ao editar imagem: ' + error.message);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    if (url) {
      setInputImage(null); // Limpa upload se URL for inserida
    }
  };

  const handleImageUploadEdit = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(event, setInputImage);
    setImageUrl(''); // Limpa URL se upload for feito
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Image className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Tongyi Wanxiang AI - Qwen Models</h1>
      </div>

      <div className="text-center space-y-2 mb-8">
        <h2 className="text-xl text-muted-foreground">
          Qwen-VL-Max + Qwen-Image-Edit
        </h2>
        <p className="text-sm text-muted-foreground">
          Análise com Qwen-VL-Max e edição avançada com Qwen-Image-Edit
        </p>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Análise - Qwen-VL-Max
          </TabsTrigger>
          <TabsTrigger value="editing" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edição - Qwen-Image-Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Análise de Imagem com Qwen-VL-Max
              </CardTitle>
              <CardDescription>
                Faça perguntas sobre imagens e receba análises detalhadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="analysis-image">Upload da Imagem</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="analysis-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setAnalysisImage)}
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {analysisImage && (
                <div className="space-y-2">
                  <Label>Imagem Carregada</Label>
                  <div className="border rounded-lg overflow-hidden max-w-md">
                    <img 
                      src={analysisImage} 
                      alt="Imagem para análise" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="analysis-prompt">Sua Pergunta</Label>
                <Textarea
                  id="analysis-prompt"
                  placeholder="O que você quer saber sobre esta imagem? Ex: Descreva o que você vê, identifique objetos, explique a cena..."
                  value={analysisPrompt}
                  onChange={(e) => setAnalysisPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                onClick={handleAnalyzeImage} 
                disabled={isProcessing || !analysisImage || !analysisPrompt.trim()}
                className="w-full"
              >
                {isProcessing ? 'Analisando...' : 'Analisar Imagem'}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Processando... {progress}%
                  </p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-2">
                  <Label>Resultado da Análise</Label>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <p className="whitespace-pre-wrap">{analysisResult}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edição de Imagem com Qwen-Image-Edit
              </CardTitle>
              <CardDescription>
                Edite e transforme imagens com instruções em linguagem natural
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Opção 1: Cole a URL da imagem</Label>
                  <Input
                    placeholder="https://exemplo.com/sua-imagem.jpg"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-sm text-muted-foreground">OU</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-image">Opção 2: Upload da Imagem</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="edit-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUploadEdit}
                      className="flex-1"
                    />
                    <Upload className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {(inputImage || imageUrl) && (
                <div className="space-y-2">
                  <Label>Imagem {inputImage ? 'Carregada' : 'da URL'}</Label>
                  <div className="border rounded-lg overflow-hidden max-w-md">
                    <img 
                      src={inputImage || imageUrl} 
                      alt="Imagem original" 
                      className="w-full h-auto"
                      onError={(e) => {
                        if (imageUrl) {
                          toast.error('Erro ao carregar imagem da URL. Verifique se a URL está correta.');
                        }
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="edit-prompt">Instruções de Edição</Label>
                <Textarea
                  id="edit-prompt"
                  placeholder="Descreva como quer editar a imagem... Ex: Adicione um pôr do sol no fundo, mude a cor para azul, remova objetos..."
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                onClick={handleEditImage} 
                disabled={isProcessing || !(inputImage || imageUrl) || !editPrompt.trim()}
                className="w-full"
              >
                {isProcessing ? 'Editando...' : 'Editar Imagem'}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Processando... {progress}%
                  </p>
                </div>
              )}

              {editedImage && (
                <div className="space-y-2">
                  <Label>Imagem Editada</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={editedImage} 
                      alt="Imagem editada" 
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TongyiWanxiang;