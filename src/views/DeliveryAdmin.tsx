import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  MapPin,
  Star,
  Navigation,
  ListTodo,
  Settings,
  Bell,
  ChevronLeft,
  Bike,
  DollarSign,
  TrendingUp,
  Package,
  Edit2,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type DeliveryProfile = Database['public']['Tables']['delivery_profiles']['Row'];
type Earning = Database['public']['Tables']['earnings']['Row'];
type Delivery = Database['public']['Tables']['deliveries']['Row'];

interface WeeklyData {
  day: string;
  amount: number;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DeliveryAdmin: React.FC = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<DeliveryProfile | null>(null);
  const [userName, setUserName] = useState('Entregador');
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Pega usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado para acessar esta página.');
        return;
      }

      // Busca perfil do usuário
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      if (userData) setUserName(userData.name);

      // Busca delivery_profile
      const { data: dp, error: dpErr } = await supabase
        .from('delivery_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (dpErr || !dp) {
        setError('Perfil de entregador não encontrado. Fale com o suporte.');
        return;
      }

      setProfile(dp);
      setTempGoal(dp.daily_goal.toString());

      // Busca ganhos dos últimos 7 dias
      const since = new Date();
      since.setDate(since.getDate() - 6);
      const { data: earningsData } = await supabase
        .from('earnings')
        .select('*')
        .eq('delivery_profile_id', dp.id)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setEarnings(earningsData || []);

      // Monta gráfico semanal
      const weekly: WeeklyData[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = DAYS[d.getDay()];
        const dayTotal = (earningsData || [])
          .filter(e => e.date === dateStr)
          .reduce((acc, e) => acc + e.amount, 0);
        weekly.push({ day: dayLabel, amount: dayTotal });
      }
      setWeeklyData(weekly);

      // Busca entrega ativa
      const { data: deliveryData } = await supabase
        .from('deliveries')
        .select('*')
        .eq('delivery_profile_id', dp.id)
        .in('status', ['collecting', 'on_the_way'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setActiveDelivery(deliveryData);
    } catch (e: unknown) {
      setError('Erro ao carregar dados. Tente novamente.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ganhos de hoje
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEarnings = earnings
    .filter(e => e.date === todayStr)
    .reduce((acc, e) => acc + e.amount, 0);

  const weekTotal = weeklyData.reduce((acc, d) => acc + d.amount, 0);
  const maxWeek = Math.max(...weeklyData.map(d => d.amount), 1);
  const dailyGoal = profile?.daily_goal ?? 200;
  const progress = Math.min(100, (todayEarnings / dailyGoal) * 100);
  const remaining = Math.max(0, dailyGoal - todayEarnings);

  const handleSaveGoal = async () => {
    if (!profile) return;
    const newGoal = parseFloat(tempGoal);
    if (isNaN(newGoal) || newGoal <= 0) {
      setTempGoal(dailyGoal.toString());
      setIsEditingGoal(false);
      return;
    }
    setIsSavingGoal(true);
    const { error: updateErr } = await supabase
      .from('delivery_profiles')
      .update({ daily_goal: newGoal })
      .eq('id', profile.id);
    if (!updateErr) {
      setProfile(prev => prev ? { ...prev, daily_goal: newGoal } : prev);
    }
    setIsSavingGoal(false);
    setIsEditingGoal(false);
  };

  const handleToggleOnline = async () => {
    if (!profile || isTogglingOnline) return;
    setIsTogglingOnline(true);
    const newStatus = !profile.is_online;
    const { error: updateErr } = await supabase
      .from('delivery_profiles')
      .update({ is_online: newStatus })
      .eq('id', profile.id);
    if (!updateErr) {
      setProfile(prev => prev ? { ...prev, is_online: newStatus } : prev);
    }
    setIsTogglingOnline(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-orange-500 animate-spin" />
          <p className="text-neutral-500 font-bold">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="text-red-500 mx-auto" />
          <p className="text-neutral-700 font-bold">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = {
    collecting: 'Coletando',
    on_the_way: 'A Caminho',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-200 bg-white p-6 hidden lg:flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>
          <Logo variant="orange" className="scale-90 origin-left" />
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-2">Painel Entregador</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button className="flex w-full items-center gap-3 rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600">
            <ListTodo size={18} />
            Entregas
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
            <DollarSign size={18} />
            Ganhos
          </button>
          <button
            onClick={() => navigate('/admin/delivery/area')}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all"
          >
            <Settings size={18} />
            Área de Atuação
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <Bike size={20} className="text-neutral-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{userName}</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase">
                <Star size={10} fill="currentColor" />
                {(profile?.rating ?? 0).toFixed(1)} Rating
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-8 overflow-y-auto">
        <header className="mb-6 md:mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 lg:hidden"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Entregas de Hoje</h1>
              <p className="text-sm md:text-base text-neutral-400">
                {profile?.is_online ? 'Você está online e disponível.' : 'Você está offline.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button className="relative p-3 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 transition-all">
              <Bell size={20} className="text-neutral-600" />
            </button>
            <button
              onClick={handleToggleOnline}
              disabled={isTogglingOnline}
              className={`flex-1 md:flex-none rounded-2xl px-6 py-3 text-sm font-bold shadow-sm transition-all text-center flex items-center justify-center gap-2 ${profile?.is_online
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                }`}
            >
              {isTogglingOnline ? (
                <Loader2 size={16} className="animate-spin" />
              ) : profile?.is_online ? (
                <><ToggleRight size={18} /> Ficar Offline</>
              ) : (
                <><ToggleLeft size={18} /> Ficar Online</>
              )}
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Ganhos Card */}
          <div className="lg:col-span-2">
            <div className="rounded-[2.5rem] bg-white p-8 md:p-10 shadow-sm border border-neutral-100 h-full flex flex-col md:flex-row gap-10 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-50/50 blur-3xl -z-0" />

              {/* Ganhos + Meta */}
              <div className="flex flex-col justify-between relative z-10 md:w-2/5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 mb-5">
                    <DollarSign size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Receita Diária</span>
                  </div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ganhos Hoje</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-neutral-400">R$</span>
                    <span className="text-5xl font-black text-neutral-900 tracking-tighter">
                      {todayEarnings.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Meta Diária</span>
                      <button
                        onClick={() => { setTempGoal(dailyGoal.toString()); setIsEditingGoal(true); }}
                        className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-orange-600 transition-colors"
                      >
                        <Edit2 size={10} />
                      </button>
                    </div>
                    {isEditingGoal ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-400">R$</span>
                        <input
                          type="number"
                          autoFocus
                          value={tempGoal}
                          onChange={(e) => setTempGoal(e.target.value)}
                          onBlur={handleSaveGoal}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                          className="w-16 p-0 text-right text-xs font-bold text-neutral-900 border-b border-orange-500 focus:outline-none bg-transparent"
                        />
                        {isSavingGoal && <Loader2 size={10} className="animate-spin text-orange-500" />}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-neutral-900">{progress.toFixed(0)}%</span>
                    )}
                  </div>

                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      {remaining > 0
                        ? `Faltam R$ ${remaining.toFixed(2).replace('.', ',')} para a meta`
                        : 'Meta atingida! 🎉'}
                    </p>
                    <p className="text-[10px] font-bold text-neutral-900">
                      Meta: R$ {dailyGoal.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gráfico Semanal */}
              <div className="flex-1 flex flex-col relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-900">Desempenho Semanal</h4>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Últimos 7 dias</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xl font-black text-neutral-900">R$ {weekTotal.toFixed(2).replace('.', ',')}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Acumulado</p>
                  </div>
                </div>

                <div className="flex-1 flex items-end justify-between gap-2 min-h-[160px]">
                  {weeklyData.map((d, i) => {
                    const heightPct = maxWeek > 0 ? (d.amount / maxWeek) * 100 : 0;
                    const isToday = i === 6;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar h-full justify-end">
                        <div className="relative w-full flex-1 flex items-end justify-center">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            R$ {d.amount.toFixed(2)}
                          </div>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(heightPct, 4)}%` }}
                            className={`w-full max-w-[12px] md:max-w-[16px] rounded-full transition-all duration-500 ${isToday
                                ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
                                : 'bg-neutral-100 group-hover/bar:bg-orange-200'
                              }`}
                          />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${isToday ? 'text-orange-600' : 'text-neutral-400'}`}>
                          {d.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Rápidos */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 h-full">
              <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <Package size={20} />
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">hoje</div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Entregas</p>
                  <p className="text-3xl font-black text-neutral-900 mt-1">
                    {earnings.filter(e => e.date === todayStr).length}
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                    <Star size={20} />
                  </div>
                  <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                    {profile?.is_online ? 'Online' : 'Offline'}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Avaliação</p>
                  <p className="text-3xl font-black text-neutral-900 mt-1">
                    {(profile?.rating ?? 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entrega Ativa */}
        {activeDelivery ? (
          <div className="mb-10">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              Entrega em Andamento
            </h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2.5rem] bg-white p-8 border-2 border-orange-500 shadow-lg shadow-orange-500/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <Navigation size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-neutral-900">
                      Pedido #{activeDelivery.order_id.slice(0, 6).toUpperCase()}
                    </p>
                    <p className="text-sm font-bold text-orange-600">
                      {statusLabel[activeDelivery.status] ?? activeDelivery.status}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest">
                  {statusLabel[activeDelivery.status] ?? activeDelivery.status}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <MapPin size={14} className="text-orange-500" />
                  Iniciado:{' '}
                  {activeDelivery.started_at
                    ? new Date(activeDelivery.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2">
                  <Navigation size={18} />
                  Abrir no Mapa
                </button>
                <button className="flex-1 rounded-2xl bg-orange-600 py-4 text-sm font-bold text-white shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
                  <TrendingUp size={18} />
                  Confirmar Entrega
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="mb-10 rounded-[2.5rem] bg-white p-10 border border-dashed border-neutral-200 text-center">
            <Package size={40} className="text-neutral-300 mx-auto mb-4" />
            <p className="font-bold text-neutral-500">Nenhuma entrega ativa no momento</p>
            <p className="text-sm text-neutral-400 mt-1">
              {profile?.is_online
                ? 'Aguardando novos pedidos...'
                : 'Fique online para receber pedidos.'}
            </p>
          </div>
        )}

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-neutral-200 bg-white px-6 py-4 lg:hidden">
          <button className="flex flex-col items-center gap-1 text-orange-600">
            <ListTodo size={20} />
            <span className="text-[10px] font-bold">Entregas</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-900 transition-colors">
            <DollarSign size={20} />
            <span className="text-[10px] font-bold">Ganhos</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-900 transition-colors">
            <Settings size={20} />
            <span className="text-[10px] font-bold">Ajustes</span>
          </button>
        </div>
      </main>
    </div>
  );
};
