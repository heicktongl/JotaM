import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2, PackageOpen, Store, Wrench, ChevronRight, MapPin, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { ItemCard, ItemType } from '../components/ItemCard';
import { supabase } from '../lib/supabase';
import { useLocationScope } from '../context/LocationContext';

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────
type StorefrontType = 'shop' | 'provider';

interface StorefrontResult {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  type: StorefrontType;
  neighborhood: string;
  city: string;
  views?: number;
}

// ──────────────────────────────────────────────
// Card de Vitrine — padrão (busca)
// ──────────────────────────────────────────────
const StorefrontCard: React.FC<{ store: StorefrontResult }> = ({ store }) => {
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
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={10} className="text-neutral-400 shrink-0" />
          <span className="text-[10px] text-neutral-400 truncate">{store.neighborhood}</span>
        </div>
      </div>
      <ChevronRight size={18} className="shrink-0 text-neutral-300 group-hover:text-orange-400 transition-colors" />
    </button>
  );
};

// ──────────────────────────────────────────────
// Card de Vitrine — DESTAQUE (top 2)
// ──────────────────────────────────────────────
const FeaturedStorefrontCard: React.FC<{ store: StorefrontResult; rank: number }> = ({ store, rank }) => {
  const navigate = useNavigate();
  const isShop = store.type === 'shop';
  const href = `/@${store.username}`;

  return (
    <button
      onClick={() => navigate(href)}
      className="flex-1 min-w-0 flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-md hover:border-orange-200 transition-all text-left group active:scale-[0.98]"
    >
      {/* Capa / header colorido */}
      <div className={`relative h-20 w-full flex items-center justify-center ${isShop ? 'bg-gradient-to-br from-orange-400 to-rose-500' : 'bg-gradient-to-br from-purple-500 to-indigo-600'}`}>
        {/* Rank badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Flame size={10} className="text-amber-300" />
          <span className="text-[10px] font-black text-white">#{rank}</span>
        </div>

        {/* Avatar */}
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

      {/* Corpo */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-1">
          <span className="font-bold text-sm text-neutral-900 leading-tight line-clamp-2">{store.name}</span>
          <ChevronRight size={14} className="shrink-0 text-neutral-300 group-hover:text-orange-400 transition-colors mt-0.5" />
        </div>

        {store.bio && (
          <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">{store.bio}</p>
        )}

        <div className="flex items-center gap-1 mt-auto pt-1">
          <MapPin size={9} className="text-neutral-400 shrink-0" />
          <span className="text-[10px] text-neutral-400 truncate">{store.neighborhood}</span>
        </div>

        {(store.views ?? 0) > 0 && (
          <div className="flex items-center gap-1">
            <Flame size={9} className="text-amber-400 shrink-0" />
            <span className="text-[10px] font-bold text-amber-500">{store.views} acessos</span>
          </div>
        )}
      </div>
    </button>
  );
};

// ──────────────────────────────────────────────
// Página principal
// ──────────────────────────────────────────────
export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ItemType[]>([]);
  const [storefronts, setStorefronts] = useState<StorefrontResult[]>([]);
  const [topStorefronts, setTopStorefronts] = useState<StorefrontResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTop, setIsLoadingTop] = useState(true);
  const [topSectionTitle, setTopSectionTitle] = useState('Destaques');
  const { location, scope } = useLocationScope();

  const neighborhoodFilter =
    scope !== 'city' &&
      location?.neighborhood &&
      location.neighborhood !== 'Bairro Desconhecido'
      ? location.neighborhood
      : null;
  const cityFilter = location?.city || null;

  // ── Busca TOP 2 vitrines (carrega uma vez por localização) ─────────
  useEffect(() => {
    const fetchTopStorefronts = async () => {
      setIsLoadingTop(true);
      try {
        let results: StorefrontResult[] = [];
        let usedIds = new Set<string>();

        // Helpers formatadores
        const formatSellers = (data: any[]): StorefrontResult[] => {
          return data.filter((s) => s.username).map((s) => {
            const primary = (s.store_locations || []).find((l: any) => l.is_primary) || (s.store_locations || [])[0] || {};
            return {
              id: s.id, name: s.store_name, username: s.username,
              avatar_url: s.avatar_url, bio: s.bio, type: 'shop',
              neighborhood: primary.neighborhood || '', city: primary.city || '',
              views: s.views ?? 0,
            };
          });
        };

        const formatProviders = (data: any[]): StorefrontResult[] => {
          return data.filter((p) => p.username).map((p) => ({
            id: p.id, name: p.name, username: p.username,
            avatar_url: p.avatar_url, bio: p.bio, type: 'provider',
            neighborhood: p.neighborhood || '', city: p.city || '', views: 0
          }));
        };

        const addResults = (newItems: StorefrontResult[]) => {
          for (const item of newItems) {
            if (!usedIds.has(item.id) && results.length < 2) {
              results.push(item);
              usedIds.add(item.id);
            }
          }
        };

        // ====== NÍVEL 1: BAIRRO (Lojas) ======
        if (neighborhoodFilter) {
          const { data: locs } = await supabase.from('store_locations').select('seller_id').ilike('neighborhood', `%${neighborhoodFilter}%`);
          const sellerIds = (locs || []).map((l: any) => l.seller_id).filter(Boolean);

          if (sellerIds.length > 0) {
            const { data } = await supabase.from('sellers')
              .select('id, store_name, username, avatar_url, bio, views, store_locations(neighborhood, city, is_primary)')
              .in('id', sellerIds).not('username', 'is', null).order('views', { ascending: false }).limit(2);
            if (data) addResults(formatSellers(data));
          }
          if (results.length > 0) setTopSectionTitle(`Mais acessadas em ${neighborhoodFilter}`);
        }

        // ====== NÍVEL 2: CIDADE (Lojas) ======
        if (results.length < 2 && cityFilter) {
          const { data: locs } = await supabase.from('store_locations').select('seller_id').ilike('city', `%${cityFilter}%`);
          const sellerIds = (locs || []).map((l: any) => l.seller_id).filter(Boolean);

          if (sellerIds.length > 0) {
            const { data } = await supabase.from('sellers')
              .select('id, store_name, username, avatar_url, bio, views, store_locations(neighborhood, city, is_primary)')
              .in('id', sellerIds).not('username', 'is', null).order('views', { ascending: false }).limit(2);
            if (data) addResults(formatSellers(data));
          }
          if (results.length > 0 && results.length <= 2 && topSectionTitle === 'Destaques') {
            setTopSectionTitle('Mais acessadas na sua região');
          }
        }

        // ====== NÍVEL 3: CIDADE (Prestadores) ======
        if (results.length < 2 && cityFilter) {
          const { data } = await supabase.from('service_providers')
            .select('id, name, username, avatar_url, bio, neighborhood, city')
            .ilike('city', `%${cityFilter}%`).not('username', 'is', null).limit(2);
          if (data) addResults(formatProviders(data));
          if (results.length > 0 && topSectionTitle === 'Destaques') {
            setTopSectionTitle('Destaques na sua região');
          }
        }

        // ====== NÍVEL 4: GLOBAL (Lojas JotaM) ======
        if (results.length < 2) {
          const { data } = await supabase.from('sellers')
            .select('id, store_name, username, avatar_url, bio, views, store_locations(neighborhood, city, is_primary)')
            .not('username', 'is', null).order('views', { ascending: false }).limit(2 - results.length);
          if (data) addResults(formatSellers(data));
          setTopSectionTitle('Destaques na JotaM');
        }

        setTopStorefronts(results);
      } catch (err) {
        console.error('Erro ao buscar top vitrines:', err);
      } finally {
        setIsLoadingTop(false);
      }
    };

    fetchTopStorefronts();
  }, [neighborhoodFilter, cityFilter]);

  // ── Busca de query (debounced) ─────────────────────────────────────
  useEffect(() => {
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const q = query.trim();

        // 1. Produtos
        let prodsQuery = supabase.from('products').select('*').eq('is_active', true).limit(20);
        if (neighborhoodFilter) prodsQuery = prodsQuery.ilike('neighborhood', `%${neighborhoodFilter}%`);
        else if (cityFilter) prodsQuery = prodsQuery.ilike('city', `%${cityFilter}%`);
        if (q.length > 0) prodsQuery = prodsQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

        // 2. Serviços
        let servsQuery = supabase.from('services').select('*').eq('is_active', true).limit(20);
        if (neighborhoodFilter) servsQuery = servsQuery.ilike('neighborhood', `%${neighborhoodFilter}%`);
        else if (cityFilter) servsQuery = servsQuery.ilike('city', `%${cityFilter}%`);
        if (q.length > 0) servsQuery = servsQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

        // 3. Sellers (busca por nome) — subconsulta por bairro via store_locations
        let sellerIdsForSearch: string[] = [];
        if (neighborhoodFilter || cityFilter) {
          let locQ = supabase.from('store_locations').select('seller_id');
          if (neighborhoodFilter) locQ = locQ.ilike('neighborhood', `%${neighborhoodFilter}%`);
          else if (cityFilter) locQ = locQ.ilike('city', `%${cityFilter}%`);
          const { data: lData } = await locQ;
          sellerIdsForSearch = (lData || []).map((l: any) => l.seller_id).filter(Boolean);
        }

        let sellersQuery = supabase
          .from('sellers')
          .select('id, store_name, username, avatar_url, bio, views, store_locations(neighborhood, city, is_primary)')
          .not('username', 'is', null)
          .limit(10);

        if (sellerIdsForSearch.length > 0) {
          sellersQuery = sellersQuery.in('id', sellerIdsForSearch);
        }
        if (q.length > 0) sellersQuery = sellersQuery.ilike('store_name', `%${q}%`);

        // 4. Prestadores
        let providersQuery = supabase
          .from('service_providers')
          .select('id, name, username, avatar_url, bio, neighborhood, city')
          .not('username', 'is', null)
          .limit(10);
        if (neighborhoodFilter) providersQuery = providersQuery.ilike('neighborhood', `%${neighborhoodFilter}%`);
        else if (cityFilter) providersQuery = providersQuery.ilike('city', `%${cityFilter}%`);
        if (q.length > 0) providersQuery = providersQuery.ilike('name', `%${q}%`);

        const [prodsRes, servsRes, sellersRes, providersRes] = await Promise.all([
          prodsQuery, servsQuery, sellersQuery, providersQuery,
        ]);

        // Formata produtos
        const formattedProducts: ItemType[] = (prodsRes.data || []).map((p: any) => ({
          id: p.id, name: p.name, price: p.price,
          image: p.image_url || 'https://picsum.photos/seed/' + p.id + '/800/1000',
          category: p.category_id ?? 'Produto', seller: 'Vendedor', username: '',
          distance: '–', description: p.description || '',
          target_type: 'product' as const, created_at: p.created_at,
        }));

        // Formata serviços
        const formattedServices: ItemType[] = (servsRes.data || []).map((s: any) => ({
          id: s.id, name: s.name, pricePerHour: s.price,
          image: s.image_url || 'https://picsum.photos/seed/' + s.id + '/800/1000',
          category: s.category_id ?? 'Serviço', provider: 'Prestador', username: '',
          rating: 5.0, distance: '–', target_type: 'service' as const, created_at: s.created_at,
        }));

        setProducts([...formattedProducts, ...formattedServices].sort(
          (a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
        ));

        // Formata vitrines de busca
        const formattedSellers: StorefrontResult[] = (sellersRes.data || [])
          .filter((s: any) => s.username)
          .map((s: any) => {
            const locs: any[] = s.store_locations || [];
            const primary = locs.find((l: any) => l.is_primary) || locs[0] || {};
            return {
              id: s.id, name: s.store_name, username: s.username,
              avatar_url: s.avatar_url, bio: s.bio, type: 'shop' as const,
              neighborhood: primary.neighborhood || '', city: primary.city || '',
              views: s.views ?? 0,
            };
          });

        const formattedProviders: StorefrontResult[] = (providersRes.data || [])
          .filter((p: any) => p.username)
          .map((p: any) => ({
            id: p.id, name: p.name, username: p.username,
            avatar_url: p.avatar_url, bio: p.bio, type: 'provider' as const,
            neighborhood: p.neighborhood || '', city: p.city || '',
          }));

        setStorefronts([...formattedSellers, ...formattedProviders]);
      } catch (err) {
        console.error('Erro ao buscar:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchResults, 400);
    return () => clearTimeout(timeoutId);
  }, [query, neighborhoodFilter, cityFilter]);

  const neighborhoodLabel = neighborhoodFilter || location?.city || 'sua região';
  const isQuerying = query.trim().length > 0;

  return (
    <div className="min-h-screen pb-24 bg-neutral-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-neutral-50/90 backdrop-blur-xl pt-8 pb-4 px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-neutral-900 mb-4">
            Buscar
          </h1>
          <div className="relative w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Lojas, prestadores, produtos em ${neighborhoodLabel}…`}
              className="w-full rounded-2xl bg-white border-none py-4 pl-12 pr-12 shadow-sm ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 transition-all font-medium text-neutral-900"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 animate-spin" size={20} />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-6 space-y-10">

        {/* ══════════════════════════════════════════
            ESTADO PADRÃO (sem query):
            Top 2 vitrines + produtos recentes
        ══════════════════════════════════════════ */}
        {!isQuerying && (
          <>
            {/* Top 2 Vitrines do Bairro */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Flame size={16} className="text-amber-400" />
                <h2 className="font-display text-lg font-bold text-neutral-900">
                  {topSectionTitle}
                </h2>
              </div>

              {isLoadingTop ? (
                <div className="flex gap-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex-1 h-44 rounded-3xl bg-neutral-200 animate-pulse" />
                  ))}
                </div>
              ) : topStorefronts.length > 0 ? (
                <div className="flex gap-3">
                  {topStorefronts.map((store, idx) => (
                    <FeaturedStorefrontCard key={store.id} store={store} rank={idx + 1} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-100 text-neutral-500">
                  <Store size={18} />
                  <span className="text-sm font-medium">Nenhuma vitrine em {neighborhoodLabel} ainda.</span>
                </div>
              )}
            </section>

            {/* Produtos & Serviços recentes */}
            <section>
              <h2 className="font-display text-lg font-bold text-neutral-900 mb-3">
                Recentes em {neighborhoodLabel}
              </h2>
              {products.length === 0 && !isSearching ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-neutral-400">
                    <PackageOpen size={24} />
                  </div>
                  <p className="text-sm font-bold text-neutral-900">Nenhum item ainda</p>
                  <p className="text-xs text-neutral-500 mt-1">Tente ampliar sua área de busca.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {products.map((item) => (
                    <ItemCard key={item.id} item={item} type={item.target_type!} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ══════════════════════════════════════════
            ESTADO COM QUERY:
            Vitrines filtradas + Produtos filtrados
        ══════════════════════════════════════════ */}
        {isQuerying && (
          <>
            {/* Vitrines (busca) */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold text-neutral-900">
                  Vitrines para "{query}"
                </h2>
                <span className="text-xs font-bold text-orange-500">
                  {storefronts.length} {storefronts.length === 1 ? 'vitrine' : 'vitrines'}
                </span>
              </div>

              {storefronts.length > 0 ? (
                <div className="space-y-3">
                  {storefronts.map((store) => (
                    <StorefrontCard key={`${store.type}-${store.id}`} store={store} />
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-100 text-neutral-500">
                  <Store size={18} />
                  <span className="text-sm font-medium">Nenhuma vitrine encontrada.</span>
                </div>
              ) : null}
            </section>

            {/* Produtos & Serviços (busca) */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold text-neutral-900">
                  Produtos & Serviços para "{query}"
                </h2>
                <span className="text-xs font-bold text-orange-500">
                  {products.length} {products.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {products.length === 0 && !isSearching ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center mb-3 text-neutral-400">
                    <PackageOpen size={24} />
                  </div>
                  <p className="text-sm font-bold text-neutral-900">Nenhum resultado</p>
                  <p className="text-xs text-neutral-500 mt-1">Tente outras palavras.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {products.map((item) => (
                    <ItemCard key={item.id} item={item} type={item.target_type!} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

      </main>

      <BottomNav />
    </div>
  );
};
