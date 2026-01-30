import { Brain, Target, Lightbulb } from "lucide-react";
import AgentPageLayout from "@/components/landing/AgentPageLayout";

const AgentAtlas = () => {
  return (
    <AgentPageLayout
      agent="atlas"
      name="ATLAS"
      role="O Estrategista"
      badge="Inteligência Analítica"
      quote="Eu analiso cada detalhe do seu produto para descobrir exatamente o que faz ele vender. Dados são minha linguagem."
      description="ATLAS é nossa IA especializada em análise estratégica de produtos. Ele examina profundamente cada característica do seu item, identifica o público-alvo ideal, sugere os melhores cenários de apresentação e desenvolve estratégias de posicionamento que maximizam suas vendas."
      capabilities={[
        "Análise completa do produto em segundos",
        "Identificação de público-alvo ideal",
        "Sugestão de ambientes e cenários",
        "Estratégia de palavras-chave SEO",
        "Mapeamento de pontos de venda únicos",
        "Recomendações de preço competitivo",
        "Análise de concorrência",
        "Identificação de gatilhos de compra",
      ]}
      processSteps={[
        {
          title: "Recebe os dados do produto",
          description: "ATLAS recebe as informações do seu produto: nome, descrição, categoria, imagens e qualquer detalhe adicional que você fornecer.",
        },
        {
          title: "Analisa características e mercado",
          description: "Usando inteligência artificial avançada, identifica os pontos fortes do produto, público ideal, e como posicioná-lo no mercado.",
        },
        {
          title: "Desenvolve estratégia de apresentação",
          description: "Sugere os melhores cenários, ângulos e abordagens para fotografar e descrever seu produto de forma atraente.",
        },
        {
          title: "Gera insights acionáveis",
          description: "Entrega um relatório completo com recomendações práticas que LYRA e ORION usarão para criar seu anúncio perfeito.",
        },
      ]}
      examples={[
        {
          title: "Eletrônicos",
          description: "Identifica specs técnicos relevantes, público tech-savvy e cenários lifestyle modernos.",
          icon: Brain,
        },
        {
          title: "Moda e Acessórios",
          description: "Analisa tendências, sugere combinações e identifica o estilo visual ideal para seu público.",
          icon: Target,
        },
        {
          title: "Casa e Decoração",
          description: "Recomenda ambientes, paletas de cores e estilos de fotografia que vendem mais.",
          icon: Lightbulb,
        },
      ]}
      beforeAfterExamples={[
        {
          title: "De descrição básica para análise estratégica",
          beforeImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          beforeLabel: "Produto sem análise",
          afterImage: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800",
          afterLabel: "Estratégia completa",
        },
      ]}
      linkTo="/comando-unificado-n8n"
      linkLabel="Usar ATLAS Agora"
      nextAgent={{ name: "LYRA", path: "/agente/lyra" }}
    />
  );
};

export default AgentAtlas;
