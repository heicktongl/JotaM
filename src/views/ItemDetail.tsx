import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, MapPin, Star, ShieldCheck, Clock, Minus, Plus, ShoppingBag, ChevronRight } from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_SERVICES, Product, Service } from '../data';
import { useCart } from '../context/CartContext';

export const ItemDetail: React.FC = () => {
  const { type, id } = useParams<{ type: 'product' | 'service', id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // @DB_TODO: Fetch item details from 'products' or 'services' table based on ID
  const item = type === 'product' 
    ? MOCK_PRODUCTS.find(p => p.id === id) 
    : MOCK_SERVICES.find(s => s.id === id);

  if (!item) return <div className="p-8 text-center">Item não encontrado</div>;

  const isProduct = type === 'product';
  const price = isProduct ? (item as Product).price : (item as Service).pricePerHour;
  const sellerName = isProduct ? (item as Product).seller : (item as Service).provider;

  const handleAddToCart = () => {
    addToCart(item, type as 'product' | 'service', quantity);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      {/* Header Image & Back Button */}
      <div className="relative h-80 w-full bg-neutral-200">
        <img 
          src={item.image} 
          alt={item.name} 
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <span className="mb-2 inline-flex items-center rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
            {item.category}
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white shadow-sm">
            {item.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 pt-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
          <div>
            <p className="text-3xl font-black text-neutral-900">
              R$ {price.toFixed(2)}
              {!isProduct && <span className="text-sm font-medium text-neutral-500"> /hora</span>}
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-neutral-500">
              <MapPin size={16} className="text-orange-500" />
              {item.distance} de você
            </div>
          </div>
          
          {!isProduct && (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-600">
                <Star size={16} fill="currentColor" />
                <span className="font-bold">{(item as Service).rating}</span>
              </div>
              <span className="mt-1 text-xs text-neutral-400">12 avaliações</span>
            </div>
          )}
        </div>

        <div className="py-6 border-b border-neutral-200">
          <h3 className="mb-3 text-lg font-bold text-neutral-900">Sobre</h3>
          <p className="text-neutral-600 leading-relaxed">
            {isProduct ? (item as Product).description : `Serviço profissional oferecido por ${sellerName}. Especialista na área com anos de experiência no bairro, garantindo qualidade e confiança para você e sua família.`}
          </p>
        </div>

        <div className="py-6">
          <button 
            onClick={() => navigate(`/@${item.username}`)}
            className="w-full flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm border border-neutral-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
          >
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl group-hover:scale-105 transition-transform">
              {sellerName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Oferecido por</p>
              <p className="font-bold text-neutral-900">{sellerName}</p>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-500" />
              <ChevronRight size={20} className="text-neutral-400 group-hover:text-orange-600 transition-colors" />
            </div>
          </button>
        </div>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          {isProduct && (
            <div className="flex h-14 items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-2">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-white hover:shadow-sm"
              >
                <Minus size={18} />
              </button>
              <span className="w-8 text-center font-bold text-neutral-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 hover:bg-white hover:shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
          
          <button 
            onClick={handleAddToCart}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98]"
          >
            <ShoppingBag size={20} />
            Adicionar • R$ {(price * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};
