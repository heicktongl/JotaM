import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Plus, 
  MoreVertical, 
  DollarSign, 
  Users, 
  ArrowUpRight,
  ChevronLeft
} from 'lucide-react';
import { MOCK_PRODUCTS } from '../data';

import { Logo } from '../components/Logo';

export const ProductAdmin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50 flex">
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
          <Logo className="scale-90 origin-left" />
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-2">Painel de Produtos</p>
        </div>

        <nav className="space-y-2 flex-1">
          <button className="flex w-full items-center gap-3 rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600">
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
            <Package size={18} />
            Meus Produtos
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all">
            <TrendingUp size={18} />
            Vendas
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100" />
            {/* @DB_TODO: Fetch seller profile data (name, plan type) from 'sellers' or 'users' table */}
            <div>
              <p className="text-sm font-bold">Horta do João</p>
              <p className="text-xs text-neutral-400">Plano Premium</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 lg:pb-8">
        <header className="mb-6 md:mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-100 lg:hidden"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">Olá, João!</h1>
              <p className="text-sm md:text-base text-neutral-500">Aqui está o resumo da sua horta hoje.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/admin/products/new')}
            className="self-start md:self-auto flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-2.5 md:px-6 md:py-3 text-sm font-bold text-white shadow-lg hover:bg-neutral-800 transition-all"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-3 mb-6 md:mb-10">
          {/* @DB_TODO: Fetch aggregated sales data (Total Sales, New Customers, Growth) from 'orders' and 'customers' tables */}
          {[
            { label: 'Vendas Totais', value: 'R$ 1.240', icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
            { label: 'Novos Clientes', value: '12', icon: Users, color: 'bg-purple-50 text-purple-600' },
            { label: 'Crescimento', value: '+18%', icon: ArrowUpRight, color: 'bg-orange-50 text-orange-600' },
          ].map((stat, i) => (
            <div key={i} className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <button className="text-neutral-400"><MoreVertical size={16} /></button>
              </div>
              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-neutral-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Product List */}
        <div className="rounded-3xl bg-white shadow-sm border border-neutral-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-bold text-lg">Produtos Ativos</h3>
            <button className="text-sm font-bold text-orange-600">Ver todos</button>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-neutral-50 text-xs font-bold text-neutral-400 uppercase tracking-widest border-b border-neutral-100">
            <div className="col-span-5">Produto</div>
            <div className="col-span-2">Estoque</div>
            <div className="col-span-2">Preço</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>

          {/* Responsive List */}
          <div className="divide-y divide-neutral-100">
            {/* @DB_TODO: Fetch seller's active products from 'products' table */}
            {MOCK_PRODUCTS.map((product) => (
              <div key={product.id} className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 p-4 md:p-6 hover:bg-neutral-50 transition-colors">
                {/* Mobile: Flex row, Desktop: Col span 5 */}
                <div className="col-span-5 flex items-center justify-between md:justify-start gap-3">
                  <div className="flex items-center gap-3">
                    <img src={product.image} className="h-12 w-12 rounded-xl object-cover" alt="" />
                    <div>
                      <span className="font-bold text-neutral-900 block">{product.name}</span>
                      <span className="text-sm text-neutral-500 block md:hidden">R$ {product.price.toFixed(2)} • 24 un.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:hidden">
                    <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                      Estoque
                    </span>
                    <button className="text-neutral-400 hover:text-neutral-900 p-2"><MoreVertical size={18} /></button>
                  </div>
                </div>
                
                {/* Desktop only columns */}
                <div className="hidden md:block col-span-2 font-medium text-neutral-600">24 unidades</div>
                <div className="hidden md:block col-span-2 font-bold text-neutral-900">R$ {product.price.toFixed(2)}</div>
                <div className="hidden md:block col-span-2">
                  <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                    Em estoque
                  </span>
                </div>
                <div className="hidden md:flex col-span-1 justify-end">
                  <button className="text-neutral-400 hover:text-neutral-900"><MoreVertical size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-neutral-200 bg-white px-6 py-4 lg:hidden pb-safe">
          <button className="flex flex-col items-center gap-1 text-orange-600">
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-bold">Início</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-900 transition-colors">
            <Package size={20} />
            <span className="text-[10px] font-bold">Produtos</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-neutral-400 hover:text-neutral-900 transition-colors">
            <TrendingUp size={20} />
            <span className="text-[10px] font-bold">Vendas</span>
          </button>
        </div>
      </main>
    </div>
  );
};
