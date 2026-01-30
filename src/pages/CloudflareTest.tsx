import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useImageHosting } from "@/hooks/enhancement/useImageHosting";
import { HostingStatusIndicator } from "@/components/enhancement/HostingStatusIndicator";
import { toast } from "sonner";
import { 
  Cloud, 
  Upload, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Server,
  Image as ImageIcon,
  Download
} from "lucide-react";

interface TestResult {
  service: string;
  success: boolean;
  url?: string;
  hosted: boolean;
  message: string;
  timestamp: string;
  responseTime: number;
}

export default function CloudflareTest() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testImageUrl, setTestImageUrl] = useState("");
  const [isTestingHosting, setIsTestingHosting] = useState(false);
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  const { 
    hostEnhancedImage, 
    testCloudflareConnectivity, 
    testImgBBConnectivity,
    uploadToCloudflare,
    uploadToImgBB
  } = useImageHosting();

  // Converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Teste de conectividade com todos os serviços
  const handleConnectivityTest = async () => {
    setIsTestingConnectivity(true);
    const startTime = Date.now();

    try {
      console.log("🔍 Iniciando teste de conectividade...");
      
      // Teste Cloudflare
      setProgress(33);
      const cloudflareResult = await testCloudflareConnectivity();
      const cloudflareTime = Date.now() - startTime;
      
      // Teste ImgBB
      setProgress(66);
      const imgbbResult = await testImgBBConnectivity();
      const imgbbTime = Date.now() - startTime - cloudflareTime;
      
      setProgress(100);
      
      const results: TestResult[] = [
        {
          service: "cloudflare",
          success: cloudflareResult,
          hosted: false,
          message: cloudflareResult ? "Conectividade OK" : "Falha na conectividade",
          timestamp: new Date().toLocaleString(),
          responseTime: cloudflareTime
        },
        {
          service: "imgbb",
          success: imgbbResult,
          hosted: false,
          message: imgbbResult ? "Conectividade OK" : "Falha na conectividade",
          timestamp: new Date().toLocaleString(),
          responseTime: imgbbTime
        }
      ];

      setTestResults(results);
      
      if (cloudflareResult && imgbbResult) {
        toast.success("✅ Todos os serviços estão conectados!");
      } else {
        toast.warning("⚠️ Alguns serviços podem estar indisponíveis");
      }
      
    } catch (error) {
      console.error("Erro no teste de conectividade:", error);
      toast.error("Erro durante o teste de conectividade");
    } finally {
      setIsTestingConnectivity(false);
      setProgress(0);
    }
  };

  // Teste de hospedagem completo
  const handleHostingTest = async () => {
    if (!selectedFile && !testImageUrl) {
      toast.error("Selecione um arquivo ou insira uma URL de imagem");
      return;
    }

    setIsTestingHosting(true);
    const startTime = Date.now();

    try {
      let imageData: string;
      let fileName: string;

      if (selectedFile) {
        imageData = await fileToBase64(selectedFile);
        fileName = selectedFile.name;
      } else {
        // Para URL externa, vamos simular usando a URL
        imageData = testImageUrl;
        fileName = "test-image.jpg";
      }

      console.log("🚀 Iniciando teste de hospedagem completo...");
      setProgress(50);

      const result = await hostEnhancedImage(imageData, fileName);
      const responseTime = Date.now() - startTime;

      setProgress(100);

      const testResult: TestResult = {
        service: result.service,
        success: result.hosted || result.service === 'deepai_direct',
        url: result.url,
        hosted: result.hosted,
        message: result.message,
        timestamp: new Date().toLocaleString(),
        responseTime
      };

      setTestResults(prev => [testResult, ...prev]);

      if (result.hosted) {
        toast.success(`✅ Sucesso! Imagem hospedada no ${result.service.toUpperCase()}`);
      } else {
        toast.warning(`⚠️ Fallback: ${result.message}`);
      }

    } catch (error) {
      console.error("Erro no teste de hospedagem:", error);
      toast.error("Erro durante o teste de hospedagem");
      
      const errorResult: TestResult = {
        service: "error",
        success: false,
        hosted: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toLocaleString(),
        responseTime: Date.now() - startTime
      };
      
      setTestResults(prev => [errorResult, ...prev]);
    } finally {
      setIsTestingHosting(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <TestTube className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Teste de Hospedagem Cloudflare</h1>
          <p className="text-muted-foreground">
            Teste a ordem de prioridade: Cloudflare → ImgBB → DeepAI
          </p>
        </div>
      </div>

      {/* Ordem de Prioridade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Ordem de Prioridade Configurada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <Cloud className="h-3 w-3 mr-1" />
              1º Cloudflare (Principal)
            </Badge>
            <div className="text-muted-foreground">→</div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <Cloud className="h-3 w-3 mr-1" />
              2º ImgBB (Secundário)
            </Badge>
            <div className="text-muted-foreground">→</div>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              <Server className="h-3 w-3 mr-1" />
              3º DeepAI (Fallback)
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Testes */}
        <div className="space-y-4">
          {/* Teste de Conectividade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teste de Conectividade</CardTitle>
              <CardDescription>
                Verifica se os serviços estão acessíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleConnectivityTest}
                disabled={isTestingConnectivity}
                className="w-full"
                variant="outline"
              >
                {isTestingConnectivity ? (
                  <>
                    <TestTube className="mr-2 h-4 w-4 animate-spin" />
                    Testando Conectividade...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Testar Conectividade
                  </>
                )}
              </Button>
              
              {isTestingConnectivity && (
                <Progress value={progress} className="w-full" />
              )}
            </CardContent>
          </Card>

          {/* Teste de Hospedagem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Teste de Hospedagem</CardTitle>
              <CardDescription>
                Teste o upload de imagens seguindo a ordem de prioridade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload de Arquivo */}
              <div className="space-y-2">
                <Label htmlFor="file-upload">Arquivo de Imagem</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      setTestImageUrl(""); // Limpar URL se arquivo selecionado
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">OU</span>
                <Separator className="flex-1" />
              </div>

              {/* URL de Teste */}
              <div className="space-y-2">
                <Label htmlFor="test-url">URL de Imagem de Teste</Label>
                <Input
                  id="test-url"
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={testImageUrl}
                  onChange={(e) => {
                    setTestImageUrl(e.target.value);
                    if (e.target.value) {
                      setSelectedFile(null); // Limpar arquivo se URL inserida
                    }
                  }}
                />
              </div>

              <Button 
                onClick={handleHostingTest}
                disabled={isTestingHosting || (!selectedFile && !testImageUrl)}
                className="w-full"
              >
                {isTestingHosting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-pulse" />
                    Testando Hospedagem...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Testar Hospedagem
                  </>
                )}
              </Button>
              
              {isTestingHosting && (
                <Progress value={progress} className="w-full" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resultados dos Testes */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resultados dos Testes</CardTitle>
              <CardDescription>
                Histórico de testes realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TestTube className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhum teste realizado ainda</p>
                  <p className="text-sm">Execute os testes acima para ver os resultados</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <HostingStatusIndicator
                          isHosted={result.hosted}
                          hostingService={result.service}
                          hostingMessage={result.message}
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          {result.responseTime}ms
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {result.message}
                      </p>
                      
                      {result.url && (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate max-w-xs"
                          >
                            {result.url}
                          </a>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(result.url, '_blank')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        {result.timestamp}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}