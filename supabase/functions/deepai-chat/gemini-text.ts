
export async function callGeminiText(systemPrompt: string, userPrompt: string, geminiApiKey: string, imageBase64?: string): Promise<string> {
  const parts: any[] = [{ text: systemPrompt }, { text: "\n\n" }, { text: userPrompt }];
  
  // Adicionar imagem se fornecida
  if (imageBase64) {
    // Remover o prefixo data:image/...;base64, se presente
    const cleanBase64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');
    
    parts.push({
      inline_data: {
        mime_type: "image/jpeg", // Assumindo JPEG, mas pode ser detectado dinamicamente
        data: cleanBase64
      }
    });
  }

  const requestBody = {
    contents: [{
      parts: parts
    }],
    generationConfig: {
      temperature: 0.35,
      topP: 0.8,
      maxOutputTokens: 1500,
      response_mime_type: 'text/plain'
    }
  } as const;

  const fetchPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-img-preview:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const response = await fetchPromise;
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const parts_response = data?.candidates?.[0]?.content?.parts || [];
  const textPart = parts_response.find((p: any) => typeof p.text === 'string');
  const text = textPart?.text?.trim();
  if (!text) {
    throw new Error('Resposta de texto do Gemini vazia ou em formato inesperado');
  }
  return text;
}
