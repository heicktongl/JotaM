-- Migration: Add multi-neighborhood support for sellers and products

-- Adicionando bairros_atendidos para vendedores e prestadores
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS bairros_atendidos text[] DEFAULT '{}';

ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS bairros_atendidos text[] DEFAULT '{}';

-- Adicionando bairros_disponiveis para produtos e serviços
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS bairros_disponiveis text[] DEFAULT '{}';

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS bairros_disponiveis text[] DEFAULT '{}';

-- Atualizar RLS (Row Level Security) - Embora essas colunas herdem as permissões da tabela,
-- vamos garantir que sejam consultáveis publicamente para que o feed funcione.
-- Não precisa de uma policy nova porque a policy de SELECT existe no nível da linha, não no nível da coluna.
