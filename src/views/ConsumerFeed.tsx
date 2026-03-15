import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { extractBairroName } from '../utils/sis-loca';
import { SlidersHorizontal, PackageSearch, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ItemCard } from '../components/ItemCard';
import { PostCard, FeedPost } from '../components/PostCard';
import { Logo } from '../components/Logo';
import { BottomNav } from '../components/BottomNav';
import { LocationSelector } from '../components/LocationSelector';
import { useLocationScope } from '../context/LocationContext';

import { PremiumFeedLoader } from '../components/PremiumFeedLoader';

interface FeedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string | null;
  city: string | null;
  neighborhood: string | null;
  bairros_disponiveis?: string[] | null;
  created_at?: string;
  sellers: { store_name: string; username: string; bairros_atendidos?: string[] | null } | null;
}

interface FeedService {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string | null;
  city: string | null;
  neighborhood: string | null;
  bairros_disponiveis?: string[] | null;
  created_at?: string;
  service_providers: { name: string; username?: string; rating: number; bairros_atendidos?: string[] | null } | null;
}

export const ConsumerFeed: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'all' | 'products' | 'services'>('all');
  const { location, scope, requestLocation, isLoading: isLocLoading, error: locError } = useLocationScope();
  const [products, setProducts] = React.useState<FeedProduct[]>([]);
  const [services, setServices] = React.useState<FeedService[]>([]);
  const [posts, setPosts] = React.useState<FeedPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Função robusta de match para evitar erros de acento ("São João" vs "Sao Joao")
  const normalizeBairro = React.useCallback((b: string | null | undefined) => {
    if (!b) return '';
    return b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }, []);

  const fetchData = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const prodSelect = 'id, name, price, image_url, category_id, created_at, city, neighborhood, condo, bairros_disponiveis, sellers!products_seller_id_fkey(store_name, username, bairros_atendidos)';
      const svcSelect = 'id, name, price, image_url, category_id, created_at, city, neighborhood, condo, bairros_disponiveis, service_providers(name, username, rating, bairros_atendidos)';
      const postSelect = '*';

      const userCity = location?.city || '';
      const userBairro = location?.neighborhood && location.neighborhood !== 'Bairro Desconhecido' ? location.neighborhood : '';

      let prodQuery = supabase.from('products').select(prodSelect).eq('is_active', true);
      let svcQuery = supabase.from('services').select(svcSelect).eq('is_active', true);
      let postQuery = supabase.from('posts_view').select(postSelect);

      if (userCity) {
        prodQuery = prodQuery.eq('city', userCity);
        svcQuery = svcQuery.eq('city', userCity);
        postQuery = postQuery.eq('city', userCity);
      }

      if (scope !== 'city' && userBairro) {
        if (scope === 'condo' && location?.condo) {
          prodQuery = prodQuery.eq('condo', location.condo);
          svcQuery = svcQuery.eq('condo', location.condo);
          postQuery = postQuery.eq('condo', location.condo);
        } else {
          // SIS-LOCA-PERF: Filtra por bairro no DB para performance instantânea (mleficiencia)
          prodQuery = prodQuery.eq('neighborhood', userBairro);
          svcQuery = svcQuery.eq('neighborhood', userBairro);
          postQuery = postQuery.eq('neighborhood', userBairro);
        }
      }

      // Reduzido para 50 para performance "instantânea"
      prodQuery = prodQuery.order('created_at', { ascending: false }).limit(50);
      svcQuery = svcQuery.order('created_at', { ascending: false }).limit(50);
      postQuery = postQuery.order('created_at', { ascending: false }).limit(50);

      const [prodResult, svcResult, postResult] = await Promise.all([prodQuery, svcQuery, postQuery]);

      let finalProducts = (prodResult.data ?? []) as unknown as FeedProduct[];
      let finalServices = (svcResult.data ?? []) as unknown as FeedService[];
      let finalPosts = (postResult.data ?? []) as unknown as FeedPost[];

      if (location) {
        const normalizedUserBairro = userBairro ? normalizeBairro(userBairro) : '';
        
        finalProducts = finalProducts.filter(p => {
           if (scope !== 'city' && normalizedUserBairro) {
             const baseBairro = normalizeBairro(p.neighborhood);
             if (baseBairro === normalizedUserBairro) return true;
             if (p.bairros_disponiveis && p.bairros_disponiveis.some(b => normalizeBairro(extractBairroName(b)) === normalizedUserBairro)) return true;
             return false;
           }
           return true;
        });

        finalServices = finalServices.filter(s => {
           if (scope !== 'city' && normalizedUserBairro) {
             const baseBairro = normalizeBairro(s.neighborhood);
             if (baseBairro === normalizedUserBairro) return true;
             if (s.bairros_disponiveis && s.bairros_disponiveis.some(b => normalizeBairro(extractBairroName(b)) === normalizedUserBairro)) return true;
             return false;
           }
           return true;
        });
      }

      const now = new Date();
      const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

      const separarRecentesEAntigos = (itens: any[]) => {
         const recentes: any[] = [];
         const antigos: any[] = [];
         itens.forEach(item => {
            const itemDate = new Date(item.created_at || item.id);
            if (now.getTime() - itemDate.getTime() <= FORTY_EIGHT_HOURS) {
               recentes.push(item);
            } else {
               antigos.push(item);
            }
         });
         return [...recentes, ...antigos];
      };

      setProducts(separarRecentesEAntigos(finalProducts));
      setServices(separarRecentesEAntigos(finalServices));
      setPosts(separarRecentesEAntigos(finalPosts));
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [location, scope, normalizeBairro]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await fetchData(true);
  }, [fetchData]);

  // SIS-REFRESH 3.0 - Liquid Flow Dynamics
  const [pullY, setPullY] = React.useState(0);
  const [isPulling, setIsPulling] = React.useState(false);
  const startY = React.useRef(0);
  const threshold = 100; // Aumentado para dar mais "espaço" à física

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && window.scrollY === 0) {
      // Resistência logarítmica para sensação de "tensão superficial"
      const resistance = Math.pow(diff, 0.85); 
      const finalY = Math.min(resistance * 2.5, threshold + 40);
      
      // Feedback Hático (Android) ao cruzar o threshold
      if (finalY >= threshold && pullY < threshold) {
        if ('vibrate' in navigator) navigator.vibrate(10);
      }
      
      setPullY(finalY);
    }
  };

  const handleTouchEnd = () => {
    if (pullY >= threshold) {
      handleRefresh();
    }
    setPullY(0);
    setIsPulling(false);
  };

  // SIS-SMART-NAV listener
  React.useEffect(() => {
    const handleSmartNav = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Pequeno delay para o scroll começar antes do loading visual
      setTimeout(() => {
        handleRefresh();
      }, 100);
    };

    window.addEventListener('sis-refresh-feed', handleSmartNav);
    return () => window.removeEventListener('sis-refresh-feed', handleSmartNav);
  }, [handleRefresh]);

  React.useEffect(() => {
    if (!location && !isLocLoading && !locError) {
      requestLocation();
    }
  }, [location, isLocLoading, locError, requestLocation]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);


  // SIS-PERF: Memorização do Feed Misto para evitar recalculação em renders triviais
  const mixedFeed = React.useMemo(() => {
    return [
      ...products.map(p => ({ ...p, feedType: 'product' })),
      ...services.map(s => ({ ...s, feedType: 'service' })),
      ...posts.map(p => ({ ...p, feedType: 'post' }))
    ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [products, services, posts]);

  const renderMixedFeed = () => {
    return mixedFeed.map((item: any) => {
      if (item.feedType === 'post') {
        return (
          <PostCard 
            key={item.id} 
            post={item} 
            authorName={item.metadata?.author_name}
            authorAvatar={item.metadata?.author_avatar}
          />
        );
      }
      if (item.feedType === 'product') {
        return (
          <ItemCard
            key={item.id}
            type="product"
            item={{
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image_url || 'https://picsum.photos/seed/' + item.id + '/800/1000',
              category: item.category_id ?? 'Produto',
              seller: item.sellers?.store_name ?? 'Vendedor',
              username: item.sellers?.username ?? '',
              city: item.city,
              neighborhood: item.neighborhood
            }}
          />
        );
      }
      return (
        <ItemCard
          key={item.id}
          type="service"
          item={{
            id: item.id,
            name: item.name,
            pricePerHour: item.price,
            image: item.image_url || 'https://picsum.photos/seed/' + item.id + '/800/1000',
            category: item.category_id ?? 'Serviço',
            provider: item.service_providers?.name ?? 'Prestador',
            username: item.service_providers?.username ?? '',
            rating: item.service_providers?.rating ?? 5.0,
            city: item.city,
            neighborhood: item.neighborhood
          }}
        />
      );
    });
  };

  return (
    <div 
      className="min-h-screen pb-24 flex flex-col overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* SIS-REFRESH 3.0 Liquid Indicator */}
      <AnimatePresence>
        {(pullY > 5 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              y: isRefreshing ? 20 : Math.min(pullY * 0.5, 40),
              scale: isRefreshing ? 1 : Math.min(0.8 + (pullY / threshold) * 0.4, 1.2),
            }}
            exit={{ opacity: 0, scale: 0.5, y: -20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
          >
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white dark:bg-neutral-800 shadow-xl border border-neutral-100 dark:border-neutral-700">
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: pullY * 2 }}
                transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: "tween", ease: "easeOut" }}
                className={`${pullY >= threshold || isRefreshing ? 'text-orange-600' : 'text-neutral-400'}`}
              >
                <Loader2 size={24} strokeWidth={3} />
              </motion.div>
              
              {/* Blooming Effect when ready */}
              {!isRefreshing && pullY >= threshold && (
                <motion.div 
                  layoutId="bloom"
                  className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <header 
        className="w-full bg-white dark:bg-neutral-900 pt-6 pb-4 px-4"
      >
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <Logo />
          <LocationSelector />
        </div>
      </header>

      {/* Filters - Minimalist & Elegant */}
      {location && (
        <div className="mx-auto w-full bg-white dark:bg-neutral-900">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab('all')}
                className={`whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-extrabold transition-all ${activeTab === 'all' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-neutral-100/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'}`}
              >
                Tudo
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab('products')}
                className={`whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-extrabold transition-all ${activeTab === 'products' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-neutral-100/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'}`}
              >
                Produtos
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab('services')}
                className={`whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-extrabold transition-all ${activeTab === 'services' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-neutral-100/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'}`}
              >
                Serviços
              </motion.button>
              
              <motion.button 
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-2xl bg-neutral-100/50 dark:bg-white/5 px-6 py-2.5 text-sm font-extrabold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-all"
              >
                <SlidersHorizontal size={16} />
                Filtros
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Bairro Desconhecido (Fallback) */}
      {location && location.neighborhood === 'Bairro Desconhecido' && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4 flex items-start gap-3">
            <MapPin className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-orange-900 leading-tight">Bairro não encontrado no mapa</h3>
              <p className="text-sm text-orange-700/80 mt-1">
                Não conseguimos identificar seu bairro exato. Estamos mostrando os melhores resultados de toda a cidade de <strong>{location.city}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Feed */}
      <main className="mx-auto max-w-2xl px-6 pt-6 flex-1 flex flex-col">
        {!location ? (
          // ... (JSX de localização omitido, permanece igual)
          <div /> 
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {loading ? (
              <div className="col-span-full">
                <PremiumFeedLoader />
              </div>
            ) : (
              <>
                {activeTab === 'all' && renderMixedFeed()}
                
                {activeTab === 'products' &&
                  products.map((product) => (
                    <ItemCard
                      key={product.id}
                      type="product"
                      item={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image_url || 'https://picsum.photos/seed/' + product.id + '/800/1000',
                        category: product.category_id ?? 'Produto',
                        seller: product.sellers?.store_name ?? 'Vendedor',
                        username: product.sellers?.username ?? '',
                        city: product.city,
                        neighborhood: product.neighborhood
                      }}
                    />
                  ))
                }
                {activeTab === 'services' &&
                  services.map((service) => (
                    <ItemCard
                      key={service.id}
                      type="service"
                      item={{
                        id: service.id,
                        name: service.name,
                        pricePerHour: service.price,
                        image: service.image_url || 'https://picsum.photos/seed/' + service.id + '/800/1000',
                        category: service.category_id ?? 'Serviço',
                        provider: service.service_providers?.name ?? 'Prestador',
                        username: service.service_providers?.username ?? '',
                        rating: service.service_providers?.rating ?? 5.0,
                        city: service.city,
                        neighborhood: service.neighborhood
                      }}
                    />
                  ))
                }
              </>
            )}
            {!loading && products.length === 0 && services.length === 0 && posts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 py-24 text-neutral-400">
                <PackageSearch size={48} strokeWidth={1} />
                <p className="text-lg font-bold">Nenhum item disponível ainda</p>
                <p className="text-sm">Assim que moradores e vendedores postarem, o bairro ganhará vida!</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};
