import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANALYSIS_PROMPT = `Analise este template de marketing e identifique PIXEL-PERFECT todas as zonas visuais.

REGRAS DE CLASSIFICAÇÃO:

1. PRODUTOS (objetos vendáveis, produtos físicos centralizados):
   - type: "image"
   - dataSource: "aiImages[0]" (produto principal) ou "aiImages[1]" (variação/segundo produto)
   - objectFit: "contain"
   - zIndex: 10-15
   - classification: "product"

2. BACKGROUNDS/CENÁRIOS (ondas, paisagens, texturas, fundos decorativos, padrões):
   - type: "image"
   - dataSource: "aiImages[2]" (background principal) ou "aiImages[3]" (background secundário)
   - objectFit: "cover"
   - zIndex: 1-5
   - classification: "background"

3. TEXTOS (títulos, descrições, badges, labels):
   - type: "text" ou "badge"
   - dataSource: "product.name", "unified.topicos_conversao.benefits[0]", ou "static:Texto Fixo"
   - Extrair: fontSize, fontFamily, fontWeight, color, backgroundColor, textAlign, padding, borderRadius
   - zIndex: 15-25
   - classification: "text"

IMPORTANTE:
- Meça posições em pixels (x, y do canto superior esquerdo)
- Meça dimensões exatas (width, height)
- Identifique cores em formato hexadecimal
- Detecte fontes usadas (Montserrat, Inter, Roboto, etc)
- Para textos com múltiplas cores em linhas diferentes, use splitLines: true, line1Color e line2Color

Retorne APENAS um objeto JSON válido com esta estrutura:
{
  "templateName": "Nome descritivo do template",
  "dimensions": { "width": 1200, "height": 1200 },
  "detectedFonts": ["Montserrat", "Inter"],
  "colorScheme": {
    "primary": "#FF0000",
    "secondary": "#00FF00",
    "accent": "#0000FF",
    "background": "#FFFFFF"
  },
  "zones": [
    {
      "id": "product-main",
      "type": "image",
      "position": { "x": 300, "y": 150, "width": 600, "height": 800 },
      "zIndex": 10,
      "dataSource": "aiImages[0]",
      "classification": "product",
      "style": {
        "objectFit": "contain",
        "borderRadius": "0px"
      }
    },
    {
      "id": "background-waves",
      "type": "image",
      "position": { "x": 0, "y": 800, "width": 1200, "height": 400 },
      "zIndex": 2,
      "dataSource": "aiImages[2]",
      "classification": "background",
      "style": {
        "objectFit": "cover",
        "backgroundColor": "#87CEEB"
      }
    },
    {
      "id": "title",
      "type": "text",
      "position": { "x": 100, "y": 50, "width": 1000, "height": 100 },
      "zIndex": 20,
      "dataSource": "product.name",
      "classification": "text",
      "style": {
        "fontSize": "72px",
        "fontFamily": "Montserrat, sans-serif",
        "fontWeight": "700",
        "color": "#000000",
        "backgroundColor": "transparent",
        "textAlign": "center",
        "padding": 0,
        "borderRadius": "0px"
      }
    }
  ]
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, templateKey, templateName, category = 'Geral 01' } = await req.json();
    
    if (!imageBase64 || !templateKey || !templateName) {
      throw new Error('Missing required fields: imageBase64, templateKey, templateName');
    }

    console.log(`[analyze-template] Starting analysis for template: ${templateKey} (${category})`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Upload image to Supabase Storage
    console.log('[analyze-template] Uploading image to Supabase Storage...');
    const imageBuffer = Uint8Array.from(
      atob(imageBase64.replace(/^data:image\/\w+;base64,/, '')),
      c => c.charCodeAt(0)
    );
    
    const fileName = `${templateKey}-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('marketing-templates')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error('[analyze-template] Storage upload failed:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('marketing-templates')
      .getPublicUrl(fileName);

    console.log('[analyze-template] Image uploaded to:', publicUrl);

    // Step 2: Analyze with Gemini 2.5 Flash Image
    console.log('[analyze-template] Analyzing image with Gemini...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: ANALYSIS_PROMPT
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 8000, // Aumentado para suportar templates complexos sem truncamento
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[analyze-template] AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content;
    
    if (!analysisText) {
      throw new Error('No analysis returned from AI');
    }

    console.log('[analyze-template] Raw AI response length:', analysisText.length);
    console.log('[analyze-template] Raw AI response:', analysisText);

    // Extract JSON from response (handle markdown code blocks)
    let analysisJson;
    let parsedJsonText = '';
    try {
      let jsonText = analysisText.trim();
      
      console.log('[analyze-template] First 200 chars:', jsonText.substring(0, 200));
      
      // Remove markdown code blocks com múltiplas estratégias
      if (jsonText.startsWith('```')) {
        // Estratégia 1: Regex padrão com ambos backticks
        const matches = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        
        if (matches && matches[1]) {
          jsonText = matches[1].trim();
          console.log('[analyze-template] Removed markdown blocks via regex');
        } else {
          // Estratégia 2: Remove apenas abertura se não houver fechamento (truncado)
          jsonText = jsonText.replace(/^```(?:json)?\s*/i, '');
          jsonText = jsonText.replace(/\s*```\s*$/i, '');
          console.log('[analyze-template] Removed partial markdown blocks (fallback)');
        }
      }
      
      console.log('[analyze-template] Cleaned JSON length:', jsonText.length);
      parsedJsonText = jsonText;
      
      analysisJson = JSON.parse(jsonText);
      console.log('[analyze-template] Successfully parsed analysis JSON');
      console.log('[analyze-template] Zones detected:', analysisJson.zones?.length || 0);
      
    } catch (parseError) {
      const err = parseError as Error;
      console.error('[analyze-template] Failed to parse AI response:', parseError);
      console.error('[analyze-template] Attempted to parse (first 1000 chars):', parsedJsonText.substring(0, 1000));
      console.error('[analyze-template] Last 500 chars:', parsedJsonText.substring(Math.max(0, parsedJsonText.length - 500)));
      
      throw new Error(`Failed to parse AI analysis response: ${err.message}`);
    }

    // Validar estrutura básica
    if (!analysisJson.templateName || !analysisJson.dimensions || !analysisJson.zones) {
      throw new Error('Invalid analysis structure: missing required fields (templateName, dimensions, or zones)');
    }

    if (!Array.isArray(analysisJson.zones)) {
      throw new Error('Invalid analysis structure: zones must be an array');
    }

    console.log(`[analyze-template] Validated: ${analysisJson.zones.length} zones, template "${analysisJson.templateName}"`);

    // Step 3: Save to Supabase
    console.log('[analyze-template] Saving to database...');

    const { data: existingTemplate } = await supabaseClient
      .from('marketing_templates')
      .select('id')
      .eq('template_key', templateKey)
      .single();

    let result;
    if (existingTemplate) {
      // Update existing
      const { data, error } = await supabaseClient
        .from('marketing_templates')
        .update({
          name: templateName,
          category: category,
          base_image_url: publicUrl,
          dimensions: analysisJson.dimensions,
          zones: analysisJson.zones,
          color_scheme: analysisJson.colorScheme || null,
          detected_fonts: analysisJson.detectedFonts || [],
        })
        .eq('template_key', templateKey)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('[analyze-template] Template updated:', templateKey);
    } else {
      // Insert new
      const { data, error } = await supabaseClient
        .from('marketing_templates')
        .insert({
          template_key: templateKey,
          name: templateName,
          category: category,
          base_image_url: publicUrl,
          dimensions: analysisJson.dimensions,
          zones: analysisJson.zones,
          color_scheme: analysisJson.colorScheme || null,
          detected_fonts: analysisJson.detectedFonts || [],
          is_system: true,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log('[analyze-template] Template created:', templateKey);
    }

    return new Response(
      JSON.stringify({
        success: true,
        template: result,
        analysis: analysisJson,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[analyze-template] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
