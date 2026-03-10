-- ==========================================================
-- 🚀 SOVIX CONNECT - MASTER SETUP DATABASE SCRIPT
-- ==========================================================
-- Este script sincroniza TODO o esquema do banco de dados.
-- Ele usa 'IF NOT EXISTS' e verificações de coluna para ser SEGURO de rodar.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS BASE (De acordo com database.types.ts)

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('consumer', 'seller', 'delivery', 'admin')) DEFAULT 'consumer',
    phone TEXT
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    type TEXT CHECK (type IN ('product', 'service')),
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    username TEXT UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    theme_color TEXT,
    whatsapp TEXT,
    instagram TEXT,
    is_verified BOOLEAN DEFAULT false,
    pinned_product_id UUID,
    category_id UUID REFERENCES public.categories(id),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Colunas extras de migrações
    bairros_atendidos TEXT[] DEFAULT '{}',
    theme_id TEXT DEFAULT 'sovix_default',
    theme_customization JSONB
);

CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    category_id UUID REFERENCES public.categories(id),
    rating NUMERIC(3,2) DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Colunas extras de migrações
    bairros_atendidos TEXT[] DEFAULT '{}',
    theme_id TEXT DEFAULT 'sovix_default',
    theme_customization JSONB,
    city TEXT,
    neighborhood TEXT,
    provider_type TEXT CHECK (provider_type IN ('autonomo', 'empresa')) DEFAULT 'autonomo',
    phone TEXT,
    whatsapp TEXT
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    city TEXT,
    neighborhood TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Colunas de métricas
    views INTEGER DEFAULT 0,
    cart_count INTEGER DEFAULT 0,
    bairros_disponiveis TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    city TEXT,
    neighborhood TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Colunas de métricas
    views INTEGER DEFAULT 0,
    cart_count INTEGER DEFAULT 0,
    bairros_disponiveis TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.store_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude NUMERIC,
    longitude NUMERIC,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELAS DE APOIO E NOVAS FUNCIONALIDADES

CREATE TABLE IF NOT EXISTS public.theme_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('seller', 'provider')),
    theme_id TEXT NOT NULL DEFAULT 'sovix_default',
    colors JSONB,
    fonts JSONB,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, user_type)
);

CREATE TABLE IF NOT EXISTS public.provider_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_enabled BOOLEAN DEFAULT true,
    start_time TIME WITHOUT TIME ZONE DEFAULT '09:00',
    end_time TIME WITHOUT TIME ZONE DEFAULT '18:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.seller_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_enabled BOOLEAN DEFAULT true,
    start_time TIME WITHOUT TIME ZONE DEFAULT '09:00',
    end_time TIME WITHOUT TIME ZONE DEFAULT '18:00',
    UNIQUE(seller_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.provider_portfolio_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, seller_id),
    UNIQUE(follower_id, provider_id)
);

CREATE TABLE IF NOT EXISTS public.olheiro_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    consumer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID,
    service_id UUID,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FUNÇÕES SQL E RPCS (NOMES DE PARÂMETROS SINCRONIZADOS COM FRONT-END)

-- 1. Registro de View de Loja/Prestador
DROP FUNCTION IF EXISTS public.register_storefront_view(uuid, text);
DROP FUNCTION IF EXISTS public.register_storefront_view(uuid, text, text, text);

CREATE OR REPLACE FUNCTION public.register_storefront_view(
    p_store_id uuid, 
    p_store_type text,
    p_session_id text DEFAULT NULL,
    p_ip_hash text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    IF p_store_type = 'shop' OR p_store_type = 'seller' THEN
        UPDATE public.sellers SET views = views + 1 WHERE id = p_store_id;
    ELSIF p_store_type = 'provider' THEN
        UPDATE public.service_providers SET views = COALESCE(views, 0) + 1 WHERE id = p_store_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Métricas de Produtos
DROP FUNCTION IF EXISTS public.increment_product_view(uuid);
CREATE OR REPLACE FUNCTION public.increment_product_view(p_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.products SET views = views + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.increment_product_cart(uuid);
CREATE OR REPLACE FUNCTION public.increment_product_cart(p_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.products SET cart_count = cart_count + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Métricas de Serviços
DROP FUNCTION IF EXISTS public.increment_service_view(uuid);
CREATE OR REPLACE FUNCTION public.increment_service_view(p_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.services SET views = views + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.increment_service_cart(uuid);
CREATE OR REPLACE FUNCTION public.increment_service_cart(p_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.services SET cart_count = cart_count + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SEGURANÇA (RLS BÁSICO)
-- Nota: Habilitar RLS em todas as tabelas e criar políticas de SELECT público para vitrines.

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access') THEN
        CREATE POLICY "Public read access" ON public.sellers FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON public.service_providers FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON public.products FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON public.services FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON public.store_locations FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON public.theme_customizations FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON public.provider_availability FOR SELECT USING (true);
        CREATE POLICY "Public read access" ON public.seller_availability FOR SELECT USING (true);
    END IF;
END $$;

-- 6. GARANTIR COLUNAS (Caso as tabelas já existam sem as migrações recentes)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.sellers ADD COLUMN username TEXT UNIQUE;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.sellers ADD COLUMN bairros_atendidos TEXT[] DEFAULT '{}';
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.products ADD COLUMN views INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.products ADD COLUMN cart_count INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.services ADD COLUMN views INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.services ADD COLUMN cart_count INTEGER DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;
END $$;
