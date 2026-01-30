import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { templates } = await req.json();

    if (!Array.isArray(templates)) {
      throw new Error('templates deve ser um array');
    }

    console.log(`Iniciando importação de ${templates.length} templates`);

    let imported = 0;
    let errors: string[] = [];
    const batchSize = 50;

    // Processar em lotes
    for (let i = 0; i < templates.length; i += batchSize) {
      const batch = templates.slice(i, i + batchSize);
      
      const mappedBatch = batch.map((t: any, idx: number) => ({
        template_key: t.template_key || `template_${Date.now()}_${i + idx}`,
        name: t.name || 'Template sem nome',
        category: t.category || 'Geral 01',
        base_image_url: t.base_image_url || t.baseImage || '',
        dimensions: t.dimensions || { width: 1080, height: 1080 },
        zones: t.zones || [],
        color_scheme: t.color_scheme || t.colorScheme || null,
        detected_fonts: t.detected_fonts || null,
        disable_global_logo: t.disable_global_logo ?? t.disableGlobalLogo ?? false,
        display_order: t.display_order ?? t.displayOrder ?? 0,
        is_system: true,
        user_id: null
      }));

      const { error } = await supabase
        .from('marketing_templates')
        .insert(mappedBatch);

      if (error) {
        console.error(`Erro no lote ${i}-${i + batchSize}:`, error.message);
        errors.push(`Lote ${i}-${i + batchSize}: ${error.message}`);
      } else {
        imported += batch.length;
        console.log(`Lote ${i}-${i + batchSize} importado com sucesso`);
      }
    }

    console.log(`Importação concluída: ${imported} templates`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported, 
        total: templates.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na importação:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
