import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Heart, Loader2, ShoppingBag, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ItemCard, ItemType } from '../components/ItemCard';
import { BottomNav } from '../components/BottomNav';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<{ item: ItemType; type: 'product' | 'service' }[]>([]);
  const [filter, setFilter] = useState<'all' | 'product' | 'service'>('all');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favError) throw favError;

      if (!favData || favData.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Buscar detalhes de cada item com os joins necessários para o ItemCard e cálculo de localização
      const itemPromises = favData.map(async (fav) => {
        const isProd = fav.item_type === 'product';
        const table = isProd ? 'products' : 'services';
        const query = supabase.from(table).select('*, sellers(store_name, username, avatar_url, store_locations(city, neighborhood)), service_providers(name, username, avatar_url, city, neighborhood)');
        
        const { data: itemData } = await query.eq('id', fav.item_id).single();
        
        if (!itemData) return null;

        // Mapeamento robusto para o formato esperado pelo ItemCard
        const seller = itemData.sellers;
        const provider = itemData.service_providers;
        const locationData = isProd ? (seller?.store_locations?.[0] || {}) : provider;

        const formattedItem: any = {
          ...itemData,
          image: itemData.image_url, // Mapeia image_url -> image
          price: isProd ? (itemData.price || 0) : (itemData.price_per_hour || 0), // Garante price para o toFixed
          pricePerHour: itemData.price_per_hour || 0,
          provider: isProd ? (seller?.store_name) : (provider?.name),
          city: locationData?.city,
          neighborhood: locationData?.neighborhood,
          target_type: fav.item_type
        };

        return {
          item: formattedItem as ItemType,
          type: fav.item_type as 'product' | 'service'
        };
      });

      const results = await Promise.all(itemPromises);
      setFavorites(results.filter((res): res is { item: ItemType; type: 'product' | 'service' } => res !== null));
    } catch (err) {
      console.error('Erro ao buscar favoritos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = filter === 'all' 
    ? favorites 
    : favorites.filter(f => f.type === filter);

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-100 pt-8 pb-4 px-6">
        <div className="mx-auto max-w-2xl flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900">
            Meus Favoritos
          </h1>
        </div>

        {/* Filtros */}
        <div className="mx-auto max-w-2xl mt-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filter === 'all' 
                ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20' 
                : 'bg-white text-neutral-500 border border-neutral-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('product')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filter === 'product' 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                : 'bg-white text-neutral-500 border border-neutral-100'
            }`}
          >
            <ShoppingBag size={14} />
            Produtos
          </button>
          <button
            onClick={() => setFilter('service')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filter === 'service' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                : 'bg-white text-neutral-500 border border-neutral-100'
            }`}
          >
            <Briefcase size={14} />
            Serviços
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
            <p className="text-sm font-bold text-neutral-400">Carregando seus desejos...</p>
          </div>
        ) : filteredFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredFavorites.map(({ item, type }) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <ItemCard item={item} type={type} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <div className="h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
              <Heart size={32} className="text-neutral-300" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Nada por aqui ainda</h2>
            <p className="text-sm text-neutral-500 mb-8 max-w-xs">Explore a Sovix e salve os produtos e serviços que você mais gostar!</p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-600/20 hover:scale-105 active:scale-95 transition-all text-sm"
            >
              Começar a explorar
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
