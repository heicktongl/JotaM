import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, CreditCard, QrCode, CheckCircle2, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLocationScope } from '../context/LocationContext';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { displayLocation } = useLocationScope();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isSuccess, setIsSuccess] = useState(false);

  const serviceFee = 4.90;
  const finalTotal = totalPrice + serviceFee;

  const handleCheckout = () => {
    // @DB_TODO: Create order in 'orders' table, process payment via payment gateway API, and clear cart
    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true);
      clearCart();
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-orange-600 flex flex-col items-center justify-center p-6 text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-orange-600 mb-8 shadow-2xl"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl font-extrabold tracking-tight text-center mb-4"
        >
          Pedido Confirmado!
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-orange-100 text-center mb-12 max-w-xs"
        >
          Seu vizinho já foi notificado. Acompanhe o status na aba de Perfil.
        </motion.p>
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => navigate('/')}
          className="rounded-2xl bg-white px-8 py-4 font-bold text-orange-600 shadow-lg transition-all hover:bg-neutral-50 active:scale-95"
        >
          Voltar para o Início
        </motion.button>
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
            Pagamento
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-6 space-y-8">
        {/* Delivery Info */}
        <section>
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Local de Entrega / Serviço</h2>
          {/* @DB_TODO: Fetch user's saved addresses from 'user_addresses' table */}
          <div className="flex items-start gap-4 rounded-3xl bg-white p-5 shadow-sm border border-neutral-100">
            <div className="p-3 rounded-2xl bg-orange-50 text-orange-600">
              <MapPin size={24} />
            </div>
            <div>
              <p className="font-bold text-neutral-900">Meu Endereço</p>
              <p className="text-sm text-neutral-500 mt-1">{displayLocation}</p>
              <button className="text-sm font-bold text-orange-600 mt-2">Alterar</button>
            </div>
          </div>
        </section>

        {/* Payment Methods */}
        <section>
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Forma de Pagamento</h2>
          <div className="space-y-3">
            <button 
              onClick={() => setPaymentMethod('pix')}
              className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${paymentMethod === 'pix' ? 'border-orange-600 bg-orange-50/50' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${paymentMethod === 'pix' ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  <QrCode size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-neutral-900">Pix</p>
                  <p className="text-xs text-emerald-600 font-medium mt-0.5">Aprovação imediata</p>
                </div>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'pix' ? 'border-orange-600' : 'border-neutral-300'}`}>
                {paymentMethod === 'pix' && <div className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
              </div>
            </button>

            <button 
              onClick={() => setPaymentMethod('card')}
              className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${paymentMethod === 'card' ? 'border-orange-600 bg-orange-50/50' : 'border-neutral-100 bg-white hover:border-neutral-200'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${paymentMethod === 'card' ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-neutral-900">Cartão de Crédito</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Até 3x sem juros</p>
                </div>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-orange-600' : 'border-neutral-300'}`}>
                {paymentMethod === 'card' && <div className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
              </div>
            </button>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-6">
          <div>
            <p className="text-sm text-neutral-500">Total a pagar</p>
            <p className="text-2xl font-black text-neutral-900">R$ {finalTotal.toFixed(2)}</p>
          </div>
          <button 
            onClick={handleCheckout}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98]"
          >
            Finalizar Compra
          </button>
        </div>
      </div>
    </div>
  );
};
