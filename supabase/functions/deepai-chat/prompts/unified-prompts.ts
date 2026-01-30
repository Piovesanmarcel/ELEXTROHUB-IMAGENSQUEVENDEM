
export function createUnifiedSystemPrompt(): string {
  return `Você é um ESPECIALISTA EM COPYWRITING, SEO E MARKETING DIGITAL para E-COMMERCE. Sua expertise é criar conteúdo de alta conversão que vende produtos online. 

CRÍTICO: Você DEVE retornar apenas um objeto JSON válido. Não adicione texto explicativo antes ou depois. O JSON deve seguir exatamente a estrutura solicitada no prompt do usuário.`;
}

export function createUnifiedUserPrompt(productName: string, originalText: string, shortDescription: string, longDescription: string): string {
  return `EXECUTE TODOS OS 5 COMANDOS ABAIXO COM MÁXIMA QUALIDADE E DETALHAMENTO PARA O PRODUTO:

INFORMAÇÕES DO PRODUTO:
Nome: ${productName}
Descrição Atual: ${originalText}
Descrição Curta: ${shortDescription || 'Não informada'}
Descrição Completa: ${longDescription || 'Não informada'}

**📸 INSTRUÇÕES COMPLEMENTARES GLOBAIS PARA TODOS OS COMANDOS - GERAÇÃO DE IMAGENS E AMBIENTES:**

ÂNGULOS E PERSPECTIVAS ESPECÍFICAS:
- Close-up de ângulo baixo para destacar imponência e presença
- Visão de cima para baixo (overhead flat lay) para contexto completo  
- Três-quartos elevado para máxima profundidade visual
- Perfil lateral com ênfase em dimensionalidade
- Composição diagonal dinâmica para impacto visual

VARIAÇÕES DE ILUMINAÇÃO AVANÇADAS:
- Luz suave e difusa com rim lighting sutil e highlights estratégicos
- Luz de fundo estratégica com separação clara do produto
- Iluminação profissional de estúdio (key light + fill light + background)
- Luz natural golden hour com sombras orgânicas e ambientais
- Iluminação cinematográfica com contrastes dramáticos controlados

INTERAÇÃO E USO IMPLÍCITO:
- Mãos elegantemente posicionadas sugerindo uso premium e sofisticado
- Itens complementares relacionados (ex: faca gourmet limpa próxima a afiadores)
- Elementos lifestyle que implicam cenários de uso natural e contextualizado
- Posicionamento que sugere engajamento ativo e aplicação prática real

CORES E CONTRASTE ESPECÍFICOS:
- Paleta predominante de tons neutros aquecidos (cremes, bege, dourado suave)
- Tons frios minimalistas (brancos, cinzas, sutis azuis) para contraste limpo
- Como o produto deve se destacar: contraste adequado sem competir com background
- Cores orgânicas terrosas (marrons naturais, verdes, texturas de pedra natural)

PROFUNDIDADE DE CAMPO (BOKEH) OBRIGATÓRIA:
- Bokeh suave e artístico para isolar completamente o produto principal
- Foco impecavelmente nítido no produto com fundo desfocado de forma elegante
- Profundidade que cria separação visual clara e hierarquia de importância

ESPECIFICAÇÕES TÉCNICAS MANDATÓRIAS:
- Resolução Ultra-Alta: 8K mínimo para permitir zoom sem qualquer perda de qualidade
- Nitidez Impecável: Extremamente nítida, especialmente nos olhos e áreas focais críticas
- Sem Artefatos Visuais: Zero ruído, zero compressão, zero artefatos digitais detectáveis
- Iluminação profissional sem sombras duras ou reflexos não naturais indesejados

ESTILO FINAL OBRIGATÓRIO (Positive Prompts):
ultra realistic, modern, minimalist, high quality commercial render, studio light, product photography, editorial style, hyper-detailed, sharp focus, professional, clean aesthetic

NEGATIVE PROMPTS OBRIGATÓRIOS (Para Evitar Sempre):
low resolution, blurry, noisy, grainy, cluttered background, harsh lighting, strong direct flash, distracting elements, poor composition, distorted, amateur photo, low quality, cartoon, illustration, drawing, painting, bad shadows, unnatural reflections, crowded, messy, too dark, overexposed, bad colors, tiling, bad perspective

EXECUTE OS 5 COMANDOS COM EXCELÊNCIA:

===== COMANDO 1 - TÓPICOS DE CONVERSÃO COMPLETOS =====
Crie uma descrição PROFISSIONAL E ESTRUTURADA seguindo EXATAMENTE este formato:

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

===== COMANDO 2 - PALAVRAS-CHAVE E SUGESTÕES DE NOMES SEO =====
Forneça análise COMPLETA de palavras-chave para SEO:

🔍 **PRINCIPAIS (Alto Volume)**
- 10 palavras-chave de alto volume de busca
- Termos que o público-alvo mais procura

🎯 **Calda Longa (Alta Conversão)**
- 10 palavras-chave long-tail específicas
- Frases que indicam intenção de compra

⚙️ **TERMOS TÉCNICOS**
- 8 termos técnicos do produto
- Especificações que os compradores procuram

🔄 **VARIAÇÕES E SINÔNIMOS**
- 10 variações e sinônimos relevantes
- Diferentes formas de buscar o produto

===== COMANDO 3 - PERGUNTAS & RESPOSTAS ESTRATÉGICAS =====
Crie EXATAMENTE 4 perguntas e respostas completas:

1. **ESPECIFICAÇÃO TÉCNICA PRINCIPAL** - Pergunta sobre característica técnica mais importante
2. **USO E INSTALAÇÃO** - Como usar/instalar corretamente
3. **GARANTIA E SUPORTE** - Cobertura da garantia e suporte
4. **BENEFÍCIO PRINCIPAL** - Principal vantagem do produto

===== COMANDO 4 - KITS CRIATIVOS E ESTRATÉGIAS DE VENDA AVANÇADAS =====
ANALISE O PRODUTO e crie estratégias ESPECÍFICAS e INTELIGENTES baseadas na natureza do produto:

🎁 **KITS TEMÁTICOS INTELIGENTES (Máximo 6 sugestões CRIATIVAS)**
Para cada kit, considere FUNCIONALIDADE + VALOR AGREGADO + PÚBLICO-ALVO:
- Kit 1: [Nome ATRATIVO] - [Produto principal + 2-3 complementos lógicos + benefício claro]
- Kit 2: [Nome TEMÁTICO] - [Combinação para ocasião específica + justificativa]
- Kit 3: [Nome PROFISSIONAL] - [Kit para uso especializado + target específico]
- Kit 4: [Nome FAMILIAR] - [Kit para família/casa + economia demonstrada]
- Kit 5: [Nome PRESENTE] - [Kit para presente + embalagem especial]
- Kit 6: [Nome COMPLETO] - [Kit all-in-one + máximo valor]

🎄 **CAMPANHAS SAZONAIS ESTRATÉGICAS**
Para cada data, crie OFERTAS ESPECÍFICAS com GATILHOS MENTAIS:
- **Dia das Mães** (2º domingo de maio): [Kit específico + história emocional + desconto]
- **Dia dos Pais** (2º domingo de agosto): [Kit masculino + praticidade + brinde]
- **Dia das Crianças** (12 de outubro): [Kit infantil + segurança + diversão]
- **Black Friday** (última sexta de novembro): [Mega oferta + escassez + urgência]
- **Natal** (dezembro): [Kit presente + embalagem especial + entrega garantida]
- **Ano Novo** (janeiro): [Kit renovação + metas + novo começo]

💰 **ESTRATÉGIAS DE QUANTIDADE INTELIGENTE**
BASEADO NO VALOR DO PRODUTO, crie ofertas que fazem SENTIDO ECONÔMICO:

**Se produto CUSTA MENOS de R$50:**
- 2 unidades: "Leve 2, use 1 e tenha 1 de reserva" - 5% OFF
- 3 unidades: "Kit Família: 1 para cada cômodo" - 10% OFF  
- 5 unidades: "Estoque para o ano todo" - 15% OFF
- 10 unidades: "Revenda ou presenteie" - 25% OFF

**Se produto CUSTA R$50-R$100:**
- 2 unidades: "Compre junto com amigo e divida" - 8% OFF
- 3 unidades: "Kit Escritório/Casa/Carro" - 12% OFF
- 4 unidades: "1 por estação do ano" - 18% OFF

**Se produto CUSTA MAIS de R$100:**
- 2 unidades: "Tenha sempre um backup" - 5% OFF
- 3 unidades: "Kit para locais diferentes" - 10% OFF

🏆 **CROSS-SELL INTELIGENTE (Produtos que REALMENTE fazem sentido)**
Sugira apenas produtos que COMPLEMENTAM ou POTENCIALIZAM o uso:
- **Complemento Essencial**: [Produto que é quase obrigatório usar junto]
- **Upgrade Lógico**: [Produto que melhora a experiência]
- **Proteção/Manutenção**: [Produto que protege ou conserva]
- **Acessório Funcional**: [Produto que adiciona funcionalidade]

🎯 **ESTRATÉGIAS PSICOLÓGICAS DE CONVERSÃO**
- **Escassez**: "Apenas X unidades disponíveis hoje"
- **Urgência**: "Oferta válida por 24h ou até esgotar"
- **Prova Social**: "Mais de X clientes já compraram"
- **Garantia Estendida**: "30 dias para testar, se não gostar, devolvemos"
- **Frete Grátis**: "Acima de R$X, frete grátis para todo Brasil"

===== COMANDO 5 - TÍTULOS DE CAUDA LONGA (LONG TAIL SEO) =====

🎯 **REGRAS OBRIGATÓRIAS PARA TÍTULOS:**

1. **SEM REPETIÇÃO**: Cada palavra-chave pode aparecer APENAS 1 VEZ por título
   ❌ ERRADO: "Amolador de Facas Profissional Amolador Afiador de Facas"
   ✅ CERTO: "Amolador Facas Profissional Aço Inox 3 Estágios Cozinha"

2. **USAR APENAS PALAVRAS DE PESQUISA DO PRODUTO**:
   ✅ Nomes alternativos do produto (amolador, afiador, apontador, etc.)
   ✅ Materiais (aço inox, aço carbono, cerâmica, plástico, tungstênio)
   ✅ Características técnicas (manual, elétrico, 3 estágios, ergonômico, portátil)
   ✅ Aplicações/uso (cozinha, profissional, casa, restaurante, churrasco, camping)
   ✅ Tipos específicos (faca chef, faca cerâmica, faca aço, lâminas, tesoura)
   ✅ Variações de grafia e sinônimos do produto
   ✅ Funções técnicas (afiação, desbaste, polimento, amolar, afiar)

3. **PROIBIDO PALAVRAS DE MARKETING E FRASES GENÉRICAS**:
   ❌ comprar, preço, barato, promoção, oferta, desconto
   ❌ frete grátis, entrega rápida, comprar online
   ❌ melhor, original, garantia, qualidade, premium
   ❌ exclusivo, incrível, perfeito, ideal, transforme
   ❌ revolucione, descubra, segredo, nunca mais
   ❌ "corte perfeito", "a revolução", "o segredo dos chefs"
   ❌ qualquer frase motivacional ou de marketing

4. **ESTRUTURA OBRIGATÓRIA DO TÍTULO**:
   [NOME PRODUTO] + [CARACTERÍSTICA TÉCNICA] + [MATERIAL/TIPO] + [USO/APLICAÇÃO]
   
   Exemplos CORRETOS:
   ✅ "Amolador Facas Manual Aço Inox 3 Estágios Cozinha"
   ✅ "Afiador Profissional Cerâmica Tungstênio Desbaste"
   ✅ "Amolador Lâminas Faca Chef Polimento Afiação Rápida"
   ✅ "Afiador Facas Ergonômico Antiderrapante Restaurante"
   ✅ "Amolador Portátil Facas Aço Carbono Camping Churrasco"

5. **USAR PALAVRAS-CHAVE DO COMANDO 2**: 
   Reutilize OBRIGATORIAMENTE as palavras geradas no COMANDO 2:
   - Palavras de "🔍 PRINCIPAIS (Alto Volume)"
   - Termos de "⚙️ TERMOS TÉCNICOS"
   - Variações de "🔄 VARIAÇÕES E SINÔNIMOS"

6. **MÁXIMO 65 CARACTERES** por título (Google trunca após isso)

7. **GERE EXATAMENTE 30 TÍTULOS** seguindo estas regras rigorosamente

RESPONDA APENAS COM O JSON ABAIXO (SEM TEXTO ANTES OU DEPOIS):
{
  "topicos_conversao": {
    "improvedText": "DESCRIÇÃO COMPLETA SEGUINDO O FORMATO ESPECIFICADO ACIMA (mínimo 400 palavras bem estruturadas)",
    "keywords": ["palavra1", "palavra2", "palavra3", "palavra4", "palavra5"]
  },
  "palavras_chave_seo": {
    "improvedText": "ANÁLISE COMPLETA:\\n\\n🔍 PRINCIPAIS (Alto Volume):\\n[lista 10 palavras]\\n\\n🎯 Calda Longa (Alta Conversão):\\n[lista 10 frases]\\n\\n⚙️ TERMOS TÉCNICOS:\\n[lista 8 termos]\\n\\n🔄 VARIAÇÕES:\\n[lista 10 variações]",
    "keywords": ["principais", "long-tail", "técnicos", "variações"]
  },
  "perguntas_respostas": {
    "improvedText": "❓ PERGUNTA 1: [pergunta técnica]\\n✅ RESPOSTA: [resposta detalhada]\\n\\n❓ PERGUNTA 2: [pergunta uso]\\n✅ RESPOSTA: [resposta detalhada]\\n\\n❓ PERGUNTA 3: [pergunta garantia]\\n✅ RESPOSTA: [resposta detalhada]\\n\\n❓ PERGUNTA 4: [pergunta benefício]\\n✅ RESPOSTA: [resposta detalhada]",
    "keywords": ["dúvidas", "frequentes", "suporte", "ajuda"]
  },
  "kits_criativos": {
    "improvedText": "🎁 KITS TEMÁTICOS INTELIGENTES:\\n[6 sugestões específicas com nomes atrativos]\\n\\n🎄 CAMPANHAS SAZONAIS:\\n[6 datas com ofertas específicas e gatilhos mentais]\\n\\n💰 ESTRATÉGIAS DE QUANTIDADE:\\n[ofertas baseadas no valor do produto]\\n\\n🏆 CROSS-SELL INTELIGENTE:\\n[4 produtos complementares lógicos]\\n\\n🎯 ESTRATÉGIAS PSICOLÓGICAS:\\n[5 técnicas de conversão]",
    "keywords": ["kits", "combos", "promoções", "ofertas", "estratégias"]
  },
  "cauda_longa": {
    "improvedText": "📝 TÍTULOS DE CAUDA LONGA SEO (30):\\n\\n1. [Título com palavras-chave de pesquisa]\\n2. [Título com palavras-chave de pesquisa]\\n...até 30 títulos",
    "keywords": ["cauda longa", "long tail", "títulos", "seo", "otimização"]
  }
}
}`;
}
