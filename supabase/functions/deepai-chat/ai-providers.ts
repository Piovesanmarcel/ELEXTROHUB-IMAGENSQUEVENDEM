
import { UnifiedAIResponse } from './types.ts';
import { processUnifiedResponse } from './response-processor.ts';

// Timeout aumentado para comandos unificados complexos
const API_TIMEOUT_MS = 90000; // 90 segundos

// Função para criar timeout com Promise.race
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, apiName: string): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error(`⏰ TIMEOUT ${apiName} após ${timeoutMs}ms`);
      reject(new Error(`TIMEOUT_${apiName}_${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

// Função auxiliar para extrair JSON de forma robusta da resposta do Gemini
function extractJSONFromGeminiResponse(data: any): any {
  console.log('🔍 Iniciando extração JSON robusta...');
  console.log('📊 Estrutura da resposta:', JSON.stringify(data, null, 2).substring(0, 500));
  
  // Verificar múltiplos caminhos onde o JSON pode estar
  const possiblePaths = [
    data.candidates?.[0]?.content?.parts?.[0]?.text,
    data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data,
    data.text,
    data.content
  ];
  
  for (const path of possiblePaths) {
    if (!path) continue;
    
    let textToProcess = path;
    
    // Se for base64 (inlineData), decodificar
    if (typeof path === 'string' && path.length > 100 && !path.includes('{')) {
      try {
        textToProcess = atob(path);
        console.log('✅ Decodificado base64');
      } catch {
        continue;
      }
    }
    
    if (typeof textToProcess !== 'string') continue;
    
    // Tentativa 1: Parse direto com limpeza básica
    try {
      const cleaned = textToProcess
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove caracteres de controle
      
      const parsed = JSON.parse(cleaned);
      console.log('✅ Parse direto bem-sucedido');
      return parsed;
    } catch (e1) {
      console.log('⚠️ Parse direto falhou, tentando extração...');
    }
    
    // Tentativa 2: Extrair primeiro bloco JSON com chaves balanceadas
    try {
      let depth = 0, start = -1;
      for (let i = 0; i < textToProcess.length; i++) {
        if (textToProcess[i] === '{') {
          if (depth === 0) start = i;
          depth++;
        } else if (textToProcess[i] === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            const jsonStr = textToProcess.slice(start, i + 1);
            const parsed = JSON.parse(jsonStr);
            console.log('✅ Extração de JSON balanceado bem-sucedida');
            return parsed;
          }
        }
      }
    } catch (e2) {
      console.log('⚠️ Extração de JSON balanceado falhou');
    }
    
    // Tentativa 3: Regex para encontrar objetos JSON
    try {
      const jsonMatch = textToProcess.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ Extração por regex bem-sucedida');
        return parsed;
      }
    } catch (e3) {
      console.log('⚠️ Extração por regex falhou');
    }
  }
  
  throw new Error('Não foi possível extrair JSON válido da resposta');
}

export async function callGeminiAPI(systemPrompt: string, userPrompt: string, geminiApiKey: string, command: string): Promise<UnifiedAIResponse | null> {
  console.log('🤖 Iniciando chamada Gemini com timeout otimizado...');
  
  const requestBody = {
    contents: [{
      parts: [{
        text: systemPrompt + '\n\n' + userPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 2200, // Reduzido para melhor estabilidade
      response_mime_type: 'application/json'
    }
  };
  
  try {
    console.log('📡 Fazendo requisição para Gemini...');
    
    const fetchPromise = fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    // Aplicar timeout à requisição
    const response = await withTimeout(fetchPromise, API_TIMEOUT_MS, 'GEMINI');

    console.log('📋 Gemini response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP Gemini:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error(`Gemini rate limit excedido (${response.status}). Aguarde alguns minutos.`);
      } else if (response.status >= 500) {
        throw new Error(`Gemini servidor sobrecarregado (${response.status}). Tente novamente.`);
      } else {
        throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log('📄 Resposta Gemini recebida e parseada');
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const part = data.candidates[0].content.parts?.[0];
      const generatedText: string = part?.text || '';

      let parsedResponse: any;
      try {
        // 1) Tenta parse direto (com response_mime_type=application/json)
        if (generatedText) {
          const cleaned = generatedText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
          parsedResponse = JSON.parse(cleaned);
        } else if (part?.inlineData?.data) {
          // Em alguns casos o Gemini retorna JSON em inlineData (raro)
          const decoded = atob(part.inlineData.data);
          parsedResponse = JSON.parse(decoded);
        } else {
          throw new Error('Resposta do Gemini sem texto para JSON');
        }
      } catch (parseError) {
        // 2) Fallback: extrai primeiro bloco JSON entre chaves balanceadas
        try {
          const text = generatedText || '';
          const jsonFromBraces = (() => {
            let depth = 0, start = -1;
            for (let i = 0; i < text.length; i++) {
              if (text[i] === '{') { if (depth === 0) start = i; depth++; }
              else if (text[i] === '}') { depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
            }
            return '';
          })();
          if (jsonFromBraces) {
            parsedResponse = JSON.parse(jsonFromBraces);
          } else {
            throw parseError;
          }
        } catch (fallbackError) {
          console.error('❌ Erro JSON Gemini, usando fallback de texto puro:', fallbackError);
          console.error('❌ Texto que falhou:', (generatedText || '').substring(0, 500));
          console.log('🔧 Aplicando fallback_to_plain_text para Gemini');
          
          // Fallback final: processar como texto puro
          const result = processUnifiedResponse(generatedText || '');
          result.geminiSuccess = true;
          console.log('✅ Gemini processado com fallback de texto puro');
          return result;
        }
      }
      
      const result = processUnifiedResponse(parsedResponse);
      result.geminiSuccess = true;
      console.log('✅ Gemini processado com sucesso');
      return result;
    } else {
      console.error('❌ Resposta Gemini inválida:', data);
      throw new Error('Resposta inválida do Gemini - formato inesperado');
    }
  } catch (error) {
    console.error('💥 Erro na chamada Gemini:', error);
    
    if (error instanceof Error && error.message?.includes('TIMEOUT_GEMINI')) {
      throw new Error('Gemini demorou mais de 90 segundos para responder. Tente novamente.');
    }
    
    throw error;
  }
}

export async function callOpenAIAPI(systemPrompt: string, userPrompt: string, openaiApiKey: string, command: string): Promise<UnifiedAIResponse | null> {
  console.log('🧠 Iniciando chamada OpenAI com timeout otimizado...');
  
  const requestBody = {
    model: 'gpt-4o-mini', // Modelo mais rápido
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1, // Reduzido para respostas mais consistentes e rápidas
    max_tokens: 2800, // Reduzido para acelerar
    response_format: { type: "json_object" },
    stream: false // Garantir que não está fazendo streaming
  };
  
  try {
    console.log('📡 Fazendo requisição para OpenAI...');
    
    const fetchPromise = fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    // Aplicar timeout à requisição
    const response = await withTimeout(fetchPromise, API_TIMEOUT_MS, 'OPENAI');

    console.log('📋 OpenAI response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro HTTP OpenAI:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error(`OpenAI rate limit excedido (${response.status}). Aguarde alguns minutos.`);
      } else if (response.status >= 500) {
        throw new Error(`OpenAI servidor sobrecarregado (${response.status}). Tente novamente.`);
      } else {
        throw new Error(`OpenAI HTTP ${response.status}: ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log('📄 Resposta OpenAI recebida e parseada');
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const generatedText = data.choices[0].message.content;
      console.log('📄 Conteúdo da resposta OpenAI:', generatedText?.substring(0, 200) + '...');
      
      let parsedResponse;
      try {
        // Como estamos usando response_format: "json_object", a resposta já deve ser JSON válido
        parsedResponse = JSON.parse(generatedText);
        console.log('✅ JSON OpenAI parseado com sucesso');
      } catch (parseError) {
        console.error('❌ Erro JSON OpenAI, usando fallback de texto puro:', parseError);
        console.error('❌ Conteúdo que falhou:', generatedText?.substring(0, 500));
        console.log('🔧 Aplicando fallback_to_plain_text para OpenAI');
        
        // Fallback final: processar como texto puro
        const result = processUnifiedResponse(generatedText || '');
        result.openaiSuccess = true;
        console.log('✅ OpenAI processado com fallback de texto puro');
        return result;
      }
      
      const result = processUnifiedResponse(parsedResponse);
      result.openaiSuccess = true;
      console.log('✅ OpenAI processado com sucesso');
      return result;
    } else {
      console.error('❌ Resposta OpenAI inválida:', data);
      throw new Error('Resposta inválida do OpenAI - formato inesperado');
    }
  } catch (error) {
    console.error('💥 Erro na chamada OpenAI:', error);
    
    if (error instanceof Error && error.message?.includes('TIMEOUT_OPENAI')) {
      throw new Error('OpenAI demorou mais de 90 segundos para responder. Tente novamente.');
    }
    
    throw error;
  }
}
