-- ==========================================================
-- 💖 SISTEMA DE FAVORITOS - SOVIX CONNECT
-- ==========================================================

-- 1. Criação da Tabela
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, item_id, item_type)
);

-- 2. Habilitar RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança
DROP POLICY IF EXISTS "Usuários podem ver seus próprios favoritos" ON public.favorites;
CREATE POLICY "Usuários podem ver seus próprios favoritos"
    ON public.favorites FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios favoritos" ON public.favorites;
CREATE POLICY "Usuários podem gerenciar seus próprios favoritos"
    ON public.favorites FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON public.favorites(item_id);
