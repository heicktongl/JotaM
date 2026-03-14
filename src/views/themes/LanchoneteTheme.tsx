import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, Clock, MapPin, Star, ChevronRight, ChevronLeft, Check, Heart, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { VitrineTheme } from '../../lib/themeRegistry';
import { AvailabilityBadge } from '../../components/AvailabilityBadge';

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
}

export const LanchoneteTheme: React.FC<{ data: ProfileData }> = ({ data }) => {
    const navigate = useNavigate();
    const { theme } = data;

    const pinnedProduct = data.products.find(p => p.id === data.pinnedProductId) ?? data.products[0];
    const regularProducts = data.products.filter(p => !pinnedProduct || p.id !== pinnedProduct.id);

    // Fallbacks
    const avatarSeed = data.normalizedUsername;
    const coverSrc = data.coverUrl ?? `https://picsum.photos/seed/${avatarSeed}cover/1200/600`;
    const avatarSrc = data.avatarUrl ?? `https://picsum.photos/seed/${avatarSeed}profile/200/200`;

    const primaryLoc = data.storeLocations?.[0];

    return (
        <div className="min-h-screen bg-[#f9f9fa] font-sans pb-24" style={{ '--theme-primary': theme.colors.primary } as any}>
            {/* Cover Image */}
            <div className="relative w-full h-64 md:h-80 bg-neutral-900 overflow-hidden shadow-sm rounded-b-[40px] z-0">
                <img
                    src={coverSrc}
                    alt="Capa"
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                />
                {/* Share Button top right */}
                <button
                    onClick={data.onShare}
                    className="absolute top-6 right-6 lg:right-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
                >
                    <Share2 size={18} />
                </button>
                {/* Back Button top left */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 lg:left-8 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
                >
                    <ChevronLeft size={22} />
                </button>
            </div>

            <main className="max-w-2xl mx-auto px-4 relative z-10 -mt-16">

                {/* Avatar */}
                <div className="flex justify-center">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-orange-400 to-amber-200 shadow-xl">
                        <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-white">
                            <img
                                src={avatarSrc}
                                alt={data.displayName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                </div>

                {/* Title & Info */}
                <div className="text-center mt-4">
                    <h1 className="text-3xl font-black text-neutral-900" style={{ fontFamily: theme.layout.fontFamilyHeading }}>
                        {data.displayName}
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-1 mb-3">
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                            LANCHONETE
                        </span>
                        <span className="text-sm font-bold text-neutral-400">@{data.normalizedUsername}</span>
                    </div>
                    <p className="text-sm text-neutral-500 max-w-sm mx-auto font-medium">
                        {data.bio || 'O melhor sabor artesanal da cidade! Entregamos felicidade em forma de comida 🍔🍟🥤'}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center divide-x divide-neutral-200 mt-6 max-w-sm mx-auto">
                    <div className="px-6 flex flex-col items-center">
                        <div className="flex items-center gap-1 text-amber-500">
                            <Star size={16} fill="currentColor" />
                            <span className="font-black text-xl text-neutral-900">{data.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold mt-1">Avaliação</span>
                    </div>
                    <div className="px-6 flex flex-col items-center">
                        <span className="font-black text-xl text-neutral-900">{data.totalItems}</span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold mt-1">Opções</span>
                    </div>
                    <div className="px-6 flex flex-col items-center">
                        <span className="font-black text-xl text-neutral-900">{(data.followersCount > 999 ? (data.followersCount / 1000).toFixed(1) + 'k' : data.followersCount) || 'New'}</span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold mt-1">Seguidores</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                    {data.whatsapp ? (
                        <a
                            href={`https://wa.me/${data.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-[var(--theme-primary)] text-white py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110"
                        >
                            {theme.layout.ctaIcon === 'utensils' ? (
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-4H8V9c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v3h-3v4z" /></svg>
                            ) : null}
                            {theme.layout.ctaLabel}
                        </a>
                    ) : (
                        <button disabled className="flex-1 bg-neutral-200 text-neutral-400 py-3.5 rounded-full font-bold cursor-not-allowed">
                            {theme.layout.ctaLabel}
                        </button>
                    )}

                    <button
                        onClick={data.onShare}
                        className="flex-1 bg-white border-2 border-neutral-100 hover:border-neutral-200 text-neutral-800 py-3 rounded-full font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                    >
                        <Share2 size={18} />
                        Compartilhar
                    </button>
                </div>

                {/* Botão Seguir */}
                {!data.isOwner && (
                    <div className="mt-3">
                        <button
                            onClick={data.onFollow}
                            disabled={data.isFollowLoading}
                            className={`w-full py-3 rounded-full font-bold transition-all flex items-center gap-2 justify-center ${data.isFollowing
                                ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border border-neutral-200'
                                : 'bg-neutral-900 text-white shadow-lg shadow-neutral-900/20 hover:bg-neutral-800'
                                }`}
                        >
                            {data.isFollowLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Heart size={18} className={data.isFollowing ? 'fill-current text-pink-500' : ''} />
                                    {data.isFollowing ? 'Seguindo' : 'Seguir'}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Info Cards (Status & Location) */}
                <div className="mt-8 space-y-3">
                    {/* Status Automatizado pelo TTDD-T */}
                    <AvailabilityBadge availability={data.availability} />

                    {/* Location */}
                    <div className="bg-white border border-neutral-100 rounded-3xl p-4 flex items-center gap-4 shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-neutral-900 text-sm">
                                {primaryLoc?.street ? `${primaryLoc.street}, ${primaryLoc.number || 'S/N'}` : 'Endereço Local'}
                            </h4>
                            <p className="text-xs font-semibold text-neutral-500">
                                {primaryLoc?.neighborhood || data.profileNeighborhood || 'Bairro'} • {primaryLoc?.city || data.profileCity || 'Cidade'}
                            </p>
                        </div>
                        <button className="text-[10px] font-black text-red-600 tracking-wider uppercase pl-2">
                            Ver no mapa
                        </button>
                    </div>
                </div>

                {/* Vibe do Local */}
                {theme.layout.showPortfolio && data.portfolioPhotos.length > 0 && (
                    <section className="mt-10">
                        <h3 className="font-black text-neutral-900 text-lg mb-4" style={{ fontFamily: theme.layout.fontFamilyHeading }}>
                            Vibe do Local
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {data.portfolioPhotos.map((url, i) => (
                                <div key={i} className="shrink-0 w-40 h-32 rounded-3xl overflow-hidden snap-start shadow-sm border border-neutral-100">
                                    <img src={url} alt={`Local ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Cardápio Digital */}
                <section className="mt-8">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
                        <h3 className="font-black text-neutral-900 text-xl" style={{ fontFamily: theme.layout.fontFamilyHeading }}>
                            Cardápio Digital
                        </h3>
                    </div>

                    {/* Produto Destaque */}
                    {pinnedProduct && (
                        <div className="bg-neutral-900 rounded-[32px] overflow-hidden shadow-xl mb-6 text-white relative">
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase z-10 border border-white/10">
                                Destaque
                            </div>
                            <div className="absolute top-4 right-4 bg-white text-red-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1 z-10 shadow-sm">
                                <Star size={10} fill="currentColor" /> Popular
                            </div>

                            <div className="w-full h-64 bg-neutral-800 relative">
                                <img
                                    src={pinnedProduct.image_url || `https://picsum.photos/seed/${pinnedProduct.id}/800/800`}
                                    alt={pinnedProduct.name}
                                    className="w-full h-full object-cover opacity-90"
                                />
                                {/* Floating add button */}
                                <button className="absolute -bottom-5 right-6 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform z-20 border-4 border-neutral-900">
                                    <div className="w-4 h-4 bg-white rounded-sm" />
                                </button>
                            </div>

                            <div className="p-6 pt-8 bg-white text-neutral-900 relative">
                                <h4 className="text-xl font-black mb-2" style={{ fontFamily: theme.layout.fontFamilyHeading }}>
                                    {pinnedProduct.name}
                                </h4>
                                <p className="text-sm text-neutral-500 leading-relaxed font-medium mb-4 line-clamp-3">
                                    {pinnedProduct.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="block text-xs text-neutral-400 line-through font-bold">R$ {(pinnedProduct.price * 1.15).toFixed(2).replace('.', ',')}</span>
                                        <span className="text-2xl font-black" style={{ color: 'var(--theme-primary)' }}>R$ {pinnedProduct.price.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/item/product/${pinnedProduct.id}`)}
                                        className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-900 transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grid de Produtos Secundários */}
                    <div className="grid grid-cols-2 gap-4">
                        {regularProducts.map((prod, idx) => {
                            // Pseudo-aleatoriedade para tags pelas imagens do layout
                            const isRed = idx % 2 === 0;
                            const badgeColor = isRed ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-700';
                            const badgeLabel = isRed ? 'NOVIDADE' : 'VEGANO';

                            return (
                                <div
                                    key={prod.id}
                                    onClick={() => navigate(`/item/product/${prod.id}`)}
                                    className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="w-full aspect-square relative bg-neutral-50">
                                        <img
                                            src={prod.image_url || `https://picsum.photos/seed/${prod.id}/400/400`}
                                            alt={prod.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest uppercase ${badgeColor}`}>
                                            {badgeLabel}
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <h4 className="font-bold text-neutral-900 leading-tight mb-1">{prod.name}</h4>
                                        <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed mb-3 flex-1">{prod.description}</p>
                                        <span className="font-black" style={{ color: 'var(--theme-primary)' }}>R$ {prod.price.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Card Ver Mais (Placeholder para paginação/mais itens) */}
                        <div className="bg-white rounded-3xl border border-dashed border-neutral-300 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-neutral-50 transition-colors h-full min-h-[220px]">
                            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 mb-3">
                                <span className="text-2xl leading-none">+</span>
                            </div>
                            <h4 className="font-bold text-neutral-900 text-center text-sm">Ver menu completo</h4>
                            <p className="text-[10px] text-neutral-500 mt-1 font-medium">Mais {data.totalItems} opções deliciosas</p>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};
