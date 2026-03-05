// ─────────────────────────────────────────────────────────────
// Sovix Intent Search — Módulo de Normalização e Fuzzy Matching
// ─────────────────────────────────────────────────────────────

/**
 * Mapa de correções frequentes de digitação em PT-BR.
 * Expandível a qualquer momento sem alterar a lógica da engine.
 */
const TYPO_MAP: Record<string, string> = {
    eletrcista: 'eletricista',
    eletrisista: 'eletricista',
    eletriscista: 'eletricista',
    pizaria: 'pizzaria',
    pizzaria: 'pizzaria',
    cabeleirero: 'cabeleireiro',
    cabelereira: 'cabeleireira',
    mecanico: 'mecânico',
    mecanica: 'mecânica',
    borracharia: 'borracharia',
    encanador: 'encanador',
    encandor: 'encanador',
    pedreiro: 'pedreiro',
    pintor: 'pintor',
    manicuri: 'manicure',
    marmitex: 'marmita',
    marmiteix: 'marmita',
    acai: 'açaí',
    açai: 'açaí',
    refirgerante: 'refrigerante',
    refigerante: 'refrigerante',
    sorveteria: 'sorveteria',
    farnacia: 'farmácia',
    farmasia: 'farmácia',
    padaria: 'padaria',
    confitaria: 'confeitaria',
    confeiteria: 'confeitaria',
};

/**
 * Remove acentos, converte para minúsculas e colapsa espaços.
 */
export function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // remove diacríticos
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Aplica o mapa de typos e normaliza a query do usuário.
 * Retorna a query corrigida (ou a original se sem correção).
 */
export function correctTypos(query: string): string {
    const normalized = normalize(query);
    const words = normalized.split(' ');

    const corrected = words.map(word => {
        // Tenta match direto no mapa
        if (TYPO_MAP[word]) return TYPO_MAP[word];
        // Tenta match sem acentos no mapa
        const normalizedMapKeys = Object.keys(TYPO_MAP);
        for (const key of normalizedMapKeys) {
            if (normalize(key) === word) return TYPO_MAP[key];
        }
        return word;
    });

    return corrected.join(' ');
}

/**
 * Gera bigrams de uma string (pares de caracteres consecutivos).
 * Usado para matching aproximado.
 */
function bigrams(str: string): Set<string> {
    const s = normalize(str);
    const result = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
        result.add(s.substring(i, i + 2));
    }
    return result;
}

/**
 * Calcula a similaridade de Dice entre duas strings (0 a 1).
 * Baseado em bigrams — rápido e eficiente para fuzzy matching.
 */
export function diceSimilarity(a: string, b: string): number {
    const bigramsA = bigrams(a);
    const bigramsB = bigrams(b);
    if (bigramsA.size === 0 && bigramsB.size === 0) return 1;
    if (bigramsA.size === 0 || bigramsB.size === 0) return 0;

    let intersection = 0;
    for (const bg of bigramsA) {
        if (bigramsB.has(bg)) intersection++;
    }

    return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

/**
 * Verifica se a query faz match exato (contido) no target, após normalização.
 */
export function exactMatch(query: string, target: string): boolean {
    if (!target) return false;
    return normalize(target).includes(normalize(query));
}

/**
 * Verifica se a query faz match fuzzy (tolerante a erros) no target.
 * Usa Dice similarity com threshold de 0.5 para palavras ≥ 4 chars.
 */
export function fuzzyMatch(query: string, target: string): boolean {
    if (!target) return false;

    // Primeiro tenta match exato (mais rápido)
    if (exactMatch(query, target)) return true;

    // Tenta match com query corrigida
    const corrected = correctTypos(query);
    if (corrected !== normalize(query) && exactMatch(corrected, target)) return true;

    // Fuzzy: compara cada palavra da query com cada palavra do target
    const queryWords = normalize(query).split(' ').filter(w => w.length >= 3);
    const targetWords = normalize(target).split(' ');

    for (const qw of queryWords) {
        for (const tw of targetWords) {
            if (tw.length < 3) continue;
            if (diceSimilarity(qw, tw) >= 0.55) return true;
        }
    }

    return false;
}
