import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Clock, 
  Star, 
  Navigation, 
  ListTodo, 
  Settings, 
  Bell,
  CheckCircle2,
  ChevronLeft,
  Bike,
  DollarSign,
  TrendingUp,
  Package,
  ArrowUpRight,
  Edit2,
  Check
} from 'lucide-react';

import { Logo } from '../components/Logo';

export const DeliveryAdmin: React.FC = () => {
  const navigate = useNavigate();
  // @DB_TODO: Fetch daily goal from user preferences table
  const [dailyGoal, setDailyGoal] = useState(200);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal.toString());
  
  // @DB_TODO: Fetch current earnings and deliveries count for the day from 'earnings' table
  const currentEarnings = 145.50;
  const progress = Math.min(100, (currentEarnings / dailyGoal) * 100);
  const remaining = Math.max(0, dailyGoal - currentEarnings);

  const handleSaveGoal = () => {
    const newGoal = parseFloat(tempGoal);
    if (!isNaN(newGoal) && newGoal > 0) {
      // @DB_TODO: Save new daily goal to user preferences table via API
      setDailyGoal(newGoal);
    } else {
      setTempGoal(dailyGoal.toString());
    }
    setIsEditingGoal(false);
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
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
            <Settings size={18} />
            Configurações
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <Bike size={20} className="text-neutral-500" />
            </div>
            {/* @DB_TODO: Fetch user profile data (name, vehicle, rating) */}
            <div>
              <p className="text-sm font-bold text-neutral-900">Lucas Moto</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase">
                <Star size={10} fill="currentColor" />
                4.8 Rating
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
              <p className="text-sm md:text-base text-neutral-400">Você está online e disponível.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button className="relative p-3 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 transition-all">
              <Bell size={20} className="text-neutral-600" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <button 
              onClick={() => navigate('/admin/delivery/area')}
              className="flex-1 md:flex-none rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all text-center"
            >
              Área de Atuação
            </button>
            <button className="flex-1 md:flex-none rounded-2xl bg-red-100 px-6 py-3 text-sm font-bold text-red-600 shadow-sm hover:bg-red-200 transition-all text-center">
              Ficar Offline
            </button>
          </div>
        </header>

        {/* Stats & Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Ganhos Hoje + Chart (Large Card) */}
          <div className="lg:col-span-2">
            <div className="rounded-[2.5rem] bg-white p-8 md:p-10 shadow-sm border border-neutral-100 h-full flex flex-col md:flex-row gap-10 cursor-pointer hover:shadow-xl hover:shadow-neutral-200/50 transition-all group relative overflow-hidden">
              {/* Background Decorative Element */}
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-50/50 blur-3xl -z-0" />
              
              {/* Left Side: Main Metric */}
              <div className="flex flex-col justify-between relative z-10 md:w-2/5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 mb-5">
                    <DollarSign size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Receita Diária</span>
                  </div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ganhos Hoje</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-neutral-400">R$</span>
                    <span className="text-5xl font-black text-neutral-900 tracking-tighter">145,50</span>
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg ml-2 -translate-y-1">
                      <TrendingUp size={12} />
                      <span>+12%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Meta Diária</span>
                      <button 
                        onClick={() => {
                          setTempGoal(dailyGoal.toString());
                          setIsEditingGoal(true);
                        }}
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

              {/* Right Side: Weekly Chart */}
              <div className="flex-1 flex flex-col relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-neutral-900">Desempenho Semanal</h4>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Últimos 7 dias</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xl font-black text-neutral-900">R$ 840,00</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Acumulado</p>
                  </div>
                </div>

                <div className="flex-1 flex items-end justify-between gap-2 min-h-[160px]">
                  {[30, 50, 40, 80, 60, 95, 70].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar h-full justify-end">
                      <div className="relative w-full flex-1 flex items-end justify-center">
                        {/* Hover Tooltip Value */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                          R$ {(h * 1.5).toFixed(2)}
                        </div>
                        
                        {/* The Bar */}
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className={`w-full max-w-[12px] md:max-w-[16px] rounded-full transition-all duration-500 relative ${
                            i === 5 
                              ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
                              : 'bg-neutral-100 group-hover/bar:bg-orange-200'
                          }`}
                        >
                          {i === 5 && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-orange-500" />
                          )}
                        </motion.div>
                      </div>
                      
                      {/* Day Label */}
                      <span className={`text-[10px] font-bold uppercase tracking-tighter transition-colors ${
                        i === 5 ? 'text-orange-600' : 'text-neutral-400'
                      }`}>
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Stats Column */}
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-6 h-full">
              {/* Entregas Card */}
              {/* @DB_TODO: Fetch total deliveries count for today */}
              <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <Package size={20} />
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                    +2 hoje
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Entregas</p>
                  <p className="text-3xl font-black text-neutral-900 mt-1">12</p>
                </div>
              </div>

              {/* Avaliação Card */}
              <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                    <Star size={20} />
                  </div>
                  <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                    Estável
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Avaliação</p>
                  <p className="text-3xl font-black text-neutral-900 mt-1">4.8</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Active Delivery */}
          {/* @DB_TODO: Fetch active delivery details (WebSocket/Real-time subscription recommended) */}
          <div className="lg:col-span-3">
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
                    <p className="text-lg font-bold text-neutral-900">Pedido #4092</p>
                    <p className="text-sm font-bold text-orange-600">R$ 12,50 • 2.5 km • 15 min</p>
                  </div>
                </div>
                <span className="rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest">
                  A Caminho
                </span>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <MapPin size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Coleta</p>
                    <p className="font-bold text-neutral-900">Horta do João</p>
                    <p className="text-sm text-neutral-500">Rua das Flores, 123</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-neutral-200 text-neutral-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <MapPin size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-neutral-100 bg-white shadow-sm">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Entrega</p>
                    <p className="font-bold text-neutral-900">Condomínio Vila Nova</p>
                    <p className="text-sm text-neutral-500">Av. Principal, 1000 - Bloco B</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button className="flex-1 rounded-2xl bg-neutral-900 py-4 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2">
                  <Navigation size={18} />
                  Abrir no Mapa
                </button>
                <button className="flex-1 rounded-2xl bg-orange-600 py-4 text-sm font-bold text-white shadow-lg hover:bg-orange-700 transition-all">
                  Confirmar Coleta
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-neutral-200 bg-white px-6 py-4 lg:hidden pb-safe">
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
