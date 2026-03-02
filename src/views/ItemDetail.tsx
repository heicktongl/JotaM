import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, MapPin, Star, ShieldCheck, Clock, Minus, Plus, ShoppingBag, ChevronRight, Loader2, Zap, Calendar, Repeat, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { ItemType } from '../components/ItemCard';
import { LocationGuard } from '../components/LocationGuard';

export const ItemDetail: React.FC = () => {
  const { type, id } = useParams<{ type: 'product' | 'service', id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [item, setItem] = useState<ItemType | null>(null);
  const [loading, setLoading] = useState(true);
  // Estado de localização do item para o LocationGuard
  const [itemCity, setItemCity] = useState<string | null>(null);
  const [itemNeighborhood, setItemNeighborhood] = useState<string | null>(null);

  // Estados para Modal de Agendamento (MVP Fase 3)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTurn, setSelectedTurn] = useState<'morning' | 'afternoon' | 'night' | ''>('');

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
            // Captura localização para o LocationGuard
            setItemCity(data.city ?? null);
            setItemNeighborhood(data.neighborhood ?? null);
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
                rating,
                phone,
                whatsapp
              )
            `)
            .eq('id', id)
            .single();

          if (data && !error) {
            const bizName = data.service_providers?.name || 'Prestador Desconhecido';
            const username = data.service_providers?.username || '';
            const rating = data.service_providers?.rating || 5.0;
            // Tenta pegar o whatsapp primeiro, depois o phone comercial, e por fim vazio
            const phone = data.service_providers?.whatsapp || data.service_providers?.phone || '';
            // Captura localização para o LocationGuard
            setItemCity(data.city ?? null);
            setItemNeighborhood(data.neighborhood ?? null);
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
              created_at: data.created_at,
              service_type: data.service_type,
              duration_mins: data.duration_mins,
              response_time_mins: data.response_time_mins,
              billing_cycle: data.billing_cycle,
              providerPhone: phone
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
    addToCart(item as any, type as 'product' | 'service', quantity);
    navigate('/cart');
  };

  const openWhatsApp = (msg: string) => {
    const phoneNumber = (item as any).providerPhone;
    if (!phoneNumber) {
      alert('Prestador não possui telefone cadastrado.');
      return;
    }
    // Remove tudo que não for número
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleImmediateOrder = () => {
    const msg = `🚨 Olá! Preciso AGORA de um serviço: *${item?.name}*.\nVi no JotaM que o tempo médio de resposta é de ${(item as any).response_time_mins} min. Podemos fechar?`;
    openWhatsApp(msg);
  };

  const handleRecurringOrder = () => {
    const cycleMap: Record<string, string> = { 'weekly': 'por semana', 'biweekly': 'por quinzena', 'monthly': 'por mês' };
    const cycleText = cycleMap[(item as any).billing_cycle] || 'recorrente';
    const msg = `🔄 Olá! Gostaria de assinar o plano do seu serviço: *${item?.name}*.\nVi no JotaM que o valor é R$ ${(price || 0).toFixed(2)} ${cycleText}.\nPodemos combinar?`;
    openWhatsApp(msg);
  };

  const confirmSchedule = () => {
    if (!selectedDate || !selectedTurn) {
      alert('Selecione uma data e um turno preferencial!');
      return;
    }
    const turnMap = { 'morning': 'Manhã', 'afternoon': 'Tarde', 'night': 'Noite' };
    const msg = `📅 Olá! Gostaria de agendar um horário para: *${item?.name}*.\nTenho preferência pelo dia *${selectedDate.split('-').reverse().join('/')}*, no turno da *${turnMap[selectedTurn]}*.\nPodemos confirmar a disponibilidade detalhada?`;
    openWhatsApp(msg);
    setShowScheduleModal(false);
  };

  return (
    <LocationGuard
      itemCity={itemCity}
      itemNeighborhood={itemNeighborhood}
      itemDisplayName={item.name}
    >
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
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                {item.category}
              </span>
              {!isProduct && (item as any).service_type === 'immediate' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
                  <Zap size={12} /> Imediato
                </span>
              )}
              {!isProduct && (item as any).service_type === 'scheduled' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/90 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
                  <Calendar size={12} /> Agendado
                </span>
              )}
              {!isProduct && (item as any).service_type === 'recurring' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600/90 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md shadow-sm">
                  <Repeat size={12} /> Plano Ativo
                </span>
              )}
            </div>
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
                {!isProduct && (item as any).service_type === 'immediate' && (
                  <span className="text-sm font-medium text-neutral-500"> / fixo (Até {(item as any).response_time_mins}m)</span>
                )}
                {!isProduct && (item as any).service_type === 'scheduled' && (
                  <span className="text-sm font-medium text-neutral-500"> / sessão ({(item as any).duration_mins}m)</span>
                )}
                {!isProduct && (item as any).service_type === 'recurring' && (
                  <span className="text-sm font-medium text-neutral-500">
                    {' / ' + ((item as any).billing_cycle === 'weekly' ? 'semana' : (item as any).billing_cycle === 'biweekly' ? 'quinzena' : 'mês')}
                  </span>
                )}
                {!isProduct && !(item as any).service_type && (
                  <span className="text-sm font-medium text-neutral-500"> /hora</span>
                )}
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

            {isProduct ? (
              <button
                onClick={handleAddToCart}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98]"
              >
                <ShoppingBag size={20} />
                Adicionar • R$ {((price || 0) * quantity).toFixed(2)}
              </button>
            ) : (item as any).service_type === 'immediate' ? (
              <button
                onClick={handleImmediateOrder}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 font-bold text-white shadow-lg shadow-red-600/30 transition-all hover:bg-red-700 active:scale-[0.98] animate-pulse"
              >
                <Zap size={20} className="fill-white" />
                Solicitar Agora (Urgência)
              </button>
            ) : (item as any).service_type === 'scheduled' ? (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                <Calendar size={20} />
                Escolher Horário • R$ {(price || 0).toFixed(2)}
              </button>
            ) : (item as any).service_type === 'recurring' ? (
              <button
                onClick={handleRecurringOrder}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700 active:scale-[0.98]"
              >
                <Repeat size={20} />
                Assinar Plano • R$ {(price || 0).toFixed(2)}
              </button>
            ) : (
              <button
                onClick={handleImmediateOrder}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98]"
              >
                <Zap size={20} />
                Solicitar
              </button>
            )}
          </div>
        </div>

        {/* Modal de Agendamento (MVP) */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full rounded-t-3xl bg-white p-6 pb-safe sm:max-w-md sm:rounded-3xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-neutral-900">Agendar Melhor Data</h3>
                <button onClick={() => setShowScheduleModal(false)} className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200">
                  <X size={20} />
                </button>
              </div>

              <p className="mb-6 text-sm text-neutral-500">
                Selecione uma data e um turno preferencial. O prestador irá confirmar o horário exato com você em seguida via WhatsApp.
              </p>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold text-neutral-700">Qual dia?</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-medium text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="mb-8">
                <label className="mb-2 block text-sm font-bold text-neutral-700">Qual turno preferencial?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setSelectedTurn('morning')} className={`rounded-xl py-3 text-sm font-bold border transition-colors ${selectedTurn === 'morning' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                    Manhã
                  </button>
                  <button onClick={() => setSelectedTurn('afternoon')} className={`rounded-xl py-3 text-sm font-bold border transition-colors ${selectedTurn === 'afternoon' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                    Tarde
                  </button>
                  <button onClick={() => setSelectedTurn('night')} className={`rounded-xl py-3 text-sm font-bold border transition-colors ${selectedTurn === 'night' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>
                    Noite
                  </button>
                </div>
              </div>

              <button
                onClick={confirmSchedule}
                className="w-full flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                Solicitar Reserva
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </LocationGuard>
  );
};
