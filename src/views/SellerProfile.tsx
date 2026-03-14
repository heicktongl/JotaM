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
  MessageSquare,
  Instagram,
  Users,
  Eye,
  Link as LinkIcon,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Heart,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { extractBairroName } from '../utils/sis-loca';
import { useLocationScope } from '../context/LocationContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ItemCard, ItemType } from '../components/ItemCard';
import { AvatarUploader } from '../components/AvatarUploader';
import { LocationGuard } from '../components/LocationGuard';
import { THEME_REGISTRY } from '../lib/themeRegistry';
import { LanchoneteTheme } from './themes/LanchoneteTheme';
import { BioBurgerTheme } from './themes/BioBurgerTheme';
import { GourmetProTheme } from './themes/GourmetProTheme';
import { DynamicThemeProvider, useDynamicTheme } from '../contexts/DynamicThemeContext';
import { ThemeCustomization } from '../lib/themeEngine';
import { registerView } from '../lib/metrics';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { LoadingScreen } from '../components/LoadingScreen';
import { PremiumLoader } from '../components/PremiumLoader';
import { VitrineSkeleton } from '../components/VitrineSkeleton';


type Product = Database['public']['Tables']['products']['Row'];
type Service = Database['public']['Tables']['services']['Row'];
type StoreLocation = Database['public']['Tables']['store_locations']['Row'];
type Availability = {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_enabled: boolean | null;
};

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
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de localização do perfil (para LocationGuard)
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [profileNeighborhood, setProfileNeighborhood] = useState<string | null>(null);

  const [themeId, setThemeId] = useState<string>('sovix_default');
  const [customizations, setCustomizations] = useState<ThemeCustomization | null>(null);
  const [bairrosAtendidos, setBairrosAtendidos] = useState<string[]>([]);

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
        if (sellerData.theme_id) setThemeId(sellerData.theme_id);
        if (sellerData.theme_customization) setCustomizations(sellerData.theme_customization);
        if (sellerData.bairros_atendidos) setBairrosAtendidos(sellerData.bairros_atendidos);

        // SIS-VIEW-COUNTER: Registro inteligente de visualização
        registerView(sellerData.id, 'shop').then();

        // Buscar horários do vendedor
        const { data: availData } = await supabase
          .from('seller_availability')
          .select('*')
          .eq('seller_id', targetId)
          .order('day_of_week', { ascending: true });
        setAvailability(availData ?? []);
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
          setWhatsapp(providerData.whatsapp || providerData.phone || '');
          setInstagram('');
          setIsVerified(true);
          setViews(0);
          setRating(providerData.rating || 5.0);
          setCreatedAt(providerData.created_at);
          if (providerData.theme_id) setThemeId(providerData.theme_id);
          if (providerData.theme_customization) setCustomizations(providerData.theme_customization);
          // Localização para blindagem de prestadores
          setProfileCity(providerData.city ?? null);
          setProfileNeighborhood(providerData.neighborhood ?? null);

          // SIS-VIEW-COUNTER: Registro inteligente de visualização
          registerView(providerData.id, 'provider').then();
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

        // Buscar horários do prestador
        const { data: availData } = await supabase.from('provider_availability').select('*').eq('provider_id', targetId).order('day_of_week', { ascending: true });
        setAvailability(availData ?? []);
      }

      setProducts(productsData);
      setServices(servicesData);

      // Buscar fotos do portfólio (Lojista ou Prestador)
      const portfolioTable = targetType === 'seller' ? 'seller_portfolio_photos' : 'provider_portfolio_photos';
      const portfolioFK = targetType === 'seller' ? 'seller_id' : 'provider_id';
      const { data: portfolioData } = await supabase
        .from(portfolioTable)
        .select('url')
        .eq(portfolioFK, targetId)
        .order('position', { ascending: true });
      setPortfolioPhotos(portfolioData?.map(p => p.url) ?? []);

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

      // Buscar contagem de seguidores ou check de ownership
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

  const handleBack = () => {
    // Se o histórico for <= 2, significa que entrou direto pelo link (1 é o inicial, 2 pode ser o redirecionamento/load)
    // Na maioria dos browsers modernos, se abrir uma aba nova, length é 1 ou 2.
    if (window.history.length <= 2) {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Conheça ${displayName} na Sovix`,
        text: bio || 'Confira os produtos e serviços de elite da nossa rede!',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (isLoading) {
    return <VitrineSkeleton />;
  }

  if (error || !profileId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <AlertCircle size={48} className="text-neutral-300 mb-4" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Vitrine Oculta/Offline</h2>
        <p className="text-neutral-500 mb-6 text-center">{error}</p>
        <button onClick={handleBack} className="px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold">
          Voltar
        </button>
      </div>
    );
  }

  const profileDataPayload = {
    displayName,
    normalizedUsername,
    bio,
    avatarUrl,
    coverUrl,
    rating,
    followersCount,
    whatsapp,
    products,
    services,
    totalItems: products.length + services.length,
    portfolioPhotos,
    pinnedProductId,
    profileCity,
    profileNeighborhood,
    storeLocations,
    activeTab,
    isOwner,
    onShare: handleShare,
    onFollow: handleFollow,
    isFollowing,
    isFollowLoading,
    createdAt,
    views,
    isVerified,
    availability,
    profileType,
    bairrosAtendidos,
    onBack: handleBack,
  };

  return (
    <DynamicThemeProvider initialThemeId={themeId} initialCustomizations={customizations}>
      <SellerProfileContent data={profileDataPayload as any} />
    </DynamicThemeProvider>
  );
};

const SellerProfileContent: React.FC<{ data: any }> = ({ data }) => {
  const navigate = useNavigate();
  const { activeTheme } = useDynamicTheme();

  if (activeTheme.id === 'lanchonete_01') {
    return (
      <LocationGuard
        itemCity={data.profileCity}
        itemNeighborhood={data.profileNeighborhood}
        itemDisplayName={data.displayName}
        bypass={data.isOwner}
      >
        <LanchoneteTheme
          data={{
            ...data,
            theme: activeTheme,
          }}
        />
      </LocationGuard>
    );
  }

  if (activeTheme.id === 'bioburger_01') {
    return (
      <LocationGuard
        itemCity={data.profileCity}
        itemNeighborhood={data.profileNeighborhood}
        itemDisplayName={data.displayName}
        bypass={data.isOwner}
      >
        <BioBurgerTheme
          data={{
            ...data,
            theme: activeTheme,
          }}
        />
      </LocationGuard>
    );
  }

  if (activeTheme.id === 'gourmet_pro_v1') {
    return (
      <LocationGuard
        itemCity={data.profileCity}
        itemNeighborhood={data.profileNeighborhood}
        itemDisplayName={data.displayName}
        bypass={data.isOwner}
      >
        <GourmetProTheme
          data={{
            ...data,
            theme: activeTheme,
          }}
        />
      </LocationGuard>
    );
  }

  // Fallbacks sovix_default
  const avatarSeed = data.normalizedUsername;
  const coverSeed = `${avatarSeed}cover`;
  const pinnedProduct = data.products.find((p: any) => p.id === data.pinnedProductId) ?? data.products[0];

  const { location } = useLocationScope();
  const normalizeStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const currentNeighborhood = normalizeStr(data.profileNeighborhood || '');
  const userNeighborhood = location?.neighborhood ? normalizeStr(location.neighborhood) : '';
  const coveredBairros = (data.bairrosAtendidos || []).map((b: string) => normalizeStr(b));
  const isOutOfArea = userNeighborhood && currentNeighborhood !== userNeighborhood && !coveredBairros.includes(userNeighborhood);


  return (
    <LocationGuard
      itemCity={data.profileCity}
      itemNeighborhood={data.profileNeighborhood}
      itemDisplayName={data.displayName}
      bypass={data.isOwner}
    >
      <div className="min-h-screen bg-neutral-50 pb-24">
        {/* Cover */}
        <div className="relative h-48 md:h-64 w-full bg-neutral-200 z-0">
          <img
            src={data.coverUrl ?? `https://picsum.photos/seed/${coverSeed}/1200/400`}
            alt="Capa do Perfil"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-30">
            <button
              onClick={data.onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={data.onShare}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          {/* Header do perfil */}
          <div className="relative -mt-16 mb-8 flex flex-col items-center">

            {/* Avatar Centralizado com Borda Gradiente */}
            <div className="relative z-20">
              <div className="p-1 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 shadow-xl">
                <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden relative">
                  <img
                    src={data.avatarUrl ?? `https://picsum.photos/seed/${avatarSeed}profile/200/200`}
                    alt={data.displayName}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              {data.isVerified && (
                <div className="absolute bottom-1 right-1 h-8 w-8 bg-emerald-500 rounded-full border-[3px] border-white flex items-center justify-center text-white shadow-sm z-30" title="Verificado Profissionalmente">
                  <CheckCircle2 size={16} />
                </div>
              )}
            </div>

            {/* Informações de Texto */}
            <div className="mt-4 text-center px-4 w-full">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center justify-center gap-2" style={{ fontFamily: activeTheme.layout.fontFamilyHeading }}>
                {data.displayName}
                {data.profileType === 'provider' && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full align-middle">
                    Serviços
                  </span>
                )}
              </h1>
              <p className="text-sm font-bold text-neutral-400 mt-1">@{data.normalizedUsername}</p>

              <p className="mt-3 text-neutral-600 max-w-md mx-auto leading-relaxed text-sm" style={{ fontFamily: activeTheme.layout.fontFamilyBody }}>
                {data.bio ? data.bio : (data.profileType === 'provider' ? 'Especialista profissional e de alta qualidade da Sovix.' : 'Especialista em produtos locais e de alta qualidade da Sovix.')}
              </p>

              {/* Status de Funcionamento Automatizado TTDD-T */}
              <div className="mt-3 w-full max-w-sm mx-auto">
                <AvailabilityBadge availability={data.availability} />
              </div>

              {/* Endereço com Destaque Inteligente */}
              <div className="mt-4 flex flex-col items-center">
                 <div className="flex items-center gap-1.5 text-neutral-500">
                    <MapPin size={14} className={isOutOfArea ? 'text-red-500 animate-pulse' : 'text-neutral-400'} />
                    <span className={`text-xs font-bold ${isOutOfArea ? 'text-red-600' : 'text-neutral-500'}`}>
                      {extractBairroName(data.profileNeighborhood) || 'Bairro'} • {data.profileCity || 'Cidade'}
                    </span>
                 </div>
                 {isOutOfArea && (
                   <span className="mt-1 text-[9px] font-black bg-red-50 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                     Fora da sua área de atendimento
                   </span>
                 )}
              </div>
            </div>

            {/* Métricas (Avaliação, Itens, Seguidores) */}
            <div className="mt-8 flex items-center justify-center w-full max-w-sm mx-auto divide-x divide-neutral-200/60">
              <div className="flex flex-col items-center justify-center px-4 sm:px-6">
                <div className="flex items-center gap-1.5">
                  <Star size={18} className="text-amber-500" fill="currentColor" />
                  <span className="font-black text-neutral-900 text-lg sm:text-xl">{data.rating}</span>
                </div>
                <span className="text-[9px] font-bold text-neutral-400 tracking-widest uppercase mt-1">
                  Avaliação
                </span>
              </div>

              <div className="flex flex-col items-center justify-center px-4 sm:px-6">
                <span className="font-black text-neutral-900 text-lg sm:text-xl">{data.totalItems}</span>
                <span className="text-[9px] font-bold text-neutral-400 tracking-widest uppercase mt-1">
                  {data.totalItems === 1 ? 'Item' : 'Itens'}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center px-4 sm:px-6">
                <span className="font-black text-neutral-900 text-lg sm:text-xl">{data.followersCount}</span>
                <span className="text-[9px] font-bold text-neutral-400 tracking-widest uppercase mt-1">
                  Seguidores
                </span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto px-4">
              {data.whatsapp ? (
                <a
                  href={`https://wa.me/${data.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 w-full flex items-center justify-center gap-2 bg-[var(--theme-primary)] hover:opacity-90 text-white py-3.5 px-6 rounded-full font-bold shadow-[0_8px_20px_rgba(139,92,246,0.25)] transition-all"
                  style={{ backgroundColor: activeTheme.colors.primary }}
                >
                  <MessageSquare size={18} fill="currentColor" />
                  {activeTheme.layout.ctaLabel || 'Contato'}
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 w-full flex items-center justify-center gap-2 bg-neutral-200 text-neutral-400 py-3.5 px-6 rounded-full font-bold cursor-not-allowed"
                >
                  <MessageSquare size={18} fill="currentColor" />
                  Contato
                </button>
              )}

              <button
                onClick={data.onShare}
                className="flex-1 w-full flex items-center justify-center gap-2 bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-700 py-3.5 px-6 rounded-full font-bold shadow-sm transition-all"
              >
                <Share2 size={18} />
                Compartilhar
              </button>
            </div>

            {/* Botão Seguir Condicional */}
            {!data.isOwner && (
              <div className="mt-4 w-full max-w-md mx-auto px-4">
                <button
                  onClick={data.onFollow}
                  disabled={data.isFollowLoading}
                  className={`w-full py-3 rounded-full font-bold transition-all flex items-center gap-2 justify-center ${data.isFollowing
                    ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200/80'
                    : 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20 hover:bg-neutral-800'
                    }`}
                >
                  {data.isFollowLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Heart size={18} className={data.isFollowing ? 'fill-current text-pink-500' : ''} />
                      {data.isFollowing ? 'Seguindo Perfil' : 'Seguir Perfil'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>


          {/* Produto em Destaque (Apenas Lojista) */}
          {
            pinnedProduct && data.activeTab === 'all' && data.profileType === 'seller' && (
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
                        <button className="px-6 py-3 bg-[var(--theme-primary)] text-white rounded-2xl font-bold hover:brightness-110 transition-colors" style={{ backgroundColor: activeTheme.colors.primary }}>
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          }

          <div className="space-y-10">
            {/* Bloco de Horários: Renderiza apenas se for Prestador E tiver horários cadastrados */}
            {data.profileType === 'provider' && data.portfolioPhotos.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: activeTheme.colors.primary }}></div>
                  <h2 className="text-xl font-bold text-neutral-900">Portfólio de Serviços</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                  {data.portfolioPhotos.map((url: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative shrink-0 w-48 h-48 rounded-3xl overflow-hidden shadow-sm border border-neutral-100 snap-start bg-neutral-100"
                    >
                      <img
                        src={url}
                        alt={`Portfólio ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {idx === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 py-1 text-center" style={{ backgroundColor: `${activeTheme.colors.primary}E6` }}>
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Capa</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(data.activeTab === 'all' || data.activeTab === 'products') && data.products.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: activeTheme.colors.primary }}></div>
                  <h2 className="text-xl font-bold text-neutral-900">Catálogo de Produtos</h2>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data.products.map((product: any) => (
                    <ItemCard
                      key={product.id}
                      type="product"
                      item={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image_url || 'https://picsum.photos/seed/' + product.id + '/800/1000',
                        category: product.category_id || 'Produto',
                        seller: data.displayName,
                        username: data.normalizedUsername,
                        description: product.description || '',
                        distance: '–',
                      } as ItemType}
                    />
                  ))}
                </div>
              </section>
            )}

            {(data.activeTab === 'all' || data.activeTab === 'services') && data.services.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: activeTheme.colors.primary }}></div>
                  <h2 className="text-xl font-bold text-neutral-900">Catálogo de Serviços</h2>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data.services.map((service: any) => (
                    <div key={service.id} className="relative bg-white rounded-[32px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-50 flex flex-col group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">

                      {/* Top badges */}
                      <div className="flex justify-between items-center absolute w-[calc(100%-2rem)] left-4 top-4 z-10">
                        <span className="bg-neutral-100/90 text-[10px] uppercase font-black px-3 py-1.5 rounded-xl tracking-wider backdrop-blur-md" style={{ color: activeTheme.colors.primary }}>
                          SERVIÇO
                        </span>
                        <span className="bg-white text-neutral-600 text-[10px] font-bold px-3 py-1.5 rounded-full border border-neutral-100 flex items-center gap-1 shadow-sm">
                          <MapPin size={10} className="text-orange-500" /> -
                        </span>
                      </div>

                      {/* Image Area */}
                      <div className="relative mt-12 w-full pt-[100%] max-w-[220px] mx-auto bg-neutral-100 rounded-[32px] overflow-hidden mb-2">
                        <img
                          src={service.image_url || `https://picsum.photos/seed/${service.id}/800/800`}
                          alt={service.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-1 mt-6 px-2">
                        <h3 className="font-bold text-neutral-900 text-lg leading-tight group-hover:opacity-80 transition-colors" style={{ color: activeTheme.colors.primary }}>{service.name}</h3>
                        <p className="text-sm text-neutral-500 line-clamp-2 leading-relaxed h-10 mt-1">{service.description}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto px-2 pb-2 pt-4">
                        <span className="font-extrabold text-xl" style={{ color: activeTheme.colors.primary }}>
                          R$ {service.price.toFixed(2)}
                        </span>
                        <button onClick={() => navigate(`/item/service/${service.id}`)} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 w-10 h-10 flex items-center justify-center rounded-full transition-colors">
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.totalItems === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 py-24 text-neutral-400 opacity-80">
                <ShoppingBag size={64} strokeWidth={1} />
                <p className="text-xl font-black text-neutral-900 mt-2">Vitrine Vazia</p>
                <p className="text-sm font-medium">Nenhum item adicionado para exibição ao público ainda.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-neutral-200 flex justify-center gap-8 text-neutral-400">
            {data.isOwner && (
              <div className="flex items-center gap-2">
                <Eye size={16} />
                <span className="text-xs font-bold">{data.views} acessos totais do público</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span className="text-xs font-bold">
                Certificado desde {data.createdAt ? new Date(data.createdAt).getFullYear() : '2024'}
              </span>
            </div>
          </div>
        </main >
      </div >
    </LocationGuard>
  );
};
