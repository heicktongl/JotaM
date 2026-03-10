import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ShoppingBag,
  Briefcase,
  Loader2,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  products?: { name: string; image_url: string } | null;
  services?: { name: string; image_url: string } | null;
}

interface Order {
  id: string;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
  total: number;
  payment_method: string;
  order_items: OrderItem[];
  sellers?: { store_name: string; avatar_url: string } | null;
  service_providers?: { name: string; avatar_url: string } | null;
}

export const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              unit_price,
              products (name, image_url),
              services (name, image_url)
            ),
            sellers (store_name, avatar_url),
            service_providers (name, avatar_url)
          `)
          .eq('consumer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders((data as any[]) || []);
      } catch (err) {
        console.error('Erro ao buscar pedidos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Pendente', 
          icon: Clock, 
          color: 'text-orange-600', 
          bg: 'bg-orange-50',
          border: 'border-orange-100'
        };
      case 'completed':
        return { 
          label: 'Concluído', 
          icon: CheckCircle2, 
          color: 'text-emerald-600', 
          bg: 'bg-emerald-50',
          border: 'border-emerald-100'
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          icon: XCircle, 
          color: 'text-red-600', 
          bg: 'bg-red-50',
          border: 'border-red-100'
        };
      default:
        return { 
          label: status, 
          icon: Package, 
          color: 'text-neutral-600', 
          bg: 'bg-neutral-50',
          border: 'border-neutral-100'
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-neutral-100 pt-12 pb-6 px-6">
        <div className="mx-auto max-w-2xl flex items-center gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900">
            Meus Pedidos
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pt-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-3xl bg-neutral-100 flex items-center justify-center text-neutral-400 mb-6">
              <ShoppingBag size={40} />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Nenhum pedido ainda</h2>
            <p className="text-neutral-500 text-sm max-w-xs mb-8">
              Você ainda não realizou nenhum pedido. Que tal explorar os produtos da sua região?
            </p>
            <Link
              to="/"
              className="px-8 py-3 bg-neutral-900 text-white font-bold rounded-2xl shadow-lg shadow-neutral-900/10 hover:bg-neutral-800 transition-all active:scale-95"
            >
              Explorar agora
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              const sellerName = order.sellers?.store_name || order.service_providers?.name || 'Vendedor';
              const isService = order.order_items.some(i => !!i.services);
              const firstItem = order.order_items[0];
              const itemImage = firstItem?.products?.image_url || firstItem?.services?.image_url || '';

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm hover:border-orange-200 transition-all group"
                >
                  <div className="p-4 flex items-center justify-between border-b border-neutral-50">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status.bg} ${status.color} ${status.border} border`}>
                        <StatusIcon size={12} />
                        {status.label}
                      </div>
                      <span className="text-[10px] font-bold text-neutral-400 font-mono">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Calendar size={12} />
                      <span className="text-[10px] font-bold">{formatDate(order.created_at)}</span>
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
                      {itemImage ? (
                        <img src={itemImage} alt="Item" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-neutral-300">
                          {isService ? <Briefcase size={24} /> : <ShoppingBag size={24} />}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-neutral-900 truncate mb-1">{sellerName}</h4>
                      <p className="text-xs text-neutral-500 line-clamp-1">
                        {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'itens'} • 
                        {order.order_items.map(i => i.products?.name || i.services?.name).join(', ')}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-neutral-400 font-bold uppercase tracking-tighter">Total</p>
                      <p className="font-black text-neutral-900">R$ {order.total.toFixed(2)}</p>
                    </div>
                    
                    <ChevronRight size={18} className="text-neutral-300 group-hover:text-orange-500 transition-colors ml-2" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
