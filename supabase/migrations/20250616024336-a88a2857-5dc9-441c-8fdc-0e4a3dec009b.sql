
-- Adicionar coluna de frete na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN frete NUMERIC(10,2) DEFAULT 0;

-- Adicionar coluna produto_id na tabela pedidos_itens para fazer a ligação com produtos
ALTER TABLE public.pedidos_itens 
ADD COLUMN produto_id UUID REFERENCES public.produtos(id);

-- Criar índice para melhor performance na busca de produtos nos itens
CREATE INDEX idx_pedidos_itens_produto_id ON public.pedidos_itens(produto_id);
