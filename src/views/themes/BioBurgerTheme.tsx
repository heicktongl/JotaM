import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, MapPin, Star, Heart, Loader2, ShoppingBag, Clock, Leaf, Plus, MoreHorizontal, ArrowLeft, TriangleAlert } from 'lucide-react';
import { useLocationScope } from '../../context/LocationContext';
import { VitrineTheme } from '../../lib/themeRegistry';
import { AvailabilityBadge } from '../../components/AvailabilityBadge';
import { extractBairroName } from '../../utils/sis-loca';

interface ProfileData {
    displayName: string;
    normalizedUsername: string;
    bio: string;
    avatarUrl: string | null;
    coverUrl: string | null;
    rating: number;
    totalItems: number;
    followersCount: number;
    whatsapp: string;
    products: any[];
    services: any[];
    portfolioPhotos: string[];
    pinnedProductId: string | null;
    profileCity: string | null;
    profileNeighborhood: string | null;
    storeLocations: any[];
    availability: any[];
    activeTab: 'all' | 'products' | 'services';
    isOwner: boolean;
    onShare: () => void;
    onFollow: () => void;
    isFollowing: boolean;
    isFollowLoading?: boolean;
    theme: VitrineTheme;
    bairrosAtendidos?: string[];
    onBack: () => void;
}

export const BioBurgerTheme: React.FC<{ data: ProfileData }> = ({ data }) => {
    const navigate = useNavigate();
    const { theme } = data;

    if (!theme || !theme.colors || !theme.layout) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-400 font-medium">
                <Loader2 className="animate-spin mr-2" /> Carregando arquitetura do tema...
            </div>
        );
    }

    const pinnedProduct = data.products?.find(p => p.id === data.pinnedProductId) ?? data.products?.[0];
    const regularProducts = (data.products || []).filter(p => !pinnedProduct || p.id !== pinnedProduct.id);

    const avatarSeed = data.normalizedUsername;
    const coverSrc = data.coverUrl ?? `https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&h=800&fit=crop`;
    const avatarSrc = data.avatarUrl ?? `https://picsum.photos/seed/${avatarSeed}profile/200/200`;

    const primaryLoc = data.storeLocations?.[0];
    const { location } = useLocationScope();

    const normalizeStr = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const currentNeighborhood = normalizeStr(primaryLoc?.neighborhood || data.profileNeighborhood || '');
    const userNeighborhood = location?.neighborhood ? normalizeStr(location.neighborhood) : '';
    const coveredBairros = (data.bairrosAtendidos || []).map(b => normalizeStr(b));

    const isOutOfArea = userNeighborhood && 
                        currentNeighborhood !== userNeighborhood && 
                        !coveredBairros.includes(userNeighborhood);

    return (
        <div className="min-h-screen bg-[#f4f3ed] font-sans pb-32" style={{ '--theme-primary': theme.colors.primary } as any}>
            {/* Top Image Section (Hamburger) */}
            <div className="relative w-full h-[320px] md:h-[400px] z-0">
                <img
                    src={coverSrc}
                    alt="Capa"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Top Action Buttons */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                    <button onClick={data.onBack} className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-neutral-900 border border-white/40">
                        <ArrowLeft size={20} />
                    </button>
                </div>
                <div className="absolute top-6 right-6 flex items-center gap-3">
                    <button onClick={data.onShare} className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-neutral-900 border border-white/40">
                        <Share2 size={18} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center text-neutral-900 border border-white/40">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            <main className="max-w-xl mx-auto px-4 relative z-10 -mt-[4.5rem]">
                
                {/* Main White Card (Bio + Stats + CTA) */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-black/5 pt-0 pb-8 px-6 flex flex-col items-center border border-white relative">
                    
                    {/* Floating Avatar Logo */}
                    <div className="w-28 h-28 -mt-14 mb-4 bg-neutral-900 rounded-[2rem] border-[6px] border-white shadow-xl overflow-hidden rotate-45 flex items-center justify-center shrink-0 mx-auto">
                        <div className="-rotate-45 w-full h-full p-2 flex items-center justify-center bg-neutral-900">
                             {/* Mock BioBurger logo logic or real avatar */}
                             {data.avatarUrl ? (
                                <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                             ) : (
                                <Leaf className="text-emerald-500" size={36} strokeWidth={1.5} />
                             )}
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight" style={{ fontFamily: theme.layout.fontFamilyHeading }}>
                        {data.displayName}
                    </h1>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-5">
                        <span className="bg-green-50 text-green-700 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-1 border border-green-100">
                            <Leaf size={12} fill="currentColor" /> 100% Orgânico
                        </span>
                        <span className="bg-neutral-50 border border-neutral-100 text-neutral-500 text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full">
                            @{data.normalizedUsername}
                        </span>
                    </div>

                    {/* Bio text */}
                    <p className="text-sm text-neutral-500 text-center font-medium max-w-sm mb-6 leading-relaxed">
                        {data.bio || 'Hambúrgueres artesanais feitos com ingredientes frescos, locais e sustentáveis.'} 
                        { !data.bio && <><br/><Leaf className="inline-block mt-1 text-emerald-500" size={16} /></> }
                    </p>

                    {/* Stats Grid */}
                    <div className="w-full grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-white border border-neutral-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                            <div className="flex items-center gap-1 text-amber-500 mb-1">
                                <Star size={14} fill="currentColor" />
                                <span className="font-black text-neutral-900 text-lg">{data.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Avaliação</span>
                        </div>
                        <div className="bg-white border border-neutral-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                            <span className="font-black text-neutral-900 text-lg mb-1" style={{ color: 'var(--theme-primary)' }}>{data.totalItems}</span>
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Opções</span>
                        </div>
                        <div className="bg-white border border-neutral-100 rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm">
                            <span className="font-black text-neutral-900 text-lg mb-1">{(data.followersCount > 999 ? (data.followersCount / 1000).toFixed(1) + 'k' : data.followersCount)}</span>
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Seguidores</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="w-full mb-2">
                        {data.whatsapp ? (
                            <a
                                href={`https://wa.me/${data.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full bg-[var(--theme-primary)] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-lg"
                                style={{ backgroundColor: theme.colors.primary }}
                            >
                                <ShoppingBag size={18} />
                                {theme.layout.ctaLabel}
                            </a>
                        ) : (
                            <button disabled className="w-full bg-neutral-200 text-neutral-400 py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                                <ShoppingBag size={18} />
                                {theme.layout.ctaLabel}
                            </button>
                        )}
                    </div>
                </div>

                {/* Info Block (Horario e Local) */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-neutral-100/50 mt-6 flex flex-col gap-5">
                    {/* Status Automatizado pelo TTDD-T */}
                    <AvailabilityBadge availability={data.availability} showIcon={true} className="border-none p-0 bg-transparent shadow-none" />
                    
                    <div className="h-px w-full bg-neutral-100" />

                    {/* Location */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#f4f3ed] flex items-center justify-center text-[var(--theme-primary)] shrink-0 border border-neutral-100">
                            <MapPin size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-neutral-900 text-sm">
                                {extractBairroName(primaryLoc?.neighborhood || data.profileNeighborhood) || 'Local'}
                            </h4>
                            <p className={`text-xs font-medium ${isOutOfArea ? 'text-orange-600 font-bold' : 'text-neutral-500'}`}>
                                {primaryLoc?.city || data.profileCity || 'Cidade'}
                            </p>
                            {isOutOfArea && (
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                                    <TriangleAlert size={10} /> Fora da área de entrega
                                </p>
                            )}
                        </div>
                        <button className={`text-[10px] font-bold px-3 py-1.5 rounded-full shrink-0 ${isOutOfArea ? 'bg-orange-600 text-white' : 'text-neutral-500 bg-neutral-50 border border-neutral-200'}`}>
                            {isOutOfArea ? 'Alerta' : 'Mapa'}
                        </button>
                    </div>
                </div>

                {/* Nosso Espaço */}
                {theme.layout.showPortfolio && data.portfolioPhotos.length > 0 && (
                    <section className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                <Leaf size={12} fill="currentColor" />
                            </div>
                            <h3 className="font-black text-neutral-900 text-xl" style={{ fontFamily: theme.layout.fontFamilyHeading }}>
                                Nosso Espaço
                            </h3>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {data.portfolioPhotos.map((url, i) => (
                                <div key={i} className="shrink-0 w-64 h-48 rounded-[2rem] overflow-hidden snap-start shadow-sm border border-neutral-100 bg-white p-2">
                                    <img src={url} alt={`Local ${i + 1}`} className="w-full h-full object-cover rounded-[1.5rem]" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Cardápio Natural */}
                 <section className="mt-8">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 focus-ring" style={{ backgroundColor: 'var(--theme-primary)' }}>
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H8V9c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v3h-3v4z"/></svg>
                        </div>
                        <h3 className="font-black text-neutral-900 text-2xl" style={{ fontFamily: theme.layout.fontFamilyHeading }}>
                            Cardápio Natural
                        </h3>
                    </div>

                    {/* Destaque */}
                    {pinnedProduct && (
                        <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm mb-6 border border-neutral-100 cursor-pointer" onClick={() => navigate(`/item/product/${pinnedProduct.id}`)}>
                            <div className="w-full h-64 bg-neutral-100 relative pt-4 px-4 pb-0 flex items-end justify-center overflow-hidden">
                                 <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest flex items-center gap-1 z-10 shadow-sm text-[var(--theme-primary)]">
                                     <Leaf size={12} fill="currentColor" /> Local
                                 </div>
                                 <img
                                    src={pinnedProduct.image_url || `https://picsum.photos/seed/${pinnedProduct.id}/800/800`}
                                    alt={pinnedProduct.name}
                                    className="w-[80%] h-auto object-cover transform translate-y-4 hover:scale-105 transition-transform duration-500 rounded-xl"
                                />
                                <div className="absolute top-auto bottom-8 right-6 w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg" style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    <Plus size={24} />
                                </div>
                            </div>
                            <div className="p-6 bg-white shrink-0">
                                <h4 className="text-xl font-black mb-2 text-neutral-900">
                                    {pinnedProduct.name}
                                </h4>
                                <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed font-medium mb-4">
                                    {pinnedProduct.description}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xl font-black" style={{ color: 'var(--theme-primary)' }}>R$ {pinnedProduct.price.toFixed(2).replace('.', ',')}</span>
                                    <span className="text-xs text-neutral-400 line-through font-bold">R$ {(pinnedProduct.price * 1.15).toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grid Regular */}
                     <div className="grid grid-cols-2 gap-4">
                        {regularProducts.map((prod, idx) => {
                             const isDrink = idx % 2 === 0;
                             const tagLabel = isDrink ? 'Fresco' : '100% Plant';
                             return (
                                <div key={prod.id} onClick={() => navigate(`/item/product/${prod.id}`)} className="bg-white rounded-[2rem] p-3 flex flex-col border border-neutral-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                                    <div className="w-full aspect-square bg-[#f4f3ed] rounded-[1.5rem] relative overflow-hidden mb-4 p-2 flex items-center justify-center">
                                         <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-neutral-600 tracking-wider">
                                            {tagLabel}
                                        </div>
                                         <img
                                            src={prod.image_url || `https://picsum.photos/seed/${prod.id}/400/400`}
                                            alt={prod.name}
                                            className="w-[85%] h-[85%] object-cover rounded-xl shadow-sm mix-blend-multiply"
                                        />
                                    </div>
                                    <h4 className="font-bold text-neutral-900 text-sm leading-tight mb-2 line-clamp-1">{prod.name}</h4>
                                    <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed font-medium flex-1 mb-3">{prod.description}</p>
                                    <div className="flex items-center justify-between">
                                         <span className="font-black text-sm" style={{ color: 'var(--theme-primary)' }}>R$ {prod.price.toFixed(2).replace('.', ',')}</span>
                                         <button className="w-8 h-8 rounded-full bg-[#f4f3ed] text-[var(--theme-primary)] flex items-center justify-center hover:bg-neutral-200">
                                             <Plus size={16} />
                                         </button>
                                    </div>
                                </div>
                             )
                        })}

                         <div className="bg-[#e9e8e2] rounded-[2rem] border border-dashed border-[#d4d3cc] flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-[#e2e1db] transition-colors min-h-[220px]">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[var(--theme-primary)] mb-4">
                                <ShoppingBag fill="currentColor" size={20} className="opacity-90" />
                            </div>
                            <h4 className="font-bold text-neutral-900 text-center text-sm">Ver Menu Completo</h4>
                            <p className="text-[10px] text-neutral-500 mt-2 font-medium text-center">Descubra mais opções saudáveis.</p>
                        </div>
                     </div>
                 </section>

                 <div className="mt-16 text-center pb-8 border-t border-neutral-200/50 pt-8 opacity-60">
                    <p className="text-xs font-bold text-neutral-400">Desenvolvido com Sovix TTDDT</p>
                 </div>
            </main>
        </div>
    );
};
