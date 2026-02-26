import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Star,
  ShieldCheck,
  MapPin,
  Share2,
  MessageCircle,
  Instagram,
  Users,
  Eye,
  Link as LinkIcon,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Heart,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ItemCard } from '../components/ItemCard';
import { MOCK_PRODUCTS, MOCK_SERVICES } from '../data';

type Seller = Database['public']['Tables']['sellers']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Service = Database['public']['Tables']['services']['Row'];

type ActiveTab = 'all' | 'products' | 'services';

export const SellerProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerName, setSellerName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normaliza o username da URL (remove @ se existir)
  const rawUsername = username ? decodeURIComponent(username) : '';
  const normalizedUsername = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

  const fetchSellerData = useCallback(async () => {
    if (!normalizedUsername) return;
    try {
      setIsLoading(true);
      setError(null);

      // Busca o seller pelo username
      const { data: sellerData, error: sellerErr } = await supabase
        .from('sellers')
        .select('*')
        .eq('username', normalizedUsername)
        .single();

      if (sellerErr || !sellerData) {
        // Se não existe no banco, tenta exibir via mock (retrocompatibilidade)
        const mockProducts = MOCK_PRODUCTS.filter(p => p.username === normalizedUsername);
        const mockServices = MOCK_SERVICES.filter(s => s.username === normalizedUsername);
        if (mockProducts.length === 0 && mockServices.length === 0) {
          setError('Vendedor não encontrado ou perfil desativado.');
        }
        return;
      }

      setSeller(sellerData);
      setFollowersCount(0); // Será recalculado abaixo

      // Busca nome do usuário dono
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', sellerData.user_id)
        .single();
      setSellerName(userData?.name ?? sellerData.store_name);

      // Busca produtos ativos do vendedor
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setProducts(productsData ?? []);

      // Busca serviços ativos do vendedor
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', sellerData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setServices(servicesData ?? []);

      // Conta seguidores
      const { count } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerData.id);
      setFollowersCount(count ?? 0);

      // Verifica se o usuário logado já segue
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: followRow } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', user.id)
          .eq('seller_id', sellerData.id)
          .maybeSingle();
        setIsFollowing(!!followRow);
      }

      // Incrementa view count (fire and forget)
      await supabase
        .from('sellers')
        .update({ views: sellerData.views + 1 })
        .eq('id', sellerData.id);

    } catch (e: unknown) {
      setError('Erro ao carregar perfil. Tente novamente.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedUsername]);

  useEffect(() => {
    fetchSellerData();
  }, [fetchSellerData]);

  const handleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !seller) return;

    setIsFollowLoading(true);
    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('seller_id', seller.id);
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase
        .from('followers')
        .insert({ follower_id: user.id, seller_id: seller.id });
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
    setIsFollowLoading(false);
  };

  const handleShare = () => {
    const bio = seller?.bio ?? '';
    if (navigator.share) {
      navigator.share({
        title: `Conheça ${sellerName || normalizedUsername} no jotaM`,
        text: bio,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-orange-500 animate-spin" />
          <p className="text-neutral-500 font-bold">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <AlertCircle size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Vendedor não encontrado</h2>
        <p className="text-neutral-500 mb-6 text-center">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold">
          Voltar
        </button>
      </div>
    );
  }

  // Se é vendedor do banco, usa dados reais. Caso contrário, usa mock (retrocompat.)
  const mockProducts = !seller ? MOCK_PRODUCTS.filter(p => p.username === normalizedUsername) : [];
  const mockServices = !seller ? MOCK_SERVICES.filter(s => s.username === normalizedUsername) : [];
  const displayName = seller ? (sellerName || seller.store_name) : (mockProducts[0]?.seller || normalizedUsername);
  const bio = seller?.bio ?? 'Especialista em produtos e serviços locais. Entregando qualidade e confiança direto para você.';
  const avatarSeed = seller?.username ?? normalizedUsername;
  const coverSeed = `${avatarSeed}cover`;
  const whatsapp = seller?.whatsapp ?? '';
  const instagram = seller?.instagram ?? '';
  const isVerified = seller?.is_verified ?? false;
  const totalItems = products.length + services.length + mockProducts.length + mockServices.length;
  const pinnedProductId = seller?.pinned_product_id;
  const pinnedProduct = products.find(p => p.id === pinnedProductId) ?? products[0];

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Cover */}
      <div className="relative h-48 md:h-64 w-full bg-neutral-200">
        <img
          src={seller?.cover_url ?? `https://picsum.photos/seed/${coverSeed}/1200/400`}
          alt="Capa do Perfil"
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleShare}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6">
        {/* Header do perfil */}
        <div className="relative -mt-16 mb-8 flex flex-col md:flex-row md:items-end gap-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-4 border-neutral-50 bg-white overflow-hidden shadow-lg z-10 relative">
              <img
                src={seller?.avatar_url ?? `https://picsum.photos/seed/${avatarSeed}profile/200/200`}
                alt={displayName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {isVerified && (
              <div className="absolute bottom-2 right-2 h-8 w-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm z-20" title="Vendedor Verificado">
                <ShieldCheck size={16} />
              </div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900">
                  {displayName}
                </h1>
                <p className="text-sm font-bold text-neutral-400">@{normalizedUsername}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl font-bold transition-all flex items-center gap-2 justify-center ${isFollowing
                      ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                      : 'bg-neutral-900 text-white shadow-lg hover:bg-neutral-800'
                    }`}
                >
                  {isFollowLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Heart size={16} className={isFollowing ? 'fill-current' : ''} />
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </>
                  )}
                </button>
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-11 w-11 rounded-2xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle size={20} />
                  </a>
                )}
              </div>
            </div>

            <p className="mt-4 text-neutral-600 max-w-2xl leading-relaxed">{bio}</p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Entrega rápida no seu bairro
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">{followersCount}</span>
                <span className="text-neutral-500">seguidores</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">{totalItems}</span>
                <span className="text-neutral-500">itens</span>
              </div>
              {seller && (
                <div className="flex items-center gap-1 text-neutral-500">
                  <Eye size={14} />
                  <span>{seller.views} visualizações</span>
                </div>
              )}
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-pink-600 hover:underline"
                >
                  <Instagram size={14} />
                  {instagram}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Link da Loja */}
        <div className="mb-8 p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-white rounded-xl text-orange-600 shrink-0">
              <LinkIcon size={18} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-orange-600/70 uppercase tracking-widest">Link da Loja</p>
              <p className="font-bold text-orange-900 truncate">jotam.app/@{normalizedUsername}</p>
            </div>
          </div>
          <button onClick={handleShare} className="text-sm font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap px-4">
            Copiar
          </button>
        </div>

        {/* Produto em Destaque (apenas se tem dado real) */}
        {pinnedProduct && activeTab === 'all' && (
          <section className="mb-10">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star size={14} className="text-amber-500" fill="currentColor" />
              Destaque da Loja
            </h2>
            <div
              className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/item/product/${pinnedProduct.id}`)}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-48 md:h-auto relative bg-neutral-100">
                  {pinnedProduct.image_url ? (
                    <img src={pinnedProduct.image_url} alt={pinnedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={48} className="text-neutral-300" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-neutral-900 shadow-sm">
                    Mais Vendido
                  </div>
                </div>
                <div className="p-6 md:w-2/3 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">{pinnedProduct.name}</h3>
                  <p className="text-neutral-500 mb-4 line-clamp-2">{pinnedProduct.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-2xl font-black text-neutral-900">R$ {pinnedProduct.price.toFixed(2)}</p>
                    <button className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-colors">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-neutral-200 mb-8 overflow-x-auto">
          {(['all', 'products', 'services'] as ActiveTab[]).map(tab => {
            const counts = { all: totalItems, products: products.length + mockProducts.length, services: services.length + mockServices.length };
            const labels = { all: `Todos (${totalItems})`, products: `Produtos (${counts.products})`, services: `Serviços (${counts.services})` };
            if (counts[tab] === 0 && tab !== 'all') return null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
              >
                {labels[tab]}
                {activeTab === tab && <motion.div layoutId="seller-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />}
              </button>
            );
          })}
        </div>

        {/* Grid de Itens do banco real */}
        {seller && (
          <div className="space-y-10">
            {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
              <section>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map(product => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/item/product/${product.id}`)}
                      className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="h-48 bg-neutral-100 relative overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={40} className="text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-neutral-900 truncate">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{product.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-xl font-black text-neutral-900">R$ {product.price.toFixed(2)}</p>
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${product.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {product.stock > 0 ? `${product.stock} un.` : 'Esgotado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'services') && services.length > 0 && (
              <section>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => navigate(`/item/service/${service.id}`)}
                      className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="h-48 bg-neutral-100 relative overflow-hidden">
                        {service.image_url ? (
                          <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={40} className="text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-neutral-900 truncate">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{service.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-xl font-black text-neutral-900">R$ {service.price.toFixed(2)}</p>
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
                            {service.duration_minutes}min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Fallback: itens mockados (retrocompatibilidade) */}
        {!seller && (
          <div className="space-y-10">
            {(activeTab === 'all' || activeTab === 'products') && mockProducts.length > 0 && (
              <section>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {mockProducts.map(product => (
                    <ItemCard key={product.id} item={product} type="product" />
                  ))}
                </div>
              </section>
            )}
            {(activeTab === 'all' || activeTab === 'services') && mockServices.length > 0 && (
              <section>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {mockServices.map(service => (
                    <ItemCard key={service.id} item={service} type="service" />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {totalItems === 0 && !isLoading && (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="text-neutral-300 mx-auto mb-4" />
            <p className="font-bold text-neutral-500">Nenhum item disponível no momento</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-neutral-200 flex justify-center gap-8 text-neutral-400">
          <div className="flex items-center gap-2">
            <Eye size={16} />
            <span className="text-xs font-bold">{seller?.views ?? 0} visualizações</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span className="text-xs font-bold">
              Membro desde {seller ? new Date(seller.created_at).getFullYear() : '2024'}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
