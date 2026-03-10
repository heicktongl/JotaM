-- Adiciona suporte a variações e SKUs
ALTER TABLE public.product_complement_groups 
ADD COLUMN IF NOT EXISTS is_variation BOOLEAN DEFAULT false;

ALTER TABLE public.product_complement_items 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT NULL;

-- Adiciona metadados nos itens do pedido para persistir variações/complementos
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN public.product_complement_groups.is_variation IS 'Define se o grupo é uma variação obrigatória (ex: Tamanho) ou apenas um adicional opcional.';
COMMENT ON COLUMN public.product_complement_items.stock IS 'Estoque individual da variação/item. Se NULL, ignora controle individual.';
COMMENT ON COLUMN public.order_items.metadata IS 'Armazena detalhes das variações e complementos escolhidos pelo cliente no momento da compra.';
