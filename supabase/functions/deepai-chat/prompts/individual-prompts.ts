
export function createIndividualSystemPrompt(): string {
  return `Você é um ESPECIALISTA EM COPYWRITING, SEO E MARKETING DIGITAL para E-COMMERCE. Sua especialidade é criar descrições completas de produtos que vendem.`;
}

export function createIndividualUserPrompt(productName: string, originalText: string, shortDescription: string, longDescription: string): string {
  return `COMANDO 1 - TÓPICOS DE CONVERSÃO COMPLETOS E PROFISSIONAIS COM INSTRUÇÕES AVANÇADAS DE FOTOGRAFIA:

INFORMAÇÕES DO PRODUTO:
Nome: ${productName}
Descrição Atual: ${originalText}
Descrição Curta: ${shortDescription || 'Não informada'}
Descrição Completa: ${longDescription || 'Não informada'}

CRIE UMA DESCRIÇÃO PROFISSIONAL E ESTRUTURADA seguindo EXATAMENTE este formato:

**🔍 DESCRIÇÃO SEO OTIMIZADA**
- APENAS 1 parágrafo CURTO e OBJETIVO (máximo 50-70 palavras)
- Texto direto, persuasivo e com palavras-chave principais
- Destaque o principal benefício do produto de forma concisa

**📋 ESPECIFICAÇÕES TÉCNICAS**
- APENAS especificações que você tem informação REAL do produto
- NÃO incluir itens com "Não informado", "Não disponível" ou similares
- Somente dados técnicos confirmados e relevantes
- Exemplos: Dimensões, Peso, Material, Voltagem, Capacidade, Compatibilidade, Garantia, Cor/Modelo

**✨ PRINCIPAIS BENEFÍCIOS**
• [Benefício 1 - principal vantagem do produto]
• [Benefício 2 - segundo maior benefício]
• [Benefício 3 - terceiro benefício mais relevante]
*MÁXIMO 3 BENEFÍCIOS - os mais importantes e impactantes*

**🛒 GARANTA JÁ O SEU!**
✅ Entrega rápida e segura
✅ Garantia de qualidade
✅ Suporte especializado
✅ Melhor custo-benefício do mercado

**💡 IDEAL PARA:**
- [Público-alvo específico 1]
- [Público-alvo específico 2]
- [Situação de uso 1]
- [Situação de uso 2]

**📸 INSTRUÇÕES COMPLEMENTARES PARA GERAÇÃO DE IMAGENS E AMBIENTES:**

ÂNGULOS E PERSPECTIVAS ESPECÍFICAS:
- Close-up de ângulo baixo para destacar imponência
- Visão de cima para baixo (overhead) para contexto completo
- Três-quartos elevado para profundidade
- Perfil lateral com ênfase em profundidade
- Composição diagonal dinâmica

VARIAÇÕES DE ILUMINAÇÃO AVANÇADAS:
- Luz suave e difusa com rim lighting sutil
- Luz de fundo estratégica com highlights direcionados
- Iluminação profissional de estúdio com separação de background
- Luz natural golden hour com sombras orgânicas
- Iluminação cinematográfica com contrastes dramáticos

INTERAÇÃO E USO IMPLÍCITO:
- Mãos elegantemente posicionadas sugerindo uso premium
- Itens complementares relacionados (como faca gourmet limpa próxima a afiadores)
- Elementos lifestyle que implicam cenários de uso natural
- Posicionamento que sugere engajamento ativo e aplicação prática

CORES E CONTRASTE:
- Paleta predominante de tons neutros aquecidos (cremes, bege, dourado suave)
- Tons frios minimalistas (brancos, cinzas, azul sutil) para contraste
- Como o produto deve se destacar: contraste adequado com background
- Cores orgânicas terrosas (marrons naturais, verdes, texturas de pedra)

PROFUNDIDADE DE CAMPO (BOKEH):
- Bokeh suave para isolar completamente o produto
- Foco nítido no produto com fundo artisticamente desfocado
- Profundidade que cria separação visual clara

ESPECIFICAÇÕES TÉCNICAS OBRIGATÓRIAS:
- Resolução Ultra-Alta: 8K mínimo para zoom sem perda de qualidade
- Nitidez Impecável: Extremamente nítida, especialmente em áreas focais
- Sem Artefatos Visuais: Zero ruído, compressão ou artefatos digitais
- Iluminação profissional sem sombras duras ou reflexos não naturais

ESTILO FINAL (Positive Prompts):
ultra realistic, modern, minimalist, high quality commercial render, studio light, product photography, editorial style, hyper-detailed, sharp focus, professional, clean aesthetic

NEGATIVE PROMPTS (Para Evitar):
low resolution, blurry, noisy, grainy, cluttered background, harsh lighting, strong direct flash, distracting elements, poor composition, distorted, amateur photo, low quality, cartoon, illustration, drawing, painting, bad shadows, unnatural reflections, crowded, messy, too dark, overexposed, bad colors, tiling, bad perspective

FORMATO DE RESPOSTA:
{
  "improvedText": "descrição completa seguindo o formato especificado acima (mínimo 400 palavras bem estruturadas)",
  "keywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"]
}`;
}
