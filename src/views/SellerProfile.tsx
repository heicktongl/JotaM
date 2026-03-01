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
import { ItemCard, ItemType } from '../components/ItemCard';
import { AvatarUploader } from '../components/AvatarUploader';
import { LocationGuard } from '../components/LocationGuard';


type Product = Database['public']['Tables']['products']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type StoreLocation = Database['public']['Tables']['store_locations']['Row'];

type ActiveTab = 'all' | 'products' | 'services';

export const SellerProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // States Unificados para Seller ou Service Provider
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileType, setProfileType] = useState<'seller' | 'provider' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [views, setViews] = useState(0);
  const [rating, setRating] = useState(5.0);
  const [createdAt, setCreatedAt] = useState('');
  const [pinnedProductId, setPinnedProductId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de localização do perfil (para LocationGuard)
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [profileNeighborhood, setProfileNeighborhood] = useState<string | null>(null);

  // Normaliza o username da URL (remove @ se existir)
  const rawUsername = username ? decodeURIComponent(username) : '';
  const normalizedUsername = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;

  const fetchProfileData = useCallback(async () => {
    if (!normalizedUsername) {
      setError('A URL deste perfil é inválida ou o profissional ainda não configurou seu link público.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      // 1. Tenta buscar em Sellers
      const { data: sellerData, error: sellerErr } = await supabase
        .from('sellers')
        .select('*')
        .eq('username', normalizedUsername)
        .maybeSingle();

      let targetId = '';
      let targetType: 'seller' | 'provider' | null = null;
      let targetUserId = '';

      if (sellerData) {
        targetId = sellerData.id;
        targetType = 'seller';
        targetUserId = sellerData.user_id;

        // Puxando o nome real do User caso queira (opcional)
        const { data: userData } = await supabase.from('users').select('name').eq('id', sellerData.user_id).single();
        setDisplayName(sellerData.store_name || userData?.name || 'Lojista');

        setBio(sellerData.bio || '');
        setAvatarUrl(sellerData.avatar_url);
        setCoverUrl(sellerData.cover_url);
        setWhatsapp(sellerData.whatsapp || '');
        setInstagram(sellerData.instagram || '');
        setIsVerified(sellerData.is_verified);
        setViews(sellerData.views);
        setCreatedAt(sellerData.created_at);
        setPinnedProductId(sellerData.pinned_product_id);

        // Dispara aumento de views fire & forget
        supabase.from('sellers').update({ views: sellerData.views + 1 }).eq('id', sellerData.id).then();
      } else {
        // 2. Tenta buscar em Service Providers
        const { data: providerData, error: providerErr } = await supabase
          .from('service_providers')
          .select('*')
          .eq('username', normalizedUsername)
          .maybeSingle();

        if (providerData) {
          targetId = providerData.id;
          targetType = 'provider';
          targetUserId = providerData.user_id;

          setDisplayName(providerData.name || 'Prestador');
          setBio(providerData.bio || '');
          setAvatarUrl(providerData.avatar_url);
          setCoverUrl(providerData.cover_url || null);
          setWhatsapp('');
          setInstagram('');
          setIsVerified(true);
          setViews(0);
          setRating(providerData.rating || 5.0);
          setCreatedAt(providerData.created_at);
          // Localização para blindagem de prestadores
          setProfileCity(providerData.city ?? null);
          setProfileNeighborhood(providerData.neighborhood ?? null);
        } else {
          // Nenhum dos dois achado
          setError('Profissional ou Lojista não encontrado com esta URL na rede JotaM.');
          return;
        }
      }

      setProfileId(targetId);
      setProfileType(targetType);
      setUserId(targetUserId);

      // Promessas de Feed de Produtos ou Serviços
      let productsData: any[] = [];
      let servicesData: any[] = [];

      if (targetType === 'seller') {
        const { data } = await supabase.from('products').select('*').eq('is_active', true).eq('seller_id', targetId).order('created_at', { ascending: false });
        productsData = data ?? [];
      } else {
        const { data } = await supabase.from('services').select('*').eq('is_active', true).eq('provider_id', targetId).order('created_at', { ascending: false });
        servicesData = data ?? [];
      }

      setProducts(productsData);
      setServices(servicesData);

      // Buscar seguidores e locations apenas para sellers
      if (targetType === 'seller') {
        const { data: locData } = await supabase.from('store_locations').select('*').eq('seller_id', targetId).order('is_primary', { ascending: false });
        setStoreLocations(locData ?? []);
        // Extraindo cidade e bairro primários para blindagem geográfica
        const primaryLoc = locData?.find(l => l.is_primary) ?? locData?.[0];
        if (primaryLoc) {
          setProfileCity(primaryLoc.city ?? null);
          setProfileNeighborhood(primaryLoc.neighborhood ?? null);
        }
      }

      // Check de isOwner (logado auth == userId do dono)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsOwner(user.id === targetUserId);

        if (targetType === 'seller') {
          // Buscar contagem de seguidores do seller no banco
          const { count: sellerFollowCount } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', targetId);
          setFollowersCount(sellerFollowCount ?? 0);

          // Checar se o usuário logado já segue
          const { data: followRow } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('seller_id', targetId)
            .maybeSingle();
          setIsFollowing(!!followRow);
        } else if (targetType === 'provider') {
          // Buscar contagem de seguidores do provider no banco
          const { count: providerFollowCount } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('provider_id', targetId);
          setFollowersCount(providerFollowCount ?? 0);

          // Checar se o usuário logado já segue o provider
          const { data: followRow } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('provider_id', targetId)
            .maybeSingle();
          setIsFollowing(!!followRow);
        }
      }

    } catch (e: unknown) {
      setError('Erro severo ao carregar perfil público. Recarregue a página.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedUsername]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !profileId || !profileType) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Desseguir
        if (profileType === 'seller') {
          await supabase.from('followers').delete().eq('follower_id', user.id).eq('seller_id', profileId);
        } else {
          await supabase.from('followers').delete().eq('follower_id', user.id).eq('provider_id', profileId);
        }
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // Seguir
        if (profileType === 'seller') {
          await supabase.from('followers').insert({ follower_id: user.id, seller_id: profileId });
        } else {
          await supabase.from('followers').insert({ follower_id: user.id, provider_id: profileId });
        }
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Erro ao seguir/desseguir:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Conheça ${displayName} no jotaM`,
        text: bio || 'Confira os produtos e serviços de elite da nossa rede!',
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
          <p className="text-neutral-500 font-bold">Resgatando Vitrine Pública...</p>
        </div>
      </div>
    );
  }

  if (error || !profileId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <AlertCircle size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Vitrine Oculta/Offline</h2>
        <p className="text-neutral-500 mb-6 text-center">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold">
          Voltar
        </button>
      </div>
    );
  }

  const avatarSeed = normalizedUsername;
  const coverSeed = `${avatarSeed}cover`;
  const totalItems = products.length + services.length;
  const pinnedProduct = products.find(p => p.id === pinnedProductId) ?? products[0];

  return (
    <LocationGuard
      itemCity={profileCity}
      itemNeighborhood={profileNeighborhood}
      itemDisplayName={displayName}
      bypass={isOwner}
    >
      <div className="min-h-screen bg-neutral-50 pb-24">
        {/* Cover */}
        <div className="relative h-48 md:h-64 w-full bg-neutral-200 z-0">
          <img
            src={coverUrl ?? `https://picsum.photos/seed/${coverSeed}/1200/400`}
            alt="Capa do Perfil"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-30">
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
            <div className="relative z-20">
              <div className="h-32 w-32 rounded-full border-4 border-neutral-50 bg-white overflow-hidden shadow-lg relative">
                <img
                  src={avatarUrl ?? `https://picsum.photos/seed/${avatarSeed}profile/200/200`}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {isVerified && (
                <div className="absolute bottom-2 right-2 h-8 w-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm z-20" title="Verificado Profissionalmente">
                  <ShieldCheck size={16} />
                </div>
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
                    {displayName}
                    {profileType === 'provider' && <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-full align-middle">Serviços</span>}
                  </h1>
                  <p className="text-sm font-bold text-neutral-400">@{normalizedUsername}</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Botão Seguir: visível para todos os tipos EXCETO o próprio dono */}
                  {!isOwner && (
                    <button
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl font-bold transition-all flex items-center gap-2 justify-center ${isFollowing
                        ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                        : profileType === 'provider'
                          ? 'bg-purple-600 text-white shadow-lg hover:bg-purple-700'
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
                  )}
                  {whatsapp && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-11 w-11 rounded-2xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    >
                      <MessageCircle size={20} />
                    </a>
                  )}
                </div>
              </div>

              <p className="mt-4 text-neutral-600 max-w-2xl leading-relaxed">
                {bio ? bio : (profileType === 'provider' ? 'Especialista profissional e de alta qualidade do jotaM.' : 'Especialista em produtos locais e de alta qualidade do jotaM.')}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500" fill="currentColor" />
                  <span className="font-bold text-neutral-900">{rating}</span>
                  <span className="text-neutral-500">Avaliação Geral</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900">{followersCount}</span>
                  <span className="text-neutral-500">seguidores</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900">{totalItems}</span>
                  <span className="text-neutral-500">itens expostos</span>
                </div>
                {instagram && (
                  <a
                    href={`https://instagram.com/${instagram.replace('@', '')}`}
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


          {/* Produto em Destaque (Apenas Lojista) */}
          {
            pinnedProduct && activeTab === 'all' && profileType === 'seller' && (
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
            )
          }

          {/* Componentizado o Grid de Itens Renderizados (Mock-free, Database real) */}
          <div className="space-y-10">
            {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-neutral-900 mb-6 border-l-4 border-orange-500 pl-3">Catalogo de Produtos</h2>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map(product => (
                    <ItemCard
                      key={product.id}
                      type="product"
                      item={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image_url || 'https://picsum.photos/seed/' + product.id + '/800/1000',
                        category: product.category_id || 'Produto',
                        seller: displayName,
                        username: normalizedUsername,
                        description: product.description || '',
                        distance: '–',
                      } as ItemType}
                    />
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'services') && services.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-neutral-900 mb-6 border-l-4 border-purple-500 pl-3">Catálogo de Serviços</h2>
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map(service => (
                    <ItemCard
                      key={service.id}
                      type="service"
                      item={{
                        id: service.id,
                        name: service.name,
                        pricePerHour: service.price,
                        image: service.image_url || 'https://picsum.photos/seed/' + service.id + '/800/1000',
                        category: service.category_id || 'Serviço',
                        provider: displayName,
                        username: normalizedUsername,
                        rating: rating,
                        description: service.description || '',
                        distance: '–',
                      } as ItemType}
                    />
                  ))}
                </div>
              </section>
            )}

            {totalItems === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 py-24 text-neutral-400 opacity-80">
                <ShoppingBag size={64} strokeWidth={1} />
                <p className="text-xl font-black text-neutral-900 mt-2">Vitrine Vazia</p>
                <p className="text-sm font-medium">Nenhum item adicionado para exibição ao público ainda.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-neutral-200 flex justify-center gap-8 text-neutral-400">
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span className="text-xs font-bold">{views} acessos totais do público</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span className="text-xs font-bold">
                Certificado desde {createdAt ? new Date(createdAt).getFullYear() : '2024'}
              </span>
            </div>
          </div>
        </main >
      </div >
    </LocationGuard>
  );
};
