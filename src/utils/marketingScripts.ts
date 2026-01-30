// Roteiros de vídeo e scripts para marketing

export const VIDEO_SCRIPTS = {
  explicativo: {
    id: 'explicativo',
    title: 'Vídeo Explicativo',
    duration: '30-60 segundos',
    icon: '📹',
    sections: [
      { label: 'GANCHO', time: '3s', text: '"Você ainda perde horas editando fotos de produtos?"' },
      { label: 'PROBLEMA', time: '8s', text: '"Fotos amadoras = menos vendas.\nMarketplaces priorizam anúncios profissionais."' },
      { label: 'SOLUÇÃO', time: '15s', text: '"Com Anúncios Que Vende, nossa IA transforma suas fotos em anúncios profissionais em segundos."' },
      { label: 'DEMONSTRAÇÃO', time: '20s', text: '"Basta fazer upload da foto, e nossa equipe de IA:\n• ATLAS remove fundo e melhora qualidade\n• LYRA cria textos persuasivos\n• ORION gera imagens para redes sociais"' },
      { label: 'CTA', time: '5s', text: '"Comece grátis agora! Link na bio."' },
    ],
  },
  reels: {
    id: 'reels',
    title: 'Reels / TikTok',
    duration: '15 segundos',
    icon: '📱',
    sections: [
      { label: 'VISUAL', time: '5s', text: 'Foto amadora → IA → Anúncio profissional' },
      { label: 'TEXTO', time: '7s', text: '"3 segundos. Sem Photoshop. Sem contratar designer."' },
      { label: 'CTA', time: '3s', text: '"Link na bio!"' },
    ],
  },
  stories: {
    id: 'stories',
    title: 'Stories Sequenciais',
    duration: '3 stories',
    icon: '📲',
    sections: [
      { label: 'STORY 1', time: '', text: '"Sabia que anúncios com fotos profissionais vendem 3x mais?"' },
      { label: 'STORY 2', time: '', text: '"Nossa IA faz isso em segundos 👇"' },
      { label: 'STORY 3', time: '', text: '[CTA] "Teste grátis - arrasta pra cima!"' },
    ],
  },
  youtube: {
    id: 'youtube',
    title: 'YouTube (2-3 min)',
    duration: '2-3 minutos',
    icon: '🎬',
    sections: [
      { label: 'INTRO', time: '15s', text: '"E aí, vendedores! Hoje vou mostrar como transformar fotos amadoras em anúncios que VENDEM."' },
      { label: 'PROBLEMA', time: '30s', text: '"Se você vende em marketplace, sabe: foto ruim = produto encalhado. Mas contratar fotógrafo ou designer custa caro..."' },
      { label: 'SOLUÇÃO', time: '45s', text: '"Descobri uma ferramenta que usa Inteligência Artificial pra fazer tudo isso automaticamente. Olha só..."' },
      { label: 'DEMO AO VIVO', time: '60s', text: '"[Mostrar tela] Faço upload da foto... e em segundos tenho: fundo removido, descrição otimizada, imagens para redes sociais..."' },
      { label: 'RESULTADOS', time: '20s', text: '"Desde que comecei a usar, minhas vendas aumentaram X%. E o melhor: economizo horas por semana."' },
      { label: 'CTA', time: '10s', text: '"Link na descrição pra testar grátis. Deixa o like se curtiu e se inscreve pro próximo vídeo!"' },
    ],
  },
};

export const POST_SCRIPTS = {
  carrossel: {
    id: 'carrossel',
    title: 'Carrossel Educativo',
    slides: 6,
    icon: '🎴',
    content: [
      'Slide 1: "Por que seus produtos não vendem? 🤔"',
      'Slide 2: "❌ Fotos com fundo bagunçado"',
      'Slide 3: "❌ Descrições genéricas e sem palavras-chave"',
      'Slide 4: "❌ Imagens que não chamam atenção"',
      'Slide 5: "✅ Com IA, tudo isso é resolvido em 1 clique"',
      'Slide 6: "Teste grátis no link da bio! 🚀"',
    ],
  },
  antesDepois: {
    id: 'antes-depois',
    title: 'Post Antes/Depois',
    slides: 1,
    icon: '🔄',
    content: [
      '📸 ANTES: Foto de celular, fundo bagunçado, iluminação ruim',
      '✨ DEPOIS: Fundo profissional, cores vibrantes, pronto pra vender',
      '',
      'Legenda:',
      '"Transformação real de um dos nossos clientes! 🚀',
      '',
      'De foto amadora pra anúncio profissional em segundos.',
      '',
      'Quer o mesmo resultado? Link na bio!"',
    ],
  },
  depoimento: {
    id: 'depoimento',
    title: 'Post de Depoimento',
    slides: 1,
    icon: '💬',
    content: [
      '⭐⭐⭐⭐⭐',
      '',
      '"Minha taxa de conversão subiu 40% depois que comecei a usar!"',
      '— João, vendedor no Mercado Livre',
      '',
      'Legenda:',
      '"Resultados reais de quem usa nossa plataforma.',
      '',
      'Quer ser o próximo case de sucesso?',
      'Comece grátis hoje! Link na bio 👇"',
    ],
  },
};

export const LEGENDAS = {
  educativa: {
    id: 'educativa',
    title: 'Legenda Educativa',
    icon: '📚',
    text: `🎯 3 erros que fazem você PERDER vendas no marketplace:

1️⃣ Fotos sem fundo limpo
Os compradores querem ver o produto, não sua casa.

2️⃣ Descrições copiadas do fornecedor
O algoritmo penaliza conteúdo duplicado.

3️⃣ Não usar palavras-chave
Sem SEO, ninguém encontra seu anúncio.

💡 A boa notícia? Nossa IA resolve os 3 em segundos.

🔗 Teste grátis no link da bio!

#marketplace #vendasonline #ecommerce #mercadolivre #shopee`,
  },
  promocional: {
    id: 'promocional',
    title: 'Legenda Promocional',
    icon: '🎉',
    text: `🔥 OFERTA POR TEMPO LIMITADO!

Transforme suas fotos em anúncios profissionais com IA.

✅ Remove fundo automaticamente
✅ Cria descrições que vendem
✅ Gera imagens para redes sociais
✅ Integra com Mercado Livre, Shopee e mais

Por apenas R$ XX/mês ou GRÁTIS para começar!

⏰ Promoção válida até [DATA]

👉 Clique no link da bio e comece agora!`,
  },
  engajamento: {
    id: 'engajamento',
    title: 'Legenda de Engajamento',
    icon: '🗣️',
    text: `Qual dessas opções você prefere? 👇

A) Passar 2 horas editando uma foto no Photoshop
B) Deixar a IA fazer em 3 segundos

Comenta aqui! 💬

Se você escolheu B, tem um link especial na bio esperando por você... 😉`,
  },
};

export const PROJECT_MATERIALS = {
  sobre: {
    id: 'sobre',
    title: 'Sobre a Plataforma',
    icon: '📋',
    content: `**Anúncios Que Vende** é uma plataforma de Inteligência Artificial que transforma fotos simples de produtos em anúncios profissionais para marketplaces.

**O que fazemos:**
• Remoção automática de fundo com IA
• Geração de descrições otimizadas para SEO
• Criação de imagens para redes sociais
• Integração direta com Mercado Livre, Shopee, Amazon e mais

**Nossos Diferenciais:**
• 3 Agentes de IA especializados (ATLAS, LYRA, ORION)
• Processamento em segundos, não horas
• Economia de até 80% em custos com designer
• Aumento médio de 40% na taxa de conversão

**Números:**
• +10.000 anúncios criados
• 8+ integrações com marketplaces
• 99.2% de uptime
• 98% de satisfação dos clientes`,
  },
  pitch: {
    id: 'pitch',
    title: 'Pitch para Parceiros',
    icon: '🤝',
    content: `**Para WhatsApp/E-mail:**

Olá! Tudo bem?

Tenho uma ferramenta que pode ajudar vendedores como você a vender mais nos marketplaces.

Com nossa IA, você:
✅ Transforma fotos simples em anúncios profissionais
✅ Gera descrições que aparecem nas buscas
✅ Cria conteúdo para redes sociais automaticamente

Tudo em segundos, sem precisar de Photoshop ou contratar designer.

Quer testar grátis? Me avisa que te mando o link!

---

**Para Afiliados:**

Ganhe comissão divulgando nossa plataforma!

• Comissão de XX% por venda
• Material de marketing pronto
• Dashboard para acompanhar conversões
• Pagamento mensal via Pix

Interesse? Responda este e-mail para mais detalhes.`,
  },
  faq: {
    id: 'faq',
    title: 'FAQ - Perguntas Frequentes',
    icon: '❓',
    content: `**1. Preciso saber editar fotos?**
Não! Nossa IA faz tudo automaticamente. Basta fazer upload da foto.

**2. Funciona com qualquer produto?**
Sim! Roupas, eletrônicos, móveis, cosméticos... qualquer produto pode ser melhorado.

**3. Quanto tempo leva?**
Segundos! O processamento é quase instantâneo.

**4. Posso usar as imagens em qualquer lugar?**
Sim! Você tem direito total sobre as imagens geradas.

**5. Tem integração com meu marketplace?**
Temos integração com Mercado Livre, Shopee, Amazon, Magalu, Bling e Olist Tiny. TikTok Shop e Shein em breve!

**6. Quanto custa?**
Temos plano gratuito para testar. Planos pagos a partir de R$ XX/mês.

**7. Como funciona o suporte?**
Suporte 24/7 via chat e e-mail. Tempo médio de resposta: 2 horas.

**8. Posso cancelar quando quiser?**
Sim! Sem fidelidade ou multa. Cancele quando quiser.`,
  },
};

export const TUTORIALS = {
  primeirosPassos: {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    icon: '🚀',
    steps: [
      { step: 1, title: 'Crie sua conta', description: 'Acesse o site e clique em "Assinar Agora". Preencha seus dados e confirme o e-mail.' },
      { step: 2, title: 'Faça upload do produto', description: 'Na dashboard, clique em "Novo Produto" e faça upload da foto. Pode ser foto de celular mesmo!' },
      { step: 3, title: 'Deixe a IA trabalhar', description: 'Nossos agentes ATLAS, LYRA e ORION vão processar sua imagem automaticamente.' },
      { step: 4, title: 'Baixe ou publique', description: 'Em segundos, você terá: foto com fundo removido, descrição otimizada e imagens para redes sociais.' },
    ],
  },
  integracoes: {
    id: 'integracoes',
    title: 'Configurar Integrações',
    icon: '🔗',
    steps: [
      { step: 1, title: 'Acesse Integrações', description: 'No menu lateral, clique em "Integrações" ou "Marketplaces".' },
      { step: 2, title: 'Escolha o marketplace', description: 'Selecione Mercado Livre, Shopee, Amazon ou outro marketplace disponível.' },
      { step: 3, title: 'Autorize a conexão', description: 'Siga o processo de autorização do marketplace. Isso permite que enviemos anúncios diretamente.' },
      { step: 4, title: 'Sincronize produtos', description: 'Após conectar, seus produtos serão sincronizados automaticamente.' },
    ],
  },
  dicasResultados: {
    id: 'dicas-resultados',
    title: 'Dicas para Melhores Resultados',
    icon: '💡',
    steps: [
      { step: 1, title: 'Use fotos com boa iluminação', description: 'Mesmo que a IA melhore, fotos bem iluminadas geram resultados superiores.' },
      { step: 2, title: 'Produto centralizado', description: 'Posicione o produto no centro da foto para melhor remoção de fundo.' },
      { step: 3, title: 'Múltiplos ângulos', description: 'Faça upload de várias fotos do mesmo produto para anúncios mais completos.' },
      { step: 4, title: 'Revise as descrições', description: 'A IA gera textos otimizados, mas uma revisão rápida pode personalizar ainda mais.' },
    ],
  },
};

// Conteúdo sobre Branding e Identidade Visual
export const BRANDING_CONTENT = {
  importancia: {
    id: 'importancia-brand',
    title: 'Por que Branding Importa?',
    icon: '🏆',
    content: `A logo da sua empresa em TODA imagem de produto cria:

**RECONHECIMENTO INSTANTÂNEO**
• Clientes reconhecem sua marca entre centenas de anúncios
• Cria familiaridade = confiança = mais vendas

**PROTEÇÃO CONTRA CÓPIAS**
• Concorrentes não podem copiar suas fotos
• Suas imagens são únicas e proprietárias
• Ninguém usa seu conteúdo como se fosse próprio

**DESTAQUE NAS BUSCAS**
• Anúncios com identidade visual se destacam
• Primeiras posições = mais cliques = mais vendas

**RECORRÊNCIA DE VENDAS**
• Cliente que comprou uma vez reconhece sua marca
• Quando buscar novo produto, prefere quem já conhece
• Fidelização natural através da identidade visual`
  },

  comoUsar: {
    id: 'como-usar-brand',
    title: 'Como Configurar sua Marca',
    icon: '⚙️',
    steps: [
      { step: 1, title: 'Acesse Configurações', description: 'No menu lateral, vá em "Configurações" > "Configurações da Marca"' },
      { step: 2, title: 'Faça upload da logo', description: 'Envie sua logo em PNG (fundo transparente recomendado) ou JPG' },
      { step: 3, title: 'Escolha a posição', description: 'Defina onde a logo aparece: canto superior, inferior, esquerda ou direita' },
      { step: 4, title: 'Ajuste o tamanho', description: 'Use o slider para definir o tamanho ideal (50px a 200px)' },
      { step: 5, title: 'Ative nos templates', description: 'Marque "Mostrar em templates" para aplicar automaticamente' },
    ]
  },

  dicasLogo: {
    id: 'dicas-logo',
    title: 'Dicas para uma Logo Eficiente',
    icon: '💡',
    tips: [
      { titulo: 'Use fundo transparente', descricao: 'PNG com transparência se integra melhor às imagens' },
      { titulo: 'Tamanho ideal: 80-100px', descricao: 'Visível mas não compete com o produto' },
      { titulo: 'Posição bottom-right', descricao: 'Padrão profissional, não interfere no produto' },
      { titulo: 'Cores contrastantes', descricao: 'Logo deve ser visível em fundos claros e escuros' },
      { titulo: 'Versão simplificada', descricao: 'Para logos complexas, use versão reduzida ou ícone' },
    ]
  },

  roteirosVideo: {
    id: 'roteiro-brand',
    title: 'Roteiro: Vídeo sobre Branding',
    icon: '🎬',
    duration: '45 segundos',
    sections: [
      { label: 'GANCHO', time: '5s', text: '"Sabia que suas fotos de produto podem estar sendo ROUBADAS agora mesmo?"' },
      { label: 'PROBLEMA', time: '10s', text: '"Concorrentes copiam suas fotos e vendem mais barato. Você perde vendas com seu próprio trabalho."' },
      { label: 'SOLUÇÃO', time: '15s', text: '"Com nossa marca d\'água automática, sua logo aparece em TODA imagem. Impossível copiar."' },
      { label: 'BENEFÍCIOS', time: '10s', text: '"Clientes reconhecem sua marca. Voltam a comprar. Indicam para amigos."' },
      { label: 'CTA', time: '5s', text: '"Configure sua marca em 2 minutos. Link na bio!"' },
    ],
  },

  legendaBrand: {
    id: 'legenda-brand',
    title: 'Legenda: Post sobre Branding',
    icon: '📱',
    text: `🛡️ Você protege suas fotos de produto?

Se a resposta é NÃO, seus concorrentes podem estar:
❌ Copiando suas imagens
❌ Vendendo mais barato
❌ Lucrando com SEU trabalho

Com nossa plataforma, sua LOGO aparece automaticamente em TODA imagem.

Benefícios imediatos:
✅ Proteção contra cópia
✅ Reconhecimento de marca
✅ Destaque nos resultados
✅ Clientes que voltam

Configure em 2 minutos. Link na bio! 🔗

#branding #protecaomarca #ecommerce #marketplace #vendasonline`
  }
};

// Conteúdo Comparativo: Photoshop vs IA
export const COMPARATIVO_PHOTOSHOP = {
  roteiroPrincipal: {
    id: 'photoshop-vs-ia',
    title: 'Vídeo: Photoshop vs IA (60s)',
    icon: '🎬',
    duration: '60 segundos',
    sections: [
      {
        label: 'GANCHO',
        time: '5s',
        text: '"Quanto você PAGA para criar uma única imagem de produto?"'
      },
      {
        label: 'DOR PHOTOSHOP',
        time: '15s',
        text: '"No Photoshop tradicional:\n⏰ 30 minutos para remover fundo\n⏰ +20 minutos para ajustar cores\n⏰ +15 minutos para adicionar textos\n= 1 HORA por produto.\n\nE se você tem 50 produtos? São 50 HORAS de trabalho."'
      },
      {
        label: 'CUSTO REAL',
        time: '10s',
        text: '"Contratar um designer? R$ 15 a R$ 50 por imagem.\n50 produtos = R$ 750 a R$ 2.500 por mês.\nFora o tempo de briefing, revisões, ajustes..."'
      },
      {
        label: 'VIRADA',
        time: '15s',
        text: '"E se eu te dissesse que você pode fazer TUDO isso em 3 SEGUNDOS?\n\nCom nossa IA:\n✅ Upload da foto\n✅ Fundo removido automaticamente\n✅ Descrição criada\n✅ E o melhor: SUA LOGO aplicada automaticamente!"'
      },
      {
        label: 'DIFERENCIAL',
        time: '10s',
        text: '"Sua marca em TODA imagem. Ninguém copia. Clientes reconhecem. Você vende MAIS."'
      },
      {
        label: 'CTA',
        time: '5s',
        text: '"Pare de perder tempo e dinheiro. Link na bio - comece AGORA!"'
      },
    ]
  },

  roteiroReels: {
    id: 'photoshop-reels',
    title: 'Reels: Tempo vs Resultado (15s)',
    icon: '📱',
    duration: '15 segundos',
    sections: [
      {
        label: 'SPLIT SCREEN',
        time: '5s',
        text: '[Lado esquerdo: cronômetro rodando 1 hora]\n[Lado direito: IA processando em 3 segundos]\n"Photoshop: 1 hora. Nossa IA: 3 segundos."'
      },
      {
        label: 'REVEAL',
        time: '7s',
        text: '[Mostra imagem final com logo]\n"E ainda coloca SUA MARCA automaticamente. Ninguém copia."'
      },
      {
        label: 'CTA',
        time: '3s',
        text: '"Link na bio. Teste grátis!"'
      },
    ]
  },

  carrosselComparativo: {
    id: 'carrossel-photoshop',
    title: 'Carrossel: Comparativo (7 slides)',
    icon: '🎴',
    slides: 7,
    content: [
      'Slide 1: "Você ainda usa PHOTOSHOP para criar anúncios?" (fundo vermelho, texto impactante)',
      'Slide 2: "⏰ TEMPO GASTO:\n\nPhotoshop: 45-60 min por imagem\nNossa IA: 3 segundos\n\n= Economia de 99% do tempo"',
      'Slide 3: "💰 CUSTO:\n\nDesigner: R$15-50 por imagem\nNossa IA: centavos\n\n50 produtos = R$2.500 vs R$25"',
      'Slide 4: "🎓 CONHECIMENTO:\n\nPhotoshop: Curso de meses para dominar\nNossa IA: Upload e pronto\n\nZero conhecimento técnico necessário"',
      'Slide 5: "🛡️ DIFERENCIAL EXCLUSIVO:\n\nSua LOGO em toda imagem\nNinguém copia suas fotos\nClientes reconhecem sua marca"',
      'Slide 6: "📈 RESULTADO:\n\n✅ Mais vendas\n✅ Menos trabalho\n✅ Marca reconhecida\n✅ Tempo livre"',
      'Slide 7: "🚀 Comece agora - Link na bio!\n\nPrimeiras imagens GRÁTIS\nSem cartão de crédito"'
    ]
  },

  legendaComparativo: {
    id: 'legenda-photoshop',
    title: 'Legenda: Economia de Tempo',
    icon: '📝',
    text: `⏰ Quanto tempo você PERDE criando imagens?

Photoshop tradicional:
❌ 45-60 minutos por produto
❌ Precisar saber editar
❌ Contratar designer (R$15-50/imagem)
❌ Briefing, revisões, ajustes...

Com nossa IA:
✅ 3 SEGUNDOS por produto
✅ Zero conhecimento técnico
✅ Fração do custo
✅ Upload e pronto!

🏆 E O DIFERENCIAL QUE NINGUÉM TEM:

Sua LOGO aparece automaticamente em TODA imagem.

Isso significa:
🛡️ Proteção contra cópias
👁️ Reconhecimento instantâneo
💰 Clientes que voltam a comprar
📈 Destaque nos resultados

Enquanto você perde HORAS no Photoshop...
Seu concorrente já criou 100 anúncios com a marca dele.

🔗 Link na bio - Teste GRÁTIS!

#photoshop #designgrafico #ecommerce #marketplace #produtividade #ia #inteligenciaartificial #vendasonline`
  },

  tabelaComparativo: {
    id: 'tabela-comparativo',
    title: 'Tabela: Comparativo Completo',
    icon: '📊',
    comparisons: [
      { aspecto: 'Tempo por imagem', photoshop: '45-60 minutos', ia: '3 segundos' },
      { aspecto: 'Custo por imagem', photoshop: 'R$ 15-50 (designer)', ia: 'Centavos' },
      { aspecto: 'Conhecimento necessário', photoshop: 'Curso de meses', ia: 'Nenhum' },
      { aspecto: 'Remoção de fundo', photoshop: 'Manual, trabalhoso', ia: 'Automático, perfeito' },
      { aspecto: 'Textos persuasivos', photoshop: 'Você escreve', ia: 'IA cria para você' },
      { aspecto: 'Logo/Branding', photoshop: 'Adicionar manualmente', ia: 'Automático em tudo' },
      { aspecto: 'Proteção contra cópia', photoshop: 'Não tem', ia: 'Logo como marca d\'água' },
      { aspecto: 'Escalabilidade', photoshop: '10 produtos = 10 horas', ia: '10 produtos = 30 segundos' },
    ]
  },

  storiesSequenciais: {
    id: 'stories-photoshop',
    title: 'Stories: Sequência (5 stories)',
    icon: '📲',
    duration: '5 stories',
    sections: [
      { label: 'STORY 1', time: 'DOR', text: '⏰ "1 hora editando UMA foto de produto no Photoshop..."\n\n[Fundo: vermelho, emoji de cansaço]' },
      { label: 'STORY 2', time: 'CUSTO', text: '💸 "...ou R$ 30 para o designer fazer..."\n\n[Fundo: laranja, calculadora]' },
      { label: 'STORY 3', time: 'SOLUÇÃO', text: '🤖 "E se eu te contar que dá pra fazer em 3 SEGUNDOS?"\n\n[Fundo: azul, robô/IA]' },
      { label: 'STORY 4', time: 'DIFERENCIAL', text: '🏆 "E ainda coloca SUA LOGO automaticamente?\nNinguém copia. Todos reconhecem."\n\n[Fundo: dourado, coroa]' },
      { label: 'STORY 5', time: 'CTA', text: '👆 "Arrasta pra cima e testa GRÁTIS!"\n\n[Link do produto, fundo verde]' },
    ]
  },

  numerosCriticos: {
    id: 'numeros-criticos',
    title: 'Números para Marketing',
    icon: '🔢',
    stats: [
      { numero: '1 hora', label: 'Tempo médio no Photoshop por imagem' },
      { numero: '3 seg', label: 'Tempo na nossa IA' },
      { numero: 'R$ 50', label: 'Custo médio de designer por imagem' },
      { numero: '99%', label: 'Economia de tempo' },
      { numero: '50x', label: 'Mais rápido que manual' },
      { numero: '100%', label: 'Imagens com sua marca' },
    ]
  }
};

// Conteúdo de Marketing para Upscale 4K / Super Resolução
export const UPSCALE_4K_CONTENT = {
  roteiroPrincipal: {
    id: 'upscale-video-principal',
    title: 'Vídeo: Upscale 4K (60s)',
    icon: '🎬',
    duration: '60 segundos',
    sections: [
      {
        label: 'GANCHO',
        time: '5s',
        text: '"Suas fotos de produto parecem PIXELADAS no zoom?"'
      },
      {
        label: 'PROBLEMA',
        time: '12s',
        text: '"Fotos em baixa resolução = menos confiança = menos vendas.\n\nClientes querem ver DETALHES antes de comprar.\n72% desistem quando não conseguem ver os detalhes do produto."'
      },
      {
        label: 'SOLUÇÃO',
        time: '15s',
        text: '"Com o Upscale 4K do ORION, transformamos qualquer foto em alta definição.\n\nAmplie 4x sem perder qualidade!\nFoto de celular vira foto profissional."'
      },
      {
        label: 'DEMO',
        time: '18s',
        text: '"Olha só: foto de celular comum → passa pelo ORION → imagem 4K profissional.\n\nCada detalhe do produto visível:\n• Costuras\n• Texturas\n• Acabamentos"'
      },
      {
        label: 'DIFERENCIAL',
        time: '7s',
        text: '"E com sua logo aplicada automaticamente, ninguém pode copiar suas fotos em alta resolução."'
      },
      {
        label: 'CTA',
        time: '5s',
        text: '"Teste grátis agora! Link na bio."'
      },
    ]
  },

  roteiroReels: {
    id: 'upscale-reels',
    title: 'Reels: Antes/Depois 4K (15s)',
    icon: '📱',
    duration: '15 segundos',
    sections: [
      {
        label: 'VISUAL',
        time: '5s',
        text: '[Split: Foto pixelada → Zoom → 4K nítida]\n"De pixelado para PERFEITO"'
      },
      {
        label: 'IMPACTO',
        time: '7s',
        text: '"4x mais resolução.\nZero esforço.\nIA faz tudo em segundos."'
      },
      {
        label: 'CTA',
        time: '3s',
        text: '"Link na bio!"'
      },
    ]
  },

  storiesSequenciais: {
    id: 'upscale-stories',
    title: 'Stories: Sequência 4K (4 stories)',
    icon: '📲',
    duration: '4 stories',
    sections: [
      { label: 'STORY 1', time: 'DOR', text: '📸 "Suas fotos parecem BORRADAS quando o cliente dá zoom?"\n\n[Fundo: vermelho, emoji de olho]' },
      { label: 'STORY 2', time: 'DADO', text: '🔍 "72% dos compradores desistem por não ver detalhes do produto"\n\n[Fundo: laranja, gráfico]' },
      { label: 'STORY 3', time: 'SOLUÇÃO', text: '✨ "ORION 4K: Amplia 4x mantendo cada detalhe perfeito"\n\n[Fundo: azul, antes/depois]' },
      { label: 'STORY 4', time: 'CTA', text: '👆 "Arrasta pra cima e teste GRÁTIS!"\n\n[Link do produto, fundo verde]' },
    ]
  },

  carrosselEducativo: {
    id: 'upscale-carrossel',
    title: 'Carrossel: Qualidade de Imagem (6 slides)',
    icon: '🎴',
    slides: 6,
    content: [
      'Slide 1: "Por que suas fotos parecem BORRADAS no marketplace? 🔍"',
      'Slide 2: "O PROBLEMA:\n\nFotos de celular = 2-4 megapixels\nMarketplaces mostram em tela cheia\n= Imagem esticada e pixelada"',
      'Slide 3: "O RESULTADO:\n\n❌ Imagem pixelada no zoom\n❌ Cliente desconfia da qualidade\n❌ Não compra"',
      'Slide 4: "A SOLUÇÃO:\n\n✅ Upscale 4K com IA\n✅ Ampliamos 4x a resolução\n✅ Nitidez perfeita mantida"',
      'Slide 5: "ANTES/DEPOIS:\n\n[Comparativo visual]\n\nCada costura, textura e detalhe visível.\nFoto de celular → Qualidade profissional"',
      'Slide 6: "🚀 Teste grátis - Link na bio!\n\nTransforme suas fotos em 4K\nEm segundos, com IA"'
    ]
  },

  legendaAltoImpacto: {
    id: 'upscale-legenda',
    title: 'Legenda: Teste do Zoom',
    icon: '📝',
    text: `🔍 Suas fotos passam no TESTE DO ZOOM?

Quando o cliente amplia sua imagem no marketplace:
❌ Fica borrada?
❌ Parece pixelada?
❌ Perde detalhes importantes?

Isso MATA suas vendas.

72% dos compradores desistem quando não conseguem ver os detalhes do produto.

💎 Com o Upscale 4K do ORION:
✅ Resolução 4x maior
✅ Detalhes nítidos no zoom
✅ Qualidade profissional instantânea
✅ Sua logo em alta definição

De foto de celular → imagem de catálogo.
Em segundos. Com IA.

🔗 Link na bio - teste grátis!

#upscale4k #qualidadedeimagem #ecommerce #marketplace #fotodeproduto #resolucao4k #vendasonline`
  },

  legendaTecnica: {
    id: 'upscale-legenda-tecnica',
    title: 'Legenda: Técnica/Educativa',
    icon: '🎓',
    text: `📸 O que é UPSCALE 4K e por que você PRECISA disso?

Quando você tira uma foto com celular, ela tem ~4 megapixels.
Quando o cliente dá zoom no marketplace, a imagem ESTICA.

Resultado? Foto borrada, pixelada, sem detalhes.

🤖 O Upscale 4K usa Inteligência Artificial para:

1️⃣ Analisar cada pixel da sua foto
2️⃣ "Adivinhar" os pixels que faltam
3️⃣ Aumentar 4x a resolução
4️⃣ Manter (e até melhorar) a nitidez

É como ter uma câmera profissional sem gastar R$ 10.000.

💡 Melhor parte:
Funciona com fotos que você JÁ TEM.
Não precisa fotografar tudo de novo.

🔗 Link na bio - Teste grátis!

#upscale #ia #inteligenciaartificial #ecommerce #fotografia #marketplace`
  },

  numerosCriticos: {
    id: 'upscale-numeros',
    title: 'Números para Marketing',
    icon: '🔢',
    stats: [
      { numero: '4x', label: 'Aumento de resolução' },
      { numero: '72%', label: 'Clientes que desistem por fotos ruins' },
      { numero: '8K', label: 'Resolução máxima alcançável' },
      { numero: '3 seg', label: 'Tempo de processamento' },
      { numero: '100%', label: 'Nitidez preservada' },
      { numero: '0', label: 'Conhecimento técnico necessário' },
    ]
  },

  tabelaComparativo: {
    id: 'upscale-tabela',
    title: 'Tabela: Foto Original vs 4K',
    icon: '📊',
    comparisons: [
      { aspecto: 'Resolução', antes: '1080p (2 MP)', depois: '4K (8 MP)' },
      { aspecto: 'Zoom do cliente', antes: 'Fica pixelado', depois: 'Nítido e claro' },
      { aspecto: 'Detalhes visíveis', antes: 'Poucos', depois: 'Todos' },
      { aspecto: 'Confiança do cliente', antes: 'Baixa', depois: 'Alta' },
      { aspecto: 'Taxa de conversão', antes: 'Menor', depois: 'Até 40% maior' },
      { aspecto: 'Profissionalismo', antes: 'Amador', depois: 'Profissional' },
    ]
  }
};

// =============================================================================
// VÍDEO COMPLETO DO SISTEMA - Roteiro com falas de 7 segundos
// =============================================================================

export const VIDEO_COMPLETO_CONTENT = {
  meta: {
    id: 'video-completo-sistema',
    title: 'Vídeo Completo do Sistema',
    subtitle: 'Roteiro com falas de 7 segundos - Fácil de gravar e editar',
    icon: '🎬',
    totalSegmentos: 26,
    duracaoTotal: '~3 minutos',
  },

  blocos: [
    {
      id: 'abertura',
      nome: 'ABERTURA',
      cor: 'purple',
      icon: '🎯',
      segmentos: [
        { num: 1, tempo: '7s', texto: 'Você passa HORAS editando fotos de produto e ainda vende pouco?' },
        { num: 2, tempo: '7s', texto: 'E se eu te mostrasse uma forma de criar anúncios profissionais em SEGUNDOS?' },
        { num: 3, tempo: '7s', texto: 'Fica comigo até o final que vou te mostrar como funciona tudo isso.' },
      ]
    },
    {
      id: 'problema',
      nome: 'O PROBLEMA',
      cor: 'red',
      icon: '❌',
      segmentos: [
        { num: 4, tempo: '7s', texto: 'Fotos amadoras fazem você perder vendas todos os dias no marketplace.' },
        { num: 5, tempo: '7s', texto: 'Contratar fotógrafo ou designer custa caro e demora pra entregar.' },
        { num: 6, tempo: '7s', texto: 'E pior: seus concorrentes COPIAM suas fotos e vendem mais barato.' },
      ]
    },
    {
      id: 'solucao',
      nome: 'A SOLUÇÃO',
      cor: 'green',
      icon: '✨',
      segmentos: [
        { num: 7, tempo: '7s', texto: 'Apresento a você: Anúncios Que Vende. Três agentes de IA trabalhando juntos.' },
        { num: 8, tempo: '7s', texto: 'São eles: ATLAS, LYRA e ORION. Cada um com uma missão específica.' },
      ]
    },
    {
      id: 'atlas',
      nome: 'AGENTE ATLAS',
      cor: 'cyan',
      icon: '🔷',
      segmentos: [
        { num: 9, tempo: '7s', texto: 'ATLAS é o Estrategista. Ele analisa sua foto e remove o fundo automaticamente.' },
        { num: 10, tempo: '7s', texto: 'Ajusta iluminação, corrige cores e prepara a imagem para os marketplaces.' },
        { num: 11, tempo: '7s', texto: 'Tudo que um designer faria em 1 hora, ATLAS faz em 3 segundos.' },
      ]
    },
    {
      id: 'lyra',
      nome: 'AGENTE LYRA',
      cor: 'violet',
      icon: '💜',
      segmentos: [
        { num: 12, tempo: '7s', texto: 'LYRA é a Persuasora. Ela cria títulos e descrições que vendem.' },
        { num: 13, tempo: '7s', texto: 'Usa palavras-chave que fazem seu produto aparecer nas primeiras posições.' },
        { num: 14, tempo: '7s', texto: 'Textos otimizados para SEO que aumentam suas chances de conversão.' },
      ]
    },
    {
      id: 'orion',
      nome: 'AGENTE ORION',
      cor: 'orange',
      icon: '🔶',
      segmentos: [
        { num: 15, tempo: '7s', texto: 'ORION é o Artista. Ele cria imagens prontas para redes sociais.' },
        { num: 16, tempo: '7s', texto: 'E tem o Upscale 4K: amplia suas fotos sem perder qualidade nenhuma.' },
        { num: 17, tempo: '7s', texto: 'Cada detalhe do produto visível quando o cliente dá zoom no anúncio.' },
      ]
    },
    {
      id: 'branding',
      nome: 'BRANDING AUTOMÁTICO',
      cor: 'amber',
      icon: '👑',
      segmentos: [
        { num: 18, tempo: '7s', texto: 'E aqui vem o diferencial: sua LOGO aparece em TODA imagem automaticamente.' },
        { num: 19, tempo: '7s', texto: 'Ninguém consegue copiar suas fotos. Sua marca fica protegida sempre.' },
        { num: 20, tempo: '7s', texto: 'Clientes reconhecem sua loja, voltam a comprar e indicam para amigos.' },
      ]
    },
    {
      id: 'custos',
      nome: 'CUSTOS E ECONOMIA',
      cor: 'emerald',
      icon: '💰',
      segmentos: [
        { num: 21, tempo: '7s', texto: 'Quanto custa? Muito menos do que você imagina. Funciona por créditos.' },
        { num: 22, tempo: '7s', texto: 'Cada imagem processada custa centavos. Designer cobra 15 a 50 reais.' },
        { num: 23, tempo: '7s', texto: '50 produtos no mês? Você economiza mais de 2 mil reais fácil.' },
      ]
    },
    {
      id: 'cta',
      nome: 'CHAMADA FINAL',
      cor: 'gradient',
      icon: '🚀',
      segmentos: [
        { num: 24, tempo: '7s', texto: 'Funciona com Mercado Livre, Shopee, Amazon, Magalu e muito mais.' },
        { num: 25, tempo: '7s', texto: 'Acesse agora pelo link na bio. É só fazer upload e deixar a IA trabalhar.' },
        { num: 26, tempo: '7s', texto: 'Para de perder tempo com Photoshop. Vende mais com menos esforço!' },
      ]
    },
  ],

  resumoTopicos: [
    { topico: 'O que é o sistema', blocos: ['solucao'] },
    { topico: 'Agente ATLAS', blocos: ['atlas'] },
    { topico: 'Agente LYRA', blocos: ['lyra'] },
    { topico: 'Agente ORION', blocos: ['orion'] },
    { topico: 'Branding/Logo', blocos: ['branding'] },
    { topico: 'Custos/Preços', blocos: ['custos'] },
    { topico: 'Conversão/Vendas', blocos: ['problema', 'lyra', 'branding', 'cta'] },
    { topico: 'Marketplaces', blocos: ['cta'] },
  ]
};

// =============================================================================
// NOVO ROTEIRO UGC COMPLETO — SaaS DE GERAÇÃO DE IMAGENS
// =============================================================================

export const ROTEIRO_UGC_SAAS = {
  meta: {
    id: 'roteiro-ugc-saas',
    title: 'Roteiro UGC Completo - SaaS',
    subtitle: 'Roteiro focado em conversão e quebra de objeções',
    icon: '🎬',
    totalSegmentos: 52,
    duracaoTotal: '~6 minutos',
  },

  blocos: [
    {
      id: 'bloco1',
      nome: 'BLOCO 1 — CHAMADA / INTERRUPÇÃO',
      cor: 'purple',
      icon: '⚡',
      segmentos: [
        { num: 1, tempo: '7s', texto: 'Se seus anúncios parecem iguais aos da concorrência, esse é o problema.' },
        { num: 2, tempo: '7s', texto: 'Hoje todo mundo vende o mesmo produto… com a mesma imagem.' },
        { num: 3, tempo: '7s', texto: 'E aí o cliente só compara preço. Quem perde? Você.' },
      ]
    },
    {
      id: 'bloco2',
      nome: 'BLOCO 2 — DOR REAL DO SELLER',
      cor: 'red',
      icon: '😩',
      segmentos: [
        { num: 4, tempo: '7s', texto: 'Você posta anúncio, não ranqueia e não entende o motivo.' },
        { num: 5, tempo: '7s', texto: 'Ou até vende… mas vive refém de promoção.' },
        { num: 6, tempo: '7s', texto: 'Porque sem marca, sem identidade, ninguém lembra de você.' },
      ]
    },
    {
      id: 'bloco3',
      nome: 'BLOCO 3 — VIRADA DE CONSCIÊNCIA',
      cor: 'green',
      icon: '💡',
      segmentos: [
        { num: 7, tempo: '7s', texto: 'O problema não é o produto. É como ele é apresentado.' },
        { num: 8, tempo: '7s', texto: 'Imagem genérica não cria valor. Marca cria.' },
        { num: 9, tempo: '7s', texto: 'Marketplace não premia preço baixo. Premia profissionalismo.' },
      ]
    },
    {
      id: 'bloco4',
      nome: 'BLOCO 4 — INTRODUÇÃO DA SOLUÇÃO',
      cor: 'cyan',
      icon: '🚀',
      segmentos: [
        { num: 10, tempo: '7s', texto: 'Foi por isso que eu comecei a usar essa ferramenta.' },
        { num: 11, tempo: '7s', texto: 'Ela não gera só imagens. Ela cria anúncios completos.' },
        { num: 12, tempo: '7s', texto: 'Tudo já sai pronto para vender.' },
      ]
    },
    {
      id: 'bloco5',
      nome: 'BLOCO 5 — IMAGENS + IDENTIDADE VISUAL',
      cor: 'violet',
      icon: '👑',
      segmentos: [
        { num: 13, tempo: '7s', texto: 'Cada imagem já vem com a logo da sua marca.' },
        { num: 14, tempo: '7s', texto: 'Isso cria identidade visual única em todos os anúncios.' },
        { num: 15, tempo: '7s', texto: 'E impede que concorrente copie e use igual.' },
      ]
    },
    {
      id: 'bloco6',
      nome: 'BLOCO 6 — VARIAÇÃO DE ANÚNCIOS',
      cor: 'orange',
      icon: '🔄',
      segmentos: [
        { num: 16, tempo: '7s', texto: 'Até seis imagens formam um anúncio profissional completo.' },
        { num: 17, tempo: '7s', texto: 'Mais imagens? Você cria vários anúncios diferentes.' },
        { num: 18, tempo: '7s', texto: 'Tudo com a mesma identidade visual.' },
      ]
    },
    {
      id: 'bloco7',
      nome: 'BLOCO 7 — QUALIDADE PREMIUM (UPSCALE)',
      cor: 'amber',
      icon: '💎',
      segmentos: [
        { num: 19, tempo: '7s', texto: 'Depois da geração, as imagens passam por upscale automático.' },
        { num: 20, tempo: '7s', texto: 'Mais nitidez, mais qualidade, mais aparência premium.' },
        { num: 21, tempo: '7s', texto: 'Imagem comum parece amadora. Essa não.' },
      ]
    },
    {
      id: 'bloco8',
      nome: 'BLOCO 8 — O QUE VEM JUNTO',
      cor: 'emerald',
      icon: '🎁',
      segmentos: [
        { num: 22, tempo: '7s', texto: 'Mas não para só na imagem.' },
        { num: 23, tempo: '7s', texto: 'A ferramenta entrega descrição SEO otimizada.' },
        { num: 24, tempo: '7s', texto: 'Palavras-chave e títulos prontos para ranquear.' },
      ]
    },
    {
      id: 'bloco9',
      nome: 'BLOCO 9 — COPY E CONVERSÃO',
      cor: 'purple',
      icon: '📝',
      segmentos: [
        { num: 25, tempo: '7s', texto: 'Ela também cria copy profissional de venda.' },
        { num: 26, tempo: '7s', texto: 'Texto pensado para converter, não só descrever.' },
        { num: 27, tempo: '7s', texto: 'Isso muda totalmente o resultado.' },
      ]
    },
    {
      id: 'bloco10',
      nome: 'BLOCO 10 — PRECIFICAÇÃO AUTOMÁTICA',
      cor: 'red',
      icon: '💰',
      segmentos: [
        { num: 28, tempo: '7s', texto: 'Ainda gera uma página de precificação automática.' },
        { num: 29, tempo: '7s', texto: 'Com margem real e lucro calculado.' },
        { num: 30, tempo: '7s', texto: 'Sem chutar preço.' },
      ]
    },
    {
      id: 'bloco11',
      nome: 'BLOCO 11 — KIT COMPLETO DE MARKETPLACE',
      cor: 'green',
      icon: '🛍️',
      segmentos: [
        { num: 31, tempo: '7s', texto: 'Vem com estratégias de venda e kits criativos.' },
        { num: 32, tempo: '7s', texto: 'E até gerador de EAN válido.' },
        { num: 33, tempo: '7s', texto: 'Pronto para Mercado Livre, Amazon e Shopee.' },
      ]
    },
    {
      id: 'bloco12',
      nome: 'BLOCO 12 — PACOTES',
      cor: 'cyan',
      icon: '📦',
      segmentos: [
        { num: 34, tempo: '7s', texto: 'Você escolhe o pacote conforme sua estratégia.' },
        { num: 35, tempo: '7s', texto: 'Do básico até o mais completo.' },
        { num: 36, tempo: '7s', texto: 'Tudo pensado para ranquear e escalar.' },
      ]
    },
    {
      id: 'bloco13',
      nome: 'BLOCO 13 — QUEBRA DE OBJEÇÃO: “É CARO?”',
      cor: 'violet',
      icon: '💸',
      segmentos: [
        { num: 37, tempo: '7s', texto: 'Muita gente acha caro antes de testar.' },
        { num: 38, tempo: '7s', texto: 'Mas um anúncio que vende paga tudo.' },
        { num: 39, tempo: '7s', texto: 'O caro é não vender.' },
      ]
    },
    {
      id: 'bloco14',
      nome: 'BLOCO 14 — QUEBRA DE OBJEÇÃO: “SOZINHO?”',
      cor: 'orange',
      icon: '🙋',
      segmentos: [
        { num: 40, tempo: '7s', texto: 'Dá pra fazer sozinho?' },
        { num: 41, tempo: '7s', texto: 'Sim. Com várias ferramentas, tempo e custo.' },
        { num: 42, tempo: '7s', texto: 'Aqui é tudo em um comando.' },
      ]
    },
    {
      id: 'bloco15',
      nome: 'BLOCO 15 — PROVA LÓGICA',
      cor: 'amber',
      icon: '🧠',
      segmentos: [
        { num: 43, tempo: '7s', texto: 'Quem usa imagem genérica compete por preço.' },
        { num: 44, tempo: '7s', texto: 'Quem cria marca compete por valor.' },
        { num: 45, tempo: '7s', texto: 'E valor vende melhor.' },
      ]
    },
    {
      id: 'bloco16',
      nome: 'BLOCO 16 — DECISÃO',
      cor: 'emerald',
      icon: '🚪',
      segmentos: [
        { num: 46, tempo: '7s', texto: 'Se você quer continuar igual, não muda nada.' },
        { num: 47, tempo: '7s', texto: 'Mas se quer se destacar, isso resolve.' },
        { num: 48, tempo: '7s', texto: 'Simples assim.' },
      ]
    },
    {
      id: 'bloco17',
      nome: 'BLOCO 17 — CTA FINAL',
      cor: 'gradient',
      icon: '📣',
      segmentos: [
        { num: 49, tempo: '7s', texto: 'Escolha um pacote e gere seus anúncios.' },
        { num: 50, tempo: '7s', texto: 'Pare de disputar preço.' },
        { num: 51, tempo: '7s', texto: 'Comece a construir marca.' },
      ]
    },
    {
      id: 'frase-final',
      nome: 'FRASE FINAL DE IMPACTO',
      cor: 'gradient',
      icon: '🔥',
      segmentos: [
        { num: 52, tempo: '7s', texto: 'Imagem qualquer vende produto. Marca vende todos.' },
      ]
    }
  ],

  resumoTopicos: [
    { topico: 'Diferenciação', blocos: ['bloco1', 'bloco2', 'bloco3'] },
    { topico: 'Solução Completa', blocos: ['bloco4', 'bloco5', 'bloco8', 'bloco11'] },
    { topico: 'Qualidade/Upscale', blocos: ['bloco7'] },
    { topico: 'Benefícios Extras', blocos: ['bloco9', 'bloco10'] },
    { topico: 'Quebra de Objeções', blocos: ['bloco13', 'bloco14'] },
    { topico: 'Fechamento', blocos: ['bloco15', 'bloco16', 'bloco17'] },
  ]
};
