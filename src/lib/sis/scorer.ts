// ─────────────────────────────────────────────────────────────
// Sovix Intent Search — Algoritmo de Pontuação por Campo
// ─────────────────────────────────────────────────────────────

import { exactMatch, fuzzyMatch } from './fuzzy';

/**
 * Pesos de pontuação por tipo de campo.
 * Ajustáveis sem alterar a lógica do scorer.
 */
export const SCORE_WEIGHTS = {
    name: 10,
    category: 7,
    description: 5,
    tags: 4,
    storefrontName: 3,
} as const;

export interface ScorableFields {
    name: string;
    description?: string | null;
    categoryName?: string | null;
    tags?: string[] | null;
    storefrontName?: string | null;
}

/**
 * Calcula a pontuação de relevância de um item em relação à query.
 * Retorna um número ≥ 0 (quanto maior, mais relevante).
 */
export function scoreItem(query: string, fields: ScorableFields): number {
    if (!query || query.trim().length === 0) return 0;

    let score = 0;

    // Nome — máxima prioridade
    if (fields.name) {
        if (exactMatch(query, fields.name)) {
            score += SCORE_WEIGHTS.name;
        } else if (fuzzyMatch(query, fields.name)) {
            score += Math.floor(SCORE_WEIGHTS.name * 0.7); // 70% se fuzzy
        }
    }

    // Categoria
    if (fields.categoryName) {
        if (exactMatch(query, fields.categoryName)) {
            score += SCORE_WEIGHTS.category;
        } else if (fuzzyMatch(query, fields.categoryName)) {
            score += Math.floor(SCORE_WEIGHTS.category * 0.7);
        }
    }

    // Descrição
    if (fields.description) {
        if (exactMatch(query, fields.description)) {
            score += SCORE_WEIGHTS.description;
        } else if (fuzzyMatch(query, fields.description)) {
            score += Math.floor(SCORE_WEIGHTS.description * 0.6);
        }
    }

    // Tags (futuro — já preparado)
    if (fields.tags && fields.tags.length > 0) {
        for (const tag of fields.tags) {
            if (exactMatch(query, tag)) {
                score += SCORE_WEIGHTS.tags;
                break; // Uma tag basta
            } else if (fuzzyMatch(query, tag)) {
                score += Math.floor(SCORE_WEIGHTS.tags * 0.7);
                break;
            }
        }
    }

    // Nome da Vitrine
    if (fields.storefrontName) {
        if (exactMatch(query, fields.storefrontName)) {
            score += SCORE_WEIGHTS.storefrontName;
        } else if (fuzzyMatch(query, fields.storefrontName)) {
            score += Math.floor(SCORE_WEIGHTS.storefrontName * 0.7);
        }
    }

    return score;
}
