import React from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { MOCK_PRODUCTS, MOCK_SERVICES } from '../data';
import { ItemCard } from '../components/ItemCard';

export const SearchPage: React.FC = () => {
  return (
    <div className="min-h-screen pb-24 bg-neutral-50">
      <header className="sticky top-0 z-30 bg-neutral-50/80 backdrop-blur-xl pt-8 pb-4 px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tighter text-neutral-900 mb-6">
            Buscar
          </h1>
          <div className="relative w-full">
            {/* @DB_TODO: Implement search logic to query 'products' and 'services' tables based on input value and user location */}
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              autoFocus
              placeholder="O que você procura hoje?"
              className="w-full rounded-2xl bg-white border-none py-4 pl-12 pr-4 shadow-sm ring-1 ring-neutral-200 focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-neutral-900">Ativos</h2>
          <span className="text-sm font-medium text-orange-600">Perto de você</span>
        </div>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* @DB_TODO: Fetch active items nearby from 'products' and 'services' tables */}
          {/* Misturando produtos e serviços para a seção "Ativos" */}
          {MOCK_PRODUCTS.slice(0, 2).map((product) => (
            <ItemCard key={product.id} item={product} type="product" />
          ))}
          {MOCK_SERVICES.slice(0, 1).map((service) => (
            <ItemCard key={service.id} item={service} type="service" />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
