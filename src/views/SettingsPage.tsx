import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Search, User, LayoutDashboard, Briefcase, ChevronRight, Bike } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-100 pt-8 pb-4 px-6">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900">
            Configurações
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-8 space-y-8">
        <section>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Interfaces de Usuário
          </h2>
          <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <Package size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-neutral-900 block">Feed Principal</span>
                  <span className="text-xs text-neutral-500">Explorar produtos e serviços</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </button>
            <button 
              onClick={() => navigate('/search')}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <Search size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-neutral-900 block">Busca</span>
                  <span className="text-xs text-neutral-500">Encontrar itens próximos</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
                  <User size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-neutral-900 block">Meu Perfil</span>
                  <span className="text-xs text-neutral-500">Gerenciar conta e favoritos</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Interfaces Administrativas
          </h2>
          <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
            <button 
              onClick={() => navigate('/admin/products')}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <LayoutDashboard size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-neutral-900 block">Painel de Produtos</span>
                  <span className="text-xs text-neutral-500">Gestão para vendedores</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </button>
            <button 
              onClick={() => navigate('/admin/services')}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Briefcase size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-neutral-900 block">Painel de Serviços</span>
                  <span className="text-xs text-neutral-500">Gestão para prestadores</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </button>
            <button 
              onClick={() => navigate('/admin/delivery')}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Bike size={18} />
                </div>
                <div className="text-left">
                  <span className="font-bold text-neutral-900 block">Painel de Entregador</span>
                  <span className="text-xs text-neutral-500">Gestão de rotas e entregas</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
