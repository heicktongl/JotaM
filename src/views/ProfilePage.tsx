import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Heart, Clock, ChevronRight, LogOut, Store, Bike, Briefcase, ChevronDown, DollarSign } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { LocationSelector } from '../components/LocationSelector';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isEarnMoneyOpen, setIsEarnMoneyOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

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
          <section>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Minha Conta</h3>
            <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
              <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                    <Heart size={18} />
                  </div>
                  <span className="font-bold text-neutral-900">Favoritos</span>
                </div>
                <ChevronRight size={18} className="text-neutral-400" />
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Clock size={18} />
                  </div>
                  <span className="font-bold text-neutral-900">Histórico de Pedidos</span>
                </div>
                <ChevronRight size={18} className="text-neutral-400" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-neutral-100 text-neutral-600">
                    <Settings size={18} />
                  </div>
                  <span className="font-bold text-neutral-900">Configurações</span>
                </div>
                <ChevronRight size={18} className="text-neutral-400" />
              </button>
            </div>
          </section>

          <section>
            <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
              <button
                onClick={() => setIsEarnMoneyOpen(!isEarnMoneyOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-50 text-green-600">
                    <DollarSign size={18} />
                  </div>
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
                    <button
                      onClick={() => navigate('/seller-setup')}
                      className="w-full flex items-center justify-between p-4 pl-12 hover:bg-neutral-100 transition-colors border-b border-neutral-100/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                          <Store size={18} />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-neutral-900 block">Seja um Vendedor</span>
                          <span className="text-xs text-neutral-500">Venda seus produtos</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-neutral-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 pl-12 hover:bg-neutral-100 transition-colors border-b border-neutral-100/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                          <Bike size={18} />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-neutral-900 block">Seja um Entregador</span>
                          <span className="text-xs text-neutral-500">Faça entregas locais</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-neutral-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 pl-12 hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                          <Briefcase size={18} />
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-neutral-900 block">Ofereça Serviços</span>
                          <span className="text-xs text-neutral-500">Preste serviços</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-neutral-400" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} />
              Sair da conta
            </button>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
