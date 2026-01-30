import { toast } from "sonner";

export interface ValidationResult {
  isValid: boolean;
  accessible: boolean;
  contentType?: string;
  size?: number;
  error?: string;
}

export const useHostingValidator = () => {
  // Valida se uma URL está acessível e é uma imagem válida
  const validateHostedImage = async (url: string, timeoutMs = 5000): Promise<ValidationResult> => {
    try {
      console.log('🔍 Validando imagem hospedada:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(url, {
        method: 'HEAD', // Apenas cabeçalhos para ser mais rápido
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          isValid: false,
          accessible: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      
      const isImage = contentType.startsWith('image/');
      
      if (!isImage) {
        return {
          isValid: false,
          accessible: true,
          contentType,
          error: `Não é uma imagem: ${contentType}`
        };
      }
      
      console.log('✅ Imagem válida e acessível');
      
      return {
        isValid: true,
        accessible: true,
        contentType,
        size: contentLength ? parseInt(contentLength) : undefined
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro na validação:', errorMessage);
      
      return {
        isValid: false,
        accessible: false,
        error: errorMessage
      };
    }
  };

  // Valida múltiplas imagens em paralelo
  const validateMultipleImages = async (urls: string[]): Promise<ValidationResult[]> => {
    console.log(`🔍 Validando ${urls.length} imagens hospedadas...`);
    
    const validationPromises = urls.map(url => validateHostedImage(url));
    const results = await Promise.all(validationPromises);
    
    const validCount = results.filter(r => r.isValid).length;
    const accessibleCount = results.filter(r => r.accessible).length;
    
    console.log(`📊 Validação completa: ${validCount}/${urls.length} válidas, ${accessibleCount}/${urls.length} acessíveis`);
    
    if (validCount === urls.length) {
      toast.success(`✅ Todas as ${urls.length} imagens hospedadas são válidas!`);
    } else if (accessibleCount === urls.length) {
      toast.warning(`⚠️ ${urls.length - validCount} imagens não são do tipo correto, mas estão acessíveis`);
    } else {
      toast.error(`❌ ${urls.length - accessibleCount} imagens não estão acessíveis`);
    }
    
    return results;
  };

  // Teste rápido de conectividade com o serviço de hospedagem
  const testHostingService = async (): Promise<boolean> => {
    try {
      console.log('🔗 Testando conectividade do serviço de hospedagem...');
      
      // Testa com uma URL conhecida do Cloudflare R2
      const testUrl = 'https://pub-891d90f87ad642679b9a62cf0f65ab8c.r2.dev/';
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      
      // Status 403 é esperado para bucket sem listagem pública
      // Status 200 também é válido
      const isConnected = response.status === 403 || response.status === 200;
      
      if (isConnected) {
        console.log('✅ Serviço de hospedagem conectado');
        return true;
      } else {
        console.error('❌ Serviço de hospedagem não acessível:', response.status);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro ao testar conectividade:', error);
      return false;
    }
  };

  // Função de diagnóstico completa
  const runDiagnostics = async (imageUrls: string[]) => {
    console.log('🔧 INICIANDO DIAGNÓSTICO COMPLETO DE HOSPEDAGEM');
    
    // 1. Teste de conectividade
    const serviceConnected = await testHostingService();
    
    // 2. Validação das imagens
    const validationResults = imageUrls.length > 0 
      ? await validateMultipleImages(imageUrls)
      : [];
    
    // 3. Estatísticas
    const totalImages = imageUrls.length;
    const validImages = validationResults.filter(r => r.isValid).length;
    const accessibleImages = validationResults.filter(r => r.accessible).length;
    const successRate = totalImages > 0 ? (validImages / totalImages * 100).toFixed(1) : '0';
    
    // 4. Relatório
    console.log('\n=== DIAGNÓSTICO DE HOSPEDAGEM ===');
    console.log(`🔗 Serviço conectado: ${serviceConnected ? 'SIM' : 'NÃO'}`);
    console.log(`📊 Imagens testadas: ${totalImages}`);
    console.log(`✅ Válidas: ${validImages} (${successRate}%)`);
    console.log(`🌐 Acessíveis: ${accessibleImages}`);
    console.log('==================================\n');
    
    return {
      serviceConnected,
      totalImages,
      validImages,
      accessibleImages,
      successRate: parseFloat(successRate),
      results: validationResults
    };
  };

  return {
    validateHostedImage,
    validateMultipleImages,
    testHostingService,
    runDiagnostics
  };
};