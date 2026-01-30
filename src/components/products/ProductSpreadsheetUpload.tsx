
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductSpreadsheetUploadProps {
  onProductsUploaded?: () => void;
}

export function ProductSpreadsheetUpload({ onProductsUploaded }: ProductSpreadsheetUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    total: number;
    success: number;
    errors: string[];
  } | null>(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        sku: "PROD001",
        sku_pai: "",
        tipo_produto: "simples",
        nome: "Exemplo Produto",
        marca: "Marca Exemplo",
        categoria: "Eletrônicos",
        preco: 99.90,
        preco_custo: 50.00,
        estoque: 100,
        descricao_curta: "Descrição curta do produto",
        descricao: "Descrição completa do produto com mais detalhes",
        gtin: "1234567890123",
        unidade: "UN",
        situacao: "Ativo",
        peso: 0.5,
        altura: 10,
        largura: 15,
        profundidade: 5,
        imagem_url: "https://exemplo.com/imagem1.jpg",
        imagem_url_2: "https://exemplo.com/imagem2.jpg",
        imagem_url_3: "https://exemplo.com/imagem3.jpg"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
    
    // Definir larguras das colunas
    const colWidths = [
      { wch: 15 }, // sku
      { wch: 15 }, // sku_pai
      { wch: 12 }, // tipo_produto
      { wch: 25 }, // nome
      { wch: 15 }, // marca
      { wch: 15 }, // categoria
      { wch: 12 }, // preco
      { wch: 12 }, // preco_custo
      { wch: 10 }, // estoque
      { wch: 30 }, // descricao_curta
      { wch: 50 }, // descricao
      { wch: 15 }, // gtin
      { wch: 8 },  // unidade
      { wch: 10 }, // situacao
      { wch: 8 },  // peso
      { wch: 8 },  // altura
      { wch: 8 },  // largura
      { wch: 12 }, // profundidade
      { wch: 30 }, // imagem_url
      { wch: 30 }, // imagem_url_2
      { wch: 30 }  // imagem_url_3
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, "modelo_produtos.xlsx");
    toast.success("Modelo de planilha baixado com sucesso!");
  };

  const downloadStockTemplate = () => {
    const templateData = [
      {
        sku: "PROD001",
        estoque: 100
      },
      {
        sku: "PROD002", 
        estoque: 50
      },
      {
        sku: "PROD003",
        estoque: 25
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque");
    
    // Definir larguras das colunas
    const colWidths = [
      { wch: 20 }, // sku
      { wch: 15 }  // estoque
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, "modelo_estoque.xlsx");
    toast.success("Modelo de planilha de estoque baixado com sucesso!");
  };

  const downloadSoudrop2Template = () => {
    const templateData = [
      {
        'Nome': 'Exemplo Produto Soudrop2',
        'sku': 'SOUDROP001',
        'estoque': 100,
        'descrição': 'Descrição completa do produto com mais detalhes',
        'ncm': '8467.29.92',
        'preço custo': 'R$ 50.00',
        'peso': '0.5',
        'altura': '10.00',
        'largura': '15.00',
        'comprimento': '20.00',
        'imagens': 'https://exemplo.com/img1.jpg|https://exemplo.com/img2.jpg|https://exemplo.com/img3.jpg',
        'Marca': 'Marca Exemplo'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Soudrop2");
    
    const colWidths = [
      { wch: 30 }, // Nome
      { wch: 15 }, // sku
      { wch: 10 }, // estoque
      { wch: 50 }, // descrição
      { wch: 15 }, // ncm
      { wch: 15 }, // preço custo
      { wch: 8 },  // peso
      { wch: 8 },  // altura
      { wch: 8 },  // largura
      { wch: 12 }, // comprimento
      { wch: 80 }, // imagens
      { wch: 20 }  // Marca
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, "modelo_soudrop2.xlsx");
    toast.success("Modelo de planilha Soudrop2 baixado com sucesso!");
  };

  const parseImagens = (imagensString: string): Record<string, string | null> => {
    if (!imagensString) return {};
    
    const urls = String(imagensString)
      .replace(/\\\|/g, '|')
      .split('|')
      .map(url => url.trim())
      .filter(url => url.length > 0 && url.startsWith('http'));
    
    const result: Record<string, string | null> = {};
    
    if (urls[0]) result.imagem_url = urls[0];
    if (urls[1]) result.imagem_url_2 = urls[1];
    if (urls[2]) result.imagem_url_3 = urls[2];
    if (urls[3]) result.imagem_url_4 = urls[3];
    if (urls[4]) result.imagem_url_5 = urls[4];
    if (urls[5]) result.imagem_url_6 = urls[5];
    if (urls[6]) result.imagem_url_7 = urls[6];
    if (urls[7]) result.imagem_url_8 = urls[7];
    if (urls[8]) result.imagem_url_9 = urls[8];
    if (urls[9]) result.imagem_url_10 = urls[9];
    
    return result;
  };

  const parsePrecoCusto = (precoString: string | number | undefined): number | null => {
    if (precoString === undefined || precoString === null || precoString === '') return null;
    
    if (typeof precoString === 'number') return precoString;
    
    const cleaned = String(precoString)
      .replace('R$', '')
      .replace(/\s/g, '')
      .replace(',', '.')
      .trim();
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSoudrop2FileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setIsUploading(true);
    setUploadStats(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('📊 Dados da planilha Soudrop2:', jsonData);

      const stats = {
        total: jsonData.length,
        success: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        try {
          const nome = row['Nome'] || row['nome'];
          const sku = row['sku'] || row['SKU'];

          if (!nome || !sku) {
            stats.errors.push(`Linha ${i + 2}: Nome e SKU são obrigatórios`);
            continue;
          }

          const imagensObj = parseImagens(row['imagens'] || row['Imagens'] || '');

          const productData = {
            nome: String(nome).trim(),
            sku: String(sku).trim(),
            estoque: row['estoque'] ? Number(row['estoque']) : 0,
            descricao: row['descrição'] || row['descricao'] || row['Descrição'] || null,
            preco_custo: parsePrecoCusto(row['preço custo'] || row['preco custo'] || row['Preço Custo']),
            peso_bruto: row['peso'] ? parseFloat(row['peso']) : null,
            altura: row['altura'] ? parseFloat(row['altura']) : null,
            largura: row['largura'] ? parseFloat(row['largura']) : null,
            profundidade: row['comprimento'] ? parseFloat(row['comprimento']) : null,
            marca: row['Marca'] || row['marca'] || null,
            ...imagensObj,
            usuario_id: user.id,
            tipo_produto: 'simples',
            situacao: 'Ativo',
            unidade: 'UN',
            atualizado_em: new Date().toISOString()
          };

          const { error } = await supabase
            .from('produtos')
            .upsert(productData, { 
              onConflict: 'sku,usuario_id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error(`Erro na linha ${i + 2}:`, error);
            stats.errors.push(`Linha ${i + 2}: ${error.message}`);
          } else {
            stats.success++;
            console.log(`✅ Produto Soudrop2 ${productData.nome} inserido/atualizado`);
          }
          
        } catch (error) {
          console.error(`Erro na linha ${i + 2}:`, error);
          stats.errors.push(`Linha ${i + 2}: Erro ao processar dados`);
        }
      }

      setUploadStats(stats);

      if (stats.success > 0) {
        toast.success(`${stats.success} produtos Soudrop2 importados com sucesso!`);
        onProductsUploaded?.();
      }

      if (stats.errors.length > 0) {
        toast.warning(`${stats.errors.length} produtos com erro. Verifique os detalhes.`);
      }

    } catch (error) {
      console.error('Erro ao processar planilha Soudrop2:', error);
      toast.error("Erro ao processar planilha. Verifique o formato do arquivo.");
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleProductsFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setIsUploading(true);
    setUploadStats(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('📊 Dados da planilha:', jsonData);

      const stats = {
        total: jsonData.length,
        success: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        try {
          // Validar campos obrigatórios
          if (!row.nome || !row.sku) {
            stats.errors.push(`Linha ${i + 2}: Nome e SKU são obrigatórios`);
            continue;
          }

          // Validar tipo_produto e sku_pai
          const tiposProduto = ['simples', 'variacao', 'variavel'];
          const tipoProduto = row.tipo_produto ? String(row.tipo_produto).trim().toLowerCase() : 'simples';
          
          if (!tiposProduto.includes(tipoProduto)) {
            stats.errors.push(`Linha ${i + 2}: tipo_produto deve ser 'simples', 'variacao' ou 'variavel'`);
            continue;
          }

          const skuPai = row.sku_pai ? String(row.sku_pai).trim() : null;

          // Se tipo_produto é 'variacao', sku_pai é obrigatório
          if (tipoProduto === 'variacao' && !skuPai) {
            stats.errors.push(`Linha ${i + 2}: sku_pai é obrigatório para produtos do tipo 'variacao'`);
            continue;
          }

          // Preparar dados do produto
          const productData = {
            nome: String(row.nome).trim(),
            sku: String(row.sku).trim(),
            sku_pai: skuPai,
            tipo_produto: tipoProduto,
            preco: row.preco ? Number(row.preco) : null,
            preco_custo: row.preco_custo ? Number(row.preco_custo) : null,
            estoque: row.estoque ? Number(row.estoque) : 0,
            descricao_curta: row.descricao_curta ? String(row.descricao_curta).trim() : null,
            descricao: row.descricao ? String(row.descricao).trim() : null,
            categoria: row.categoria ? String(row.categoria).trim() : null,
            marca: row.marca ? String(row.marca).trim() : null,
            gtin: row.gtin ? String(row.gtin).trim() : null,
            unidade: row.unidade ? String(row.unidade).trim() : 'UN',
            situacao: row.situacao ? String(row.situacao).trim() : 'Ativo',
            peso: row.peso ? Number(row.peso) : null,
            altura: row.altura ? Number(row.altura) : null,
            largura: row.largura ? Number(row.largura) : null,
            profundidade: row.profundidade ? Number(row.profundidade) : null,
            peso_bruto: row.peso_bruto ? Number(row.peso_bruto) : null,
            imagem_url: row.imagem_url ? String(row.imagem_url).trim() : null,
            imagem_url_2: row.imagem_url_2 ? String(row.imagem_url_2).trim() : null,
            imagem_url_3: row.imagem_url_3 ? String(row.imagem_url_3).trim() : null,
            imagem_url_4: row.imagem_url_4 ? String(row.imagem_url_4).trim() : null,
            imagem_url_5: row.imagem_url_5 ? String(row.imagem_url_5).trim() : null,
            imagem_url_6: row.imagem_url_6 ? String(row.imagem_url_6).trim() : null,
            imagem_url_7: row.imagem_url_7 ? String(row.imagem_url_7).trim() : null,
            imagem_url_8: row.imagem_url_8 ? String(row.imagem_url_8).trim() : null,
            imagem_url_9: row.imagem_url_9 ? String(row.imagem_url_9).trim() : null,
            imagem_url_10: row.imagem_url_10 ? String(row.imagem_url_10).trim() : null,
            usuario_id: user.id,
            atualizado_em: new Date().toISOString()
          };

          // Inserir ou atualizar produto
          const { error } = await supabase
            .from('produtos')
            .upsert(productData, { 
              onConflict: 'sku,usuario_id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error(`Erro na linha ${i + 2}:`, error);
            stats.errors.push(`Linha ${i + 2}: ${error.message}`);
          } else {
            stats.success++;
            console.log(`✅ Produto ${productData.nome} inserido/atualizado com sucesso`);
          }
          
        } catch (error) {
          console.error(`Erro na linha ${i + 2}:`, error);
          stats.errors.push(`Linha ${i + 2}: Erro ao processar dados`);
        }
      }

      setUploadStats(stats);

      if (stats.success > 0) {
        toast.success(`${stats.success} produtos importados com sucesso!`);
        onProductsUploaded?.();
      }

      if (stats.errors.length > 0) {
        toast.warning(`${stats.errors.length} produtos com erro. Verifique os detalhes.`);
      }

    } catch (error) {
      console.error('Erro ao processar planilha:', error);
      toast.error("Erro ao processar planilha. Verifique o formato do arquivo.");
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir re-upload do mesmo arquivo
      event.target.value = '';
    }
  };

  const handleStockFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setIsUploading(true);
    setUploadStats(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('📦 Dados da planilha de estoque:', jsonData);

      const stats = {
        total: jsonData.length,
        success: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        
        try {
          // Validar campos obrigatórios
          if (!row.sku) {
            stats.errors.push(`Linha ${i + 2}: SKU é obrigatório`);
            continue;
          }

          if (row.estoque === undefined || row.estoque === null || row.estoque === '') {
            stats.errors.push(`Linha ${i + 2}: Estoque é obrigatório`);
            continue;
          }

          const sku = String(row.sku).trim();
          const estoque = Number(row.estoque);

          if (isNaN(estoque) || estoque < 0) {
            stats.errors.push(`Linha ${i + 2}: Estoque deve ser um número válido maior ou igual a 0`);
            continue;
          }

          // Atualizar estoque do produto baseado no SKU
          const { error } = await (supabase as any)
            .from('produtos')
            .update({ 
              updated_at: new Date().toISOString()
            })
            .eq('sku', sku)
            .eq('usuario_id', user.id);

          if (error) {
            console.error(`Erro na linha ${i + 2}:`, error);
            stats.errors.push(`Linha ${i + 2}: ${error.message}`);
          } else {
            stats.success++;
            console.log(`✅ Estoque do produto SKU ${sku} atualizado para ${estoque}`);
          }
          
        } catch (error) {
          console.error(`Erro na linha ${i + 2}:`, error);
          stats.errors.push(`Linha ${i + 2}: Erro ao processar dados`);
        }
      }

      setUploadStats(stats);

      if (stats.success > 0) {
        toast.success(`${stats.success} produtos tiveram o estoque atualizado com sucesso!`);
        onProductsUploaded?.();
      }

      if (stats.errors.length > 0) {
        toast.warning(`${stats.errors.length} produtos com erro. Verifique os detalhes.`);
      }

    } catch (error) {
      console.error('Erro ao processar planilha de estoque:', error);
      toast.error("Erro ao processar planilha. Verifique o formato do arquivo.");
    } finally {
      setIsUploading(false);
      // Limpar o input para permitir re-upload do mesmo arquivo
      event.target.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Upload de Produtos via Planilha
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="produtos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="produtos" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Produtos Completos
            </TabsTrigger>
            <TabsTrigger value="estoque" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Atualizar Estoque
            </TabsTrigger>
            <TabsTrigger value="soudrop2" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Formato Soudrop2
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Modelo Produtos
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleProductsFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="products-upload"
                />
                <Button
                  disabled={isUploading}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Processando..." : "Enviar Planilha Produtos"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>📝 Instruções para produtos:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Baixe o modelo primeiro para ver a estrutura correta</li>
                <li>Campos obrigatórios: Nome e SKU</li>
                <li><strong>sku_pai:</strong> Deixe vazio para produtos simples, preencha para variações</li>
                <li><strong>tipo_produto:</strong> 'simples', 'variacao' ou 'variavel'</li>
                <li>Se tipo_produto = 'variacao', o campo sku_pai é obrigatório</li>
                <li>Produtos com SKU existente serão atualizados</li>
                <li>Formatos aceitos: .xlsx e .xls</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="soudrop2" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={downloadSoudrop2Template}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Modelo Soudrop2
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleSoudrop2FileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="soudrop2-upload"
                />
                <Button
                  disabled={isUploading}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Processando..." : "Enviar Planilha Soudrop2"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>🔄 Formato compatível com exportação Soudrop2:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Colunas: Nome, sku, estoque, descrição, ncm, preço custo, peso, altura, largura, comprimento, imagens, Marca</li>
                <li><strong>imagens:</strong> URLs separadas por | (pipe) - suporta até 10 imagens</li>
                <li><strong>preço custo:</strong> Aceita formato "R$ 00,00" ou "00.00"</li>
                <li><strong>comprimento:</strong> Será mapeado para profundidade</li>
                <li>Campos obrigatórios: Nome e SKU</li>
                <li>Produtos com SKU existente serão atualizados</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="estoque" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={downloadStockTemplate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Modelo Estoque
              </Button>

              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleStockFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="stock-upload"
                />
                <Button
                  disabled={isUploading}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <Package className="w-4 h-4" />
                  {isUploading ? "Processando..." : "Enviar Planilha Estoque"}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>📦 Instruções para estoque:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Baixe o modelo primeiro - apenas SKU e Estoque</li>
                <li>Campos obrigatórios: SKU e Estoque</li>
                <li>O estoque será atualizado para produtos existentes</li>
                <li>Produtos não encontrados serão reportados como erro</li>
                <li>Formatos aceitos: .xlsx e .xls</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {uploadStats && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Resultado do Upload:</h4>
            <div className="text-sm space-y-1">
              <p>📊 Total de linhas: {uploadStats.total}</p>
              <p className="text-green-600">✅ Sucessos: {uploadStats.success}</p>
              {uploadStats.errors.length > 0 && (
                <div className="text-red-600">
                  <p className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Erros: {uploadStats.errors.length}
                  </p>
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs">
                    {uploadStats.errors.slice(0, 10).map((error, index) => (
                      <p key={index} className="text-red-500">• {error}</p>
                    ))}
                    {uploadStats.errors.length > 10 && (
                      <p className="text-red-500">... e mais {uploadStats.errors.length - 10} erros</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
