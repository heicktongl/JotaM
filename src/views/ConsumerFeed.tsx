import React from 'react';
import { motion } from 'motion/react';
import { SlidersHorizontal, PackageSearch } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ItemCard } from '../components/ItemCard';
import { Logo } from '../components/Logo';
import { BottomNav } from '../components/BottomNav';
import { LocationSelector } from '../components/LocationSelector';

interface FeedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string | null;
  sellers: { store_name: string; username: string } | null;
}

interface FeedService {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string | null;
  service_providers: { name: string; username?: string; rating: number } | null;
}

export const ConsumerFeed: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'all' | 'products' | 'services'>('all');
  const [products, setProducts] = React.useState<FeedProduct[]>([]);
  const [services, setServices] = React.useState<FeedService[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodResult, svcResult] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, price, image_url, category_id, sellers(store_name, username)')
            .eq('is_active', true)
            .limit(30),
          supabase
            .from('services')
            .select('id, name, price, image_url, category_id, service_providers(name, rating)')
            .eq('is_active', true)
            .limit(30),
        ]);

        if (prodResult.data) setProducts(prodResult.data as unknown as FeedProduct[]);
        if (svcResult.data) setServices(svcResult.data as unknown as FeedService[]);
      } catch (err) {
        console.error('Erro ao carregar feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* Header Section */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl pt-6 pb-4 px-6 shadow-sm border-b border-neutral-100">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Logo />
          <LocationSelector />
        </div>
      </header>

      {/* Filters - Now scrolls with the page */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'}`}
          >
            Tudo
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'}`}
          >
            Produtos
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'}`}
          >
            Serviços
          </button>
          <div className="h-8 w-px bg-neutral-200 mx-1" />
          <button className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50 border border-neutral-200 transition-all">
            <SlidersHorizontal size={16} />
            Filtros
          </button>
        </div>
      </div>

      {/* Main Feed */}
      <main className="mx-auto max-w-7xl px-6 pt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-neutral-100 animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {(activeTab === 'all' || activeTab === 'products') &&
              products.map((product) => (
                <ItemCard
                  key={product.id}
                  item={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image_url || 'https://picsum.photos/seed/' + product.id + '/800/1000',
                    category: product.category_id ?? 'Produto',
                    seller: product.sellers?.store_name ?? 'Vendedor',
                    username: product.sellers?.username ?? '',
                    distance: '–',
                    description: '',
                  }}
                  type="product"
                />
              ))
            }
            {(activeTab === 'all' || activeTab === 'services') &&
              services.map((service) => (
                <ItemCard
                  key={service.id}
                  item={{
                    id: service.id,
                    name: service.name,
                    pricePerHour: service.price,
                    image: service.image_url || 'https://picsum.photos/seed/' + service.id + '/800/1000',
                    category: service.category_id ?? 'Serviço',
                    provider: service.service_providers?.name ?? 'Prestador',
                    username: '',
                    rating: service.service_providers?.rating ?? 5.0,
                    distance: '–',
                  }}
                  type="service"
                />
              ))
            }
            {!loading && products.length === 0 && services.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 py-24 text-neutral-400">
                <PackageSearch size={48} strokeWidth={1} />
                <p className="text-lg font-bold">Nenhum item disponível ainda</p>
                <p className="text-sm">Assim que vendedores cadastrarem produtos, eles aparecerão aqui!</p>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
