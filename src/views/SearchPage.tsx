import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, Loader2, PackageOpen, Store, Wrench, ChevronRight, MapPin, Flame, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { useLocationScope } from '../context/LocationContext';
import { sisSearch, getSuggestions, getPopularTerms } from '../lib/sis';
import type { ScoredItem, ScoredStorefront, SISResults } from '../lib/sis';
import { StorefrontSkeleton } from '../components/Skeleton';

// ──────────────────────────────────────────────
// Tipos (internos)
// ──────────────────────────────────────────────
type StorefrontType = 'shop' | 'provider';

interface TopStorefront {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  type: StorefrontType;
  neighborhood: string;
  city: string;
  views?: number;
  categoryName?: string; // Added this to match the new component structure
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  type: 'product' | 'service';
  parent_id: string | null;
}

// ──────────────────────────────────────────────
// Card de Vitrine — padrão (busca)
// ──────────────────────────────────────────────
const StorefrontCard: React.FC<{ store: ScoredStorefront }> = ({ store }) => {
  const navigate = useNavigate();
  const isShop = store.type === 'shop';
  const href = `/@${store.username}`;

  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 hover:border-orange-200 hover:shadow-md transition-all text-left group active:scale-[0.98]"
    >
      <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden border-2 border-neutral-100 bg-neutral-200">
        {store.avatar_url ? (
          <img src={store.avatar_url} alt={store.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className={`h-full w-full flex items-center justify-center ${isShop ? 'bg-orange-100' : 'bg-purple-100'}`}>
            {isShop ? <Store size={20} className="text-orange-500" /> : <Wrench size={20} className="text-purple-500" />}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm text-neutral-900 truncate">{store.name}</span>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${isShop ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
            {isShop ? 'Loja' : 'Prestador'}
          </span>
        </div>
        {store.bio && <p className="text-xs text-neutral-500 truncate">{store.bio}</p>}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            <MapPin size={10} className="text-neutral-400 shrink-0" />
            <span className="text-[10px] text-neutral-400 truncate">{store.neighborhood}</span>
          </div>
          {store.categoryName && (
            <span className="text-[9px] font-bold bg-neutral-100 text-neutral-400 px-1.5 py-0.5 rounded-full lowercase">
              {store.categoryName}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-neutral-300 group-hover:text-orange-400 transition-colors" />
    </button>
  );
};

// ──────────────────────────────────────────────
// Card de Vitrine — DESTAQUE (top 2)
// ──────────────────────────────────────────────
const FeaturedStorefrontCard: React.FC<{ store: TopStorefront; rank: number }> = ({ store, rank }) => {
  const navigate = useNavigate();
  const isShop = store.type === 'shop';
  const href = `/@${store.username}`;

  return (
    <button
      onClick={() => navigate(href)}
      className="flex-1 w-full flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-md hover:border-orange-200 transition-all text-left group active:scale-[0.98]"
    >
      <div className={`relative h-24 w-full flex items-center justify-center ${isShop ? 'bg-gradient-to-br from-orange-400 to-rose-500' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Flame size={10} className="text-amber-300" />
          <span className="text-[10px] font-black text-white">#{rank}</span>
        </div>
        <div className="h-16 w-16 rounded-full overflow-hidden border-3 border-white shadow-lg bg-white">
          {store.avatar_url ? (
            <img src={store.avatar_url} alt={store.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className={`h-full w-full flex items-center justify-center ${isShop ? 'bg-orange-100' : 'bg-purple-100'}`}>
              {isShop ? <Store size={24} className="text-orange-500" /> : <Wrench size={24} className="text-purple-500" />}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-1">
          <span className="font-bold text-sm text-neutral-900 leading-tight line-clamp-1">{store.name}</span>
          <ChevronRight size={14} className="shrink-0 text-neutral-300 group-hover:text-orange-400 transition-colors mt-0.5" />
        </div>
        {store.bio && <p className="text-[11px] text-neutral-500 line-clamp-1 leading-tight">{store.bio}</p>}
        <div className="flex items-center gap-1 mt-auto pt-1">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <MapPin size={9} className="text-neutral-400 shrink-0" />
            <span className="text-[10px] text-neutral-400 truncate">{store.neighborhood}</span>
          </div>
          {store.categoryName && (
             <span className={`shrink-0 text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${isShop ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                {store.categoryName}
             </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ──────────────────────────────────────────────
// Card de Item (Produto/Serviço) — SIS
// ──────────────────────────────────────────────
const SISItemCard: React.FC<{ item: ScoredItem; rank?: number }> = ({ item, rank }) => {
  const navigate = useNavigate();
  const isProduct = item.type === 'product';

  return (
    <button
      onClick={() => navigate(`/item/${item.type}/${item.id}`)}
      className="w-full flex items-center gap-4 bg-white rounded-2xl p-3 shadow-sm border border-neutral-100 hover:border-orange-200 hover:shadow-md transition-all text-left group active:scale-[0.98] relative"
    >
      <div className="shrink-0 h-16 w-16 rounded-2xl overflow-hidden bg-neutral-100 relative">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        {rank && rank <= 3 && (
          <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-[8px] font-black text-white px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 animate-pulse">
            <Flame size={8} className="text-orange-400" />
            EM ALTA
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-neutral-900 truncate group-hover:text-orange-600 transition-colors">{item.name}</p>
        {item.storefrontName && (
          <p className="text-[11px] text-neutral-500 truncate">{item.storefrontName}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-black text-neutral-900">
            <span className="text-[10px] font-bold text-neutral-400">R$</span>{' '}
            {item.price.toFixed(2)}
          </span>
          {item.categoryName && (
            <span className="text-[9px] font-bold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full">{item.categoryName}</span>
          )}
        </div>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50 text-neutral-900 transition-all group-hover:bg-orange-600 group-hover:text-white shrink-0">
        {isProduct ? <ShoppingBag size={16} /> : <ArrowRight size={16} />}
      </div>
    </button>
  );
};

// ──────────────────────────────────────────────
// Chip de Sugestão
// ──────────────────────────────────────────────
const SuggestionChip: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold bg-white border border-neutral-200 text-neutral-600 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-95"
  >
    {label}
  </button>
);

// ──────────────────────────────────────────────
// Página principal — Sovix Intent Search
// ──────────────────────────────────────────────
export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SISResults>({ products: [], services: [], storefronts: [] });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularTerms, setPopularTerms] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [topStorefronts, setTopStorefronts] = useState<TopStorefront[]>([]);
  const [isLoadingTop, setIsLoadingTop] = useState(true);
  const [topSectionTitle, setTopSectionTitle] = useState('Destaques');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<Category | null>(null);
  const [isShowingExternal, setIsShowingExternal] = useState(false);
  const { location, scope } = useLocationScope();

  const neighborhoodFilter =
    scope !== 'city' &&
      location?.neighborhood &&
      location.neighborhood !== 'Bairro Desconhecido'
      ? location.neighborhood
      : null;
  const cityFilter = location?.city || null;

  // ── Categorias (carrega uma vez) ───────────────────────────
  useEffect(() => {
    const fetchRootCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .order('name');
      if (data) setCategories(data as Category[]);
    };
    fetchRootCategories();
    setPopularTerms(getPopularTerms(6));
  }, []);

  // ── Subcategorias quando uma categoria-pai é selecionada ────
  useEffect(() => {
    if (selectedCategory) {
      const fetchSubs = async () => {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('parent_id', selectedCategory.id)
          .order('name');
        if (data) setSubCategories(data as Category[]);
      };
      fetchSubs();
    } else {
      setSubCategories([]);
      setSelectedSubCategory(null);
    }
  }, [selectedCategory]);

  // ── Buscar sugestões filtradas conforme digita ─────────────
  useEffect(() => {
    if (query.trim().length > 0) {
      getSuggestions(query).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // ── Top 2 vitrines (sem query — igual ao original) ─────────
  useEffect(() => {
    const fetchTopStorefronts = async () => {
      setIsLoadingTop(true);
      try {
        let topResults: TopStorefront[] = [];
        const usedIds = new Set<string>();

        const isCompleteSeller = (s: any) => 
          s.username && (s.store_name || s.name); 

        const isCompleteProvider = (p: any) => 
          p.username && p.name;

        const formatSellers = (data: any[]): TopStorefront[] =>
          data.filter(s => s.username && isCompleteSeller(s)).map((s) => {
            const primary = s.store_locations?.find((l: any) => l.is_primary) || s.store_locations?.[0] || {};
            return {
              id: s.id, name: s.store_name, username: s.username,
              avatar_url: s.avatar_url, bio: s.bio, type: 'shop' as const,
              neighborhood: primary.neighborhood || '', city: primary.city || '',
              views: s.views ?? 0,
            };
          });

        const formatProviders = (data: any[]): TopStorefront[] =>
          data.filter(p => p.username && isCompleteProvider(p)).map((p) => ({
            id: p.id, name: p.name, username: p.username,
            avatar_url: p.avatar_url, bio: p.bio, type: 'provider' as const,
            neighborhood: p.neighborhood || '', city: p.city || '', views: 0,
          }));

        const addResults = (newItems: TopStorefront[]) => {
          for (const item of newItems) {
            if (!usedIds.has(item.id) && topResults.length < 7) {
              topResults.push(item);
              usedIds.add(item.id);
            }
          }
        };

        // SIS-LOCA-HIPERLOCAL: Filtro unificado para qualquer vitrine no bairro (Lojas + Prestadores)
        if (neighborhoodFilter) {
          // 1. Busca Lojas (Sellers)
          let queryLocs = supabase.from('store_locations').select('seller_id').ilike('neighborhood', `%${neighborhoodFilter}%`);
          if (cityFilter) queryLocs = queryLocs.ilike('city', `%${cityFilter}%`);
          
          const { data: locs } = await queryLocs;
          const sIds = (locs || []).map((l: any) => l.seller_id).filter(Boolean);
          
          if (sIds.length > 0) {
            const { data: sellersData } = await supabase.from('sellers')
              .select('id, store_name, username, avatar_url, cover_url, bio, whatsapp, views, store_locations(neighborhood, city, is_primary)')
              .in('id', sIds).not('username', 'is', null).order('views', { ascending: false });
            if (sellersData) addResults(formatSellers(sellersData));
          }

          // 2. Busca Prestadores (Service Providers)
          let provQuery = supabase.from('service_providers')
            .select('id, name, username, avatar_url, bio, neighborhood, city, whatsapp')
            .ilike('neighborhood', `%${neighborhoodFilter}%`);
          if (cityFilter) provQuery = provQuery.ilike('city', `%${cityFilter}%`);
          
          const { data: provsData } = await provQuery.not('username', 'is', null).limit(10);
          if (provsData) addResults(formatProviders(provsData));

          if (topResults.length > 0) setTopSectionTitle(`Destaques em ${neighborhoodFilter}`);
        }

        if (topResults.length < 7 && cityFilter) {
          const { data: locs } = await supabase.from('store_locations').select('seller_id').ilike('city', `%${cityFilter}%`);
          const sIds = (locs || []).map((l: any) => l.seller_id).filter(Boolean);
          if (sIds.length > 0) {
            const { data } = await supabase.from('sellers')
              .select('id, store_name, username, avatar_url, cover_url, bio, whatsapp, views, store_locations(neighborhood, city, is_primary), products(id), seller_availability(id)')
              .in('id', sIds).not('username', 'is', null).order('views', { ascending: false }).limit(20);
            if (data) addResults(formatSellers(data));
          }
          if (topResults.length > 0 && topSectionTitle === 'Destaques') setTopSectionTitle('Mais acessadas na sua região');
        }

        if (topResults.length < 2 && cityFilter) {
          const { data } = await supabase.from('service_providers')
            .select('id, name, username, avatar_url, bio, neighborhood, city')
            .ilike('city', `%${cityFilter}%`).not('username', 'is', null).limit(2);
          if (data) addResults(formatProviders(data));
          if (topResults.length > 0 && topSectionTitle === 'Destaques') setTopSectionTitle('Destaques na sua região');
        }

        if (topResults.length < 2) {
          const { data } = await supabase.from('sellers')
            .select('id, store_name, username, avatar_url, bio, views, store_locations(neighborhood, city, is_primary)')
            .not('username', 'is', null).order('views', { ascending: false }).limit(2 - topResults.length);
          if (data) addResults(formatSellers(data));
          setTopSectionTitle('Destaques na Sovix');
        }

        setTopStorefronts(topResults);
      } catch (err) {
        console.error('[SIS] Erro ao buscar top vitrines:', err);
      } finally {
        setIsLoadingTop(false);
      }
    };

    fetchTopStorefronts();
  }, [neighborhoodFilter, cityFilter]);

  // ── Busca SIS (debounced) ──────────────────────────────────
  useEffect(() => {
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const activeCategoryId = selectedSubCategory?.id || selectedCategory?.id || null;
        const sisResults = await sisSearch(query, {
          neighborhood: neighborhoodFilter,
          city: cityFilter,
          categoryId: activeCategoryId,
        });

        // ── FILTRO DE CAMADAS (Tiered Search Hiperlocal) ──
        let externalFlag = false;
        if (neighborhoodFilter) {
           const safeNormalize = (b: string | null | undefined) => b ? b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
           const targetBairro = safeNormalize(neighborhoodFilter);

           const applyTier = (items: any[]) => {
              if (items.length === 0) return items;
              const localItems = items.filter(i => safeNormalize(i.neighborhood) === targetBairro);
              if (localItems.length > 0) return localItems;
              externalFlag = true;
              return items; // Retorna os externos se não houver locais
           };

           sisResults.products = applyTier(sisResults.products);
           sisResults.services = applyTier(sisResults.services);
           sisResults.storefronts = applyTier(sisResults.storefronts);
        }
        
        setIsShowingExternal(externalFlag);
        setResults(sisResults);
      } catch (err) {
        console.error('[SIS] Erro na busca:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [query, neighborhoodFilter, cityFilter, selectedCategory, selectedSubCategory]);

  const neighborhoodLabel = neighborhoodFilter || location?.city || 'sua região';
  const isQuerying = query.trim().length > 0;
  const totalResults = results.products.length + results.services.length + results.storefronts.length;

  return (
    <div className="min-h-screen pb-24 bg-neutral-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-neutral-50/90 backdrop-blur-xl pt-8 pb-4 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-orange-500" />
            <h1 className="font-display text-3xl font-extrabold tracking-tighter text-neutral-900">
              Buscar
            </h1>
          </div>
          <div className="relative w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Serviços, produtos, vitrines em ${neighborhoodLabel}…`}
              className="w-full rounded-2xl bg-white border-none py-4 pl-12 pr-12 shadow-sm ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 transition-all font-medium text-neutral-900"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 animate-spin" size={20} />
            )}

            {/* Menu Suspenso de Sugestões durante a digitação */}
            {isQuerying && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden z-50">
                <div className="p-2">
                  <p className="px-3 pb-2 pt-1 text-[10px] font-black tracking-widest text-neutral-400 uppercase">Sugestões</p>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); setSuggestions([]); }}
                      className="w-full text-left px-3 py-3 rounded-xl text-neutral-700 hover:text-orange-600 hover:bg-orange-50 font-medium transition-colors flex items-center gap-3"
                    >
                      <SearchIcon size={14} className="text-neutral-300" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-6 space-y-10">

        {/* ══════════════════════════════════════════
            ESTADO PADRÃO (sem query):
            Top 2 vitrines + itens recentes
        ══════════════════════════════════════════ */}
        {!isQuerying && (
          <>
            {/* Top 2 Vitrines */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Flame size={16} className="text-amber-400" />
                <h2 className="font-display text-lg font-bold text-neutral-900">
                  {topSectionTitle}
                </h2>
              </div>

              {isLoadingTop ? (
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="min-w-[280px] shrink-0">
                      <StorefrontSkeleton />
                    </div>
                  ))}
                </div>
              ) : topStorefronts.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory -mx-6 px-6">
                  {topStorefronts.map((store, idx) => (
                    <div key={store.id} className="min-w-[220px] snap-start">
                      <FeaturedStorefrontCard store={store} rank={idx + 1} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-100 text-neutral-500">
                  <Store size={18} />
                  <span className="text-sm font-medium">Nenhuma vitrine em {neighborhoodLabel} ainda.</span>
                </div>
              )}
            </section>

            {/* Destaques da Semana */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-orange-500" />
                <h2 className="font-display text-lg font-bold text-neutral-900">
                  Destaques da semana {neighborhoodFilter ? `em ${neighborhoodFilter}` : `na sua região`}
                </h2>
              </div>
              {results.products.length === 0 && results.services.length === 0 && !isSearching ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-neutral-400">
                    <PackageOpen size={24} />
                  </div>
                  <p className="text-sm font-bold text-neutral-900">Nenhum item ainda</p>
                  <p className="text-xs text-neutral-500 mt-1">Tente ampliar sua área de busca.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const safeNormalize = (b: string | null | undefined) => 
                      b ? b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';
                    
                    const userBairro = safeNormalize(neighborhoodFilter);

                    return [...results.services, ...results.products]
                      .map(item => {
                        const itemBairro = safeNormalize(item.neighborhood);
                        const isLocal = userBairro && itemBairro === userBairro;
                        
                        // SIS-LOCA-SOBERANIA: Bônus massivo para o bairro atual
                        const proximityBonus = isLocal ? 1000000 : 0;

                        return {
                          ...item,
                          performanceScore: 
                            proximityBonus +
                            ((item.views || 0) * 1) + 
                            ((item.cart_count || 0) * 5) + 
                            ((item.rating || 5) * 10)
                        };
                      })
                      .sort((a, b) => b.performanceScore - a.performanceScore)
                      .slice(0, 10)
                      .map((item, idx) => (
                        <SISItemCard 
                          key={`${item.type}-${item.id}`} 
                          item={item} 
                          rank={idx + 1}
                        />
                      ));
                  })()}
                </div>
              )}
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════
            ESTADO COM QUERY:
            Blocos separados: Serviços → Produtos → Vitrines
        ══════════════════════════════════════════ */}
        {isQuerying && (
          <>
            {/* Resumo do motorzinho */}
            {!isSearching && totalResults > 0 && (
              <div className="flex flex-col gap-1 mb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400">
                  <Sparkles size={12} className="text-orange-400" />
                  <span>{totalResults} {totalResults === 1 ? 'resultado' : 'resultados'} para "{query}"</span>
                </div>
                {isShowingExternal && (
                   <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md inline-flex w-fit items-center gap-1">
                     <MapPin size={10} />
                     Exibindo resultados de outros bairros
                   </span>
                )}
              </div>
            )}

            {/* ── Bloco: Serviços ── */}
            {results.services.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className="text-purple-500" />
                    <h2 className="font-display text-lg font-bold text-neutral-900">Serviços</h2>
                  </div>
                  <span className="text-xs font-bold text-purple-500">
                    {results.services.length} {results.services.length === 1 ? 'serviço' : 'serviços'}
                  </span>
                </div>
                <div className="space-y-3">
                  {results.services.map((item) => (
                    <SISItemCard key={`svc-${item.id}`} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Bloco: Produtos ── */}
            {results.products.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-orange-500" />
                    <h2 className="font-display text-lg font-bold text-neutral-900">Produtos</h2>
                  </div>
                  <span className="text-xs font-bold text-orange-500">
                    {results.products.length} {results.products.length === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>
                <div className="space-y-3">
                  {results.products.map((item) => (
                    <SISItemCard key={`prod-${item.id}`} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Bloco: Vitrines ── */}
            {results.storefronts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Store size={16} className="text-neutral-700" />
                    <h2 className="font-display text-lg font-bold text-neutral-900">Vitrines</h2>
                  </div>
                  <span className="text-xs font-bold text-neutral-500">
                    {results.storefronts.length} {results.storefronts.length === 1 ? 'vitrine' : 'vitrines'}
                  </span>
                </div>
                <div className="space-y-3">
                  {results.storefronts.map((store) => (
                    <StorefrontCard key={`${store.type}-${store.id}`} store={store} />
                  ))}
                </div>
              </section>
            )}

            {/* ── Nenhum resultado ── */}
            {!isSearching && totalResults === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-neutral-400">
                  <PackageOpen size={24} />
                </div>
                <p className="text-sm font-bold text-neutral-900">Nenhum resultado</p>
                <p className="text-xs text-neutral-500 mt-1">Tente outras palavras ou verifique a digitação.</p>

                {/* Sugestões alternativas */}
                {suggestions.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Sugestões</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestions.slice(0, 6).map((s) => (
                        <SuggestionChip key={s} label={s} onClick={() => setQuery(s)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

      <BottomNav />
    </div>
  );
};
