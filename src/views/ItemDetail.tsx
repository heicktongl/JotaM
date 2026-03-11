import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, MapPin, Star, ShieldCheck, Minus, Plus, ShoppingBag, ChevronRight, Loader2, Zap, Calendar, Repeat, X, Clock, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLocationScope } from '../context/LocationContext';
import { calculateProximityLabel, extractBairroName } from '../utils/sis-loca';
import { supabase } from '../lib/supabase';
import { ItemType } from '../components/ItemCard';
import { LocationGuard } from '../components/LocationGuard';
import {
  buildImmediateServiceMessage,
  buildRecurringServiceMessage,
  buildScheduledServiceMessage,
  openWhatsApp
} from '../lib/msgZapeficiente';
import { trackEvent } from '../lib/olheiro';
import { registerItemView, registerCartClick } from '../lib/metrics';
import { SelectedOption } from '../context/CartContext';


export const ItemDetail: React.FC = () => {
  const { type, id } = useParams<{ type: 'product' | 'service', id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { location } = useLocationScope();
  const [quantity, setQuantity] = useState(1);
  const [item, setItem] = useState<ItemType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [itemCity, setItemCity] = useState<string | null>(null);
  const [itemNeighborhood, setItemNeighborhood] = useState<string | null>(null);
  
  // Hiperlocal
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState<string[]>([]);
  const [bairrosAtendidos, setBairrosAtendidos] = useState<string[]>([]);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTurn, setSelectedTurn] = useState<'morning' | 'afternoon' | 'night' | ''>('');

  // Complementos
  type ComplementItem = { id: string; name: string; price: number };
  type ComplementGroup = { id: string; name: string; required: boolean; max_choices: number; items: ComplementItem[] };
  const [complementGroups, setComplementGroups] = useState<ComplementGroup[]>([]);
  const [selectedComplements, setSelectedComplements] = useState<Record<string, string[]>>({});

  // Função robusta de match para evitar erros de acento ("São João" vs "Sao Joao")
  const normalizeBairro = (b: string | null | undefined) => {
    if (!b) return '';
    return b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  useEffect(() => {
    const fetchItem = async () => {
      if (!id || !type) return;
      setLoading(true);
      try {
        if (type === 'product') {
          const { data, error } = await supabase
            .from('products')
            .select(`
              *,
              sellers!products_seller_id_fkey (
                store_name,
                username,
                avatar_url,
                bairros_atendidos
              )
            `)
            .eq('id', id)
            .single();

          if (data && !error) {
            const storeName = data.sellers?.store_name || 'Vendedor Desconhecido';
            const username = data.sellers?.username || '';
            setItemCity(data.city ?? null);
            setItemNeighborhood(data.neighborhood ?? null);
            setBairrosDisponiveis(data.bairros_disponiveis || []);
            setBairrosAtendidos(data.sellers?.bairros_atendidos || []);
            setItem({
              id: data.id,
              name: data.name,
              price: data.price,
              image: data.image_url || 'https://picsum.photos/seed/' + data.id + '/800/1000',
              category: data.category_id || 'Produto',
              seller: storeName,
              username: username,
              avatar_url: data.sellers?.avatar_url,
              distance: '–',
              description: data.description || '',
              target_type: 'product',
              created_at: data.created_at
            } as any);
            // 👁️ Olheiro — view de produto
            if (data.seller_id) {
              trackEvent({ sellerId: data.seller_id, eventType: 'view', productId: data.id });
            }
            // 📊 Métricas SIS — view de produto
            registerItemView(data.id, 'product');
          }
        } else {
          const { data, error } = await supabase
            .from('services')
            .select(`
              *,
              service_providers (
                name,
                username,
                rating,
                phone,
                whatsapp,
                avatar_url,
                bairros_atendidos
              )
            `)
            .eq('id', id)
            .single();

          if (data && !error) {
            const bizName = data.service_providers?.name || 'Prestador Desconhecido';
            const username = data.service_providers?.username || '';
            const rating = data.service_providers?.rating || 5.0;
            const phone = data.service_providers?.whatsapp || data.service_providers?.phone || '';
            setItemCity(data.city ?? null);
            setItemNeighborhood(data.neighborhood ?? null);
            setBairrosDisponiveis(data.bairros_disponiveis || []);
            setBairrosAtendidos(data.service_providers?.bairros_atendidos || []);
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
              providerPhone: phone,
              avatar_url: data.service_providers?.avatar_url
            } as any);
            // 📊 Métricas SIS — view de serviço
            registerItemView(data.id, 'service');
          }
        }
      } catch (err) {
        console.error('Erro ao fletchar os detalhes:', err);
      } finally {
        setLoading(false);
      }

      // Buscar complementos
      if (type === 'product') {
        try {
          const { data: groups } = await supabase
            .from('product_complement_groups')
            .select('*, product_complement_items(*)')
            .eq('product_id', id)
            .order('position');

          if (groups && groups.length > 0) {
            const formatted: ComplementGroup[] = groups.map((g: any) => ({
              id: g.id,
              name: g.name,
              required: g.required,
              max_choices: g.max_choices,
              items: (g.product_complement_items || []).sort((a: any, b: any) => a.position - b.position),
            }));
            setComplementGroups(formatted);
            const initial: Record<string, string[]> = {};
            formatted.forEach(g => { initial[g.id] = []; });
            setSelectedComplements(initial);
          }
        } catch (err) {
          console.error('Erro ao buscar complementos:', err);
        }
      }
    };
    fetchItem();
  }, [id, type]);

  // Verificar se é favorito
  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', id)
        .maybeSingle();

      setIsFavorited(!!data);
    };
    checkFavorite();
  }, [id]);

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      sessionStorage.setItem('sovix_redirect_after_login', window.location.pathname);
      navigate('/login');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', id);
        setIsFavorited(false);
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            item_id: id,
            item_type: type
          });
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Erro ao toggle favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

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
        <button onClick={() => navigate('/')} className="rounded-2xl bg-neutral-200 px-6 py-3 font-bold text-neutral-700 hover:bg-neutral-300">Voltar para Home</button>
      </div>
    );
  }

  const isProduct = type === 'product';
  const price = isProduct ? (item as any).price : (item as any).pricePerHour;
  const sellerName = isProduct ? (item as any).seller : (item as any).provider;

  // Preço extra dos complementos selecionados
  const extrasTotal = complementGroups.reduce((acc, group) => {
    const selected = selectedComplements[group.id] || [];
    return acc + selected.reduce((s, itemId) => {
      const found = group.items.find(i => i.id === itemId);
      return s + (found?.price || 0);
    }, 0);
  }, 0);
  const totalPrice = (price || 0) * quantity + extrasTotal;

  // Verifica se complementos obrigatórios foram atendidos
  const requiredOk = complementGroups.every(g => !g.required || (selectedComplements[g.id]?.length || 0) > 0);

  const toggleComplement = (groupId: string, itemId: string, maxChoices: number) => {
    setSelectedComplements(prev => {
      const current = prev[groupId] || [];
      if (current.includes(itemId)) {
        return { ...prev, [groupId]: current.filter(x => x !== itemId) };
      }
      if (maxChoices === 1) {
        return { ...prev, [groupId]: [itemId] };
      }
      if (current.length < maxChoices) {
        return { ...prev, [groupId]: [...current, itemId] };
      }
      return prev;
    });
  };

  const handleAddToCart = () => {
    // Transformar Record<string, string[]> em SelectedOption[]
    const options: SelectedOption[] = [];
    
    Object.entries(selectedComplements).forEach(([groupId, itemIds]) => {
      const group = complementGroups.find(g => g.id === groupId);
      if (!group) return;
      
      (itemIds as string[]).forEach(itemId => {
        const cItem = group.items.find(i => i.id === itemId);
        if (cItem) {
          options.push({
            groupId,
            groupName: group.name,
            itemId,
            itemName: cItem.name,
            price: cItem.price
          });
        }
      });
    });

    addToCart(item as any, type as 'product' | 'service', quantity, options);
    
    // 📊 Métricas SIS — clique no carrinho
    registerCartClick(item.id, type as 'product' | 'service');
    // 👁️ Olheiro — add_to_cart
    if ((item as any).sellerId || (item as any).providerId) {
      const sid = (item as any).sellerId || (item as any).providerId;
      trackEvent({
        sellerId: sid,
        eventType: 'add_to_cart',
        productId: type === 'product' ? item.id : undefined,
        serviceId: type === 'service' ? item.id : undefined,
        metadata: { 
          quantity, 
          price: (item as any).price || (item as any).pricePerHour,
          options: options.map(o => o.itemName)
        },
      });
    }
    navigate('/cart');
  };

  const handleImmediateOrder = () => {
    // 📊 Métricas SIS — interação de serviço conta como "carrinho"
    registerCartClick(item.id, 'service');
    const msg = buildImmediateServiceMessage(item?.name || '', (item as any).response_time_mins || 30);
    openWhatsApp((item as any).providerPhone || '', msg);
  };

  const handleRecurringOrder = () => {
    const msg = buildRecurringServiceMessage(item?.name || '', price || 0, (item as any).billing_cycle || 'monthly');
    openWhatsApp((item as any).providerPhone || '', msg);
  };

  const confirmSchedule = () => {
    if (!selectedDate || !selectedTurn) {
      alert('Selecione uma data e um turno preferencial!');
      return;
    }
    const msg = buildScheduledServiceMessage(item?.name || '', selectedDate, selectedTurn);
    openWhatsApp((item as any).providerPhone || '', msg);
    setShowScheduleModal(false);
  };

  return (
    <LocationGuard itemCity={itemCity} itemNeighborhood={itemNeighborhood} itemDisplayName={item.name}>
      <div className="min-h-screen bg-neutral-50 pb-32">
        <div className="relative h-80 w-full bg-neutral-200">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          <button onClick={() => navigate(-1)} className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 shadow-lg transition-all active:scale-90"><ChevronLeft size={24} /></button>
          
          <button 
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border transition-all active:scale-[0.85] shadow-lg ${
              isFavorited 
                ? 'bg-rose-500 border-rose-500 text-white' 
                : 'bg-white/20 border-white/20 text-white backdrop-blur-md hover:bg-white/40'
            }`}
          >
            <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} className={favoriteLoading ? 'animate-pulse' : ''} />
          </button>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-sm">{item.category}</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white shadow-sm">{item.name}</h1>
          </div>
        </div>

        {/* --- BANNER ÁREA NÃO COBERTA --- */}
        {(() => {
          if (!location || location.scope === 'city' || !location.neighborhood || location.neighborhood === 'Bairro Desconhecido') return null;
          
          const userBairro = normalizeBairro(location.neighborhood);
          let isOutOfRange = true;

          const baseItemBairro = normalizeBairro(itemNeighborhood);

          if (baseItemBairro === userBairro) {
            isOutOfRange = false;
          } else if (bairrosDisponiveis && bairrosDisponiveis.some(b => normalizeBairro(extractBairroName(b)) === userBairro)) {
            isOutOfRange = false;
          } else if ((!bairrosDisponiveis || bairrosDisponiveis.length === 0) && bairrosAtendidos && bairrosAtendidos.some(b => normalizeBairro(extractBairroName(b)) === userBairro)) {
            isOutOfRange = false;
          }

          if (!isOutOfRange) return null;

          return (
            <div className="bg-orange-50 border-b border-orange-100 px-6 py-4 flex items-start gap-3">
              <div className="shrink-0 p-2 bg-orange-100 rounded-full text-orange-600 mt-0.5">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-orange-800">Fora da área de cobertura garantida</p>
                <p className="text-xs text-orange-600 mt-0.5">Entrega pode não estar disponível para seu bairro. Confirme com o vendedor.</p>
              </div>
            </div>
          );
        })()}

        <main className="mx-auto max-w-3xl px-6 pt-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
            <div>
              <p className="text-3xl font-black text-neutral-900">
                R$ {price?.toFixed(2) || '0.00'}
                {!isProduct && (item as any).service_type === 'immediate' && (<span className="text-sm font-medium text-neutral-500"> / fixo</span>)}
                {!isProduct && (item as any).service_type === 'scheduled' && (<span className="text-sm font-medium text-neutral-500"> / sessão</span>)}
                {!isProduct && (item as any).service_type === 'recurring' && (<span className="text-sm font-medium text-neutral-500"> / {(item as any).billing_cycle}</span>)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-neutral-500">
                <MapPin size={16} className="text-orange-500" />
                {calculateProximityLabel(location, { city: itemCity, neighborhood: itemNeighborhood }, bairrosDisponiveis)}
              </div>
            </div>
            {!isProduct && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-600">
                  <Star size={16} fill="currentColor" /><span className="font-bold">{(item as any).rating || '5.0'}</span>
                </div>
                <span className="mt-1 text-xs text-neutral-400">Proteção Sovix</span>
              </div>
            )}
          </div>

          <div className="py-6 border-b border-neutral-200">
            <h3 className="mb-3 text-lg font-bold text-neutral-900">Sobre</h3>
            <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">{(item as any).description || `Serviço oferecido por ${sellerName}.`}</p>
          </div>

          {/* Complementos */}
          {isProduct && complementGroups.length > 0 && (
            <div className="space-y-4 py-6 border-b border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900">Personalize seu pedido</h3>
              {complementGroups.map(group => {
                const selected = selectedComplements[group.id] || [];
                return (
                  <div key={group.id} className="rounded-2xl border border-neutral-100 bg-white overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-neutral-50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-extrabold text-neutral-900">{group.name}</p>
                        <p className="text-[10px] text-neutral-400 font-medium">
                          {group.required ? '✶ Obrigatório' : 'Opcional'}
                          {group.max_choices > 1 ? ` • Até ${group.max_choices} escolhas` : ''}
                        </p>
                      </div>
                      {group.required && selected.length === 0 && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Selecione</span>
                      )}
                    </div>
                    <div className="divide-y divide-neutral-50">
                      {group.items.map(cItem => {
                        const isSelected = selected.includes(cItem.id);
                        const isRadio = group.max_choices === 1;
                        return (
                          <button
                            key={cItem.id}
                            type="button"
                            onClick={() => toggleComplement(group.id, cItem.id, group.max_choices)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-neutral-50'}`}
                          >
                            <div className={`shrink-0 flex items-center justify-center transition-all ${isRadio ? 'h-5 w-5 rounded-full border-2' : 'h-5 w-5 rounded-md border-2'} ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-neutral-300 bg-white'}`}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                            <span className={`flex-1 text-sm font-semibold ${isSelected ? 'text-neutral-900' : 'text-neutral-600'}`}>{cItem.name}</span>
                            <span className={`text-sm font-bold ${cItem.price > 0 ? 'text-orange-600' : 'text-neutral-400'}`}>
                              {cItem.price > 0 ? `+R$ ${cItem.price.toFixed(2)}` : 'Grátis'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="py-6">
            <button onClick={() => navigate(`/${(item as any).username || ''}`)} className="w-full flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm border border-neutral-100 hover:border-orange-200 hover:shadow-md transition-all text-left group">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center border border-neutral-100 group-hover:scale-105 transition-transform">
                {(item as any).avatar_url ? (
                  <img src={(item as any).avatar_url} alt={sellerName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-neutral-400 font-bold text-xl">{sellerName.charAt(0).toUpperCase()}</span>
                )}
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

        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="mx-auto flex max-w-3xl items-center gap-4">
            {isProduct && (
              <div className="flex h-14 items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-white hover:shadow-sm"><Minus size={18} /></button>
                <span className="w-8 text-center font-bold text-neutral-900">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-white hover:shadow-sm"><Plus size={18} /></button>
              </div>
            )}
            {isProduct ? (
              /* LARANJA — Energia de compra, conversão imediata. Bloqueado até complementos obrigatórios serem preenchidos */
              <button
                onClick={handleAddToCart}
                disabled={!requiredOk}
                title={!requiredOk ? 'Selecione os complementos obrigatórios' : ''}
                className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl px-6 font-bold text-white shadow-lg transition-all duration-200 ${requiredOk
                  ? 'bg-orange-500 shadow-orange-500/30 hover:bg-orange-600 active:scale-[0.97]'
                  : 'bg-neutral-300 shadow-none cursor-not-allowed'
                  }`}
              >
                <ShoppingBag size={20} />
                {requiredOk
                  ? `Adicionar • R$ ${totalPrice.toFixed(2)}`
                  : 'Selecione os obrigatórios'}
              </button>
            ) : (item as any).service_type === 'immediate' ? (
              /* VERMELHO FIRME — Urgência real, sem ansiedade artificial (sem animate-pulse) */
              <button onClick={handleImmediateOrder} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 font-bold text-white shadow-lg shadow-red-600/25 hover:bg-red-700 active:scale-[0.97] transition-all duration-200">
                <Zap size={20} className="fill-white" /> Solicitar Agora
              </button>
            ) : (item as any).service_type === 'scheduled' ? (
              /* AZUL — Confiança, organização, planejamento seguro */
              <button onClick={() => setShowScheduleModal(true)} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.97] transition-all duration-200">
                <Calendar size={20} /> Agendar Horário • R$ {(price || 0).toFixed(2)}
              </button>
            ) : (item as any).service_type === 'recurring' ? (
              /* VERDE-ESMERALDA — Estabilidade, comprometimento de longo prazo */
              <button onClick={handleRecurringOrder} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 active:scale-[0.97] transition-all duration-200">
                <Repeat size={20} /> Assinar Plano • R$ {(price || 0).toFixed(2)}
              </button>
            ) : (
              /* LARANJA FALLBACK — Convite à ação genérica */
              <button onClick={handleImmediateOrder} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.97] transition-all duration-200">
                <Zap size={20} /> Solicitar
              </button>
            )}
          </div>
        </div>

        {showScheduleModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full rounded-t-3xl bg-white p-6 pb-safe sm:max-w-md sm:rounded-3xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-neutral-900">Agendar Melhor Data</h3>
                <button onClick={() => setShowScheduleModal(false)} className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200"><X size={20} /></button>
              </div>
              <p className="mb-6 text-sm text-neutral-500">Selecione uma data e um turno preferencial. O prestador irá confirmar o horário exato com você em seguida via WhatsApp.</p>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold text-neutral-700">Qual dia?</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-medium text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="mb-8">
                <label className="mb-2 block text-sm font-bold text-neutral-700">Qual turno preferencial?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setSelectedTurn('morning')} className={`rounded-xl py-3 text-sm font-bold border transition-colors ${selectedTurn === 'morning' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>Manhã</button>
                  <button onClick={() => setSelectedTurn('afternoon')} className={`rounded-xl py-3 text-sm font-bold border transition-colors ${selectedTurn === 'afternoon' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>Tarde</button>
                  <button onClick={() => setSelectedTurn('night')} className={`rounded-xl py-3 text-sm font-bold border transition-colors ${selectedTurn === 'night' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}>Noite</button>
                </div>
              </div>
              <button onClick={confirmSchedule} className="w-full flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-[0.98] transition-all">Solicitar Reserva</button>
            </motion.div>
          </div>
        )}
      </div>
    </LocationGuard>
  );
};
