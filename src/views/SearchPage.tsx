import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2, PackageOpen } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ItemCard, ItemType } from '../components/ItemCard';
import { supabase } from '../lib/supabase';
import { useLocationScope } from '../context/LocationContext';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ItemType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { location, scope } = useLocationScope();

  useEffect(() => {
    // Evita busca vazia, buscará os mais recentes se estiver vazio
    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const buildQuery = (table: 'products' | 'services', useLocationFilter: boolean) => {
          let q = supabase.from(table).select('*').eq('is_active', true).limit(20);

          if (useLocationFilter && location) {
            if (scope === 'city' && location.city) {
              q = q.ilike('city', `%${location.city}%`);
            } else if ((scope === 'neighborhood' || scope === 'condo') && location.neighborhood) {
              q = q.ilike('neighborhood', `%${location.neighborhood}%`);
            }
          }

          if (query.trim().length > 0) {
            q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
          }

          return q;
        };

        // 1: Busca Hiperlocal
        let [prodsRes, servsRes] = await Promise.all([
          buildQuery('products', true),
          buildQuery('services', true),
        ]);

        let pData = prodsRes.data || [];
        let sData = servsRes.data || [];

        // Fallback: Se não achou na área exata e tem pouco resultado, tenta busca global
        if (pData.length + sData.length < 3) {
          const [p2, s2] = await Promise.all([
            buildQuery('products', false),
            buildQuery('services', false),
          ]);
          pData = p2.data || [];
          sData = s2.data || [];
        }

        const formattedProducts: ItemType[] = pData.map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image_url || 'https://picsum.photos/seed/' + p.id + '/800/1000',
          category: p.category_id ?? 'Produto',
          seller: 'Vendedor',
          username: '',
          distance: '–',
          description: p.description || '',
          target_type: 'product' as const,
          created_at: p.created_at,
        }));

        const formattedServices: ItemType[] = sData.map((s: any) => ({
          id: s.id,
          name: s.name,
          pricePerHour: s.price,
          image: s.image_url || 'https://picsum.photos/seed/' + s.id + '/800/1000',
          category: s.category_id ?? 'Serviço',
          provider: 'Prestador',
          username: '',
          rating: 5.0,
          distance: '–',
          target_type: 'service' as const,
          created_at: s.created_at,
        }));

        // Mesclar
        const merged = [...formattedProducts, ...formattedServices].sort((a, b) => {
          return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
        });

        setResults(merged);
      } catch (err) {
        console.error('Erro ao buscar:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchResults();
    }, 500); // Debounce leve de 500ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="min-h-screen pb-24 bg-neutral-50">
      <header className="sticky top-0 z-30 bg-neutral-50/80 backdrop-blur-xl pt-8 pb-4 px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-neutral-900 mb-6">
            Buscar
          </h1>
          <div className="relative w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você procura hoje?"
              className="w-full rounded-2xl bg-white border-none py-4 pl-12 pr-4 shadow-sm ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 transition-all font-medium text-neutral-900"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 animate-spin" size={20} />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-neutral-900">
            {query.length > 0 ? `Resultados para "${query}"` : 'Recentes na sua área'}
          </h2>
          <span className="text-sm font-medium text-orange-600">
            {results.length} encontrado{results.length !== 1 && 's'}
          </span>
        </div>

        {results.length === 0 && !isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
              <PackageOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Nenhum resultado</h3>
            <p className="text-sm text-neutral-500 max-w-[200px]">Tente usar outras palavras ou refine sua busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item) => (
              <ItemCard key={item.id} item={item} type={item.target_type!} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
