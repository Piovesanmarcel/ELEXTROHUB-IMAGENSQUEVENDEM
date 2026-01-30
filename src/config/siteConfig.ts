export const siteConfig = {
  // YouTube Video Configuration
  // Replace with your actual YouTube video ID (the part after v= in the URL)
  // Example: For https://www.youtube.com/watch?v=dQw4w9WgXcQ, use "dQw4w9WgXcQ"
  // Para configurar: cole o ID do seu vídeo abaixo (ex: "abc123XYZ")
  youtubeVideoId: "", // <- Insira o ID do seu vídeo YouTube aqui
  youtubeVideoTitle: "Como nossos Agentes de Conversão transformam suas fotos em anúncios profissionais",
  
  // Site metadata
  siteName: "Anúncios Que Vende",
  siteDescription: "Transforme suas fotos em anúncios profissionais com inteligência artificial",
};

// Credit Plans for purchase
export const creditPlans = [
  { 
    id: 'pro', 
    name: 'Pro', 
    credits: 100, 
    price: 200.00,  // R$ 2,00 por imagem
    popular: false, 
    savings: 0, 
    description: 'Perfeito para começar' 
  },
  { 
    id: 'standard', 
    name: 'Standard', 
    credits: 200, 
    price: 360.00,  // R$ 1,80 por imagem (10% desconto)
    popular: true, 
    savings: 10, 
    description: 'Melhor custo-benefício' 
  },
  { 
    id: 'avancado', 
    name: 'Avançado', 
    credits: 300, 
    price: 510.00,  // R$ 1,70 por imagem (15% desconto)
    popular: false, 
    savings: 15, 
    description: 'Para vendedores ativos' 
  },
  { 
    id: 'premium', 
    name: 'Premium', 
    credits: 500, 
    price: 800.00,  // R$ 1,60 por imagem (20% desconto)
    popular: false, 
    savings: 20, 
    description: 'Volume máximo' 
  },
];
