import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Product, Service } from '../data';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  const serviceFee = totalPrice > 0 ? 4.90 : 0;
  const finalTotal = totalPrice + serviceFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <div className="h-24 w-24 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-6">
          <ShoppingBag size={40} />
        </div>
        <h2 className="font-display text-2xl font-bold text-neutral-900 mb-2">Seu carrinho está vazio</h2>
        <p className="text-neutral-500 text-center mb-8">Explore a vizinhança e encontre produtos e serviços incríveis perto de você.</p>
        <button 
          onClick={() => navigate('/')}
          className="rounded-2xl bg-orange-600 px-8 py-4 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700"
        >
          Explorar o jotaM
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-32">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-100 pt-8 pb-4 px-6">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900">
            Carrinho
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-6 space-y-6">
        <div className="space-y-4">
          {items.map((cartItem) => {
            const isProduct = cartItem.type === 'product';
            const price = isProduct ? (cartItem.item as Product).price : (cartItem.item as Service).pricePerHour;
            
            return (
              <motion.div 
                key={cartItem.item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex gap-4 rounded-3xl bg-white p-4 shadow-sm border border-neutral-100"
              >
                <img 
                  src={cartItem.item.image} 
                  alt={cartItem.item.name} 
                  className="h-24 w-24 rounded-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-neutral-900 line-clamp-1">{cartItem.item.name}</h3>
                      <p className="text-xs text-neutral-500 mt-1">{isProduct ? (cartItem.item as Product).seller : (cartItem.item as Service).provider}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(cartItem.item.id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-black text-neutral-900">R$ {price.toFixed(2)}</p>
                    
                    {isProduct ? (
                      <div className="flex h-9 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-1">
                        <button 
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-white hover:shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-neutral-900">{cartItem.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-white hover:shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                        {cartItem.quantity} hora(s)
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-neutral-100 space-y-4">
          <h3 className="font-bold text-neutral-900 border-b border-neutral-100 pb-4">Resumo do Pedido</h3>
          
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span className="font-medium text-neutral-900">R$ {totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Taxa de serviço jotaM</span>
            <span className="font-medium text-neutral-900">R$ {serviceFee.toFixed(2)}</span>
          </div>
          
          <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
            <span className="font-bold text-neutral-900">Total</span>
            <span className="text-2xl font-black text-orange-600">R$ {finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-3xl">
          <button 
            onClick={() => navigate('/checkout')}
            className="flex w-full h-14 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98]"
          >
            Ir para Pagamento
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
