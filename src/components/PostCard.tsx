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
import { toggleLike, checkUserLiked, sharePost, fetchComments, postComment, getUserIdentities } from '../lib/engage';

import { CommentSkeleton } from './Skeleton';

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
  resolved_author_id?: string;
  resolved_author_username?: string;
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
  const [identities, setIdentities] = React.useState<any[]>([]);
  const [selectedIdentity, setSelectedIdentity] = React.useState<any>(null);
  const [isSelectorOpen, setIsSelectorOpen] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      checkUserLiked(post.id, user.id).then(setIsLiked);
    }
  }, [post.id, user]);

  // SIS-IDENT-SYNC: Sincronização Proativa (Auto-Sync)
  React.useEffect(() => {
    if (user && !identities.length) {
      console.log('[SIS-ENGAGE] Auto-Sync Proativo de identidades...');
      getUserIdentities(user.id).then(data => {
        setIdentities(data || []);
      });
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (isCommentsOpen) {
      setIsLoadingComments(true);
      
      // Profiling imediato do perfil pessoal enquanto o banco é consultado
      const emailPrefix = user?.email?.split('@')[0];
      const rawName = user?.user_metadata?.full_name || user?.user_metadata?.name || emailPrefix || 'Você';
      
      // Se o nome for o e-mail ou algo genérico, tratamos como 'Você' para ser mais amigável
      const friendlyName = (rawName === emailPrefix) ? 'Você' : rawName;
      
      const personal = { 
        id: user?.id, 
        type: 'personal', 
        name: friendlyName, 
        avatar: user?.user_metadata?.avatar_url 
      };

      // Set inicial síncrono para evitar "undefined"
      if (!selectedIdentity || selectedIdentity.name === undefined) {
        setSelectedIdentity(personal);
      }
      
      Promise.all([
        fetchComments(post.id),
        user ? getUserIdentities(user.id) : Promise.resolve(identities)
      ]).then(([commentsData, identitiesData]) => {
        console.log(`[SIS-ENGAGE] Sincronizando identidades para o usuário:`, user?.id);
        setComments(commentsData || []);
        setIdentities(identitiesData || []);
        
        const savedIdentityId = localStorage.getItem('sovix_preferred_identity_id');
        const savedIdentityType = localStorage.getItem('sovix_preferred_identity_type');

        if (savedIdentityId && savedIdentityType) {
          const matched = identitiesData.find(id => id.id === savedIdentityId && id.type === savedIdentityType);
          if (matched) {
            setSelectedIdentity(matched);
            return;
          }
        }
        
        // Se após o load as identidades mudarem, mas não houver match com o salvo, 
        // mantemos o que já estiver setado se não for personal.
        if (selectedIdentity?.type === 'personal' || !selectedIdentity) {
          setSelectedIdentity(personal);
        }
      }).catch(err => {
        console.error('[SIS-ENGAGE] Erro no load de comentários:', err);
      }).finally(() => setIsLoadingComments(false));
    }
  }, [isCommentsOpen, post.id, user?.id]); // Usar user.id para evitar re-runs por referência

  const selectIdentity = (identity: any) => {
    console.log('[SIS-ENGAGE] Trocando identidade para:', identity?.name, identity?.type);
    setSelectedIdentity(identity);
    setIsSelectorOpen(false);
    if (identity?.id) {
      localStorage.setItem('sovix_preferred_identity_id', identity.id);
      localStorage.setItem('sovix_preferred_identity_type', identity.type);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Atualização Otimista
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    
    setIsLiked(!previousIsLiked);
    setLikesCount(prev => previousIsLiked ? prev - 1 : prev + 1);

    try {
      const result = await toggleLike(post.id, user.id);
      // Sincroniza com o valor real do servidor
      setIsLiked(result.liked);
      setLikesCount(result.count);
    } catch (err) {
      // Reverte em caso de erro
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      console.error('[SIS-ENGAGE] Erro ao curtir:', err);
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

  const handleRetrySync = async () => {
    if (!user) return;
    setIsSubmittingComment(true);
    try {
      console.log(`[SIS-IDENT-SYNC] Forçando Auto-Sync Manual para: ${user.id}`);
      const data = await getUserIdentities(user.id, true); // Forçar refresh do cache
      setIdentities(data || []);
      
      if (data && data.length > 0) {
        alert(`Sincronização Automática Concluída!\nEncontramos ${data.length} vitrine(s) vinculada(s).\nSeu ID: ${user.id.slice(0, 8)}...`);
      } else {
        alert(`Auto-Sync Sovix: Nenhuma vitrine vinculada encontrada.\nVerifique se este é o perfil correto.\nID: ${user.id.slice(0, 8)}...`);
      }
    } catch (err) {
      alert('Erro na sincronização. Tente novamente em instantes.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Se ainda estiver carregando a identidade, não faz nada mas não redireciona
    if (!selectedIdentity) return;

    const content = newComment.trim();
    if (!content) return;

    // Preparação do Comentário Otimista com Identidade Selecionada
    const optimisticComment = {
      id: `temp-${Date.now()}`,
      post_id: post.id,
      user_id: user.id,
      content,
      author_type: selectedIdentity.type,
      author_id: selectedIdentity.type !== 'personal' ? selectedIdentity.id : null,
      created_at: new Date().toISOString(),
      author_name: selectedIdentity.name,
      author_avatar: selectedIdentity.avatar
    };

    setNewComment('');
    setComments(prev => [...prev, optimisticComment]);
    setCommentsCount(prev => prev + 1);
    setIsSubmittingComment(true);

    try {
      const data = await postComment(
        post.id, 
        user.id, 
        content, 
        selectedIdentity.type, 
        selectedIdentity.type !== 'personal' ? selectedIdentity.id : undefined
      );
      if (data) {
        console.log('[SIS-ENGAGE] Comentário persistido com sucesso no banco:', data.id);
        const realComment = {
          ...data,
          author_name: selectedIdentity.name,
          author_avatar: selectedIdentity.avatar
        };
        setComments(prev => prev.map(c => c.id === optimisticComment.id ? realComment : c));
      } else {
        // Se postComment retornar null, tratamos como falha de persistência
        throw new Error('O servidor não confirmou o salvamento do seu comentário.');
      }
    } catch (err: any) {
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
      setCommentsCount(prev => prev - 1);
      setNewComment(content);
      console.error('[SIS-ENGAGE] Erro ao comentar:', err);
      
      // Feedback visual nítido para o usuário
      const errorMsg = err.message || 'Erro desconhecido';
      alert(`O sistema negou o comentário.\nMotivo: ${errorMsg}\n\nVerifique sua conexão ou se sua vitrine está ativa.`);
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

  const authorUser = post.resolved_author_username || post.metadata?.author_username;
  const canNavigate = isVitrine && authorUser;

  const handleHeaderClick = () => {
    if (!canNavigate) return;
    
    const targetPath = `/@${authorUser}`;
    navigate(targetPath);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm mb-6"
    >
      {/* Post Header */}
      <div 
        onClick={handleHeaderClick}
        className={`p-4 flex items-center justify-between ${canNavigate ? 'cursor-pointer hover:bg-neutral-50 transition-colors' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-100 border border-neutral-100">
            <img 
              src={authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'User')}&background=${isVitrine ? 'FFF7ED&color=EA580C' : 'F3F4F6&color=4B5563'}&size=128&bold=true`}
              alt="Avatar" 
              className="h-full w-full object-cover" 
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <h4 className="text-sm font-bold text-neutral-900 truncate">{authorName || 'Usuário Sovix'}</h4>
              {isVitrine && (
                <div className="h-4 w-4 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Tag size={10} className="text-orange-600 fill-orange-600/10" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold uppercase tracking-wider overflow-hidden">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate">{post.neighborhood}</span>
              <span className="shrink-0 mx-1">•</span>
              <Clock size={10} className="shrink-0" />
              <span className="truncate">{getRelativeTime(post.created_at)}</span>
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
          className={`flex items-center gap-1.5 transition-all active:scale-95 ${isLiked ? 'text-red-500' : 'text-neutral-400 hover:text-red-500'}`}
        >
          <motion.div
            animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Heart 
              size={18} 
              fill={isLiked ? 'currentColor' : 'none'} 
              className={isLiked ? 'filter drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]' : ''} 
            />
          </motion.div>
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
                className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[40px] px-4 sm:px-6 pb-8 pt-4 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.15)] overflow-hidden max-h-[92vh] flex flex-col"
              >
                <div className="mx-auto w-10 h-1 bg-neutral-100 rounded-full mb-6 cursor-grab active:cursor-grabbing" />
                
                <div className="flex items-center justify-between mb-8 px-4 sm:px-2 overflow-visible">
                  <div className="flex items-center gap-3 w-full min-h-[50px]">
                    {/* Identity Pulse Container */}
                    <div className="flex items-center gap-2 relative flex-shrink-0 z-20">
                       {/* Current Active Avatar with Switch Indicator */}
                       <div 
                        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                        className={`relative h-14 w-14 rounded-full p-0.5 border-2 shadow-xl active:scale-95 transition-all cursor-pointer z-30 bg-white ${isSelectorOpen ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-neutral-100'}`}
                      >
                        <div className="h-full w-full rounded-full overflow-hidden bg-neutral-100">
                           <img 
                             src={selectedIdentity?.avatar || (selectedIdentity?.type === 'personal' ? user?.user_metadata?.avatar_url : null) || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedIdentity?.name || 'U')}&background=EA580C&color=FFF`} 
                             alt="Avatar" 
                             className="h-full w-full object-cover"
                             onError={(e) => {
                               (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedIdentity?.name || 'U')}&background=EA580C&color=FFF`;
                             }}
                           />
                         </div>
                        
                        {/* Interactive Hint: Small icon indicating switchable */}
                        {identities.length > 0 && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-sm">
                            <Store size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      {/* Identities Slide Out */}
                      <AnimatePresence>
                        {isSelectorOpen && (
                             <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="flex items-center gap-2.5 bg-neutral-100/50 backdrop-blur-xl p-1.5 pr-4 rounded-full border border-white shadow-inner z-[40]"
                            >
                              {/* Option: Personal */}
                              {selectedIdentity?.type !== 'personal' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); selectIdentity({ id: user?.id, type: 'personal', name: user?.user_metadata?.full_name || user?.user_metadata?.name || 'Você', avatar: user?.user_metadata?.avatar_url }); }}
                                  className="h-11 w-11 rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 active:scale-90 transition-all bg-white relative shrink-0 touch-manipulation"
                                  title="Voltar para perfil pessoal"
                                >
                                  <img src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'U'}`} className="h-full w-full object-cover" alt="Perfil Pessoal" />
                                </button>
                              )}

                            {/* Option: Vitrines */}
                            {identities.filter(id => id.id !== selectedIdentity?.id).map(id => (
                               <button 
                                key={id.id}
                                onClick={(e) => { e.stopPropagation(); selectIdentity(id); }}
                                className="h-11 w-11 rounded-full overflow-hidden border-2 border-white shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all bg-white relative shrink-0 touch-manipulation ring-offset-2 hover:ring-2 hover:ring-orange-500/20"
                                title={`Comentar como ${id.name}`}
                              >
                                <img src={id.avatar || `https://ui-avatars.com/api/?name=${id.name}`} className="h-full w-full object-cover" alt={id.name} />
                              </button>
                            ))}

                            {/* Empty State */}
                            {identities.length === 0 && selectedIdentity?.type === 'personal' && (
                              <div className="flex items-center gap-1 group">
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tight px-2 whitespace-nowrap">
                                  Perfil Único
                                </p>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRetrySync(); }}
                                  className="p-1 rounded-full hover:bg-neutral-100 text-neutral-300 hover:text-orange-500 transition-colors"
                                  title="Sincronizar Vitrine"
                                >
                                  <Loader2 size={10} className={isSubmittingComment ? "animate-spin" : ""} />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Header Text */}
                    <div className="flex-1 min-w-0 relative z-10">
                      <h2 className="text-lg font-black text-neutral-900 tracking-tight leading-none truncate">
                        Comentários
                      </h2>
                       <p className="text-[10px] text-orange-600 font-bold mt-1 truncate">
                        {isSelectorOpen ? 'Escolha sua identidade de voz' : (
                          selectedIdentity?.type === 'personal' 
                            ? `Você está como ${selectedIdentity?.name}` 
                            : `Representando ${selectedIdentity?.name}`
                        )}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsCommentsOpen(false)} 
                    className="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-neutral-50 rounded-full text-neutral-400 hover:bg-neutral-100 transition-colors ml-2"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Comment List */}
                <div className="flex-1 overflow-y-auto space-y-7 pb-28 pr-1 custom-scrollbar min-h-[400px]">
                  {isLoadingComments ? (
                    <div className="space-y-6">
                      {[1, 2, 3].map(i => <CommentSkeleton key={i} />)}
                      <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <Loader2 size={24} className="animate-spin text-orange-600 mb-2" />
                        <p className="text-[8px] font-black text-neutral-400 uppercase tracking-[0.3em]">Sincronizando...</p>
                      </div>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment, idx) => (
                      <div key={comment.id || idx} className="group flex gap-4 px-2">
                        <div className="h-11 w-11 rounded-2xl overflow-hidden flex-shrink-0 bg-neutral-100 border border-neutral-50 transition-transform group-hover:scale-105">
                          <img 
                            src={comment.author_avatar || `https://ui-avatars.com/api/?name=${comment.author_name || 'U'}&background=F4F4F5&color=71717A`} 
                            alt="Avatar" 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[10px] font-black text-neutral-900 uppercase tracking-wider">
                              {comment.author_name || 'Usuário Sovix'}
                            </span>
                            <span className="text-[8px] font-bold text-neutral-300 uppercase">
                              {getRelativeTime(comment.created_at)}
                            </span>
                          </div>
                        <div className="bg-neutral-50/50 p-4 rounded-3xl rounded-tl-none border border-neutral-100/50 transition-colors group-hover:bg-neutral-50">
                          <p className="text-[14px] text-neutral-600 leading-relaxed font-medium">
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
                  <div className="mt-auto absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-8 px-4 sm:px-8">
                    <div className="flex items-center gap-3 bg-neutral-50 p-1.5 pl-5 rounded-[28px] border border-neutral-100 shadow-sm focus-within:border-orange-200 focus-within:bg-white transition-all">
                      <input
                        type="text"
                        placeholder="Adicionar um comentário..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        className="flex-1 bg-transparent border-none py-3 text-[16px] font-bold text-neutral-900 placeholder:text-neutral-300 outline-none"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={isSubmittingComment || !newComment.trim() || !selectedIdentity}
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
