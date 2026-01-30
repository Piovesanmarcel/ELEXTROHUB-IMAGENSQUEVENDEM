import { Image, Palette, Layers } from "lucide-react";
import AgentPageLayout from "@/components/landing/AgentPageLayout";

// Agent page for ORION - The Visual Artist
const AgentOrion = () => {
  return (
    <AgentPageLayout
      agent="orion"
      name="ORION"
      role="O Artista Visual"
      badge="Geração de Imagens"
      quote="Uma imagem vale mais que mil palavras, mas as minhas imagens valem mil vendas. Eu transformo o comum em extraordinário."
      description="ORION é nossa IA especialista em criação visual. Ele pega suas fotos simples e as transforma em imagens profissionais de catálogo. Remove fundos, cria cenários incríveis, aplica templates de marketing e gera dezenas de variações para você escolher as melhores."
      capabilities={[
        "36+ imagens profissionais por produto",
        "Remoção de fundo perfeita",
        "Cenários personalizados por IA",
        "Templates de marketing prontos",
        "Upscale 4K - Super Resolução automática",
        "Fundos temáticos e sazonais",
        "Composições para redes sociais",
        "Variações de cor e estilo",
      ]}
      processSteps={[
        {
          title: "Recebe imagens originais",
          description: "ORION recebe suas fotos do produto, mesmo que sejam simples fotos de celular ou imagens de fundo branco.",
        },
        {
          title: "Remove e otimiza",
          description: "Remove fundos com precisão de pixel, melhora cores, iluminação e qualidade geral da imagem.",
        },
        {
          title: "Cria cenários inteligentes",
          description: "Usando os insights do ATLAS, gera fundos e ambientes que valorizam seu produto e atraem seu público.",
        },
        {
          title: "Gera múltiplas versões",
          description: "Produz dezenas de variações com diferentes cenários, ângulos e estilos para diferentes plataformas.",
        },
        {
          title: "Finaliza com Super Resolução 4K",
          description: "Aplica upscale inteligente elevando suas imagens para até 4K (3840x3840px), garantindo máxima qualidade para qualquer plataforma.",
        },
      ]}
      examples={[
        {
          title: "Produto em Lifestyle",
          description: "Seu produto em cenários reais: na mesa de café, no escritório, em uso por pessoas.",
          icon: Image,
        },
        {
          title: "Fundos Profissionais",
          description: "Gradientes elegantes, texturas premium, cores que destacam e vendem mais.",
          icon: Palette,
        },
        {
          title: "Templates de Marketing",
          description: "Imagens prontas para promoções, Black Friday, Natal, e campanhas especiais.",
          icon: Layers,
        },
      ]}
      beforeAfterExamples={[
        {
          title: "De foto amadora para imagem profissional",
          beforeImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
          beforeLabel: "Foto original",
          afterImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          afterLabel: "Imagem profissional",
        },
        {
          title: "Remoção de fundo perfeita",
          beforeImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
          beforeLabel: "Com fundo",
          afterImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
          afterLabel: "Fundo removido",
        },
      ]}
      linkTo="/gerador-anuncios-n8n"
      linkLabel="Usar ORION Agora"
      prevAgent={{ name: "LYRA", path: "/agente/lyra" }}
    />
  );
};

export default AgentOrion;
