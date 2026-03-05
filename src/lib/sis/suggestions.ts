// ─────────────────────────────────────────────────────────────
// Sovix Intent Search — Sugestões Automáticas
// ─────────────────────────────────────────────────────────────

import { supabase } from '../supabase';
import { normalize, fuzzyMatch, exactMatch } from './fuzzy';
import { INTENTIONS_MAP } from './intentions';

/**
 * Lista de termos populares estáticos (alta demanda regional).
 * Expandível via tabela `search_logs` no futuro.
 */
const TRENDING_TERMS = [
    'eletricista',
    'encanador',
    'pedreiro',
    'pintor',
    'manicure',
    'cabeleireiro',
    'marmita',
    'bolo',
    'açaí',
    'frete',
    'mudança',
    'limpeza',
    'mecânico',
    'costureira',
    'pet shop',
    'farmácia',
    'padaria',
    'pizzaria',
    'borracharia',
    'sorveteria',
];

let cachedCategories: string[] = [];
let categoriesFetched = false;

/**
 * Busca nomes de categorias existentes no banco (cache em memória).
 */
async function fetchCategories(): Promise<string[]> {
    if (categoriesFetched) return cachedCategories;

    try {
        const { data } = await supabase
            .from('categories')
            .select('name')
            .order('name');

        cachedCategories = (data || []).map((c: { name: string }) => c.name);
        categoriesFetched = true;
    } catch (err) {
        console.error('[SIS] Erro ao buscar categorias para sugestões:', err);
    }

    return cachedCategories;
}

/**
 * Retorna sugestões filtradas de acordo com a query parcial do usuário.
 * 1. Mapeia INTENTIONS_MAP (se a query bater com a chave, sugere os filhos)
 * 2. Faz match fuzzy nas categorias e popular terms.
 */
export async function getSuggestions(partialQuery: string): Promise<string[]> {
    const normQuery = normalize(partialQuery || '');
    if (!normQuery) return getPopularTerms(6);

    const suggestions = new Set<string>();

    // 1. Verifica Intentions Map (Match Direto na Chave)
    const exactIntentionsMatches = Object.keys(INTENTIONS_MAP).filter(k => exactMatch(normQuery, k) || exactMatch(k, normQuery));

    for (const matchKey of exactIntentionsMatches) {
        INTENTIONS_MAP[matchKey].forEach(i => suggestions.add(i));
    }

    // Preenche o resto com categorias e termos populares (Fuzzy Match)
    const categories = await fetchCategories();

    const allTerms = new Set<string>([...categories, ...TRENDING_TERMS]);

    for (const term of allTerms) {
        if (suggestions.size >= 6) break;

        // Se não já estiver na lista, testa via Fuzzy
        if (!suggestions.has(term)) {
            if (fuzzyMatch(normQuery, term)) {
                suggestions.add(term);
            }
        }
    }

    return Array.from(suggestions).slice(0, 6);
}

/**
 * Retorna termos da lista TRENDING_TERMS organizados para popularidade ("Populares perto de você")
 */
export function getPopularTerms(limit: number = 5): string[] {
    // Poderia embaralhar ou retornar fixos. Por enquanto retornamos os tops.
    return TRENDING_TERMS.slice(0, limit);
}

/**
 * Invalida o cache de categorias (chamar se categorias forem atualizadas).
 */
export function invalidateSuggestionsCache(): void {
    cachedCategories = [];
    categoriesFetched = false;
}
