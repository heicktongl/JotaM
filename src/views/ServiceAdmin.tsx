import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Star, 
  MessageSquare, 
  Briefcase, 
  Settings, 
  Bell,
  CheckCircle2,
  XCircle,
  ChevronLeft
} from 'lucide-react';
import { MOCK_SERVICES } from '../data';

import { Logo } from '../components/Logo';

export const ServiceAdmin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex">
      {/* Sidebar - Light Mode Aesthetic */}
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
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-2">Painel de Serviços</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button className="flex w-full items-center gap-3 rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600">
            <Calendar size={18} />
            Agenda
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
            <Briefcase size={18} />
            Meus Serviços
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
            <MessageSquare size={18} />
            Mensagens
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
            <Settings size={18} />
            Configurações
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-100" />
            {/* @DB_TODO: Fetch service provider profile data (name, rating) from 'service_providers' or 'users' table */}
            <div>
              <p className="text-sm font-bold text-neutral-900">Carlos Verde</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase">
                <Star size={10} fill="currentColor" />
                4.9 Rating
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
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Agenda de Hoje</h1>
              <p className="text-sm md:text-base text-neutral-400">Você tem 3 agendamentos pendentes.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button className="relative p-3 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 transition-all">
              <Bell size={20} className="text-neutral-600" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <button 
              onClick={() => navigate('/admin/services/availability')}
              className="flex-1 md:flex-none rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all text-center"
            >
              Disponibilidade
            </button>
          </div>
        </header>

        {/* Upcoming Appointments */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-10">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Próximos Clientes</h3>
          {/* @DB_TODO: Fetch upcoming appointments from 'appointments' or 'orders' table */}
          {[
            { client: 'Mariana Silva', time: '14:00 - 15:30', service: 'Consultoria de Jardinagem', status: 'confirmed' },
            { client: 'Roberto Costa', time: '16:00 - 17:00', service: 'Manutenção de Vasos', status: 'pending' },
          ].map((app, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex items-center justify-between rounded-3xl bg-white p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-orange-50 text-orange-600">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold text-neutral-900">{app.client}</p>
                  <p className="text-sm text-neutral-500">{app.service}</p>
                  <p className="text-xs font-bold text-orange-600 mt-1">{app.time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {app.status === 'pending' ? (
                  <>
                    <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-all shadow-sm">
                      <CheckCircle2 size={20} />
                    </button>
                    <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-all">
                      <XCircle size={20} />
                    </button>
                  </>
                ) : (
                  <span className="rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest">
                    Confirmado
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Performance Chart Placeholder */}
        <div className="rounded-3xl bg-white p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-neutral-900">Desempenho Semanal</h3>
            <select className="bg-transparent border-none text-sm font-bold text-neutral-500 focus:ring-0">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-48 flex items-end gap-4">
            {/* @DB_TODO: Fetch weekly performance data (appointments/earnings) from 'appointments' or 'earnings' table */}
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  className="w-full rounded-t-lg bg-orange-100 group-hover:bg-orange-500 transition-all"
                />
                <span className="text-[10px] font-bold text-neutral-400">S{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-neutral-200 bg-white px-6 py-4 lg:hidden pb-safe">
          <button className="flex flex-col items-center gap-1 text-orange-600">
            <Calendar size={20} />
            <span className="text-[10px] font-bold">Agenda</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-900 transition-colors">
            <Briefcase size={20} />
            <span className="text-[10px] font-bold">Serviços</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-900 transition-colors">
            <MessageSquare size={20} />
            <span className="text-[10px] font-bold">Mensagens</span>
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
