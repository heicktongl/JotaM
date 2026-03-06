-- Criação da tabela theme_customizations para armazenar as customizações de visual de Sellers e Providers
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
    
    -- Restrição de unicidade para que um usuário tenha apenas uma personalização ativa por tipo
    UNIQUE (user_id, user_type)
);

-- Ativar Row Level Security
ALTER TABLE public.theme_customizations ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
-- 1. Qualquer pessoa pode ler as personalizações de tema (necessário para visitantes da vitrine)
CREATE POLICY "Public profiles are viewable by everyone."
ON public.theme_customizations FOR SELECT
USING (true);

-- 2. Apenas os donos podem editar/criar suas próprias customizações
CREATE POLICY "Users can insert their own theme customizations."
ON public.theme_customizations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own theme customizations."
ON public.theme_customizations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own theme customizations."
ON public.theme_customizations FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_theme_customizations_updated
BEFORE UPDATE ON public.theme_customizations
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
