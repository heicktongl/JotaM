import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Heart, Clock, ChevronRight, LogOut, Store, Bike, Briefcase,
  ChevronDown, DollarSign, Package, TrendingUp, Plus, MapPin, Calendar,
  Star, Loader2
} from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { LocationSelector } from '../components/LocationSelector';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';

interface UserRoles {
  isSeller: boolean;
  isDelivery: boolean;
  isServiceProvider: boolean;
  sellerData: {
    store_name: string;
    username: string;
    views: number;
    productCount: number;
    orderCount: number;
  } | null;
  deliveryData: {
    is_online: boolean;
    rating: number;
    todayEarnings: number;
    deliveryCount: number;
  } | null;
  serviceData: {
    name: string;
    rating: number;
    appointmentCount: number;
  } | null;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isEarnMoneyOpen, setIsEarnMoneyOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const [roles, setRoles] = useState<UserRoles | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingRoles(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        // Busca paralela nos 3 perfis
        const [sellerRes, deliveryRes, serviceRes] = await Promise.all([
          supabase.from('sellers').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('delivery_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('service_providers').select('*').eq('user_id', user.id).maybeSingle(),
        ]);

        const seller = sellerRes.data;
        const delivery = deliveryRes.data;
        const service = serviceRes.data;

        let sellerData = null;
        if (seller) {
          const [prodRes, orderRes] = await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id),
          ]);
          sellerData = {
            store_name: seller.store_name,
            username: seller.username,
            views: seller.views ?? 0,
            productCount: prodRes.count ?? 0,
            orderCount: orderRes.count ?? 0,
          };
        }

        let deliveryData = null;
        if (delivery) {
          const today = new Date().toISOString().split('T')[0];
          const [earningsRes, deliveriesRes] = await Promise.all([
            supabase.from('earnings').select('amount').eq('delivery_profile_id', delivery.id).eq('date', today),
            supabase.from('deliveries').select('id', { count: 'exact', head: true }).eq('delivery_profile_id', delivery.id).eq('status', 'delivered'),
          ]);
          const todayEarnings = (earningsRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
          deliveryData = {
            is_online: delivery.is_online,
            rating: Number(delivery.rating),
            todayEarnings,
            deliveryCount: deliveriesRes.count ?? 0,
          };
        }

        let serviceData = null;
        if (service) {
          const appointRes = await supabase
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', service.id);
          serviceData = {
            name: service.name,
            rating: Number(service.rating),
            appointmentCount: appointRes.count ?? 0,
          };
        }

        setRoles({
          isSeller: !!seller,
          isDelivery: !!delivery,
          isServiceProvider: !!service,
          sellerData,
          deliveryData,
          serviceData,
        });
      } catch (e) {
        console.error('Erro ao buscar perfis:', e);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen pb-24 bg-neutral-50 flex flex-col">
        <header className="pt-12 pb-6 px-6 text-center border-b border-neutral-100 bg-white shadow-sm flex flex-col justify-center items-center h-48">
          <Logo variant="orange" className="mb-4" />
          <h1 className="font-display text-2xl font-extrabold tracking-tighter text-neutral-900">
            Seu Perfil
          </h1>
          <p className="text-neutral-500 text-sm mt-1 mb-2">Faça login para ver seu histórico e favoritos.</p>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <button
            onClick={() => navigate('/login')}
            className="w-full max-w-sm rounded-2xl bg-neutral-900 py-4 font-bold text-white shadow-lg shadow-neutral-900/20 transition-all hover:bg-neutral-800"
          >
            Fazer Login
          </button>

          <button
            onClick={() => navigate('/register')}
            className="w-full max-w-sm rounded-2xl bg-orange-50 py-4 font-bold text-orange-600 transition-all hover:bg-orange-100 border border-orange-100"
          >
            Criar Conta
          </button>
        </main>

        <BottomNav />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const hasAnyRole = roles?.isSeller || roles?.isDelivery || roles?.isServiceProvider;
  const showEarnMoney = !roles?.isSeller || !roles?.isDelivery || !roles?.isServiceProvider;

  return (
    <div className="min-h-screen pb-24 bg-neutral-50">
      <header className="pt-12 pb-6 px-6 bg-white border-b border-neutral-100">
        <div className="mx-auto max-w-7xl flex items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
            <img
              src={`https://ui-avatars.com/api/?name=${user.user_metadata?.name || 'User'}&background=FFF7ED&color=EA580C`}
              alt="Perfil"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tighter text-neutral-900">
              {user.user_metadata?.name || 'Seu Nome'}
            </h1>
            <LocationSelector />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-8">
        <div className="space-y-6">

          {loadingRoles ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-orange-500" size={28} />
            </div>
          ) : (
            <>
              {/* ============================================ */}
              {/* PAINEL DO VENDEDOR */}
              {/* ============================================ */}
              {roles?.isSeller && roles.sellerData && (
                <section>
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Minha Loja</h3>
                  <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-0 divide-x divide-neutral-100">
                      <div className="p-4 text-center">
                        <p className="text-2xl font-black text-neutral-900">{roles.sellerData.productCount}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Produtos</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-2xl font-black text-neutral-900">{roles.sellerData.orderCount}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Pedidos</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-2xl font-black text-neutral-900">{roles.sellerData.views}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Views</p>
                      </div>
                    </div>

                    <div className="border-t border-neutral-100">
                      <button
                        onClick={() => navigate('/admin/products')}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><Package size={18} /></div>
                          <span className="font-bold text-neutral-900">Gerenciar Produtos</span>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400" />
                      </button>
                      <button
                        onClick={() => navigate('/admin/products/new')}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-green-50 text-green-600"><Plus size={18} /></div>
                          <span className="font-bold text-neutral-900">Cadastrar Novo Produto</span>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400" />
                      </button>
                      <button
                        onClick={() => navigate(`/${roles.sellerData!.username}`)}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Store size={18} /></div>
                          <div className="text-left">
                            <span className="font-bold text-neutral-900 block">Ver Minha Vitrine</span>
                            <span className="text-xs text-neutral-500">@{roles.sellerData.username}</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* ============================================ */}
              {/* PAINEL DO ENTREGADOR */}
              {/* ============================================ */}
              {roles?.isDelivery && roles.deliveryData && (
                <section>
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Minhas Entregas</h3>
                  <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-3 gap-0 divide-x divide-neutral-100">
                      <div className="p-4 text-center">
                        <p className="text-2xl font-black text-green-600">R$ {roles.deliveryData.todayEarnings.toFixed(0)}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Hoje</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-2xl font-black text-neutral-900">{roles.deliveryData.deliveryCount}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Entregas</p>
                      </div>
                      <div className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <p className="text-2xl font-black text-neutral-900">{roles.deliveryData.rating.toFixed(1)}</p>
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Nota</p>
                      </div>
                    </div>

                    <div className="border-t border-neutral-100">
                      <button
                        onClick={() => navigate('/admin/delivery')}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Bike size={18} /></div>
                          <span className="font-bold text-neutral-900">Painel de Entregas</span>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400" />
                      </button>
                      <button
                        onClick={() => navigate('/admin/delivery/area')}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><MapPin size={18} /></div>
                          <span className="font-bold text-neutral-900">Configurar Área de Atuação</span>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* ============================================ */}
              {/* PAINEL DO PRESTADOR DE SERVIÇO */}
              {/* ============================================ */}
              {roles?.isServiceProvider && roles.serviceData && (
                <section>
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Meus Serviços</h3>
                  <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-2 gap-0 divide-x divide-neutral-100">
                      <div className="p-4 text-center">
                        <p className="text-2xl font-black text-neutral-900">{roles.serviceData.appointmentCount}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Agendamentos</p>
                      </div>
                      <div className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <p className="text-2xl font-black text-neutral-900">{roles.serviceData.rating.toFixed(1)}</p>
                        </div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Nota</p>
                      </div>
                    </div>

                    <div className="border-t border-neutral-100">
                      <button
                        onClick={() => navigate('/admin/services')}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><Briefcase size={18} /></div>
                          <span className="font-bold text-neutral-900">Painel de Serviços</span>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400" />
                      </button>
                      <button
                        onClick={() => navigate('/admin/services/availability')}
                        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Calendar size={18} /></div>
                          <span className="font-bold text-neutral-900">Cadastrar Novo Serviço</span>
                        </div>
                        <ChevronRight size={18} className="text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* ============================================ */}
              {/* MINHA CONTA (sempre visível) */}
              {/* ============================================ */}
              <section>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Minha Conta</h3>
                <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
                  <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><Heart size={18} /></div>
                      <span className="font-bold text-neutral-900">Favoritos</span>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Clock size={18} /></div>
                      <span className="font-bold text-neutral-900">Histórico de Pedidos</span>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400" />
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-neutral-100 text-neutral-600"><Settings size={18} /></div>
                      <span className="font-bold text-neutral-900">Configurações</span>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400" />
                  </button>
                </div>
              </section>

              {/* ============================================ */}
              {/* GANHE DINHEIRO (só roles que faltam) */}
              {/* ============================================ */}
              {showEarnMoney && (
                <section>
                  <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
                    <button
                      onClick={() => setIsEarnMoneyOpen(!isEarnMoneyOpen)}
                      className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-50 text-green-600"><DollarSign size={18} /></div>
                        <div className="text-left">
                          <span className="font-bold text-neutral-900 block">Ganhe dinheiro com a jotaM</span>
                          <span className="text-xs text-neutral-500">Descubra formas de lucrar na sua região</span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isEarnMoneyOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={18} className="text-neutral-400" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isEarnMoneyOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-neutral-100 bg-neutral-50/50"
                        >
                          {!roles?.isSeller && (
                            <button
                              onClick={() => navigate('/seller-setup')}
                              className="w-full flex items-center justify-between p-4 pl-12 hover:bg-neutral-100 transition-colors border-b border-neutral-100/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><Store size={18} /></div>
                                <div className="text-left">
                                  <span className="font-bold text-neutral-900 block">Seja um Vendedor</span>
                                  <span className="text-xs text-neutral-500">Venda seus produtos</span>
                                </div>
                              </div>
                              <ChevronRight size={18} className="text-neutral-400" />
                            </button>
                          )}
                          {!roles?.isDelivery && (
                            <button
                              onClick={() => navigate('/admin/delivery')}
                              className="w-full flex items-center justify-between p-4 pl-12 hover:bg-neutral-100 transition-colors border-b border-neutral-100/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Bike size={18} /></div>
                                <div className="text-left">
                                  <span className="font-bold text-neutral-900 block">Seja um Entregador</span>
                                  <span className="text-xs text-neutral-500">Faça entregas locais</span>
                                </div>
                              </div>
                              <ChevronRight size={18} className="text-neutral-400" />
                            </button>
                          )}
                          {!roles?.isServiceProvider && (
                            <button
                              onClick={() => navigate('/admin/services')}
                              className="w-full flex items-center justify-between p-4 pl-12 hover:bg-neutral-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-50 text-purple-600"><Briefcase size={18} /></div>
                                <div className="text-left">
                                  <span className="font-bold text-neutral-900 block">Ofereça Serviços</span>
                                  <span className="text-xs text-neutral-500">Preste serviços</span>
                                </div>
                              </div>
                              <ChevronRight size={18} className="text-neutral-400" />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </section>
              )}

              {/* Logout */}
              <section>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                >
                  <LogOut size={18} />
                  Sair da conta
                </button>
              </section>
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
