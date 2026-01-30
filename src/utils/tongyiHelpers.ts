// Utilitários para TongyiWanxiang
export const convertUrlToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    console.log('🔄 [DEBUG] Convertendo URL para base64:', imageUrl);
    
    try {
      const response = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📦 [DEBUG] Blob obtido via fetch:', { size: blob.size, type: blob.type });
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log('✅ [DEBUG] Base64 gerado via fetch, tamanho:', result.length);
          resolve(result);
        };
        reader.onerror = () => {
          console.error('❌ [DEBUG] Erro no FileReader');
          reject(new Error('Falha na conversão para base64'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (fetchError) {
      console.log('⚠️ [DEBUG] Fetch falhou:', fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao processar imagem:', error);
    
    throw new Error(`Falha ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

// Estruturas de prompts
export const tongyiPromptStructures = {
  structure1: `Analise a imagem do produto e crie um prompt para geração de imagem seguindo EXATAMENTE esta estrutura:

"[PRODUTO] em [LOCAL/CENÁRIO], [AÇÃO PRINCIPAL], [POSIÇÃO/ÂNGULO], [AMBIENTE/ILUMINAÇÃO], fotografia profissional, alta qualidade, realista"

Exemplo de estrutura correta:
"Brinquedo robô em sala de estar moderna, criança brincando alegremente, produto em primeiro plano à direita, luz natural suave da janela, fotografia profissional, alta qualidade, realista"

IMPORTANTE: 
- Mantenha as características visuais originais do produto (cores, formas, texturas)
- Use cenários que destacam o produto de forma atrativa
- Foque na naturalidade e realismo da cena
- NÃO inclua texto, legendas, CTA ou elementos gráficos na imagem`,

  structure2: `Crie um prompt seguindo esta estrutura específica:

"[PRODUTO] posicionado em [AMBIENTE], [PESSOA/SITUAÇÃO DE USO], [DETALHES DO CENÁRIO], [ESTILO FOTOGRÁFICO], composição equilibrada"

Exemplo:
"Produto de limpeza posicionado em cozinha elegante, mãe limpando bancada com satisfação, armários brancos e plantas ao fundo, estilo fotográfico clean e moderno, composição equilibrada"

Diretrizes:
- Preserve todas as características do produto original
- Crie contextos de uso realistas e atrativos
- Foque na funcionalidade e benefícios do produto
- Ambiente deve complementar, não competir com o produto`,

  structure3: `Desenvolva um prompt com esta estrutura:

"[PRODUTO] em destaque no [LOCAL], [MOMENTO/SITUAÇÃO], [ELEMENTOS COMPLEMENTARES], [QUALIDADE VISUAL], perspectiva envolvente"

Exemplo:
"Livro infantil em destaque no quarto aconchegante, momento de leitura antes de dormir, pelúcias e abajur suave ao redor, qualidade cinematográfica, perspectiva envolvente"

Critérios:
- Produto deve ser o elemento central da composição
- Situação deve ser envolvente e emocional
- Elementos complementares reforçam a atmosfera
- Visual deve transmitir qualidade premium`,

  structure4: `Construa um prompt seguindo:

"[PRODUTO] integrado ao [CONTEXTO], [BENEFÍCIO/RESULTADO], [DETALHES AMBIENTAIS], [MOOD/ATMOSFERA], captura autêntica"

Exemplo:
"Suplemento vitamínico integrado ao café da manhã saudável, energia e vitalidade para o dia, mesa com frutas frescas e luz matinal, mood positivo e energizante, captura autêntica"

Elementos essenciais:
- Integração natural do produto no contexto
- Benefício do produto deve ser visualmente comunicado
- Detalhes ambientais criam credibilidade
- Mood apropriado ao público-alvo`,

  structure5: `Elabore um prompt com esta abordagem:

"[PRODUTO] como protagonista em [SITUAÇÃO], [INTERAÇÃO], [COMPONENTES VISUAIS], [TRATAMENTO FOTOGRÁFICO], narrativa visual clara"

Exemplo:
"Jogo educativo como protagonista em tarde familiar, pais e filhos interagindo com alegria, sala organizada com decoração acolhedora, tratamento fotográfico warm e natural, narrativa visual clara"

Pontos importantes:
- Produto é sempre o protagonista da cena
- Interações devem parecer genuínas e naturais
- Componentes visuais apoiam a narrativa
- Tratamento fotográfico adequado ao contexto`,

  structure6: `Formule um prompt usando:

"[PRODUTO] inserido em [CENÁRIO ASPIRACIONAL], [LIFESTYLE/ESTILO DE VIDA], [ELEMENTOS DE APOIO], [QUALIDADE DE PRODUÇÃO], impacto visual memorável"

Exemplo:
"Produto de skincare inserido em banheiro de spa luxuoso, lifestyle de autocuidado e bem-estar, toalhas macias e velas aromáticas, qualidade de produção premium, impacto visual memorável"

Características obrigatórias:
- Cenário deve ser aspiracional mas alcançável
- Lifestyle coerente com o produto
- Elementos de apoio reforçam o posicionamento
- Qualidade de produção condizente com o valor percebido
- Impacto visual que permanece na memória`
};

export const ambientLabels = {
  ambient_1: 'Ambiente 1 - Familiar',
  ambient_2: 'Ambiente 2 - Profissional', 
  ambient_3: 'Ambiente 3 - Lazer',
  ambient_4: 'Ambiente 4 - Educativo',
  ambient_5: 'Ambiente 5 - Lifestyle',
  ambient_6: 'Ambiente 6 - Elegante',
  ambient_7: 'Ambiente 7 - Criativo'
};

export const copyAllPrompts = async (prompts: string[]) => {
  if (prompts.length === 0) {
    throw new Error('Nenhum prompt para copiar');
  }

  const allPromptsText = prompts.map((prompt, index) => 
    `CENÁRIO ${index + 1}:\n${prompt}`
  ).join('\n\n---\n\n');

  await navigator.clipboard.writeText(allPromptsText);
};