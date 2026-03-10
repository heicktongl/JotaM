import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, Heart, Clock, ChevronRight, LogOut, Store, Bike, Briefcase,
  ChevronDown, DollarSign, Package, Plus, MapPin,
  Star, Loader2, Palette
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
    username: string;
    rating: number;
    appointmentCount: number;
  } | null;
}

/**
 * SIS-INSTANT-UI: Configuração Estática de Ferramentas
 * Permite renderização imediata sem esperar o backend.
 */
const SELLER_TOOLS = [
  { id: 'manage', label: 'Gerenciar Produtos', icon: Package, route: '/admin/products', color: 'orange' },
  { id: 'new', label: 'Cadastrar Novo Produto', icon: Plus, route: '/admin/products/new', color: 'green' },
  { id: 'setup', label: 'Dados da Vitrine', icon: Settings, route: '/seller-setup', color: 'neutral' },
  { id: 'view', label: 'Ver Minha Vitrine', icon: Store, route: '/:username', color: 'orange', isDynamic: true },
];

const SERVICE_TOOLS = [
  { id: 'panel', label: 'Painel de Serviços', icon: Briefcase, route: '/admin/services', color: 'purple' },
  { id: 'new', label: 'Cadastrar Novo Serviço', icon: Plus, route: '/admin/services/new', color: 'indigo' },
  { id: 'setup', label: 'Configurar Minha Vitrine', icon: Settings, route: '/service-setup', color: 'neutral' },
  { id: 'view', label: 'Ver Minha Vitrine', icon: Store, route: '/:username', color: 'purple', isDynamic: true },
];

const DELIVERY_TOOLS = [
  { id: 'panel', label: 'Painel de Entregas', icon: Bike, route: '/admin/delivery', color: 'emerald' },
];


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
        // Busca paralela no usuário e nos 3 perfis
        const [sellerRes, deliveryRes, serviceRes] = await Promise.all([
          supabase.from('sellers').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('delivery_profiles').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('service_providers').select('*').eq('user_id', user.id).maybeSingle(),
        ]);

        const seller = sellerRes.data;
        const delivery = deliveryRes.data;
        const service = serviceRes.data;

        // Atualiza roles IMEDIATAMENTE após descobrir quem o usuário é
        setRoles(prev => ({
          ...prev,
          isSeller: !!seller,
          isDelivery: !!delivery,
          isServiceProvider: !!service,
          sellerData: seller ? { store_name: seller.store_name, username: seller.username, views: seller.views ?? 0, productCount: 0, orderCount: 0 } : null,
          deliveryData: delivery ? { is_online: delivery.is_online, rating: Number(delivery.rating), todayEarnings: 0, deliveryCount: 0 } : null,
          serviceData: service ? { name: service.name, username: service.username, rating: Number(service.rating), appointmentCount: 0 } : null,
        } as UserRoles));
        setLoadingRoles(false);

        // Busca Métricas DETALHADAS em background (Lazy Loading)
        if (seller) {
          Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', seller.id),
          ]).then(([prodRes, orderRes]) => {
            setRoles(prev => prev ? ({
              ...prev,
              sellerData: {
                ...prev.sellerData!,
                productCount: prodRes.count ?? 0,
                orderCount: orderRes.count ?? 0,
              }
            }) : null);
          });
        }

        if (delivery) {
          const today = new Date().toISOString().split('T')[0];
          Promise.all([
            supabase.from('earnings').select('amount').eq('delivery_profile_id', delivery.id).eq('date', today),
            supabase.from('deliveries').select('id', { count: 'exact', head: true }).eq('delivery_profile_id', delivery.id).eq('status', 'delivered'),
          ]).then(([earningsRes, deliveriesRes]) => {
            const todayEarnings = (earningsRes.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
            setRoles(prev => prev ? ({
              ...prev,
              deliveryData: {
                ...prev.deliveryData!,
                todayEarnings,
                deliveryCount: deliveriesRes.count ?? 0,
              }
            }) : null);
          });
        }

        if (service) {
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('provider_id', service.id)
            .then(appointRes => {
              setRoles(prev => prev ? ({
                ...prev,
                serviceData: {
                  ...prev.serviceData!,
                  appointmentCount: appointRes.count ?? 0,
                }
              }) : null);
            });
        }
      } catch (e) {
        console.error('Erro ao buscar perfis:', e);
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
          {/* Foto somente leitura — edição centralizada em /settings */}
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-neutral-100">
              <img
                src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.user_metadata?.name || 'User'}&background=FFF7ED&color=EA580C`}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-orange-500 transition-colors"
            >
              <Settings size={10} />
              Editar foto
            </button>
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
                    {/* Métricas (Lazy Loaded) */}
                    <div className="grid grid-cols-3 gap-0 divide-x divide-neutral-100 bg-neutral-50/30">
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
                      {SELLER_TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        const finalRoute = tool.isDynamic ? tool.route.replace(':username', roles.sellerData!.username) : tool.route;
                        const colorClass = tool.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                         tool.color === 'green' ? 'bg-green-50 text-green-600' :
                                         'bg-neutral-100 text-neutral-600';

                        return (
                          <button
                            key={tool.id}
                            onClick={() => navigate(finalRoute)}
                            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${colorClass}`}><Icon size={18} /></div>
                              <div className="text-left">
                                <span className="font-bold text-neutral-900 block">{tool.label}</span>
                                {tool.isDynamic && <span className="text-xs text-neutral-500">@{roles.sellerData!.username}</span>}
                              </div>
                            </div>
                            <ChevronRight size={18} className="text-neutral-400" />
                          </button>
                        );
                      })}
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
                    <div className="grid grid-cols-3 gap-0 divide-x divide-neutral-100 bg-neutral-50/30">
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
                      {DELIVERY_TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        const colorClass = tool.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-600';
                        return (
                          <button
                            key={tool.id}
                            onClick={() => navigate(tool.route)}
                            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${colorClass}`}><Icon size={18} /></div>
                              <span className="font-bold text-neutral-900">{tool.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-neutral-400" />
                          </button>
                        );
                      })}
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
                    <div className="grid grid-cols-2 gap-0 divide-x divide-neutral-100 bg-neutral-50/30">
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
                      {SERVICE_TOOLS.map((tool) => {
                        const Icon = tool.icon;
                        const finalRoute = tool.isDynamic ? tool.route.replace(':username', roles.serviceData!.username) : tool.route;
                        const colorClass = tool.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                                         tool.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                         'bg-neutral-100 text-neutral-600';

                        return (
                          <button
                            key={tool.id}
                            onClick={() => navigate(finalRoute)}
                            className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl ${colorClass}`}><Icon size={18} /></div>
                              <div className="text-left">
                                <span className="font-bold text-neutral-900 block">{tool.label}</span>
                                {tool.isDynamic && <span className="text-xs text-neutral-500">@{roles.serviceData!.username}</span>}
                              </div>
                            </div>
                            <ChevronRight size={18} className="text-neutral-400" />
                          </button>
                        );
                      })}
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
                  <Link 
                    to="/favorites"
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-50 text-orange-600"><Heart size={18} /></div>
                      <span className="font-bold text-neutral-900">Favoritos</span>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400" />
                  </Link>
                  <Link 
                    to="/orders"
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600"><Clock size={18} /></div>
                      <span className="font-bold text-neutral-900">Histórico de Pedidos</span>
                    </div>
                    <ChevronRight size={18} className="text-neutral-400" />
                  </Link>
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
                          <span className="font-bold text-neutral-900 block">Ganhe dinheiro com a Sovix</span>
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
                              onClick={() => navigate('/service-setup')}
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
