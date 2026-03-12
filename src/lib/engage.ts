import { supabase } from './supabase';

/**
 * SIS-ENGAGE: Motor de Engajamento Social
 * Lida com Curtidas, Comentários e Compartilhamento de forma atômica e resiliente.
 * Pilares: Reputação e Prova Social.
 */

/**
 * Alterna o estado de curtida de um post para um usuário.
 * Utiliza o trigger 'on_post_like' do banco para sincronizar 'likes_count' em 'posts'.
 */
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  if (!postId || !userId) throw new Error('[SIS-ENGAGE] Post ID e User ID são obrigatórios');

  try {
    // Chamada RPC Atômica: garante integridade "Mil Grau" no contador
    const { data, error } = await supabase.rpc('toggle_post_like', {
      p_post_id: postId,
      p_user_id: userId
    });

    if (error) throw error;

    return {
      liked: data.liked,
      count: data.count
    };
  } catch (err) {
    console.error('[SIS-ENGAGE] Erro crítico ao toggleLike (RPC):', err);
    throw err;
  }
}

/**
 * Verifica se um usuário específico curtiu um post.
 */
export async function checkUserLiked(postId: string, userId: string): Promise<boolean> {
  if (!postId || !userId) return false;
  
  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error) {
    console.warn('[SIS-ENGAGE] Falha ao verificar curtida:', error);
    return false;
  }
  return !!data;
}

/**
 * Registra um novo comentário em um post.
 * Utiliza o trigger 'on_post_comment' do banco para sincronizar 'comments_count' em 'posts'.
 */
export async function postComment(
  postId: string, 
  userId: string, 
  content: string, 
  authorType: 'personal' | 'seller' | 'provider' = 'personal',
  authorId?: string
) {
  if (!content?.trim()) return null;

  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ 
        post_id: postId, 
        user_id: userId, 
        content: content.trim(),
        author_type: authorType,
        author_id: authorId
      })
      .select(`
        *,
        profiles:user_id (
          name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SIS-ENGAGE] Erro ao postComment:', err);
    throw err;
  }
}

/**
 * Busca a lista de comentários de um post com dados do perfil do autor (incluindo Vitrines).
 */
export async function fetchComments(postId: string) {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id (
          name,
          avatar_url
        ),
        seller:author_id (
          store_name,
          avatar_url
        ),
        provider:author_id (
          name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Normalizar dados do autor para facilitar no front
    return data?.map(comment => {
      let authorName = comment.profiles?.name || 'Usuário Sovix';
      let authorAvatar = comment.profiles?.avatar_url;

      if (comment.author_type === 'seller') {
        authorName = comment.seller?.store_name || authorName;
        authorAvatar = comment.seller?.avatar_url || authorAvatar;
      } else if (comment.author_type === 'provider') {
        authorName = comment.provider?.name || authorName;
        authorAvatar = comment.provider?.avatar_url || authorAvatar;
      }

      return {
        ...comment,
        authorName,
        authorAvatar
      };
    });
  } catch (err) {
    console.error('[SIS-ENGAGE] Erro ao fetchComments:', err);
    throw err;
  }
}

// Cache simples para evitar múltiplas chamadas ao banco no mesmo ciclo de vida
let cachedIdentities: { [userId: string]: { data: any[], timestamp: number } } = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos de cache

/**
 * Busca as identidades (Sellers/Providers) vinculadas ao usuário.
 * Implementa cache automático para facilitar a UX (Sincronização Automática).
 */
export async function getUserIdentities(userId: string, forceRefresh = false) {
  if (!userId) {
    console.warn('[SIS-IDENT-SYNC] userId nulo na busca de identidades.');
    return [];
  }
  
  const now = Date.now();
  if (!forceRefresh && cachedIdentities[userId] && (now - cachedIdentities[userId].timestamp < CACHE_TTL)) {
    console.log(`[SIS-IDENT-SYNC] Retornando identidades do cache para: ${userId}`);
    return cachedIdentities[userId].data;
  }
  
  console.log(`[SIS-IDENT-SYNC] Escaneando ecossistema (Auto-Sync) para: ${userId}`);
  
  try {
    // Busca paralela em Sellers e Providers
    const [sellersRes, providersRes] = await Promise.all([
      supabase.from('sellers').select('id, store_name, avatar_url, user_id').eq('user_id', userId),
      supabase.from('service_providers').select('id, name, avatar_url, user_id').eq('user_id', userId)
    ]);

    if (sellersRes.error) console.error('[SIS-IDENT-SYNC] Falha Sellers:', sellersRes.error.message);
    if (providersRes.error) console.error('[SIS-IDENT-SYNC] Falha Providers:', providersRes.error.message);

    const identities: any[] = [];
    
    // Processar Vendedores
    if (sellersRes.data && sellersRes.data.length > 0) {
      sellersRes.data.forEach(s => {
        identities.push({ 
          id: s.id, 
          name: s.store_name, 
          avatar: s.avatar_url, 
          type: 'seller' 
        });
      });
    }
    
    // Processar Prestadores
    if (providersRes.data && providersRes.data.length > 0) {
      providersRes.data.forEach(p => {
        identities.push({ 
          id: p.id, 
          name: p.name, 
          avatar: p.avatar_url, 
          type: 'provider' 
        });
      });
    }

    // Atualizar Cache
    cachedIdentities[userId] = {
      data: identities,
      timestamp: now
    };

    console.log(`[SIS-IDENT-SYNC] Sincronização automática concluída: ${identities.length} encontradas.`);
    return identities;
  } catch (err) {
    console.error('[SIS-IDENT-SYNC] Falha Crítica no Scan:', err);
    return [];
  }
}

/**
 * Engine de Compartilhamento Nativo (Web Share API) com Fallback.
 * Conecta-se ao SIS-OLHEIRO para futura rastreabilidade.
 */
export async function sharePost(post: any) {
  const shareData = {
    title: 'Confira este post na Sovix!',
    text: post.content || 'Veja as novidades do bairro na rede Sovix.',
    url: `${window.location.origin}/post/${post.id}`
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('[SIS-ENGAGE] Erro no compartilhamento nativo:', err);
      }
      return false;
    }
  } else {
    // Fallback: Copiar para área de transferência
    try {
      await navigator.clipboard.writeText(shareData.url);
      return 'copied';
    } catch (err) {
      console.error('[SIS-ENGAGE] Falha no fallback de cópia:', err);
      return false;
    }
  }
}
