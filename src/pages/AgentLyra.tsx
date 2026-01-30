import { PenTool, FileText, Search } from "lucide-react";
import AgentPageLayout from "@/components/landing/AgentPageLayout";

const AgentLyra = () => {
  return (
    <AgentPageLayout
      agent="lyra"
      name="LYRA"
      role="A Persuasora"
      badge="Copywriting Avançado"
      quote="Palavras têm poder. Eu encontro as palavras certas para fazer seu produto irresistível. Cada título, cada descrição, é uma história de sucesso."
      description="LYRA é nossa IA especialista em copywriting e persuasão. Ela transforma as análises do ATLAS em textos magnéticos que capturam a atenção, despertam desejo e motivam a compra. Otimizada para SEO, suas palavras colocam seus produtos no topo das buscas."
      capabilities={[
        "30+ títulos SEO otimizados",
        "Descrições persuasivas e completas",
        "FAQ automático do produto",
        "Gatilhos emocionais de compra",
        "Benefícios destacados estrategicamente",
        "Copy para redes sociais",
        "Palavras-chave de alto impacto",
        "Adaptação para múltiplos marketplaces",
      ]}
      processSteps={[
        {
          title: "Recebe análise do ATLAS",
          description: "LYRA começa onde ATLAS termina, recebendo todos os insights estratégicos sobre o produto e seu público.",
        },
        {
          title: "Pesquisa palavras-chave",
          description: "Identifica os termos de busca mais relevantes e com maior potencial de conversão para seu nicho.",
        },
        {
          title: "Cria textos persuasivos",
          description: "Desenvolve títulos, descrições, FAQs e copy de vendas usando técnicas avançadas de persuasão e SEO.",
        },
        {
          title: "Otimiza para conversão",
          description: "Refina cada palavra para maximizar cliques, engajamento e, principalmente, vendas.",
        },
      ]}
      examples={[
        {
          title: "Títulos que Vendem",
          description: "De 'Camiseta Azul' para '👕 Camiseta Premium 100% Algodão | Conforto o Dia Todo | 5 Cores'",
          icon: PenTool,
        },
        {
          title: "Descrições Completas",
          description: "Textos estruturados com benefícios, especificações técnicas e chamadas para ação irresistíveis.",
          icon: FileText,
        },
        {
          title: "SEO Integrado",
          description: "Palavras-chave naturalmente inseridas para ranquear no topo do Mercado Livre, Amazon e Google.",
          icon: Search,
        },
      ]}
      beforeAfterExamples={[
        {
          title: "De título genérico para copy que vende",
          beforeImage: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800",
          beforeLabel: "Título básico",
          afterImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
          afterLabel: "30+ títulos SEO",
        },
      ]}
      linkTo="/copywriting-profissional-n8n"
      linkLabel="Usar LYRA Agora"
      prevAgent={{ name: "ATLAS", path: "/agente/atlas" }}
      nextAgent={{ name: "ORION", path: "/agente/orion" }}
    />
  );
};

export default AgentLyra;
