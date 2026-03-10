-- Adiciona colunas de métricas em produtos
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cart_count INTEGER DEFAULT 0;

-- Adiciona colunas de métricas em serviços
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cart_count INTEGER DEFAULT 0;

-- Função para incrementar views de produtos
CREATE OR REPLACE FUNCTION increment_product_view(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar views de serviços
CREATE OR REPLACE FUNCTION increment_service_view(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.services
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar cart_count de produtos
CREATE OR REPLACE FUNCTION increment_product_cart(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET cart_count = COALESCE(cart_count, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar cart_count de serviços
CREATE OR REPLACE FUNCTION increment_service_cart(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.services
  SET cart_count = COALESCE(cart_count, 0) + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
