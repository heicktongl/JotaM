// ─────────────────────────────────────────────────────────────
// Sovix Intent Search — Exportações Públicas
// ─────────────────────────────────────────────────────────────

export { sisSearch } from './engine';
export { getSuggestions, getPopularTerms, invalidateSuggestionsCache } from './suggestions';
export { correctTypos, normalize, fuzzyMatch } from './fuzzy';
export { scoreItem, SCORE_WEIGHTS } from './scorer';

export type { SISResults, ScoredItem, ScoredStorefront, LocationFilter } from './engine';
export type { ScorableFields } from './scorer';
