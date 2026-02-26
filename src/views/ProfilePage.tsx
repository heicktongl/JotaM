import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Heart, Clock, ChevronRight, LogOut, Store, Bike, Briefcase, ChevronDown, DollarSign } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { LocationSelector } from '../components/LocationSelector';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [isEarnMoneyOpen, setIsEarnMoneyOpen] = useState(false);

  return (
    <div className="min-h-screen pb-24 bg-neutral-50">
      <header className="pt-12 pb-6 px-6 bg-white border-b border-neutral-100">
        <div className="mx-auto max-w-7xl flex items-center gap-6">
          {/* @DB_TODO: Fetch user profile data (name, photo URL) from 'users' table */}
          <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
            <img 
              src="https://picsum.photos/seed/user/200/200" 
              alt="Perfil" 
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tighter text-neutral-900">
              Mariana Silva
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
                    <button className="w-full flex items-center justify-between p-4 pl-12 hover:bg-neutral-100 transition-colors border-b border-neutral-100/50">
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
            {/* @DB_TODO: Implement logout logic (clear session/token) */}
            <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors">
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
