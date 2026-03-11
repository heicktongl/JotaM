import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2, MapPin, Star, ShoppingBag, Plus, ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';
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
    isVerified: boolean;
}

export const GourmetProTheme: React.FC<{ data: ProfileData }> = ({ data }) => {
    const navigate = useNavigate();
    const { theme } = data;

    // Fallbacks inteligentes que respeitam a identidade do vendedor
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    // Gradiente dinâmico baseado no nome para gerar cores únicas mas harmoniosas
    const getGradientSeed = (name: string) => {
        const colors = [
            'from-purple-600 to-indigo-600',
            'from-orange-500 to-rose-500',
            'from-pink-500 to-purple-500',
            'from-emerald-500 to-teal-500',
            'from-blue-600 to-cyan-500'
        ];
        const index = name.length % colors.length;
        return colors[index];
    };

    const initials = getInitials(data.displayName);
    const fallbackGradient = getGradientSeed(data.displayName);

    const pinnedProduct = data.products?.find(p => p.id === data.pinnedProductId) ?? data.products?.[0];
    const regularProducts = (data.products || []).filter(p => !pinnedProduct || p.id !== pinnedProduct.id);
    const services = data.services || [];

    const primaryLoc = data.storeLocations?.find(l => l.is_primary) ?? data.storeLocations?.[0];

    return (
        <div className="min-h-screen bg-[#FFF5F7] dark:bg-[#1A1016] text-[#1F2937] dark:text-[#F3F4F6] font-sans antialiased pb-20 selection:bg-[#7C3AED] selection:text-white overflow-x-hidden">
            {/* Elegant Header / Cover */}
            <div className={`relative w-full h-80 overflow-hidden rounded-b-[2.5rem] shadow-2xl ${!data.coverUrl ? `bg-gradient-to-br ${fallbackGradient}` : ''}`}>
                {data.coverUrl && (
                    <img 
                        alt="Capa Gourmet" 
                        className="absolute inset-0 w-full h-full object-cover" 
                        src={data.coverUrl}
                        referrerPolicy="no-referrer"
                    />
                )}
                {/* Gradient Overlay: subtle bottom-up for legibility only */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                
                {/* Top Actions */}
                <div className="absolute top-6 left-6 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md p-2 rounded-full transition-all border border-white/30">
                        <ArrowLeft size={20} />
                    </button>
                </div>

                {/* Profile Info in Hero */}
                <div className="absolute bottom-0 left-0 w-full p-6 flex items-end justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-full border-4 border-white dark:border-[#2D1F2A] overflow-hidden shadow-xl bg-white dark:bg-[#2D1F2A] relative flex items-center justify-center">
                                {data.avatarUrl ? (
                                    <img 
                                        alt={data.displayName} 
                                        className="w-full h-full object-cover" 
                                        src={data.avatarUrl}
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
                                        <span className="text-white font-display text-2xl font-bold">{initials}</span>
                                    </div>
                                )}
                                {data.isVerified && (
                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-[#2D1F2A] rounded-full flex items-center justify-center text-white">
                                        <CheckCircle2 size={12} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mb-1 text-white">
                            <h1 className="font-display text-3xl font-bold drop-shadow-lg leading-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                                {data.displayName}
                            </h1>
                            <p className="text-white/90 text-sm font-medium tracking-wide">
                                {data.bio ? data.bio : 'Produtos Gourmet & Artesanais Exclusive'}
                            </p>
                        </div>
                    </div>
                    <button onClick={data.onShare} className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md p-3 rounded-full transition-all border border-white/30">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Quick Info Cards */}
            <div className="px-6 mt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-3 bg-white dark:bg-[#2D1F2A] p-4 rounded-2xl shadow-sm border border-pink-100 dark:border-white/5 flex-1">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-1">Horários</p>
                            <AvailabilityBadge availability={data.availability} showIcon={true} className="border-none p-0 bg-transparent shadow-none" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-[#2D1F2A] p-4 rounded-2xl shadow-sm border border-pink-100 dark:border-white/5 flex-1">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-0.5">Localização</p>
                            <p className="text-gray-900 dark:text-gray-100 font-semibold text-sm">
                                {primaryLoc?.neighborhood || data.profileNeighborhood || 'Local'}, {primaryLoc?.city || data.profileCity || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gallery Section */}
            {theme.layout.showPortfolio && data.portfolioPhotos.length > 0 && (
                <div className="mt-8 pl-6">
                    <div className="flex justify-between items-center pr-6 mb-4">
                        <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: '"Playfair Display", serif' }}>
                            Experiência Gourmet
                        </h2>
                        <span className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">Galeria</span>
                    </div>
                    <div className="flex overflow-x-auto gap-4 pb-4 pr-6 no-scrollbar snap-x snap-mandatory">
                        {data.portfolioPhotos.map((url, i) => (
                            <div key={i} className="snap-center shrink-0 w-36 h-48 rounded-2xl overflow-hidden relative group shadow-lg border border-white/20">
                                <img 
                                    alt={`Foto ${i + 1}`} 
                                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110" 
                                    src={url}
                                    referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Product */}
            {pinnedProduct && (
                <div className="mt-8 px-6">
                    <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                        Destaque Premium <Star className="text-orange-500 fill-current" size={20} />
                    </h2>
                    <div 
                        className="relative bg-white dark:bg-[#2D1F2A] rounded-[2rem] p-4 shadow-xl border border-pink-50 dark:border-white/5 mb-6 overflow-hidden transition-transform hover:scale-[1.01] cursor-pointer"
                        onClick={() => navigate(`/item/product/${pinnedProduct.id}`)}
                    >
                        <div className="absolute top-6 left-6 z-10 bg-[#7C3AED] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Destaque</div>
                        <div className={`w-full h-64 rounded-2xl overflow-hidden mb-4 relative shadow-inner ${!pinnedProduct.image_url ? 'bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center' : ''}`}>
                            {pinnedProduct.image_url ? (
                                <img 
                                    alt={pinnedProduct.name} 
                                    className="w-full h-full object-cover" 
                                    src={pinnedProduct.image_url}
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-neutral-300 dark:text-neutral-600">
                                    <ShoppingBag size={48} strokeWidth={1} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Sem foto cadastrada</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-start mb-2 px-2">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{pinnedProduct.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{pinnedProduct.description}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-2xl font-display font-bold text-[#7C3AED]" style={{ fontFamily: '"Playfair Display", serif' }}>
                                    R$ {pinnedProduct.price.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        </div>
                        <button className="w-full mt-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-gray-100 transition-all shadow-md">
                            <span>Ver Detalhes</span>
                            <ShoppingBag size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Full Menu Grid */}
            <div className="mt-8 px-6 pb-12">
                <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6" style={{ fontFamily: '"Playfair Display", serif' }}>
                    Menu Completo
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {regularProducts.map((prod) => (
                        <div 
                            key={prod.id} 
                            onClick={() => navigate(`/item/product/${prod.id}`)}
                            className="bg-white dark:bg-[#2D1F2A] rounded-2xl p-3 shadow-md border border-pink-50 dark:border-white/5 group transform transition-all hover:-translate-y-1"
                        >
                            <div className={`relative aspect-square rounded-[1.25rem] overflow-hidden mb-3 shadow-sm ${!prod.image_url ? 'bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center' : ''}`}>
                                {prod.image_url ? (
                                    <img 
                                        alt={prod.name} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                        src={prod.image_url}
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <ShoppingBag size={32} strokeWidth={1} className="text-neutral-200 dark:text-neutral-700" />
                                )}
                                <button className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-[#7C3AED]">
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div className="px-1">
                                <h4 className="font-bold text-gray-900 dark:text-white leading-tight mb-1 h-5 overflow-hidden text-sm">{prod.name}</h4>
                                <p className="text-gray-400 text-[10px] mb-2 line-clamp-1">{prod.description || 'Sabor inigualável'}</p>
                                <p className="text-[#7C3AED] font-black text-sm">R$ {prod.price.toFixed(2).replace('.', ',')}</p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Services Items if any */}
                    {services.map((service) => (
                         <div 
                            key={service.id} 
                            onClick={() => navigate(`/item/service/${service.id}`)}
                            className="bg-white dark:bg-[#2D1F2A] rounded-2xl p-3 shadow-md border border-pink-50 dark:border-white/5 group transform transition-all hover:-translate-y-1"
                        >
                            <div className={`relative aspect-square rounded-[1.25rem] overflow-hidden mb-3 shadow-sm border border-purple-100 dark:border-purple-900/30 ${!service.image_url ? 'bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center' : ''}`}>
                                {service.image_url ? (
                                    <img 
                                        alt={service.name} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                        src={service.image_url}
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <ShoppingBag size={32} strokeWidth={1} className="text-neutral-200 dark:text-neutral-700" />
                                )}
                                <div className="absolute top-2 left-2 bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Serviço</div>
                            </div>
                            <div className="px-1">
                                <h4 className="font-bold text-gray-900 dark:text-white leading-tight mb-1 h-5 overflow-hidden text-sm">{service.name}</h4>
                                <p className="text-[#7C3AED] font-black text-sm">R$ {service.price.toFixed(2).replace('.', ',')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* WhatsApp Float */}
            {data.whatsapp && (
                <div className="fixed bottom-6 right-6 z-50">
                    <a 
                        href={`https://wa.me/${data.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-2xl shadow-green-500/40 transform transition-all hover:scale-110 active:scale-95"
                    >
                        <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
                    </a>
                </div>
            )}
            
            {/* Bottom Safe Area Padding */}
            <div className="h-10"></div>
        </div>
    );
};
