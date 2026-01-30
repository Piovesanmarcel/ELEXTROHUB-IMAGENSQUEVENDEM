
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const EanGenerator = () => {
  const [quantity, setQuantity] = useState(1000);
  const [generatedEans, setGeneratedEans] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedEan, setCopiedEan] = useState<string | null>(null);

  // Função para calcular o dígito verificador do EAN-13
  const calculateCheckDigit = (ean12: string): string => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(ean12[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit.toString();
  };

  // Função para gerar um EAN-13 válido com prefixo brasileiro fixo 789
  const generateValidEan = (): string => {
    // Prefixo FIXO 789 para códigos brasileiros
    const prefix = "789";
    
    // Gerando 9 dígitos aleatórios para completar os 12 primeiros dígitos
    let randomDigits = "";
    for (let i = 0; i < 9; i++) {
      randomDigits += Math.floor(Math.random() * 10).toString();
    }
    
    const ean12 = prefix + randomDigits;
    const checkDigit = calculateCheckDigit(ean12);
    
    return ean12 + checkDigit;
  };

  // Função para gerar múltiplos EANs únicos
  const generateEans = () => {
    if (quantity < 1 || quantity > 50000) {
      toast.error("A quantidade deve estar entre 1 e 50.000");
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const newEans = new Set<string>();
      
      // Garantir que todos os EANs sejam únicos
      while (newEans.size < quantity) {
        const ean = generateValidEan();
        newEans.add(ean);
      }
      
      setGeneratedEans(Array.from(newEans));
      setIsGenerating(false);
      toast.success(`${quantity} EANs brasileiros válidos gerados com sucesso!`);
    }, 100);
  };

  // Função para exportar para Excel
  const exportToExcel = () => {
    if (generatedEans.length === 0) {
      toast.error("Nenhum EAN gerado para exportar");
      return;
    }

    const data = generatedEans.map((ean, index) => ({
      "Número": index + 1,
      "EAN-13": ean,
      "Prefixo": "789 (Brasil)",
      "Válido": "Sim"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EANs Brasil");
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 10 }, // Número
      { wch: 15 }, // EAN-13
      { wch: 15 }, // Prefixo
      { wch: 10 }  // Válido
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `eans-brasil-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Planilha exportada com sucesso!");
  };

  // Função para copiar EAN individual
  const copyEan = async (ean: string) => {
    try {
      await navigator.clipboard.writeText(ean);
      setCopiedEan(ean);
      toast.success("EAN copiado para a área de transferência!");
      
      setTimeout(() => {
        setCopiedEan(null);
      }, 2000);
    } catch (error) {
      toast.error("Erro ao copiar EAN");
    }
  };

  // Função para copiar todos os EANs
  const copyAllEans = async () => {
    if (generatedEans.length === 0) return;
    
    try {
      const allEans = generatedEans.join('\n');
      await navigator.clipboard.writeText(allEans);
      toast.success("Todos os EANs copiados para a área de transferência!");
    } catch (error) {
      toast.error("Erro ao copiar EANs");
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setQuantity(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Gerador de EANs Brasil
        </h1>
        <p className="text-gray-600">
          Gere códigos EAN-13 válidos com prefixo brasileiro fixo (789) para seus produtos nos marketplaces de forma rápida e gratuita.
        </p>
      </div>

      {/* Configurações de Geração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Configurações de Geração
          </CardTitle>
          <CardDescription>
            Configure quantos EANs você deseja gerar (máximo 50.000 por vez)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade de EANs</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="50000"
              value={quantity}
              onChange={handleQuantityChange}
              className="w-full"
              placeholder="Digite a quantidade desejada"
            />
            <p className="text-sm text-gray-500">
              Digite qualquer quantidade entre 1 e 50.000 EANs
            </p>
          </div>

          <Button 
            onClick={generateEans} 
            disabled={isGenerating || quantity < 1}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando EANs...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar {quantity} EANs Brasileiros (789)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados */}
      {generatedEans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>EANs Brasileiros Gerados (Prefixo 789)</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {generatedEans.length} códigos
              </Badge>
            </CardTitle>
            <CardDescription>
              Códigos EAN-13 válidos com prefixo brasileiro FIXO (789) prontos para uso nos marketplaces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ações em Lote */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={exportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Planilha Excel
              </Button>
              <Button onClick={copyAllEans} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Todos
              </Button>
            </div>

            {/* Lista de EANs */}
            <div className="max-h-96 overflow-y-auto border rounded-lg p-4 space-y-2">
              {generatedEans.map((ean, index) => (
                <div 
                  key={ean} 
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-12">
                      {(index + 1).toString().padStart(3, '0')}
                    </span>
                    <span className="font-mono text-sm font-medium">
                      {ean}
                    </span>
                    <span className="text-xs text-green-600 font-medium">
                      ✓ 789
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyEan(ean)}
                    className="h-8 w-8 p-0"
                  >
                    {copiedEan === ean ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre EANs */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre os EANs Brasileiros (789)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">✅ Características:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Códigos EAN-13 matematicamente válidos</li>
                <li>• Prefixo FIXO 789 (indicador de origem brasileira)</li>
                <li>• Dígito verificador calculado corretamente</li>
                <li>• Aceitos pelos principais marketplaces</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">🎯 Uso Recomendado:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Produtos sem código de barras oficial</li>
                <li>• Listagens em marketplaces brasileiros</li>
                <li>• Controle interno de estoque</li>
                <li>• Identificação única de produtos nacionais</li>
              </ul>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Garantia:</strong> Todos os códigos gerados começam obrigatoriamente com 789 (prefixo brasileiro) 
              e possuem dígito verificador matematicamente correto para uso em marketplaces.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EanGenerator;
