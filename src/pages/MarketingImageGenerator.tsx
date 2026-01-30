import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Product, fetchProducts } from "@/lib/supabase";
import { MarketingImageGenerator } from "@/components/marketing/MarketingImageGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const MarketingImageGeneratorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) {
      toast.error("ID do produto não fornecido");
      navigate("/produtos");
      return;
    }

    setIsLoading(true);
    try {
      const products = await fetchProducts();
      const foundProduct = products.find(p => p.id === id);
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        toast.error("Produto não encontrado");
        navigate("/produtos");
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Erro ao carregar produto");
    } finally {
      setIsLoading(false);
    }
  };

  const getProductImages = (product: Product) => {
    const images: string[] = [];
    
    const imageFields = [
      product.imagem_url,
      product.imagem_url_2,
      product.imagem_url_3,
      product.imagem_url_4,
      product.imagem_url_5,
      product.imagem_url_6,
      product.imagem_url_7,
      product.imagem_url_8,
      product.imagem_url_9,
      product.imagem_url_10
    ];
    
    imageFields.forEach((url) => {
      if (url && url.trim() !== '' && url !== 'null' && url !== 'undefined') {
        images.push(url);
      }
    });
    
    return images;
  };

  // Gerar dados da IA específicos baseados na descrição do produto
  const generateProductSpecificAIData = (product: Product) => {
    const productName = product.nome.toLowerCase();
    const productDescription = product.descricao_curta || product.descricao || '';
    
    // Função para gerar benefícios específicos
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

    // Função para gerar FAQs específicas
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

    // Função para gerar problemas e soluções específicas
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

    // Gerar depoimentos específicos
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="glass-effect">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando produto...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="glass-effect">
          <CardContent className="p-12">
            <div className="text-center">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Produto não encontrado</p>
              <Button 
                onClick={() => navigate("/produtos")} 
                className="mt-4"
                variant="outline"
              >
                Voltar aos Produtos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const productImages = getProductImages(product);
  const aiData = generateProductSpecificAIData(product);

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/produtos/${id}`)}
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Produto
        </Button>
        <div className="h-6 w-px bg-gray-300"></div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">
            🚀 Gerador de Imagens de Marketing
          </h1>
          <p className="text-lg font-semibold text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            UTILIZE AS IMAGENS PARA UM TER OUTRO ANÚNCIO DIFERENCIAL COM MAIS OPÇÕES PARA O MESMO PRODUTO
          </p>
        </div>
      </div>

      {/* Product Info */}
      <Card className="glass-effect mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            Produto Selecionado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {productImages[0] && (
              <img
                src={productImages[0]}
                alt={product.nome}
                className="w-16 h-16 object-cover rounded-lg border"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg">{product.nome}</h3>
              <p className="text-gray-600">SKU: {product.sku}</p>
              <p className="text-sm text-gray-500">{productImages.length} imagens disponíveis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marketing Image Generator */}
      <MarketingImageGenerator
        productName={product.nome}
        productImages={productImages}
        productDescription={product.descricao_curta || undefined}
        productBenefits={aiData.benefits}
        productFaqs={aiData.faqs}
        productPainPoints={aiData.painPoints}
        productSolutions={aiData.solutions}
        testimonials={aiData.testimonials}
        seoDescription={aiData.seoDescription}
        idealFor={aiData.idealFor}
        guarantee={aiData.guarantee}
      />
    </div>
  );
};

export default MarketingImageGeneratorPage;
