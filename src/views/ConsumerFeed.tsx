import React from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, SlidersHorizontal, Package, Briefcase, User } from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_SERVICES } from '../data';
import { ItemCard } from '../components/ItemCard';
import { Logo } from '../components/Logo';
import { BottomNav } from '../components/BottomNav';
import { LocationSelector } from '../components/LocationSelector';

export const ConsumerFeed: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'all' | 'products' | 'services'>('all');

  return (
    <div className="min-h-screen pb-24">
      {/* Header Section */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl pt-6 pb-4 px-6 shadow-sm border-b border-neutral-100">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Logo />
          <LocationSelector />
        </div>
      </header>

      {/* Filters - Now scrolls with the page */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
          <button 
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'}`}
          >
            Tudo
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'}`}
          >
            Produtos
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'}`}
          >
            Serviços
          </button>
          <div className="h-8 w-px bg-neutral-200 mx-1" />
          <button className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-50 border border-neutral-200 transition-all">
            <SlidersHorizontal size={16} />
            Filtros
          </button>
        </div>
      </div>

      {/* Main Feed */}
      <main className="mx-auto max-w-7xl px-6 pt-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* @DB_TODO: Fetch products from 'products' table based on activeTab, location, and filters */}
          {(activeTab === 'all' || activeTab === 'products') && 
            MOCK_PRODUCTS.map((product) => (
              <ItemCard key={product.id} item={product} type="product" />
            ))
          }
          {/* @DB_TODO: Fetch services from 'services' table based on activeTab, location, and filters */}
          {(activeTab === 'all' || activeTab === 'services') && 
            MOCK_SERVICES.map((service) => (
              <ItemCard key={service.id} item={service} type="service" />
            ))
          }
        </div>
      </main>

      <BottomNav />
    </div>
  );
};
