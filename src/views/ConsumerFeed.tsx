import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { extractBairroName } from '../utils/sis-loca';
import { SlidersHorizontal, PackageSearch, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ItemCard } from '../components/ItemCard';
import { PostCard, FeedPost } from '../components/PostCard';
import { Logo } from '../components/Logo';
import { BottomNav } from '../components/BottomNav';
import { LocationSelector } from '../components/LocationSelector';
import { useLocationScope } from '../context/LocationContext';
import { ItemCardSkeleton, PostCardSkeleton } from '../components/Skeleton';

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

  React.useEffect(() => {
    if (!location && !isLocLoading && !locError) {
      requestLocation();
    }
  }, [location, isLocLoading, locError, requestLocation]);

  // Função robusta de match para evitar erros de acento ("São João" vs "Sao Joao")
  const normalizeBairro = (b: string | null | undefined) => {
    if (!b) return '';
    return b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullOffset, setPullOffset] = React.useState(0);
  const pullOffsetRef = React.useRef(0);
  const PULL_THRESHOLD = 80;

  const fetchData = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const prodSelect = 'id, name, price, image_url, category_id, created_at, city, neighborhood, bairros_disponiveis, sellers!products_seller_id_fkey(store_name, username, bairros_atendidos)';
      const svcSelect = 'id, name, price, image_url, category_id, created_at, city, neighborhood, bairros_disponiveis, service_providers(name, rating, bairros_atendidos)';
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
        postQuery = postQuery.eq('neighborhood', userBairro);
      }

      prodQuery = prodQuery.order('created_at', { ascending: false }).limit(200);
      svcQuery = svcQuery.order('created_at', { ascending: false }).limit(200);
      postQuery = postQuery.order('created_at', { ascending: false }).limit(200);

      const [prodResult, svcResult, postResult] = await Promise.all([prodQuery, svcQuery, postQuery]);

      let finalProducts = (prodResult.data ?? []) as unknown as FeedProduct[];
      let finalServices = (svcResult.data ?? []) as unknown as FeedService[];
      let finalPosts = (postResult.data ?? []) as unknown as FeedPost[];

      if (location) {
        const normalizedUserCity = normalizeBairro(location.city);
        const normalizedUserBairro = userBairro ? normalizeBairro(userBairro) : '';
        
        finalProducts = finalProducts.filter(p => {
           const baseCity = normalizeBairro(p.city);
           if (normalizedUserCity && baseCity !== normalizedUserCity) return false;
           if (scope !== 'city' && normalizedUserBairro) {
             const baseBairro = normalizeBairro(p.neighborhood);
             if (baseBairro === normalizedUserBairro) return true;
             if (p.bairros_disponiveis && p.bairros_disponiveis.some(b => normalizeBairro(extractBairroName(b)) === normalizedUserBairro)) return true;
             return false;
           }
           return true;
        });

        finalServices = finalServices.filter(s => {
           const baseCity = normalizeBairro(s.city);
           if (normalizedUserCity && baseCity !== normalizedUserCity) return false;
           if (scope !== 'city' && normalizedUserBairro) {
             const baseBairro = normalizeBairro(s.neighborhood);
             if (baseBairro === normalizedUserBairro) return true;
             if (s.bairros_disponiveis && s.bairros_disponiveis.some(b => normalizeBairro(extractBairroName(b)) === normalizedUserBairro)) return true;
             return false;
           }
           return true;
        });

        finalPosts = finalPosts.filter(p => {
          const baseCity = normalizeBairro(p.city);
          if (normalizedUserCity && baseCity !== normalizedUserCity) return false;
          
          if (scope !== 'city' && normalizedUserBairro) {
            const baseBairro = normalizeBairro(p.neighborhood);
            return baseBairro === normalizedUserBairro;
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

      setProducts(separarRecentesEAntigos(finalProducts).slice(0, 30));
      setServices(separarRecentesEAntigos(finalServices).slice(0, 30));
      setPosts(separarRecentesEAntigos(finalPosts).slice(0, 30));
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setPullOffset(0);
    }
  }, [location, scope]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await fetchData(true);
  }, [fetchData]);

  // SIS-REFRESH: Lógica de Interceptação Dinâmica (Zero-Latency Scroll)
  React.useEffect(() => {
    let startY = 0;
    let startX = 0;
    let isDragging = false;
    let isCheckingGesture = false;

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = currentY - startY;
      const diffX = currentX - startX;

      // Fase de checagem: determina se é um pull-down ou scroll normal
      if (isCheckingGesture) {
        // Se mover para cima ou horizontalmente, aborta e deixa o scroll nativo agir
        if (diffY < 0 || Math.abs(diffX) > Math.abs(diffY)) {
          cleanup();
          return;
        }
        
        // Se mover para baixo significativamente, assume o controle
        if (diffY > 10) {
          isCheckingGesture = false;
          isDragging = true;
        }
      }

      if (isDragging) {
        if (e.cancelable) e.preventDefault();
        const newVal = Math.min(diffY * 0.4, PULL_THRESHOLD + 20);
        setPullOffset(newVal);
        pullOffsetRef.current = newVal;
      }
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        if (pullOffsetRef.current > PULL_THRESHOLD) {
          handleRefresh();
        } else {
          setPullOffset(0);
          pullOffsetRef.current = 0;
        }
      }
      cleanup();
    };

    const cleanup = () => {
      isDragging = false;
      isCheckingGesture = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', cleanup);
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Só ativa a checagem se estiver no topo absoluto
      if (window.scrollY > 5 || isRefreshing) return;

      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      isCheckingGesture = true;
      isDragging = false;

      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchcancel', cleanup);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      cleanup();
    };
  }, [isRefreshing, handleRefresh]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);


  const renderMixedFeed = () => {
    const items = [
      ...products.map(p => ({ ...p, feedType: 'product' })),
      ...services.map(s => ({ ...s, feedType: 'service' })),
      ...posts.map(p => ({ ...p, feedType: 'post' }))
    ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return items.map((item: any) => {
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
            rating: item.service_providers?.rating ?? 5.0,
            city: item.city,
            neighborhood: item.neighborhood
          }}
        />
      );
    });
  };

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      <div className="flex-1 flex flex-col overflow-x-hidden">
      {/* Header Section */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl pt-6 pb-4 px-6 shadow-sm border-b border-neutral-200/50 dark:border-neutral-800/50"
        animate={{ y: pullOffset }}
        transition={isRefreshing ? { duration: 0.2 } : { type: 'spring', damping: 28, stiffness: 350 }}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Logo />
          <LocationSelector />
        </div>
      </motion.header>
      
      <motion.div 
        className="mx-auto w-full max-w-7xl px-6 overflow-hidden flex flex-col items-center justify-center pointer-events-none"
        animate={{ 
          height: isRefreshing ? 48 : (pullOffset > 0 ? Math.min(pullOffset, PULL_THRESHOLD) : 0),
          marginBottom: (isRefreshing || pullOffset > 0) ? 16 : 0,
          y: pullOffset // Sincroniza o movimento vertical do indicador com o header
        }}
        transition={isRefreshing ? { duration: 0.2 } : { type: 'spring', damping: 25, stiffness: 400 }}
      >
        <motion.div
          animate={isRefreshing ? { 
            rotate: 360, 
            scale: 1,
            opacity: 1
          } : { 
            rotate: pullOffset * 3, 
            scale: Math.max(0, Math.min(pullOffset / PULL_THRESHOLD, 1)),
            opacity: Math.min(pullOffset / 20, 1)
          }}
          transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { type: 'spring' }}
          className="text-orange-600 bg-white dark:bg-neutral-800 p-2 rounded-full shadow-sm border border-neutral-100 dark:border-neutral-700"
        >
          <Loader2 size={18} className={isRefreshing ? "animate-spin" : ""} />
        </motion.div>
      </motion.div>

      {/* Filters - Sticky with Glassmorphism */}
      {location && (
        <div className="sticky top-[81px] z-30 mx-auto w-full bg-neutral-50/70 dark:bg-neutral-950/70 backdrop-blur-lg border-b border-neutral-200/30 dark:border-neutral-800/30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab('all')}
                className={`whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-extrabold transition-all ${activeTab === 'all' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-105' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 shadow-sm'}`}
              >
                Tudo
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab('products')}
                className={`whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-extrabold transition-all ${activeTab === 'products' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-105' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 shadow-sm'}`}
              >
                Produtos
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveTab('services')}
                className={`whitespace-nowrap rounded-2xl px-6 py-2.5 text-sm font-extrabold transition-all ${activeTab === 'services' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 scale-105' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 shadow-sm'}`}
              >
                Serviços
              </motion.button>
              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />
              <motion.button 
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-2xl bg-white dark:bg-neutral-800 px-6 py-2.5 text-sm font-extrabold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 shadow-sm transition-all"
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
        <div className="mx-auto max-w-7xl px-6 pt-4">
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
      <main className="mx-auto max-w-7xl px-6 pt-6 flex-1 flex flex-col">
        {!location ? (
          // ... (JSX de localização omitido, permanece igual)
          <div /> 
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              activeTab === 'all' ? (
                <>
                  <PostCardSkeleton />
                  <ItemCardSkeleton />
                  <ItemCardSkeleton />
                  <PostCardSkeleton />
                  <ItemCardSkeleton />
                  <ItemCardSkeleton />
                </>
              ) : (
                Array.from({ length: 6 }).map((_, i) => (
                  <ItemCardSkeleton key={i} />
                ))
              )
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
      </div>

      <BottomNav />
    </div>
  );
};
