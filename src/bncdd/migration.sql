-- =========================================================
-- JotaM - Migração Completa do Banco de Dados (Supabase)
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- Dashboard: https://supabase.com/dashboard/project/teloynyqnrlgbefmxque/sql
-- =========================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. TABELAS BASE
-- =========================================================

-- Perfil estendido do usuário (complementa auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('consumer', 'seller', 'delivery', 'admin')),
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Endereços salvos do consumidor
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Casa',
  street TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 2. MÓDULO LOJA/MARKETPLACE
-- =========================================================

-- Categorias de produtos e serviços
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  type TEXT NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfil do vendedor/loja
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  theme_color TEXT DEFAULT '#6366f1',
  whatsapp TEXT,
  instagram TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  pinned_product_id UUID,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Produtos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar FK de pinned_product_id após criar products
ALTER TABLE public.sellers 
  ADD CONSTRAINT fk_sellers_pinned_product 
  FOREIGN KEY (pinned_product_id) REFERENCES public.products(id) ON DELETE SET NULL;

-- Seguidores de vendedores
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, seller_id)
);

-- =========================================================
-- 3. MÓDULO SERVIÇOS
-- =========================================================

-- Prestadores de serviço
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Serviços
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grade de disponibilidade do prestador
CREATE TABLE IF NOT EXISTS public.service_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES public.users(id),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 4. AVALIAÇÕES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'service')),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 5. MÓDULO ENTREGADOR
-- =========================================================

-- Bairros/Regiões da plataforma
CREATE TABLE IF NOT EXISTS public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Fortaleza',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfil do entregador
CREATE TABLE IF NOT EXISTS public.delivery_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  vehicle_type TEXT NOT NULL DEFAULT 'bike' CHECK (vehicle_type IN ('bike', 'moto', 'car')),
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
  daily_goal NUMERIC(10,2) NOT NULL DEFAULT 100.0,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ganhos do entregador
CREATE TABLE IF NOT EXISTS public.earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_profile_id UUID NOT NULL REFERENCES public.delivery_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Preferências de área do entregador
CREATE TABLE IF NOT EXISTS public.delivery_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_profile_id UUID NOT NULL REFERENCES public.delivery_profiles(id) ON DELETE CASCADE UNIQUE,
  area_type TEXT NOT NULL DEFAULT 'city' CHECK (area_type IN ('city', 'condo', 'neighborhoods')),
  neighborhood_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 6. MÓDULO PEDIDOS
-- =========================================================

-- Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  delivery_profile_id UUID REFERENCES public.delivery_profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending','confirmed','preparing','collecting','on_the_way','delivered','cancelled')),
  total NUMERIC(10,2) NOT NULL,
  address_id UUID REFERENCES public.user_addresses(id),
  payment_method TEXT NOT NULL DEFAULT 'pix' CHECK (payment_method IN ('pix', 'card', 'cash')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  service_id UUID REFERENCES public.services(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entregas
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_profile_id UUID NOT NULL REFERENCES public.delivery_profiles(id),
  status TEXT NOT NULL DEFAULT 'collecting' 
    CHECK (status IN ('collecting', 'on_the_way', 'delivered', 'cancelled')),
  started_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  method TEXT NOT NULL CHECK (method IN ('pix', 'card', 'cash')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  amount NUMERIC(10,2) NOT NULL,
  pix_code TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =========================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies públicas (leitura livre para produtos, serviços, categorias, etc.)
CREATE POLICY "Produtos públicos visíveis" ON public.products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Serviços públicos visíveis" ON public.services
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Categorias são públicas" ON public.categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Perfil de vendedor público" ON public.sellers
  FOR SELECT USING (TRUE);

CREATE POLICY "Avaliações públicas" ON public.reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "Bairros públicos" ON public.neighborhoods
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Seguidores públicos" ON public.followers
  FOR SELECT USING (TRUE);

-- Policies autenticadas (cada usuário gerencia seu próprio dado)
CREATE POLICY "Usuário vê seu próprio perfil" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuário edita seu próprio perfil" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuário cria seu perfil" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuário gerencia seus endereços" ON public.user_addresses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Vendedor gerencia sua loja" ON public.sellers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Vendedor gerencia seus produtos" ON public.products
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE sellers.id = products.seller_id AND sellers.user_id = auth.uid()
  ));

CREATE POLICY "Prestador gerencia seus serviços" ON public.services
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.service_providers WHERE service_providers.id = services.provider_id AND service_providers.user_id = auth.uid()
  ));

CREATE POLICY "Usuário vê seus pedidos" ON public.orders
  FOR SELECT USING (auth.uid() = consumer_id);

CREATE POLICY "Usuário cria pedidos" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Entregador vê seu perfil" ON public.delivery_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Entregador vê seus ganhos" ON public.earnings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.delivery_profiles WHERE delivery_profiles.id = earnings.delivery_profile_id AND delivery_profiles.user_id = auth.uid()
  ));

-- =========================================================
-- 8. DADOS INICIAIS (SEED)
-- =========================================================

-- Categorias base
INSERT INTO public.categories (name, icon, type) VALUES
  ('Alimentação', '🍔', 'product'),
  ('Bebidas', '🥤', 'product'),
  ('Beleza', '💅', 'service'),
  ('Casa e Jardim', '🏡', 'product'),
  ('Moda', '👗', 'product'),
  ('Saúde', '💊', 'product'),
  ('Tecnologia', '💻', 'product'),
  ('Limpeza', '🧹', 'service'),
  ('Educação', '📚', 'service'),
  ('Fitness', '💪', 'service')
ON CONFLICT DO NOTHING;

-- Bairros de exemplo
INSERT INTO public.neighborhoods (name, city) VALUES
  ('Aldeota', 'Fortaleza'),
  ('Meireles', 'Fortaleza'),
  ('Cocó', 'Fortaleza'),
  ('Varjota', 'Fortaleza'),
  ('Papicu', 'Fortaleza'),
  ('Dionísio Torres', 'Fortaleza'),
  ('Mucuripe', 'Fortaleza')
ON CONFLICT DO NOTHING;

-- =========================================================
-- FIM DA MIGRAÇÃO
-- =========================================================
-- Acesse: https://supabase.com/dashboard/project/teloynyqnrlgbefmxque/editor
-- Cole e execute este SQL para criar todas as tabelas.
