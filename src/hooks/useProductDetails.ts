import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProductsCache } from "./useProductsCache";

export const useProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cachedProducts, updateProductCache } = useProductsCache();
  
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncToBling, setSyncToBling] = useState(false);
  const [enhancementRecommended, setEnhancementRecommended] = useState(false);
  const [showMarketingGenerator, setShowMarketingGenerator] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [hasError, setHasError] = useState(false);

  console.log('🔍 useProductDetails - URL ID:', id);

  const loadProduct = async (retryCount = 0) => {
    if (!id) {
      console.error('❌ useProductDetails - Nenhum ID fornecido');
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Usar cache como fonte primária - não recarregar em background desnecessariamente
    const cachedProduct = cachedProducts.find(p => p.id === id);
    if (cachedProduct && retryCount === 0) {
      console.log('💾 useProductDetails - Carregado do cache:', cachedProduct.nome);
      setProduct(cachedProduct);
      setFormData(cachedProduct);
      setIsLoading(false);
      setHasError(false);
      return; // Cache válido, sem necessidade de recarregar
    }

    try {
      if (retryCount === 0) {
        setIsLoading(true);
      }
      setHasError(false);
      
      // Verificar autenticação ANTES de tentar carregar
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔐 useProductDetails - Status de autenticação:', {
        authenticated: !!session,
        userId: session?.user?.id,
        sessionError: sessionError?.message
      });

      if (!session || !session.user) {
        console.error('❌ useProductDetails - Usuário não autenticado');
        toast.error('Você precisa estar logado para acessar esta página');
        setHasError(true);
        // Redirecionar para login após 1.5s
        setTimeout(() => {
          navigate('/login', { state: { from: `/produtos/${id}` } });
        }, 1500);
        return;
      }

      console.log('🔍 useProductDetails - Carregando produto com ID:', id);
      
      // Timeout reduzido para melhor experiência
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Carregamento demorou mais que 10 segundos')), 10000)
      );
      
      const loadPromise = supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      const { data, error } = await Promise.race([loadPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ useProductDetails - Erro ao carregar produto:', {
          error,
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details
        });

        // Detectar erro de RLS
        if (error.code === 'PGRST116' || error.message?.includes('row-level security')) {
          console.error('🚫 useProductDetails - Bloqueado por RLS');
          toast.error('Sem permissão para acessar este produto');
          setHasError(true);
          setTimeout(() => {
            navigate('/painel');
          }, 2000);
          return;
        }

        // Retry automático em caso de erro de conexão (máximo 2 tentativas)
        if (retryCount < 2 && (error.message?.includes('fetch') || error.message?.includes('network'))) {
          console.warn(`⚠️ useProductDetails - Erro de conexão, tentando novamente (${retryCount + 1}/2)...`);
          toast.info('Reconectando...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadProduct(retryCount + 1);
        }

        toast.error('Erro ao carregar produto');
        setHasError(true);
        return;
      }

      if (!data) {
        console.error('❌ useProductDetails - Produto não encontrado para ID:', id);
        toast.error('Produto não encontrado');
        setHasError(true);
        return;
      }

      console.log('✅ useProductDetails - Produto carregado:', {
        id: data.id,
        nome: data.nome,
        sku: data.sku,
        usuario_id: data.usuario_id
      });
      
      setProduct(data);
      setFormData(data);
      setHasError(false);
      
      // Atualizar cache
      if (cachedProducts.length > 0) {
        updateProductCache(id, data);
      }
    } catch (error) {
      console.error('❌ useProductDetails - Erro inesperado:', error);
      
      if (error instanceof Error && error.message.includes('Timeout')) {
        toast.error('Carregamento demorou muito. Tente novamente.');
      } else {
        toast.error('Erro inesperado ao carregar produto');
      }
      
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  // Listener para atualizações em tempo real do produto
  useEffect(() => {
    const handleProductUpdate = (event: any) => {
      const { productId, product: updatedProduct, source } = event.detail || {};
      
      console.log('🔔 useProductDetails - Evento productUpdated recebido:', {
        eventProductId: productId,
        currentPageId: id,
        source,
        hasUpdatedProduct: !!updatedProduct
      });

      // Verificar se é o produto da página atual
      if (productId !== id) {
        console.log('⏩ useProductDetails - Evento ignorado (produto diferente)');
        return;
      }

      console.log('✅ useProductDetails - Aplicando atualização em tempo real');
      
      // Atualizar estado local imediatamente
      if (updatedProduct) {
        setProduct((prev: any) => ({ ...prev, ...updatedProduct }));
        setFormData((prev: any) => ({ ...prev, ...updatedProduct }));
        updateProductCache(productId, updatedProduct);
        console.log('✅ Estado local e cache atualizados');
      }

      // Mostrar indicador de atualização
      setIsRefreshing(true);

      // Recarregar do banco após pequeno delay
      setTimeout(() => {
        console.log('🔄 useProductDetails - Recarregando do banco para confirmar dados');
        loadProduct().finally(() => {
          setIsRefreshing(false);
          console.log('✅ useProductDetails - Atualização completa');
        });
      }, 400);
    };

    window.addEventListener('productUpdated', handleProductUpdate);
    console.log('👂 useProductDetails - Listener de productUpdated ativado para produto', id);

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      console.log('🔇 useProductDetails - Listener de productUpdated removido');
    };
  }, [id, updateProductCache]);

  // Forçar recarregamento quando voltar à página
  const handleUpdateProduct = () => {
    console.log('🔄 Forçando recarregamento do produto do Bling');
    setIsRefreshing(true);
    loadProduct().finally(() => setIsRefreshing(false));
  };

  const handleSave = async () => {
    if (!id) {
      console.error('❌ useProductDetails - handleSave - Nenhum ID fornecido');
      toast.error('Erro ao salvar: ID do produto não encontrado.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('💾 useProductDetails - handleSave - Salvando produto com ID:', id);

      const { error } = await supabase
        .from('produtos')
        .update(formData)
        .eq('id', id);

      if (error) {
        console.error('❌ useProductDetails - handleSave - Erro ao salvar produto:', error);
        toast.error('Erro ao salvar produto');
        return;
      }

      console.log('✅ useProductDetails - handleSave - Produto salvo com sucesso:', formData);
      toast.success('Produto salvo com sucesso!');
      setIsEditing(false);
      
      // Atualizar cache imediatamente
      const updatedProduct = { ...product, ...formData };
      setProduct(updatedProduct);
      updateProductCache(id, updatedProduct);
      
      // Recarregar em background
      loadProduct();
    } catch (error) {
      console.error('❌ useProductDetails - handleSave - Erro inesperado:', error);
      toast.error('Erro inesperado ao salvar produto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateDescription = (type: 'short' | 'long' | 'name', value: string) => {
    console.log('🔄 useProductDetails - Atualizando descrição:', { type, value });
    
    const updates = { ...formData };
    
    if (type === 'short') {
      updates.descricao_curta = value;
    } else if (type === 'long') {
      updates.descricao = value;
    } else if (type === 'name') {
      updates.nome = value;
    }
    
    setFormData(updates);
    setProduct(updates); // Também atualizar o produto
  };

  const handleFormDataChange = (field: string, value: any) => {
    const updates = { ...formData, [field]: value };
    setFormData(updates);
    
    // Também atualizar o produto para manter sincronizado
    setProduct({ ...product, [field]: value });
  };

  const handleGenerateMarketing = () => {
    setShowMarketingGenerator(!showMarketingGenerator);
  };

  const getProductImages = (product: any) => {
    const images: string[] = [];
    
    // 1. Coletar imagens do produto principal usando COLUNAS CORRETAS
    // Slot 1: imagem_original
    if (product?.imagem_original && product.imagem_original.trim()) {
      images.push(product.imagem_original.trim());
    }
    
    // Slots 2-11: imagem_melhorada_1 a imagem_melhorada_10
    for (let i = 1; i <= 10; i++) {
      const imageUrl = product?.[`imagem_melhorada_${i}`];
      if (imageUrl && imageUrl.trim()) {
        images.push(imageUrl.trim());
      }
    }
    
    // 2. Se for produto variável, coletar imagens das variações
    if (product?.tipo_produto === 'variavel' && Array.isArray(product?.variacoes)) {
      product.variacoes.forEach((variacao: any) => {
        if (Array.isArray(variacao.imagens)) {
          variacao.imagens.forEach((imgUrl: string) => {
            if (imgUrl && imgUrl.trim()) {
              images.push(imgUrl.trim());
            }
          });
        }
      });
    }
    
    // 3. Remover duplicatas e retornar
    return Array.from(new Set(images));
  };

  // 🆕 Função para atualizar a ordem das imagens no banco (usando colunas corretas)
  const updateImageOrder = async (newOrder: string[]) => {
    if (!id) {
      toast.error('ID do produto não encontrado');
      return false;
    }

    try {
      const updates: Record<string, string | null> = {};
      
      // Mapear novas posições usando COLUNAS CORRETAS
      newOrder.forEach((url, index) => {
        if (index === 0) {
          updates.imagem_original = url;  // Slot 1
        } else {
          updates[`imagem_melhorada_${index}`] = url;  // Slots 2-11
        }
      });
      
      // Limpar campos extras se nova ordem for menor que 11 slots
      // Limpar imagem_original se não houver nenhuma imagem
      if (newOrder.length === 0) {
        updates.imagem_original = null;
      }
      
      // Limpar imagem_melhorada_1 a imagem_melhorada_10
      for (let i = 1; i <= 10; i++) {
        if (i >= newOrder.length) {
          updates[`imagem_melhorada_${i}`] = null;
        }
      }

      console.log('📝 Atualizando ordem das imagens (colunas corretas):', updates);

      const { error } = await supabase
        .from('produtos')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao salvar ordem das imagens:', error);
        toast.error('Erro ao salvar ordem das imagens');
        return false;
      }

      // Atualizar estado local e cache
      const updatedProduct = { ...product, ...updates };
      setProduct(updatedProduct);
      setFormData(updatedProduct);
      updateProductCache(id, updatedProduct);

      console.log('✅ Ordem das imagens atualizada com sucesso');
      toast.success('Ordem das imagens salva!');
      return true;
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar ordem:', error);
      toast.error('Erro inesperado ao salvar ordem');
      return false;
    }
  };

  return {
    id,
    navigate,
    product,
    isLoading,
    isRefreshing,
    isEditing,
    setIsEditing,
    isSaving,
    syncToBling,
    setSyncToBling,
    enhancementRecommended,
    setEnhancementRecommended, 
    formData,
    showMarketingGenerator,
    setShowMarketingGenerator,
    hasError,
    setHasError,
    loadProduct,
    handleSave,
    handleUpdateDescription,
    handleFormDataChange,
    handleGenerateMarketing,
    getProductImages,
    updateImageOrder
  };
};
