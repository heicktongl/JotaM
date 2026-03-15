// ─────────────────────────────────────────────────────────────
// Sovix Intent Search — Engine (Orquestrador Principal)
// ─────────────────────────────────────────────────────────────

import { supabase } from '../supabase';
import { scoreItem, ScorableFields } from './scorer';
import { correctTypos, normalize } from './fuzzy';

// ── Tipos exportados ────────────────────────────────────────

export interface ScoredItem {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    categoryName: string;
    storefrontName: string;
    storefrontUsername: string;
    score: number;
    type: 'product' | 'service';
    // Campos extras para serviços
    serviceType?: string;
    rating?: number;
    created_at?: string;
    neighborhood?: string;
    city?: string;
    views?: number;
    cart_count?: number;
}

export interface ScoredStorefront {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    type: 'shop' | 'provider';
    categoryName: string;
    neighborhood: string;
    city: string;
    views: number;
    score: number;
}

export interface SISResults {
    products: ScoredItem[];
    services: ScoredItem[];
    storefronts: ScoredStorefront[];
}

export interface LocationFilter {
    neighborhood?: string | null;
    city?: string | null;
    categoryId?: string | null;
}

// ── Helpers ─────────────────────────────────────────────────

// SIS-LOCA-HIPERLOCAL: Construtor rigoroso de filtro geográfico
function buildLocationFilter(
    query: any,
    loc: LocationFilter,
    neighborhoodCol = 'neighborhood',
    cityCol = 'city'
) {
    let finalQuery = query;
    // 1. Sempre trava na cidade (Âncora estratégica territorial)
    if (loc.city) {
        finalQuery = finalQuery.ilike(cityCol, `%${loc.city}%`);
    }
    // 2. Aplica bairro por cima (se existente e válido)
    if (loc.neighborhood && loc.neighborhood !== 'Bairro Desconhecido') {
        finalQuery = finalQuery.ilike(neighborhoodCol, `%${loc.neighborhood}%`);
    }
    return finalQuery;
}

// ── Engine Principal ────────────────────────────────────────

/**
 * Executa uma busca completa na Sovix via Sovix Intent Search.
 *
 * 1. Aplica correção de typos na query
 * 2. Dispara queries paralelas ao Supabase
 * 3. Aplica scoring de relevância client-side
 * 4. Retorna resultados separados e ordenados por score
 */
export async function sisSearch(
    rawQuery: string,
    location: LocationFilter
): Promise<SISResults> {
    const corrected = correctTypos(rawQuery);
    const q = corrected.trim();
    const searchTerm = q.length > 0 ? `%${q}%` : null;

    // ── 1. Query de Produtos (com joins para scoring) ──────────
    let prodsQuery = supabase
        .from('products')
        .select('id, name, description, price, image_url, category_id, created_at, city, neighborhood, seller_id, views, cart_count, sellers!products_seller_id_fkey(store_name, username), categories(name)')
        .eq('is_active', true)
        .limit(60); // AUMENTADO PARA PERMITIR FILTRO DE CAMADA

    // SIS-LOCA-HIPERLOCAL: Na busca, trazemos por cidade e depois separamos no front
    prodsQuery = buildLocationFilter(prodsQuery, { ...location, neighborhood: null });

    if (location.categoryId) {
        prodsQuery = prodsQuery.eq('category_id', location.categoryId);
    }

    if (searchTerm) {
        prodsQuery = prodsQuery.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // ── 2. Query de Serviços (com joins para scoring) ──────────
    let servsQuery = supabase
        .from('services')
        .select('id, name, description, price, image_url, category_id, service_type, created_at, city, neighborhood, provider_id, views, cart_count, service_providers(name, username, rating), categories(name)')
        .eq('is_active', true)
        .limit(60);

    servsQuery = buildLocationFilter(servsQuery, { ...location, neighborhood: null });

    if (location.categoryId) {
        servsQuery = servsQuery.eq('category_id', location.categoryId);
    }

    if (searchTerm) {
        servsQuery = servsQuery.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // ── 3. Query de Sellers (SIS-LOCA-HIPERLOCAL) ──────────────
    // Sellers exigem sub-query via store_locations para localização
    let sellerIds: string[] = [];
    if (location.neighborhood || location.city) {
        let locQ = supabase.from('store_locations').select('seller_id');

        // Sempre trava na cidade
        if (location.city) {
            locQ = locQ.ilike('city', `%${location.city}%`);
        }
        // Remove filtro de bairro pra vitrines na query bruta para exibir camada 2
        
        const { data: lData } = await locQ;
        sellerIds = (lData || []).map((l: any) => l.seller_id).filter(Boolean);
    }

    let sellersQuery = supabase
        .from('sellers')
        .select('id, store_name, username, avatar_url, bio, views, category_id, store_locations(neighborhood, city, is_primary), categories(name)')
        .not('username', 'is', null)
        .is('deleted_at', null)
        .limit(15);

    if (sellerIds.length > 0) {
        sellersQuery = sellersQuery.in('id', sellerIds);
    }

    if (location.categoryId) {
        sellersQuery = sellersQuery.eq('category_id', location.categoryId);
    }

    if (searchTerm) {
        sellersQuery = sellersQuery.or(`store_name.ilike.${searchTerm},bio.ilike.${searchTerm}`);
    }

    // ── 4. Query de Prestadores ────────────────────────────────
    let providersQuery = supabase
        .from('service_providers')
        .select('id, name, username, avatar_url, bio, neighborhood, city, category_id, categories(name)')
        .not('username', 'is', null)
        .is('deleted_at', null)
        .limit(20);

    providersQuery = buildLocationFilter(providersQuery, { ...location, neighborhood: null });

    if (location.categoryId) {
        providersQuery = providersQuery.eq('category_id', location.categoryId);
    }

    if (searchTerm) {
        providersQuery = providersQuery.or(`name.ilike.${searchTerm},bio.ilike.${searchTerm}`);
    }

    // ── Dispara tudo em paralelo ──────────────────────────────
    const [prodsRes, servsRes, sellersRes, providersRes] = await Promise.all([
        prodsQuery,
        servsQuery,
        sellersQuery,
        providersQuery,
    ]);

    // ── Scoring de Produtos ───────────────────────────────────
    const products: ScoredItem[] = (prodsRes.data || [])
        .filter((p: any) => p.sellers) // Se o seller for deletado (via join logic ou se filtrarmos no select futuramente)
        .map((p: any) => {
        const catName = p.categories?.name || '';
        const storeName = p.sellers?.store_name || '';

        const fields: ScorableFields = {
            name: p.name || '',
            description: p.description,
            categoryName: catName,
            storefrontName: storeName,
        };

        return {
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image_url || `https://picsum.photos/seed/${p.id}/800/1000`,
            description: p.description || '',
            categoryName: catName,
            storefrontName: storeName,
            storefrontUsername: p.sellers?.username || '',
            score: q.length > 0 ? scoreItem(q, fields) : 0,
            type: 'product',
            created_at: p.created_at,
            city: p.city,
            neighborhood: p.neighborhood,
            views: p.views || 0,
            cart_count: p.cart_count || 0,
        };
    });

    // ── Scoring de Serviços ───────────────────────────────────
    const services: ScoredItem[] = (servsRes.data || [])
        .filter((s: any) => s.service_providers)
        .map((s: any) => {
        const catName = s.categories?.name || '';
        const providerName = s.service_providers?.name || '';

        const fields: ScorableFields = {
            name: s.name || '',
            description: s.description,
            categoryName: catName,
            storefrontName: providerName,
        };

        return {
            id: s.id,
            name: s.name,
            price: s.price,
            image: s.image_url || `https://picsum.photos/seed/${s.id}/800/1000`,
            description: s.description || '',
            categoryName: catName,
            storefrontName: providerName,
            storefrontUsername: s.service_providers?.username || '',
            score: q.length > 0 ? scoreItem(q, fields) : 0,
            type: 'service',
            serviceType: s.service_type,
            rating: s.service_providers?.rating ?? 5.0,
            created_at: s.created_at,
            city: s.city,
            neighborhood: s.neighborhood,
            views: s.views || 0,
            cart_count: s.cart_count || 0,
        };
    });

    // ── Scoring de Vitrines ───────────────────────────────────
    const formattedSellers: ScoredStorefront[] = (sellersRes.data || [])
        .filter((s: any) => s.username)
        .map((s: any) => {
            const locs: any[] = s.store_locations || [];
            const primary = locs.find((l: any) => l.is_primary) || locs[0] || {};

            const catName = s.categories?.name || '';
            const fields: ScorableFields = {
                name: s.store_name || '',
                description: s.bio,
                categoryName: catName,
            };

            return {
                id: s.id,
                name: s.store_name,
                username: s.username,
                avatar_url: s.avatar_url,
                bio: s.bio,
                type: 'shop' as const,
                categoryName: catName,
                neighborhood: primary.neighborhood || '',
                city: primary.city || '',
                views: s.views ?? 0,
                score: q.length > 0 ? scoreItem(q, fields) : 0,
            };
        });

    const formattedProviders: ScoredStorefront[] = (providersRes.data || [])
        .filter((p: any) => p.username)
        .map((p: any) => {
            const catName = p.categories?.name || '';
            const fields: ScorableFields = {
                name: p.name || '',
                description: p.bio,
                categoryName: catName,
            };

            return {
                id: p.id,
                name: p.name,
                username: p.username || '',
                avatar_url: p.avatar_url,
                bio: p.bio,
                type: 'provider' as const,
                categoryName: catName,
                neighborhood: p.neighborhood || '',
                city: p.city || '',
                views: 0,
                score: q.length > 0 ? scoreItem(q, fields) : 0,
            };
        });

    const storefronts = [...formattedSellers, ...formattedProviders];

    // ── Ordenação por score (decrescente) ─────────────────────
    products.sort((a, b) => b.score - a.score || new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    services.sort((a, b) => b.score - a.score || new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
    storefronts.sort((a, b) => b.score - a.score || b.views - a.views);

    return { products, services, storefronts };
}
