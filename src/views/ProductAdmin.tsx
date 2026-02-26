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
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/Logo';

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
}

export const ProductAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seller, setSeller] = React.useState<{ store_name: string; id: string } | null>(null);
  const [products, setProducts] = React.useState<SellerProduct[]>([]);
  const [stats, setStats] = React.useState({ revenue: 0, customers: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        // Buscar perfil do vendedor
        const { data: sellerData } = await supabase
          .from('sellers')
          .select('id, store_name')
          .eq('user_id', user.id)
          .single();

        if (sellerData) {
          setSeller(sellerData);
          // Buscar produtos do vendedor
          const { data: prodData } = await supabase
            .from('products')
            .select('id, name, price, stock, image_url, is_active')
            .eq('seller_id', sellerData.id)
            .order('created_at', { ascending: false });
          if (prodData) setProducts(prodData);

          // Buscar total de pedidos (receita e clientes únicos)
          const { data: ordersData } = await supabase
            .from('orders')
            .select('total, consumer_id')
            .eq('seller_id', sellerData.id)
            .eq('status', 'delivered');
          if (ordersData) {
            const revenue = ordersData.reduce((acc, o) => acc + o.total, 0);
            const uniqueCustomers = new Set(ordersData.map(o => o.consumer_id)).size;
            setStats({ revenue, customers: uniqueCustomers });
          }
        }
      } catch (err) {
        console.error('Erro ao carregar painel do vendedor:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

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
            <div>
              <p className="text-sm font-bold">{seller?.store_name ?? 'Minha Loja'}</p>
              <p className="text-xs text-neutral-400">Vendedor</p>
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
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900">
                Olá, {seller?.store_name ?? 'Vendedor'}!
              </h1>
              <p className="text-sm md:text-base text-neutral-500">Aqui está o resumo da sua loja hoje.</p>
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
          {[
            { label: 'Receita Total', value: `R$ ${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
            { label: 'Clientes Únicos', value: String(stats.customers), icon: Users, color: 'bg-purple-50 text-purple-600' },
            { label: 'Produtos Ativos', value: String(products.filter(p => p.is_active).length), icon: ArrowUpRight, color: 'bg-orange-50 text-orange-600' },
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
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 m-4 rounded-2xl bg-neutral-100 animate-pulse" />
              ))
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-neutral-400">
                <Package size={40} className="mx-auto mb-3" strokeWidth={1} />
                <p className="font-bold">Nenhum produto cadastrado ainda</p>
                <p className="text-sm">Clique em "Novo Produto" para começar.</p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 p-4 md:p-6 hover:bg-neutral-50 transition-colors">
                  <div className="col-span-5 flex items-center justify-between md:justify-start gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url || 'https://picsum.photos/seed/' + product.id + '/100/100'}
                        className="h-12 w-12 rounded-xl object-cover"
                        alt=""
                      />
                      <div>
                        <span className="font-bold text-neutral-900 block">{product.name}</span>
                        <span className="text-sm text-neutral-500 block md:hidden">R$ {product.price.toFixed(2)} • {product.stock} un.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${product.is_active ? 'bg-orange-50 text-orange-600' : 'bg-neutral-100 text-neutral-400'
                        }`}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <button className="text-neutral-400 hover:text-neutral-900 p-2"><MoreVertical size={18} /></button>
                    </div>
                  </div>
                  <div className="hidden md:block col-span-2 font-medium text-neutral-600">{product.stock} unidades</div>
                  <div className="hidden md:block col-span-2 font-bold text-neutral-900">R$ {product.price.toFixed(2)}</div>
                  <div className="hidden md:block col-span-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${product.is_active ? 'bg-orange-50 text-orange-600' : 'bg-neutral-100 text-neutral-400'
                      }`}>
                      {product.is_active ? 'Em estoque' : 'Inativo'}
                    </span>
                  </div>
                  <div className="hidden md:flex col-span-1 justify-end">
                    <button className="text-neutral-400 hover:text-neutral-900"><MoreVertical size={18} /></button>
                  </div>
                </div>
              ))
            )}
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
