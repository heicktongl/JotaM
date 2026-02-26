import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  CreditCard,
  QrCode,
  CheckCircle2,
  MapPin,
  Loader2,
  AlertCircle,
  Banknote,
  ChevronRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLocationScope } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type PaymentMethod = 'pix' | 'card' | 'cash';
type Address = Database['public']['Tables']['user_addresses']['Row'];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { displayLocation } = useLocationScope();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const SERVICE_FEE = 4.90;
  const finalTotal = totalPrice + SERVICE_FEE;

  // Busca endereços salvos do usuário
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        setAddresses(data ?? []);
        const def = data?.find(a => a.is_default);
        if (def) setSelectedAddressId(def.id);
        else if (data && data.length > 0) setSelectedAddressId(data[0].id);
      } catch (e) {
        console.error('Erro ao buscar endereços', e);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    fetchAddresses();
  }, []);

  // Guard: redireciona se carrinho vazio
  useEffect(() => {
    if (items.length === 0 && !createdOrderId) {
      navigate('/');
    }
  }, [items, navigate, createdOrderId]);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Você precisa estar logado para finalizar o pedido.');
        setIsLoading(false);
        return;
      }

      // Descobre o seller_id a partir do primeiro item do carrinho
      // (assumindo que o carrinho é de um único vendedor)
      const firstItem = items[0];
      const itemId = firstItem.item.id;

      let sellerId: string | null = null;

      if (firstItem.type === 'product') {
        const { data } = await supabase
          .from('products')
          .select('seller_id')
          .eq('id', itemId)
          .single();
        sellerId = data?.seller_id ?? null;
      } else {
        // Para serviço, usa o provider_id como seller_id
        const { data } = await supabase
          .from('services')
          .select('provider_id')
          .eq('id', itemId)
          .single();
        sellerId = data?.provider_id ?? null;
      }

      if (!sellerId) {
        setError('Não foi possível identificar o vendedor. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // 1. Cria o pedido na tabela orders
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          consumer_id: user.id,
          seller_id: sellerId,
          delivery_profile_id: null,
          status: 'pending',
          total: finalTotal,
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (orderErr || !order) {
        throw new Error(orderErr?.message ?? 'Erro ao criar pedido.');
      }

      // 2. Insere os itens do pedido em order_items
      const orderItems = items.map(cartItem => ({
        order_id: order.id,
        product_id: cartItem.type === 'product' ? cartItem.item.id : null,
        service_id: cartItem.type === 'service' ? cartItem.item.id : null,
        quantity: cartItem.quantity,
        unit_price: cartItem.type === 'product'
          ? (cartItem.item as { price: number }).price
          : (cartItem.item as { pricePerHour: number }).pricePerHour,
      }));

      const { error: itemsErr } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsErr) {
        throw new Error(itemsErr.message);
      }

      // 3. Registra o pagamento na tabela payments
      const { error: paymentErr } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          method: paymentMethod,
          status: 'pending',
          amount: finalTotal,
          pix_code: paymentMethod === 'pix' ? `PIX-${order.id.slice(0, 8).toUpperCase()}` : null,
          paid_at: null,
        });

      if (paymentErr) {
        console.error('Erro ao registrar pagamento:', paymentErr);
        // Não bloqueia o fluxo — pedido já foi criado
      }

      // 4. Sucesso!
      setCreatedOrderId(order.id);
      clearCart();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao finalizar pedido.';
      setError(msg);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de Sucesso
  if (createdOrderId) {
    return (
      <div className="min-h-screen bg-orange-600 flex flex-col items-center justify-center p-6 text-white">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
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
          className="text-orange-100 text-center mb-4 max-w-xs"
        >
          Seu vizinho já foi notificado. Acompanhe o status na aba de Perfil.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-orange-200 text-xs font-mono mb-10"
        >
          Pedido #{createdOrderId.slice(0, 8).toUpperCase()}
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/')}
          className="rounded-2xl bg-white px-8 py-4 font-bold text-orange-600 shadow-lg transition-all hover:bg-neutral-50 active:scale-95"
        >
          Voltar para o Início
        </motion.button>
      </div>
    );
  }

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

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
            Finalizar Pedido
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-6 space-y-6">
        {/* Resumo do Carrinho */}
        <section>
          <h2 className="text-sm font-bold text-neutral-900 mb-3">Resumo do Pedido</h2>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-neutral-100 space-y-3">
            {items.map(cartItem => {
              const price = cartItem.type === 'product'
                ? (cartItem.item as { price: number }).price
                : (cartItem.item as { pricePerHour: number }).pricePerHour;
              return (
                <div key={cartItem.item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xs font-bold">
                      {cartItem.quantity}x
                    </span>
                    <span className="font-bold text-neutral-900 text-sm">{cartItem.item.name}</span>
                  </div>
                  <span className="font-bold text-neutral-700 text-sm">
                    R$ {(price * cartItem.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-neutral-100 pt-3 flex justify-between">
              <span className="text-sm text-neutral-500">Taxa de serviço</span>
              <span className="text-sm font-bold text-neutral-700">R$ {SERVICE_FEE.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* Endereço de Entrega */}
        <section>
          <h2 className="text-sm font-bold text-neutral-900 mb-3">Local de Entrega</h2>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-neutral-100">
            {isLoadingAddresses ? (
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="text-orange-500 animate-spin" />
                <span className="text-sm text-neutral-500">Carregando endereços...</span>
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedAddressId === addr.id
                        ? 'border-orange-500 bg-orange-50/50'
                        : 'border-neutral-100 hover:border-neutral-200'
                      }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${selectedAddressId === addr.id ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                      <MapPin size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-900 text-sm">{addr.label}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {addr.street}, {addr.neighborhood}
                      </p>
                    </div>
                    {addr.is_default && (
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full shrink-0">Padrão</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-orange-50 text-orange-600">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Localização atual</p>
                  <p className="text-sm text-neutral-500 mt-1">{displayLocation}</p>
                  <button className="text-sm font-bold text-orange-600 mt-2 flex items-center gap-1 hover:underline">
                    Adicionar endereço <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
          {selectedAddress && (
            <p className="text-xs text-neutral-400 mt-2 px-2">
              Entrega em: {selectedAddress.street}, {selectedAddress.neighborhood} — {selectedAddress.city}
            </p>
          )}
        </section>

        {/* Forma de Pagamento */}
        <section>
          <h2 className="text-sm font-bold text-neutral-900 mb-3">Forma de Pagamento</h2>
          <div className="space-y-3">
            {([
              { method: 'pix' as PaymentMethod, icon: <QrCode size={20} />, label: 'Pix', desc: 'Aprovação imediata', color: 'emerald' },
              { method: 'card' as PaymentMethod, icon: <CreditCard size={20} />, label: 'Cartão de Crédito', desc: 'Até 3x sem juros', color: 'blue' },
              { method: 'cash' as PaymentMethod, icon: <Banknote size={20} />, label: 'Dinheiro', desc: 'Pague na entrega', color: 'neutral' },
            ]).map(({ method, icon, label, desc }) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${paymentMethod === method
                    ? 'border-orange-600 bg-orange-50/50'
                    : 'border-neutral-100 bg-white hover:border-neutral-200'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${paymentMethod === method ? 'bg-orange-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                    {icon}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-neutral-900">{label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                  </div>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method ? 'border-orange-600' : 'border-neutral-300'}`}>
                  {paymentMethod === method && <div className="h-2.5 w-2.5 rounded-full bg-orange-600" />}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Observações */}
        <section>
          <h2 className="text-sm font-bold text-neutral-900 mb-3">Observações (opcional)</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex: sem cebola, deixar na portaria, campainha do 4..."
            rows={3}
            className="w-full rounded-2xl bg-white border border-neutral-200 p-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 resize-none shadow-sm"
          />
        </section>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600">
            <AlertCircle size={18} />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}
      </main>

      {/* Botão Fixo de Finalizar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-6">
          <div>
            <p className="text-sm text-neutral-500">Total a pagar</p>
            <p className="text-2xl font-black text-neutral-900">R$ {finalTotal.toFixed(2)}</p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={isLoading || items.length === 0}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-orange-600 px-6 font-bold text-white shadow-lg shadow-orange-600/30 transition-all hover:bg-orange-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              'Finalizar Compra'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
