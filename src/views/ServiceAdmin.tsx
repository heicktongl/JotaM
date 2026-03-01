import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  User as UserIcon,
  Trash2,
  Power,
  Package,
  Loader2
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// Tipagem Expandida para Join com o usuário Consumidor
interface AppointmentRow {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  scheduled_at: string;
  services: { name: string };
  users: { name: string }; // Consumer name via auth.users or profiles (we'll fetch from metadata)
  consumer_id: string;
}

interface ServiceRow {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

export const ServiceAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [activeTab, setActiveTab] = useState<'agenda' | 'services'>('agenda');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        // 1. Busca perfil do provedor
        const { data: provData, error: provErr } = await supabase
          .from('service_providers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (provErr) throw provErr;
        setProvider(provData);

        // 2. Busca agenda (Appointments) com Join na View 'user_profiles' para o nome do Cliente
        const { data: appointsData, error: appErr } = await supabase
          .from('appointments')
          .select(`
            id,
            status,
            scheduled_at,
            consumer_id,
            services ( name ),
            user_profiles!appointments_consumer_id_fkey ( name, avatar_url )
          `)
          .eq('provider_id', provData.id)
          .order('scheduled_at', { ascending: true });

        if (appErr) throw appErr;

        const formatted = (appointsData as any[]).map(a => ({
          ...a,
          users: {
            name: a.user_profiles?.name || 'Cliente Sem Nome',
            avatar: a.user_profiles?.avatar_url || null
          }
        }));

        setAppointments(formatted);

        // 3. Busca Meus Serviços
        const { data: svcsData, error: svcErr } = await supabase
          .from('services')
          .select('id, name, price, is_active')
          .eq('provider_id', provData.id)
          .order('created_at', { ascending: false });

        if (!svcErr && svcsData) {
          setServices(svcsData);
        }

      } catch (err) {
        console.error('Erro ao carregar Dashboard de Serviços:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      // Atualiza interface instantaneamente
      setAppointments(prev => prev.map(a =>
        a.id === appointmentId ? { ...a, status: newStatus as any } : a
      ));
    } catch (err) {
      console.error('Falha ao atualizar status', err);
      alert('Não foi possível alterar o status do agendamento.');
    }
  };

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  const handleToggleServiceActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.map(s =>
        s.id === id ? { ...s, is_active: !currentStatus } : s
      ));
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Não foi possível alterar o status do serviço.');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja apagar este serviço? Essa ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
      alert('Não foi possível excluir o serviço. Verifique se há agendamentos vinculados.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <Briefcase size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-lg font-bold text-neutral-900 mb-2">Conta não encontrada</h2>
        <p className="text-sm text-neutral-500 max-w-sm mb-6">Parece que você não ativou sua conta de prestador de serviços ainda.</p>
        <button onClick={() => navigate(-1)} className="bg-orange-600 px-6 py-3 rounded-2xl text-white font-bold">Voltar</button>
      </div>
    );
  }

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
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-2">Painel de Serviços</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === 'agenda' ? 'bg-orange-50 text-orange-600' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
          >
            <Calendar size={18} />
            Agenda
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-orange-50 text-orange-600' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
          >
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
            {provider.avatar_url ? (
              <img src={provider.avatar_url} alt="Profile" className="h-10 w-10 rounded-full object-cover shadow-sm bg-neutral-100" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <UserIcon size={18} />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-neutral-900 truncate max-w-[120px]">{provider.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase">
                <Star size={10} fill="currentColor" />
                {Number(provider.rating).toFixed(1)} Rating
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
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {activeTab === 'agenda' ? 'Sua Agenda' : 'Meus Serviços'}
              </h1>
              <p className="text-sm md:text-base text-neutral-400">
                {activeTab === 'agenda'
                  ? (pendingCount === 0 ? 'Nenhum agendamento pendente.' : `Você tem ${pendingCount} agendamento${pendingCount !== 1 ? 's' : ''} pendente${pendingCount !== 1 ? 's' : ''}.`)
                  : (services.length === 0 ? 'Nenhum serviço cadastrado.' : `${services.length} serviço${services.length !== 1 ? 's' : ''} cadastrado${services.length !== 1 ? 's' : ''}.`)
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button className="relative p-3 rounded-2xl bg-white hover:bg-neutral-100 border border-neutral-200 transition-all">
              <Bell size={20} className="text-neutral-600" />
              {pendingCount > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />}
            </button>
            <button
              onClick={() => navigate('/admin/services/new')}
              className="flex-1 md:flex-none rounded-2xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-orange-700 transition-all text-center whitespace-nowrap"
            >
              Novo Serviço
            </button>
            <button
              onClick={() => navigate('/admin/services/availability')}
              className="flex-1 md:flex-none rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all text-center whitespace-nowrap hidden sm:block"
            >
              Disponibilidade
            </button>
          </div>
        </header>

        {/* Upcoming Appointments */}
        {activeTab === 'agenda' ? (
          <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-10">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Compromissos</h3>

            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-neutral-100 text-center">
                <Calendar size={48} className="text-neutral-200 mb-4" />
                <p className="text-neutral-500 font-medium">Sua agenda está livre por enquanto.</p>
              </div>
            ) : (
              appointments.map((app, i) => {
                const dateObj = new Date(app.scheduled_at);
                const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 border border-neutral-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center justify-center h-16 w-16 rounded-2xl bg-orange-50 text-orange-600 shrink-0">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-neutral-900">{app.users.name}</p>
                        <p className="text-sm text-neutral-500">{app.services?.name || 'Serviço Removido'}</p>
                        <p className="text-xs font-bold text-orange-600 mt-1">{formattedDate} às {formattedTime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:ml-auto">
                      {app.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => updateStatus(app.id, 'confirmed')}
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white hover:bg-orange-700 transition-all shadow-sm"
                            title="Confirmar Agendamento"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, 'cancelled')}
                            className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-all"
                            title="Recusar"
                          >
                            <XCircle size={20} />
                          </button>
                        </>
                      ) : (
                        <span className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${app.status === 'confirmed' ? 'bg-orange-50 text-orange-600' :
                          app.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                          {app.status === 'confirmed' ? 'Confirmado' : app.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6 md:mb-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Serviços Ativos</h3>
            </div>

            {services.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-neutral-100 text-center">
                <Package size={48} strokeWidth={1} className="text-neutral-200 mb-4" />
                <p className="text-neutral-500 font-medium mb-1">Você não possui serviços listados.</p>
                <button
                  onClick={() => navigate('/admin/services/new')}
                  className="text-sm font-bold text-orange-600 hover:underline"
                >
                  Cadastrar agora
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 rounded-3xl bg-white shadow-sm border border-neutral-100 overflow-hidden">
                {services.map((svc) => (
                  <div key={svc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-bold text-neutral-900">{svc.name}</h4>
                      <p className="text-sm font-black text-neutral-600 mt-1">
                        R$ {svc.price.toFixed(2)} <span className="text-xs font-medium text-neutral-400 font-normal">/ hora</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${svc.is_active ? 'bg-orange-50 text-orange-600' : 'bg-neutral-100 text-neutral-400'}`}>
                        {svc.is_active ? 'Ativo' : 'Inativo'}
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleServiceActive(svc.id, svc.is_active)}
                          title={svc.is_active ? "Ocultar / Desativar" : "Mostrar / Ativar"}
                          className={`p-2 rounded-xl transition-colors ${svc.is_active
                            ? 'text-orange-500 hover:bg-orange-50 bg-neutral-100'
                            : 'text-neutral-400 hover:bg-neutral-200 bg-neutral-100'
                            }`}
                        >
                          <Power size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteService(svc.id)}
                          title="Excluir Serviço"
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 bg-neutral-100 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-neutral-200 bg-white px-6 py-4 lg:hidden pb-safe">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'agenda' ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-900'}`}
          >
            <Calendar size={20} />
            <span className="text-[10px] font-bold">Agenda</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'services' ? 'text-orange-600' : 'text-neutral-400 hover:text-neutral-900'}`}
          >
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
