import React, { useState } from 'react';
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
  ShoppingBag, 
  Eye,
  Link as LinkIcon
} from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_SERVICES } from '../data';
import { ItemCard } from '../components/ItemCard';

export const SellerProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'services'>('all');
  const [isFollowing, setIsFollowing] = useState(false);

  // @DB_TODO: Fetch seller profile details (name, rating, distance, cover image, bio, social links, theme color) from 'sellers' table based on ID/username
  const decodedUsername = username ? decodeURIComponent(username) : '';
  const sellerUsername = decodedUsername.startsWith('@') ? decodedUsername.slice(1) : decodedUsername;

  // @DB_TODO: Fetch all products and services associated with this seller from 'products' and 'services' tables
  const sellerProducts = MOCK_PRODUCTS.filter(p => p.username === sellerUsername);
  const sellerServices = MOCK_SERVICES.filter(s => s.username === sellerUsername);
  
  const sellerName = sellerProducts[0]?.seller || sellerServices[0]?.provider || sellerUsername;
  
  const totalItems = sellerProducts.length + sellerServices.length;

  // Calculate average rating if they have services
  const avgRating = sellerServices.length > 0 
    ? (sellerServices.reduce((acc, s) => acc + s.rating, 0) / sellerServices.length).toFixed(1)
    : '4.9';

  // Get distance from the first item as an approximation
  const distance = sellerProducts[0]?.distance || sellerServices[0]?.distance || 'Perto de você';

  // Mock Seller Extended Profile Data
  // @DB_TODO: This data should come from the backend
  const sellerProfile = {
    bio: "Especialista em produtos orgânicos e serviços de jardinagem. Cultivando com amor e dedicação para entregar o melhor da natureza diretamente na sua casa.",
    followers: 1240 + (isFollowing ? 1 : 0),
    sales: 850,
    views: 5400,
    whatsapp: "5511999999999",
    instagram: sellerUsername,
    isVerified: true,
    pinnedProductId: sellerProducts[0]?.id,
    themeColor: "orange" // Could be used to dynamically set CSS variables
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Conheça ${sellerName} no jotaM`,
        text: sellerProfile.bio,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Vendedor não encontrado</h2>
        <p className="text-neutral-500 mb-6">Este perfil pode ter sido desativado ou não existe.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-neutral-900 text-white rounded-2xl font-bold">
          Voltar
        </button>
      </div>
    );
  }

  const pinnedProduct = sellerProducts.find(p => p.id === sellerProfile.pinnedProductId);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* SEO Meta Tags (Simulated) */}
      {/* @DB_TODO: Implement real SEO meta tags using react-helmet-async */}
      <div className="hidden">
        <title>{sellerName} | jotaM</title>
        <meta name="description" content={sellerProfile.bio} />
        <meta property="og:title" content={`${sellerName} | jotaM`} />
        <meta property="og:description" content={sellerProfile.bio} />
        <meta property="og:image" content={`https://picsum.photos/seed/${sellerUsername}/1200/630`} />
      </div>

      {/* Cover Image (Banner) */}
      <div className="relative h-48 md:h-64 w-full bg-neutral-200">
        <img 
          src={`https://picsum.photos/seed/${sellerUsername}cover/1200/400`} 
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
        {/* Profile Header Info */}
        <div className="relative -mt-16 mb-8 flex flex-col md:flex-row md:items-end gap-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-full border-4 border-neutral-50 bg-white overflow-hidden shadow-lg z-10 relative">
              <img 
                src={`https://picsum.photos/seed/${sellerUsername}profile/200/200`} 
                alt={sellerName}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {sellerProfile.isVerified && (
              <div className="absolute bottom-2 right-2 h-8 w-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm z-20" title="Vendedor Verificado">
                <ShieldCheck size={16} />
              </div>
            )}
          </div>
          
          <div className="flex-1 pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
                  {sellerName}
                </h1>
                <p className="text-sm font-bold text-neutral-400">@{sellerUsername}</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl font-bold transition-all ${isFollowing ? 'bg-neutral-200 text-neutral-700' : 'bg-neutral-900 text-white shadow-lg hover:bg-neutral-800'}`}
                >
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </button>
                <a 
                  href={`https://wa.me/${sellerProfile.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-11 w-11 rounded-2xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                >
                  <MessageCircle size={20} />
                </a>
              </div>
            </div>
            
            <p className="mt-4 text-neutral-600 max-w-2xl leading-relaxed">
              {sellerProfile.bio}
            </p>

            {/* Delivery Info Badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Entrega rápida no seu condomínio
            </div>

            {/* Metrics & Social */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">{sellerProfile.followers}</span>
                <span className="text-neutral-500">seguidores</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">{sellerProfile.sales}</span>
                <span className="text-neutral-500">vendas</span>
              </div>
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-bold">
                <Star size={14} fill="currentColor" />
                {avgRating}
              </div>
              <div className="flex items-center gap-1 text-neutral-500">
                <MapPin size={14} />
                {distance}
              </div>
              {sellerProfile.instagram && (
                <a href={`https://instagram.com/${sellerProfile.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-pink-600 hover:underline">
                  <Instagram size={14} />
                  {sellerProfile.instagram}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Custom Link / Bio Link */}
        <div className="mb-8 p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-white rounded-xl text-orange-600 shrink-0">
              <LinkIcon size={18} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-orange-600/70 uppercase tracking-widest">Link da Loja</p>
              <p className="font-bold text-orange-900 truncate">jotam.app/@{sellerUsername}</p>
            </div>
          </div>
          <button onClick={handleShare} className="text-sm font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap px-4">
            Copiar
          </button>
        </div>

        {/* Highlighted Product (Destaque) */}
        {pinnedProduct && activeTab === 'all' && (
          <section className="mb-10">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star size={14} className="text-amber-500" fill="currentColor" />
              Destaque do Vendedor
            </h2>
            <div className="rounded-3xl bg-white border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/item/product/${pinnedProduct.id}`)}>
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-48 md:h-auto relative">
                  <img src={pinnedProduct.image} alt={pinnedProduct.name} className="w-full h-full object-cover" />
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
        <div className="flex items-center gap-6 border-b border-neutral-200 mb-8 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === 'all' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
          >
            Todos os Itens ({totalItems})
            {activeTab === 'all' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />}
          </button>
          {sellerProducts.length > 0 && (
            <button 
              onClick={() => setActiveTab('products')}
              className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === 'products' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Produtos ({sellerProducts.length})
              {activeTab === 'products' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />}
            </button>
          )}
          {sellerServices.length > 0 && (
            <button 
              onClick={() => setActiveTab('services')}
              className={`pb-4 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === 'services' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
            >
              Serviços ({sellerServices.length})
              {activeTab === 'services' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />}
            </button>
          )}
        </div>

        {/* Items Grid */}
        <div className="space-y-10">
          {(activeTab === 'all' || activeTab === 'products') && sellerProducts.length > 0 && (
            <section>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {sellerProducts.map((product) => (
                  <ItemCard key={product.id} item={product} type="product" />
                ))}
              </div>
            </section>
          )}

          {(activeTab === 'all' || activeTab === 'services') && sellerServices.length > 0 && (
            <section>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {sellerServices.map((service) => (
                  <ItemCard key={service.id} item={service} type="service" />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Metrics (Visible only to owner in a real app, but good for public trust too) */}
        <div className="mt-16 pt-8 border-t border-neutral-200 flex justify-center gap-8 text-neutral-400">
          <div className="flex items-center gap-2" title="Visualizações do Perfil">
            <Eye size={16} />
            <span className="text-xs font-bold">{sellerProfile.views} visualizações</span>
          </div>
          <div className="flex items-center gap-2" title="Membro desde">
            <Users size={16} />
            <span className="text-xs font-bold">Membro desde 2023</span>
          </div>
        </div>
      </main>
    </div>
  );
};

