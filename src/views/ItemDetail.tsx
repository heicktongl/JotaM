import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, MapPin, Star, ShieldCheck, Clock, Minus, Plus, ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { ItemType } from '../components/ItemCard';

export const ItemDetail: React.FC = () => {
  const { type, id } = useParams<{ type: 'product' | 'service', id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [item, setItem] = useState<ItemType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !type) return;
      setLoading(true);
      try {
        if (type === 'product') {
          // Join limpo apenas com dados existentes
          const { data, error } = await supabase
            .from('products')
            .select(`
              *,
              sellers (
                store_name,
                username
              )
            `)
            .eq('id', id)
            .single();

          if (data && !error) {
            const storeName = data.sellers?.store_name || 'Vendedor Desconhecido';
            const username = data.sellers?.username || '';
            setItem({
              id: data.id,
              name: data.name,
              price: data.price,
              image: data.image_url || 'https://picsum.photos/seed/' + data.id + '/800/1000',
              category: data.category_id || 'Produto',
              seller: storeName,
              username: username,
              distance: '–',
              description: data.description || '',
              target_type: 'product',
              created_at: data.created_at
            } as any);
          } else {
            console.error('Produto não encontrado ou erro PostgREST:', error);
          }
        } else {
          // Join limpo com service_providers
          const { data, error } = await supabase
            .from('services')
            .select(`
              *,
              service_providers (
                name,
                username,
                rating
              )
            `)
            .eq('id', id)
            .single();

          if (data && !error) {
            const bizName = data.service_providers?.name || 'Prestador Desconhecido';
            const username = data.service_providers?.username || '';
            const rating = data.service_providers?.rating || 5.0;
            setItem({
              id: data.id,
              name: data.name,
              pricePerHour: data.price,
              image: data.image_url || 'https://picsum.photos/seed/' + data.id + '/800/1000',
              category: data.category_id || 'Serviço',
              provider: bizName,
              username: username,
              rating: rating,
              distance: '–',
              description: data.description || '',
              target_type: 'service',
              created_at: data.created_at
            } as any);
          } else {
            console.error('Serviço não encontrado ou erro PostgREST:', error);
          }
        }
      } catch (err) {
        console.error('Erro ao fletchar os detalhes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Item não encontrado</h2>
        <button
          onClick={() => navigate('/')}
          className="rounded-2xl bg-neutral-200 px-6 py-3 font-bold text-neutral-700 transition-all hover:bg-neutral-300"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  const isProduct = type === 'product';
  // O Mapeamento colocou .price (product) e .pricePerHour (service)
  const price = isProduct ? (item as any).price : (item as any).pricePerHour;
  const sellerName = isProduct ? (item as any).seller : (item as any).provider;

  const handleAddToCart = () => {
    // A tipagem do addToCart pede o 'item' inteiro. O Contexto do Carrinho não se importa com Mocks desde que tenha .id e .price/.pricePerHour.
    addToCart(item as any, type as 'product' | 'service', quantity);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      {/* Header Image & Back Button */}
      <div className="relative h-80 w-full bg-neutral-200">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <span className="mb-2 inline-flex items-center rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
            {item.category}
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white shadow-sm">
            {item.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 pt-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
          <div>
            <p className="text-3xl font-black text-neutral-900">
              R$ {price?.toFixed(2) || '0.00'}
              {!isProduct && <span className="text-sm font-medium text-neutral-500"> /hora</span>}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-neutral-500">
              <MapPin size={16} className="text-orange-500" />
              {item.distance} da sua Localização
            </div>
          </div>

          {!isProduct && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-600">
                <Star size={16} fill="currentColor" />
                <span className="font-bold">{(item as any).rating || '5.0'}</span>
              </div>
              <span className="mt-1 text-xs text-neutral-400">Proteção jotaM</span>
            </div>
          )}
        </div>

        <div className="py-6 border-b border-neutral-200">
          <h3 className="mb-3 text-lg font-bold text-neutral-900">Sobre</h3>
          <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
            {(item as any).description || `Serviço oferecido por ${sellerName}.`}
          </p>
        </div>

        <div className="py-6">
          <button
            onClick={() => navigate(`/${(item as any).username || ''}`)}
            className="w-full flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm border border-neutral-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
          >
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl group-hover:scale-105 transition-transform">
              {sellerName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Oferecido por</p>
              <p className="font-bold text-neutral-900">{sellerName}</p>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-500" />
              <ChevronRight size={20} className="text-neutral-400 group-hover:text-orange-600 transition-colors" />
            </div>
          </button>
        </div>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          {isProduct && (
            <div className="flex h-14 items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-white hover:shadow-sm"
              >
                <Minus size={18} />
              </button>
              <span className="w-8 text-center font-bold text-neutral-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-white hover:shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98]"
          >
            <ShoppingBag size={20} />
            Adicionar • R$ {((price || 0) * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};
