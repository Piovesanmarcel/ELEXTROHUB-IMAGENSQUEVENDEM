
// Separate file for marketing data generation logic
export const generateProductSpecificAIData = (product: any) => {
  const productName = product.nome.toLowerCase();
  const productDescription = product.descricao_curta || product.descricao || '';
  
  const generateBenefits = () => {
    const benefits = [];
    
    if (productName.includes('celular') || productName.includes('smartphone') || productName.includes('phone')) {
      benefits.push("Bateria de longa duração", "Câmera de alta resolução", "Processador ultrarrápido", "Tela resistente", "Design premium", "Conectividade 5G");
    } else if (productName.includes('roupa') || productName.includes('camisa') || productName.includes('vestido') || productName.includes('blusa')) {
      benefits.push("Tecido de alta qualidade", "Modelagem perfeita", "Conforto excepcional", "Durabilidade garantida", "Design moderno", "Fácil manutenção");
    } else if (productName.includes('sapato') || productName.includes('tênis') || productName.includes('sandália')) {
      benefits.push("Conforto durante todo o dia", "Material respirável", "Sola antiderrapante", "Design ergonômico", "Durabilidade superior", "Estilo versátil");
    } else if (productName.includes('casa') || productName.includes('decoração') || productName.includes('móvel')) {
      benefits.push("Material premium", "Design elegante", "Fácil instalação", "Resistente e durável", "Funcionalidade prática", "Acabamento impecável");
    } else if (productName.includes('beleza') || productName.includes('cosmético') || productName.includes('creme') || productName.includes('shampoo')) {
      benefits.push("Fórmula natural", "Resultado rápido", "Dermatologicamente testado", "Hidratação profunda", "Proteção avançada", "Fragrância suave");
    } else {
      benefits.push(`Qualidade premium do ${product.nome}`, "Durabilidade excepcional", "Design inovador", "Fácil de usar", "Excelente custo-benefício", "Garantia completa");
    }
    
    return benefits;
  };

  const generateFAQs = () => {
    const faqs = [];
    
    if (productName.includes('celular') || productName.includes('smartphone')) {
      faqs.push(
        { question: "A bateria dura quanto tempo?", answer: "A bateria dura o dia todo com uso intenso, ideal para quem precisa de performance." },
        { question: "A câmera é boa para fotos?", answer: "Sim, possui câmera profissional com alta resolução para fotos incríveis." },
        { question: "É resistente à água?", answer: "Totalmente resistente à água e impactos do dia a dia." },
        { question: "Tem garantia?", answer: "Garantia completa de 12 meses contra defeitos de fabricação." }
      );
    } else if (productName.includes('roupa') || productName.includes('camisa')) {
      faqs.push(
        { question: "O tecido é de boa qualidade?", answer: "Sim, utilizamos apenas tecidos premium que não desbotam nem deformam." },
        { question: "Como é a modelagem?", answer: "Modelagem ergonômica que veste perfeitamente em todos os tipos de corpo." },
        { question: "Posso lavar na máquina?", answer: "Sim, é super prático e pode ser lavado normalmente na máquina." },
        { question: "As cores desbotam?", answer: "Não, nossos tecidos mantêm as cores vivas por muito tempo." }
      );
    } else {
      faqs.push(
        { question: `Como usar o ${product.nome}?`, answer: "É muito fácil e intuitivo de usar, com instruções claras incluídas." },
        { question: "Qual é a garantia?", answer: "Oferecemos garantia completa de 12 meses contra defeitos." },
        { question: "É seguro?", answer: "Totalmente seguro, testado e aprovado pelos melhores padrões." },
        { question: "Como fazer manutenção?", answer: "Manutenção simples seguindo as instruções do manual." }
      );
    }
    
    return faqs;
  };

  const generatePainPointsAndSolutions = () => {
    let painPoints = [];
    let solutions = [];
    
    if (productName.includes('celular') || productName.includes('smartphone')) {
      painPoints = [
        "Celulares que descarregam muito rápido",
        "Câmeras que fazem fotos ruins",
        "Telas que quebram facilmente",
        "Celulares lentos que travam",
        "Armazenamento sempre cheio"
      ];
      solutions = [
        "Bateria que dura o dia todo",
        "Câmera profissional de alta qualidade",
        "Tela ultra resistente a quedas",
        "Processador rápido sem travamentos",
        "Armazenamento amplo para tudo"
      ];
    } else if (productName.includes('roupa') || productName.includes('camisa')) {
      painPoints = [
        "Roupas que desbotam rapidamente",
        "Tecidos que deformam na lavagem",
        "Tamanhos que não servem bem",
        "Costuras que se desfazem",
        "Modelos que saem de moda"
      ];
      solutions = [
        "Tecidos que mantêm cor sempre viva",
        "Material que não deforma nunca",
        "Modelagem perfeita para seu corpo",
        "Costuras reforçadas e duráveis",
        "Design atemporal e elegante"
      ];
    } else if (productName.includes('sapato') || productName.includes('tênis')) {
      painPoints = [
        "Sapatos que machucam os pés",
        "Solados que desgastam rápido",
        "Calçados que causam mau cheiro",
        "Materiais que racham facilmente",
        "Design ultrapassado"
      ];
      solutions = [
        "Conforto extremo o dia todo",
        "Solado ultra resistente",
        "Material respirável anti-odor",
        "Couro premium que não racha",
        "Design moderno e estiloso"
      ];
    } else {
      painPoints = [
        `${product.nome} de baixa qualidade no mercado`,
        "Produtos que quebram facilmente",
        "Preços elevados sem justificativa",
        "Falta de garantia adequada",
        "Atendimento ao cliente ruim"
      ];
      solutions = [
        `${product.nome} com qualidade premium`,
        "Produto resistente e durável",
        "Preço justo e competitivo",
        "Garantia extendida completa",
        "Suporte especializado 24/7"
      ];
    }
    
    return { painPoints, solutions };
  };

  const benefits = generateBenefits();
  const faqs = generateFAQs();
  const { painPoints, solutions } = generatePainPointsAndSolutions();

  const testimonials = [
    { name: "Maria Silva", text: `${product.nome} superou todas as expectativas! Qualidade incrível.`, rating: 5 },
    { name: "João Santos", text: `Melhor ${product.nome} que já comprei. Recomendo para todos!`, rating: 5 },
    { name: "Ana Costa", text: `Excelente qualidade e chegou super rápido. Muito satisfeita!`, rating: 5 },
    { name: "Carlos Oliveira", text: `Produto top! Exatamente como descrito. Vale muito a pena!`, rating: 5 },
    { name: "Paula Mendes", text: `Uso há meses e continua perfeito. Durabilidade impressionante!`, rating: 5 },
    { name: "Roberto Lima", text: `Atendimento excelente e produto de primeira. Já virei cliente!`, rating: 5 }
  ];

  return {
    benefits,
    faqs,
    testimonials,
    painPoints,
    solutions,
    seoDescription: productDescription ? 
      `${productDescription} - Produto premium com tecnologia avançada, design moderno e qualidade garantida. Ideal para quem busca o melhor custo-benefício do mercado.` :
      `${product.nome} - Produto de alta qualidade com excelente custo-benefício. Tecnologia avançada e design inovador para máxima satisfação do cliente.`,
    idealFor: productDescription ?
      `Ideal para pessoas que valorizam qualidade e buscam ${productDescription.toLowerCase()}. Perfeito para uso diário com tecnologia avançada e design moderno.` :
      `Pessoas que valorizam qualidade, durabilidade e design moderno. Ideal para uso doméstico e profissional, proporcionando excelente experiência.`,
    guarantee: "Garantia total de satisfação ou seu dinheiro de volta! Produto testado e aprovado com suporte especializado 24/7. Compre com confiança e receba em casa com segurança."
  };
};
