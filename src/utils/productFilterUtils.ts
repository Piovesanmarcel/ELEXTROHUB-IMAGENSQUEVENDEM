
import { supabase } from "@/integrations/supabase/client";

export interface ProductVariation {
  sku: string;
  bling_id: string;
  nome: string;
  estoque: number;
  preco: number;
  preco_custo: number;
  imagens: string[];
  atributos: Record<string, string>;
}

export interface Product {
  id: string;
  sku: string;
  nome: string;
  unidade?: string;
  preco?: number;
  situacao?: string;
  estoque?: number;
  preco_custo?: number;
  peso_bruto?: number;
  gtin?: string;
  largura?: number;
  altura?: number;
  profundidade?: number;
  descricao?: string;
  descricao_curta?: string;
  marca?: string;
  categoria?: string;
  bling_id?: string;
  codigo_fornecedor?: string;
  nome_fornecedor?: string;
  imagem_url?: string;
  imagem_url_2?: string;
  imagem_url_3?: string;
  imagem_url_4?: string;
  imagem_url_5?: string;
  imagem_url_6?: string;
  imagem_url_7?: string;
  imagem_url_8?: string;
  imagem_url_9?: string;
  imagem_url_10?: string;
  imagem_melhorada_1?: string;
  imagem_melhorada_2?: string;
  imagem_melhorada_3?: string;
  imagem_melhorada_4?: string;
  imagem_melhorada_5?: string;
  imagem_melhorada_6?: string;
  imagem_melhorada_7?: string;
  imagem_melhorada_8?: string;
  imagem_melhorada_9?: string;
  imagem_melhorada_10?: string;
  usuario_id?: string | null;
  atualizado_em?: string | null;
  ready_for_ads?: boolean | null;
  // Campos de variações
  sku_pai?: string | null;
  tipo_produto?: 'simples' | 'variavel' | 'variacao' | null;
  variacoes?: ProductVariation[] | null;
}

export const fetchAIResults = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: aiResults, error: aiError } = await supabase
    .from('ai_unified_results')
    .select('product_id, results')
    .eq('user_id', user.id);

  if (aiError) {
    console.warn("⚠️ Erro ao buscar resultados AI:", aiError);
  }

  // Criar mapa de resultados AI por product_id
  const aiResultsMap = new Map();
  if (aiResults) {
    aiResults.forEach(result => {
      aiResultsMap.set(result.product_id, result.results);
    });
  }

  return { aiResultsMap, resultsCount: aiResults?.length || 0 };
};

export const filterEligibleProducts = (products: Product[], aiResultsMap: Map<string, any>) => {
  console.log("🔍 Filtrando produtos com critérios específicos...");
  
  const eligibleProducts = products.filter(product => {
    // Verificar se tem pelo menos uma imagem melhorada
    const hasEnhancedImages = [
      product.imagem_melhorada_1,
      product.imagem_melhorada_2,
      product.imagem_melhorada_3,
      product.imagem_melhorada_4,
      product.imagem_melhorada_5,
      product.imagem_melhorada_6,
      product.imagem_melhorada_7,
      product.imagem_melhorada_8,
      product.imagem_melhorada_9,
      product.imagem_melhorada_10,
    ].some(url => url && url.trim());

    // Verificar se tem resultados de comando unificado
    const hasUnifiedResults = aiResultsMap.has(product.id);

    const isEligible = hasEnhancedImages && hasUnifiedResults;
    
    if (!isEligible) {
      console.log(`❌ Produto ${product.sku} excluído: imagens=${hasEnhancedImages}, comandoUnificado=${hasUnifiedResults}`);
    } else {
      console.log(`✅ Produto ${product.sku} incluído: tem imagens melhoradas e comando unificado`);
    }

    return isEligible;
  });

  console.log(`📊 Produtos elegíveis após filtro: ${eligibleProducts.length} de ${products.length}`);
  return eligibleProducts;
};
