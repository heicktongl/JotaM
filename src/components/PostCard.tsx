import React from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, Clock, Tag, ShoppingBag, 
  ExternalLink, MessageSquare, Heart, Share2,
  User, Store, Briefcase
} from 'lucide-react';

export interface FeedPost {
  id: string;
  user_id: string;
  author_type: 'personal' | 'seller' | 'provider';
  content: string | null;
  image_urls: string[];
  city: string;
  neighborhood: string;
  metadata: any;
  created_at: string;
  // Join fields could be added here if needed, but for now we'll assume basic data
}

interface PostCardProps {
  post: FeedPost;
  authorName?: string;
  authorAvatar?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, authorName, authorAvatar }) => {
  const isVitrine = post.author_type !== 'personal';
  
  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffInMins = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));
    
    if (diffInMins < 60) return `${diffInMins}min atrás`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return then.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm mb-6"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-100 border border-neutral-100">
            <img 
              src={authorAvatar || `https://ui-avatars.com/api/?name=${authorName || 'User'}&background=${isVitrine ? 'FFF7ED&color=EA580C' : 'F3F4F6&color=4B5563'}`}
              alt="Avatar" 
              className="h-full w-full object-cover" 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-neutral-900">{authorName || 'Usuário Sovix'}</h4>
              {isVitrine && (
                <div className="h-4 w-4 rounded-full bg-orange-100 flex items-center justify-center">
                  <Tag size={10} className="text-orange-600 fill-orange-600/10" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              <MapPin size={10} />
              <span>{post.neighborhood}</span>
              <span className="mx-1">•</span>
              <Clock size={10} />
              <span>{getRelativeTime(post.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        {post.content && (
          <p className="text-sm text-neutral-700 leading-relaxed mb-3 whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {/* Image Gallery */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className={`grid gap-1 px-4 mb-4 ${
          post.image_urls.length === 1 ? 'grid-cols-1' : 
          post.image_urls.length === 2 ? 'grid-cols-2' : 
          'grid-cols-2 sm:grid-cols-3'
        }`}>
          {post.image_urls.map((url, i) => (
            <div key={i} className={`relative rounded-2xl overflow-hidden bg-neutral-100 ${
              post.image_urls.length === 1 ? 'aspect-video' : 'aspect-square'
            }`}>
              <img src={url} alt="Imagem do post" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Linked Item (Product/Service) */}
      {(post.metadata?.product || post.metadata?.service) && (
        <div className="px-4 mb-4">
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-between group cursor-pointer hover:bg-neutral-100 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-orange-600 shadow-sm">
                {post.metadata.product ? <ShoppingBag size={20} /> : <Briefcase size={20} />}
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  {post.metadata.product ? 'Produto em destaque' : 'Serviço em destaque'}
                </span>
                <span className="font-bold text-neutral-900 block truncate max-w-[150px]">
                  {post.metadata.product?.name || post.metadata.service?.name}
                </span>
                {post.metadata.product?.price && (
                  <span className="text-sm font-black text-orange-600">R$ {post.metadata.product.price.toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="p-2 rounded-full bg-white text-neutral-400 group-hover:text-orange-600 transition-colors shadow-sm">
              <ExternalLink size={16} />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-4 py-3 border-t border-neutral-50 flex items-center gap-6">
        <button className="flex items-center gap-1.5 text-neutral-400 hover:text-red-500 transition-colors">
          <Heart size={18} />
          <span className="text-[11px] font-bold">Curtir</span>
        </button>
        <button className="flex items-center gap-1.5 text-neutral-400 hover:text-orange-600 transition-colors">
          <MessageSquare size={18} />
          <span className="text-[11px] font-bold">Comentar</span>
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-neutral-400 hover:text-blue-600 transition-colors">
          <Share2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};
