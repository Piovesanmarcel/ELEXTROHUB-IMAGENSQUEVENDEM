import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GroupingResult {
  success: boolean;
  productsGrouped: number;
  groupsCreated: number;
  errors: string[];
  details: {
    parentsCreated: number;
    variationsLinked: number;
    inconsistenciesFixed: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Sem autorização');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`[AUTO-GROUP] Iniciando agrupamento automático para usuário ${user.id}`);

    const result: GroupingResult = {
      success: true,
      productsGrouped: 0,
      groupsCreated: 0,
      errors: [],
      details: {
        parentsCreated: 0,
        variationsLinked: 0,
        inconsistenciesFixed: 0,
      }
    };

    // FASE 1: Buscar todos os produtos 3Cliques do usuário
    const { data: produtos, error: fetchError } = await supabaseClient
      .from('produtos')
      .select('id, sku, nome, usuario_id, tipo_produto, sku_pai')
      .eq('usuario_id', user.id)
      .eq('marca', '3Cliques');

    if (fetchError) {
      console.error('[AUTO-GROUP] Erro ao buscar produtos:', fetchError);
      throw fetchError;
    }

    console.log(`[AUTO-GROUP] ${produtos?.length || 0} produtos 3Cliques encontrados`);

    if (!produtos || produtos.length === 0) {
      return new Response(
        JSON.stringify({ 
          ...result, 
          success: false, 
          errors: ['Nenhum produto da marca 3Cliques encontrado'] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FASE 2: Analisar padrões de nome
    const gruposPorNomeBase = new Map<string, { pai: any | null, variacoes: any[] }>();

    for (const produto of produtos) {
      // Verificar se tem atributos (Cor: ou Tamanho:)
      const temAtributos = /Cor:|Tamanho:/i.test(produto.nome);
      
      // Extrair nome base removendo atributos
      const nomeBase = produto.nome
        .replace(/\s+Cor:.*$/i, '')
        .replace(/\s+Tamanho:.*$/i, '')
        .trim();

      if (!gruposPorNomeBase.has(nomeBase)) {
        gruposPorNomeBase.set(nomeBase, { pai: null, variacoes: [] });
      }

      const grupo = gruposPorNomeBase.get(nomeBase)!;

      if (temAtributos) {
        // É uma variação
        grupo.variacoes.push(produto);
      } else {
        // É um possível pai
        if (!grupo.pai) {
          grupo.pai = produto;
        }
      }
    }

    console.log(`[AUTO-GROUP] ${gruposPorNomeBase.size} grupos identificados por nome base`);

    // FASE 3: Atualizar banco de dados
    let produtosAtualizados = 0;
    const updates: PromiseLike<any>[] = [];

    for (const [nomeBase, grupo] of gruposPorNomeBase.entries()) {
      if (grupo.variacoes.length === 0) {
        // Grupo sem variações - manter como simples
        continue;
      }

      result.groupsCreated++;

      // Definir SKU do pai
      let skuPai: string;
      
      if (grupo.pai) {
        // Usar produto existente sem atributos como pai
        skuPai = grupo.pai.sku;
        
        // Atualizar produto pai
        updates.push(
          supabaseClient
            .from('produtos')
            .update({
              sku_pai: grupo.pai.sku,
              tipo_produto: 'variavel',
              atualizado_em: new Date().toISOString()
            })
            .eq('sku', grupo.pai.sku)
            .eq('usuario_id', user.id)
            .then()
        );
        
        result.details.parentsCreated++;
        produtosAtualizados++;
      } else {
        // Não há produto sem atributos - usar o primeiro como pai
        const primeiraVariacao = grupo.variacoes[0];
        skuPai = primeiraVariacao.sku;
        
        // Marcar primeira variação como pai
        updates.push(
          supabaseClient
            .from('produtos')
            .update({
              sku_pai: primeiraVariacao.sku,
              tipo_produto: 'variavel',
              atualizado_em: new Date().toISOString()
            })
            .eq('sku', primeiraVariacao.sku)
            .eq('usuario_id', user.id)
            .then()
        );
        
        result.details.parentsCreated++;
        produtosAtualizados++;
      }

      // Atualizar todas as variações
      for (const variacao of grupo.variacoes) {
        if (variacao.sku === skuPai) continue; // Pular o próprio pai

        updates.push(
          supabaseClient
            .from('produtos')
            .update({
              sku_pai: skuPai,
              tipo_produto: 'variacao',
              atualizado_em: new Date().toISOString()
            })
            .eq('sku', variacao.sku)
            .eq('usuario_id', user.id)
            .then()
        );
        
        result.details.variationsLinked++;
        produtosAtualizados++;
      }

      console.log(`[AUTO-GROUP] Grupo "${nomeBase}": ${grupo.variacoes.length} variações → pai: ${skuPai}`);
    }

    // FASE 4: Executar todas as atualizações
    console.log(`[AUTO-GROUP] Executando ${updates.length} atualizações...`);
    
    const updateResults = await Promise.allSettled(updates);
    
    const failures = updateResults.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('[AUTO-GROUP] Algumas atualizações falharam:', failures);
      result.errors.push(`${failures.length} atualizações falharam`);
    }

    result.productsGrouped = produtosAtualizados;
    result.success = failures.length === 0;

    console.log(`[AUTO-GROUP] ✅ Fase 3 concluída: ${result.productsGrouped} produtos atualizados em ${result.groupsCreated} grupos`);

    // FASE 5: Agregar variações no campo JSONB dos produtos pai
    console.log('[AUTO-GROUP] Iniciando Fase 5: Agregação de variações...');
    
    const { data: variacoes, error: variacoesError } = await supabaseClient
      .from('produtos')
      .select('id, sku, nome, estoque, preco, imagem_url, imagem_url_2, imagem_url_3, imagem_url_4, imagem_url_5, sku_pai')
      .eq('usuario_id', user.id)
      .eq('marca', '3Cliques')
      .eq('tipo_produto', 'variacao')
      .not('sku_pai', 'is', null);

    if (variacoesError) {
      console.error('[AUTO-GROUP] Erro ao buscar variações:', variacoesError);
      result.errors.push('Erro ao buscar variações para agregação');
    } else if (variacoes && variacoes.length > 0) {
      // Agrupar variações por sku_pai
      const variacoesPorPai = new Map<string, any[]>();
      
      for (const variacao of variacoes) {
        if (!variacoesPorPai.has(variacao.sku_pai!)) {
          variacoesPorPai.set(variacao.sku_pai!, []);
        }
        
        // Extrair atributos do nome
        const corMatch = variacao.nome.match(/Cor:([^;]+)/i);
        const tamanhoMatch = variacao.nome.match(/Tamanho:([^;]+)/i);
        
        // Coletar imagens
        const imagens = [
          variacao.imagem_url,
          variacao.imagem_url_2,
          variacao.imagem_url_3,
          variacao.imagem_url_4,
          variacao.imagem_url_5
        ].filter(url => url != null);
        
        variacoesPorPai.get(variacao.sku_pai!)!.push({
          sku: variacao.sku,
          nome: variacao.nome,
          estoque: variacao.estoque || 0,
          preco: variacao.preco || 0,
          imagens: imagens,
          atributos: {
            cor: corMatch ? corMatch[1].trim() : null,
            tamanho: tamanhoMatch ? tamanhoMatch[1].trim() : null
          }
        });
      }
      
      // Atualizar produtos pai com variações agregadas
      const aggregationUpdates: PromiseLike<any>[] = [];
      
      for (const [skuPai, variacoesArray] of variacoesPorPai.entries()) {
        const estoqueTotal = variacoesArray.reduce((sum, v) => sum + (v.estoque || 0), 0);
        
        aggregationUpdates.push(
          supabaseClient
            .from('produtos')
            .update({
              variacoes: variacoesArray,
              estoque: estoqueTotal,
              atualizado_em: new Date().toISOString()
            })
            .eq('sku', skuPai)
            .eq('usuario_id', user.id)
            .then()
        );
      }
      
      console.log(`[AUTO-GROUP] Executando ${aggregationUpdates.length} atualizações de agregação...`);
      const aggregationResults = await Promise.allSettled(aggregationUpdates);
      
      const aggregationFailures = aggregationResults.filter(r => r.status === 'rejected');
      if (aggregationFailures.length > 0) {
        console.error('[AUTO-GROUP] Algumas agregações falharam:', aggregationFailures);
        result.errors.push(`${aggregationFailures.length} agregações falharam`);
      }
      
      console.log(`[AUTO-GROUP] ✅ Fase 5 concluída: ${variacoesPorPai.size} produtos pai agregados`);
    }

    console.log(`[AUTO-GROUP] ✅ Concluído: ${result.productsGrouped} produtos atualizados em ${result.groupsCreated} grupos`);

    // Registrar log de sincronização
    await supabaseClient
      .from('sync_logs')
      .insert({
        usuario_id: user.id,
        tipo: 'agrupamento_3cliques',
        status: result.success ? 'sucesso' : 'erro',
        detalhes: result
      });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const err = error as Error;
    console.error('[AUTO-GROUP] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message,
        productsGrouped: 0,
        groupsCreated: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
