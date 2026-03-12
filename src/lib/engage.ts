import { supabase } from './supabase';

/**
 * SIS-ENGAGE: Motor de Engajamento Social
 * Lida com Curtidas, Comentários e Compartilhamento
 */

export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  try {
    // 1. Checa se já existe curtida
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      // Remover like
      await supabase.from('post_likes').delete().eq('id', existingLike.id);
    } else {
      // Adicionar like
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    }

    // 2. Busca o contador atualizado (sincronizado pelo trigger do banco)
    const { data: post } = await supabase
      .from('posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    return {
      liked: !existingLike,
      count: post?.likes_count ?? 0
    };
  } catch (err) {
    console.error('[SIS-ENGAGE] Erro ao toggleLike:', err);
    throw err;
  }
}

export async function checkUserLiked(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function postComment(postId: string, userId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: userId, content })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SIS-ENGAGE] Erro ao postComment:', err);
    throw err;
  }
}

export async function fetchComments(postId: string) {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[SIS-ENGAGE] Erro ao fetchComments:', err);
    throw err;
  }
}

export async function sharePost(post: any) {
  const shareData = {
    title: 'Confira este post na Sovix!',
    text: post.content || 'Veja as novidades do bairro na rede Sovix.',
    url: window.location.origin + '/post/' + post.id
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      console.warn('[SIS-ENGAGE] Compartilhamento cancelado ou falhou:', err);
      return false;
    }
  } else {
    // Fallback: Copiar para área de transferência
    try {
      await navigator.clipboard.writeText(shareData.url);
      return 'copied';
    } catch (err) {
      return false;
    }
  }
}
