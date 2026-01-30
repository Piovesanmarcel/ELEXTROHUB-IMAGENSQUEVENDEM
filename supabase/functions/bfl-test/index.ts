import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.203.0/encoding/base64.ts";

const YOUR_BFL_API_KEY = Deno.env.get('BFL_API_KEY');

serve(async (req) => {
  console.log("🔥 BFL FUNCTION CALLED", {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });

  if (req.method === "OPTIONS") {
    console.log("✅ CORS preflight handled");
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey, x-content-type-options, x-frame-options",
      },
    });
  }

  try {
    console.log("📋 Parsing request body...");
    const body = await req.json();
    console.log("📋 Request body received:", JSON.stringify(body, null, 2));

    console.log("🔑 API Key Status:", YOUR_BFL_API_KEY ? "FOUND" : "MISSING");
    console.log("🔑 API Key first 10 chars:", YOUR_BFL_API_KEY ? YOUR_BFL_API_KEY.substring(0, 10) + "..." : "N/A");
    
    if (!YOUR_BFL_API_KEY) {
      console.error("❌ BFL_API_KEY não configurada no ambiente");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "BFL_API_KEY não configurada no ambiente",
        message: "Chave da API BFL não foi encontrada" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
    
    console.log("🔑 API Key found, starting generation...");

    const {
      prompt = "Uma paisagem futurista com cores vibrantes",
      width = 1024,
      height = 1024,
      steps = 28,
      guidance = 7,
      model = "flux-pro-1.1",
      operation = "text-to-image",
      input_image,
      input_image_url,
      mask,
      strength = 0.8,
      seed,
      safety_tolerance = 2
    } = body;

    console.log("🎯 OPERATION DETECTED:", operation);
    const hasInputImage = !!(input_image || input_image_url);
    console.log("🖼️ HAS INPUT IMAGE:", hasInputImage);
    console.log("🖼️ INPUT IMAGE (base64):", !!input_image);
    console.log("🖼️ INPUT IMAGE URL:", !!input_image_url);
    
    if (input_image) {
      console.log("🖼️ Input image length:", input_image.length);
      console.log("🖼️ Input image preview:", input_image.substring(0, 100) + "...");
    }
    
    if (input_image_url) {
      console.log("🔗 Input image URL:", input_image_url);
    }

    let endpoint;
    
    // Use specific endpoint for flux-kontext-pro
    if (model === "flux-kontext-pro") {
      endpoint = "https://api.bfl.ml/v1/flux-kontext-pro";
      console.log("🌐 Using specific endpoint for FLUX-KONTEXT-PRO");
    } else {
      endpoint = `https://api.bfl.ml/v1/${model}`;
      console.log("🌐 Using standard endpoint for model:", model);
    }
    
    console.log("🌐 Final endpoint:", endpoint);

    const payload: any = { prompt, width, height, steps, guidance, safety_tolerance };
    
    // Add image-to-image specific parameters for FLUX-KONTEXT-PRO
    if (operation === "image-to-image" && hasInputImage) {
      console.log("🎨 Setting up IMAGE-TO-IMAGE parameters for FLUX-KONTEXT-PRO");
      
      if (input_image) {
        // Handle base64 image (SAME for upload and selection)
        let cleanBase64 = input_image;
        if (input_image.startsWith('data:image/')) {
          cleanBase64 = input_image.split(',')[1];
          console.log("🧹 Removed data URL prefix");
        }
        payload.input_image = cleanBase64;
        console.log("📏 Clean base64 length:", cleanBase64.length);
      }
      
      // Remove width, height, steps, guidance for Kontext Pro
      delete payload.width;
      delete payload.height; 
      delete payload.steps;
      delete payload.guidance;
      console.log("📐 Using automatic dimensions for Kontext Pro");
    }
    
    if ((operation === "inpainting" || operation === "outpainting") && input_image) {
      // Remove data URL prefix for consistency
      let cleanBase64 = input_image;
      if (input_image.startsWith('data:image/')) {
        cleanBase64 = input_image.split(',')[1];
      }
      payload.image = cleanBase64;
      if (mask) payload.mask = mask;
    }
    if (seed) payload.seed = seed;

    console.log("🌐 Calling BFL:", endpoint);
    console.log("📤 Payload:", JSON.stringify(payload, null, 2));

    const initResp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${YOUR_BFL_API_KEY}`,
        "X-Key": YOUR_BFL_API_KEY,
      },
      body: JSON.stringify(payload),
    });

     console.log("📥 BFL Response Status:", initResp.status);
     console.log("📥 BFL Response Headers:", Object.fromEntries(initResp.headers.entries()));
     
     if (!initResp.ok) {
       const errorText = await initResp.text();
       console.error("❌ BFL API Error Response:", errorText);
       return new Response(JSON.stringify({ 
         success: false, 
         error: `BFL API Error (${initResp.status})`,
         message: `Erro da API BFL: ${initResp.status} - ${errorText}`,
         details: { status: initResp.status, response: errorText }
       }), {
         status: 500,
         headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
       });
     }
     
     const initData = await initResp.json();
     console.log("📥 BFL Response:", JSON.stringify(initData, null, 2));
    if (!initData.id || !initData.polling_url) {
      console.error("❌ Invalid BFL response:", initData);
      return new Response(JSON.stringify({ success: false, message: "Falha ao iniciar geração", details: initData }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log("✅ BFL task started:", initData.id);
    console.log("⏳ Starting polling process...");

    const pollingUrl = initData.polling_url;
    const maxAttempts = 60;
    let attempt = 0;
    let finalResult = null;

    while (attempt < maxAttempts) {
      console.log(`⏳ Polling attempt ${attempt + 1}/${maxAttempts}...`);
      await new Promise(r => setTimeout(r, 5000));
      const pollResp = await fetch(pollingUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${YOUR_BFL_API_KEY}`,
          "X-Key": YOUR_BFL_API_KEY,
        },
      });
      
      console.log(`📊 Poll ${attempt + 1} response status:`, pollResp.status);
      
      if (!pollResp.ok) {
        const errorText = await pollResp.text();
        console.error(`❌ Polling error (attempt ${attempt + 1}):`, errorText);
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Polling Error (${pollResp.status})`,
          message: `Erro no polling: ${pollResp.status} - ${errorText}`,
          details: { attempt: attempt + 1, status: pollResp.status, response: errorText }
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      
      const pollData = await pollResp.json();
      console.log(`📊 Poll ${attempt + 1} response:`, JSON.stringify(pollData, null, 2));

      if (pollData.status === "Ready" && pollData.result?.sample) {
        console.log("🎉 Image generation completed!");
        finalResult = pollData.result.sample;
        
        // Download image and convert to base64 to avoid CORS issues
        console.log("📥 Downloading image to convert to base64...");
        try {
          const imageResponse = await fetch(finalResult);
          if (imageResponse.ok) {
            const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
            console.log("📋 Detected MIME type:", contentType);
            
            const imageBuffer = await imageResponse.arrayBuffer();
            
            // Use Deno's standard library base64 encoder for reliable conversion
            const uint8Array = new Uint8Array(imageBuffer);
            const base64String = base64Encode(uint8Array);
            
            const dataUrl = `data:${contentType};base64,${base64String}`;
            finalResult = { 
              url: finalResult, 
              base64: dataUrl, 
              mime: contentType 
            };
            console.log(`✅ Image converted to base64 (${contentType}), length: ${base64String.length}`);
          } else {
            console.warn(`⚠️ Failed to download image (${imageResponse.status}), using URL only`);
            finalResult = { url: finalResult, base64: null, mime: null };
          }
        } catch (error) {
          console.warn("⚠️ Error converting image to base64:", error instanceof Error ? error.message : String(error));
          finalResult = { url: finalResult, base64: null, mime: null };
        }
        
        break;
      }
      if (pollData.status === "Error") {
        console.error("❌ BFL generation error:", pollData);
        return new Response(JSON.stringify({ success: false, message: "Erro na geração da imagem", details: pollData }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      attempt++;
    }

    if (!finalResult) {
      console.error("❌ Timeout: No result after", maxAttempts, "attempts");
      return new Response(JSON.stringify({ success: false, message: "Timeout: imagem não gerada" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    console.log("✅ Returning final result:", finalResult);

    return new Response(JSON.stringify({
      success: true,
      model_used: model,
      operation,
      prompt,
      dimensions: { width, height },
      result_url: typeof finalResult === 'string' ? finalResult : finalResult.url,
      result_base64: typeof finalResult === 'string' ? null : finalResult.base64,
      result_mime: typeof finalResult === 'string' ? null : finalResult.mime,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    console.error("💥 BFL Function error:", err);
    console.error("💥 Error stack:", err instanceof Error ? err.stack : 'No stack trace');
    console.error("💥 Error type:", typeof err);
    console.error("💥 Error name:", err instanceof Error ? err.name : 'Unknown');
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: err instanceof Error ? err.name : "UnknownError",
      message: `Erro interno na função BFL: ${err instanceof Error ? err.message : String(err)}`,
      details: {
        type: typeof err,
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});