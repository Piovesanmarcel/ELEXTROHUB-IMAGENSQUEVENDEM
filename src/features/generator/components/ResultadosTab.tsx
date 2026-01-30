import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Sparkles, FileText, Bot, Package } from "lucide-react";
import { toast } from "sonner";
import { CopywritingFormatter } from "@/components/product/copywriting/CopywritingFormatter";
import EbookDownloadButton from "@/components/download/EbookDownloadButton";
import type { UnifiedAIResponse } from "@/components/product/ai-enhancer/types";
import type { GeneratedImage } from "@/components/n8n/GeneratedImageGallery";

interface ResultadosTabProps {
  step1Result: UnifiedAIResponse | null;
  step2Result: string | null;
  generatedImages: GeneratedImage[];
  productName: string;
  productDescription: string;
}

export function ResultadosTab({
  step1Result,
  step2Result,
  generatedImages,
  productName,
  productDescription,
}: ResultadosTabProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      toast.success("Copiado!");
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <div className="space-y-4">
      {/* Comando Unificado Result */}
      {step1Result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Comando Unificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-3 rounded-lg max-h-64 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {step1Result.topicos_conversao?.improvedText?.slice(0, 1000)}
                {(step1Result.topicos_conversao?.improvedText?.length || 0) > 1000 && '...'}
              </pre>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-1"
              onClick={() => copyToClipboard(JSON.stringify(step1Result, null, 2), 'comando')}
            >
              {copiedSection === 'comando' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copiar JSON
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Copywriting Result */}
      {step2Result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Copywriting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <CopywritingFormatter copywriting={step2Result} />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-1"
              onClick={() => copyToClipboard(step2Result, 'copywriting')}
            >
              {copiedSection === 'copywriting' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copiar Texto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Botão de Download do Kit Completo */}
      {(step1Result || step2Result || generatedImages.length > 0) && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-950/50 dark:to-purple-950/50 dark:border-indigo-800">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Kit Completo de Marketing
                </h4>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  eBook PDF + Imagens + Textos organizados em ZIP
                </p>
              </div>
              <EbookDownloadButton
                product={{
                  nome: productName,
                  descricao: productDescription,
                  sku: `gerador_${Date.now()}`
                }}
                unifiedData={step1Result}
                copywritingText={step2Result}
                images={generatedImages.map(img => ({ 
                  url: img.imageUrl, 
                  type: img.sceneType 
                }))}
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {!step1Result && !step2Result && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Execute o fluxo para ver os resultados aqui</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
