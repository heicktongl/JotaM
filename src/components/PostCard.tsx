import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, Clock, Tag, ShoppingBag, 
  ExternalLink, MessageSquare, Heart, Share2,
  User, Store, Briefcase, Send, Trash2, Loader2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toggleLike, checkUserLiked, sharePost, fetchComments, postComment } from '../lib/engage';

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
  likes_count: number;
  comments_count: number;
}

interface PostCardProps {
  post: FeedPost;
  authorName?: string;
  authorAvatar?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, authorName, authorAvatar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVitrine = post.author_type !== 'personal';
  
  const [isLiked, setIsLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = React.useState(post.comments_count || 0);
  const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      checkUserLiked(post.id, user.id).then(setIsLiked);
    }
  }, [post.id, user]);

  React.useEffect(() => {
    if (isCommentsOpen) {
      setIsLoadingComments(true);
      fetchComments(post.id)
        .then(data => setComments(data || []))
        .catch(err => console.error(err))
        .finally(() => setIsLoadingComments(false));
    }
  }, [isCommentsOpen, post.id]);

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const result = await toggleLike(post.id, user.id);
      setIsLiked(result.liked);
      setLikesCount(result.count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    const res = await sharePost(post);
    if (res === 'copied') {
      alert('Link copiado para o seu radar!');
    }
  };

  const toggleComments = () => {
    setIsCommentsOpen(!isCommentsOpen);
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await postComment(post.id, user.id, newComment);
      setNewComment('');
      setCommentsCount(prev => prev + 1);
      // Refresh comments
      const data = await fetchComments(post.id);
      setComments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
              src={authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'User')}&background=${isVitrine ? 'FFF7ED&color=EA580C' : 'F3F4F6&color=4B5563'}&size=128&bold=true`}
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
            <div key={i} className={`relative rounded-2xl overflow-hidden bg-neutral-100 flex items-center justify-center ${
              post.image_urls.length === 1 ? 'min-h-[300px] max-h-[600px]' : 'aspect-square'
            }`}>
              <img 
                src={url} 
                alt="Imagem do post" 
                loading="lazy" 
                className={`w-full h-full ${post.image_urls.length === 1 ? 'object-contain' : 'object-cover'}`} 
              />
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
        <button 
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-all active:scale-90 ${isLiked ? 'text-red-500' : 'text-neutral-400 hover:text-red-500'}`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'animate-pulse' : ''} />
          <span className="text-[11px] font-bold">{likesCount > 0 ? likesCount : 'Curtir'}</span>
        </button>
        <button 
          onClick={toggleComments}
          className={`flex items-center gap-1.5 transition-all ${isCommentsOpen ? 'text-orange-600' : 'text-neutral-400 hover:text-orange-600'}`}
        >
          <MessageSquare size={18} fill={isCommentsOpen ? 'currentColor' : 'none'} />
          <span className="text-[11px] font-bold">{commentsCount > 0 ? commentsCount : 'Comentar'}</span>
        </button>
        <button 
          onClick={handleShare}
          className="ml-auto flex items-center gap-1.5 text-neutral-400 hover:text-blue-600 transition-colors active:scale-90"
        >
          <Share2 size={18} />
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {isCommentsOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsCommentsOpen(false)} 
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]" 
              />
              
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 350, mass: 0.8 }}
                className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[40px] px-6 pb-8 pt-4 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.15)] overflow-hidden max-h-[92vh] flex flex-col"
              >
                <div className="mx-auto w-10 h-1 bg-neutral-100 rounded-full mb-6 cursor-grab active:cursor-grabbing" />
                
                <div className="flex items-center justify-between mb-8 px-2">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 tracking-tight">Comentários</h2>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-[0.2em] mt-0.5">Interações</p>
                  </div>
                  <button 
                    onClick={() => setIsCommentsOpen(false)} 
                    className="h-10 w-10 flex items-center justify-center bg-neutral-50 rounded-full text-neutral-400 hover:bg-neutral-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Comment List */}
                <div className="flex-1 overflow-y-auto space-y-7 pb-28 pr-1 custom-scrollbar min-h-[400px]">
                  {isLoadingComments ? (
                    <div className="flex flex-col items-center justify-center py-24">
                      <div className="relative">
                        <Loader2 size={32} className="animate-spin text-orange-600 opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-1 w-1 bg-orange-600 rounded-full animate-ping" />
                        </div>
                      </div>
                      <p className="text-[9px] font-black text-neutral-300 uppercase tracking-[0.3em] mt-4">Sintonizando...</p>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment, idx) => (
                      <div key={comment.id || idx} className="group flex gap-4 px-2">
                        <div className="h-11 w-11 rounded-2xl overflow-hidden flex-shrink-0 bg-neutral-100 border border-neutral-50 transition-transform group-hover:scale-105">
                          <img 
                            src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.full_name || 'U'}&background=F4F4F5&color=71717A`} 
                            alt="Avatar" 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[10px] font-black text-neutral-900 uppercase tracking-wider">
                              {comment.profiles?.full_name || 'Usuário Sovix'}
                            </span>
                            <span className="text-[8px] font-bold text-neutral-300 uppercase">
                              {getRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          <div className="bg-neutral-50/50 p-4 rounded-3xl rounded-tl-none border border-neutral-100/50 transition-colors group-hover:bg-neutral-50">
                            <p className="text-[13px] text-neutral-600 leading-relaxed font-medium">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-200">
                      <div className="h-20 w-20 rounded-full bg-neutral-50 flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sem comentários por aqui</p>
                      <p className="text-[9px] font-bold text-neutral-400 mt-1">Que tal começar a conversa?</p>
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                {user && (
                  <div className="mt-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-8 px-8">
                    <div className="flex items-center gap-3 bg-neutral-50 p-1.5 pl-5 rounded-[28px] border border-neutral-100 shadow-sm focus-within:border-orange-200 focus-within:bg-white transition-all">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Adicionar um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        className="flex-1 bg-transparent border-none py-3 text-sm font-bold text-neutral-900 placeholder:text-neutral-300 outline-none"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={isSubmittingComment || !newComment.trim()}
                        className="h-11 w-11 flex items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/30 active:scale-90 disabled:opacity-30 disabled:grayscale transition-all"
                      >
                        {isSubmittingComment ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Send size={18} strokeWidth={2.5} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};
