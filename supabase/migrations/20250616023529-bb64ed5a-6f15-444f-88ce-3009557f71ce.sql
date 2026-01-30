
-- Adicionar coluna para canal de venda na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN canal_venda TEXT,
ADD COLUMN loja TEXT;

-- Criar tabela para itens dos pedidos
CREATE TABLE public.pedidos_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  sku TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  preco_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índice para melhor performance
CREATE INDEX idx_pedidos_itens_pedido_id ON public.pedidos_itens(pedido_id);

-- Adicionar trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION update_pedidos_itens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.criado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
