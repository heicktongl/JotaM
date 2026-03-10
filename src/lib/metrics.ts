import { supabase } from './supabase';

/**
 * SIS-VIEW-COUNTER
 * Utilitário para gerenciar e registrar visualizações de vitrines
 */

const SESSION_KEY = 'sovix_session_id';

/**
 * Gera ou recupera um Session ID persistente no navegador
 */
function getPersistentSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Gera um hash simples do IP (mockado ou via serviço externo se necessário)
 * Nota: No cliente não temos acesso ao IP real de forma direta e segura.
 * Usamos uma combinação de Fingerprint básico para o MVP.
 */
async function getDeviceFingerprint(): Promise<string> {
  const userAgent = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const data = `${userAgent}-${screenRes}`;
  
  // Hash SHA-256 simples via Web Crypto API
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Registra uma visualização na vitrine usando a RPC do banco
 */
export async function registerView(storeId: string, type: 'shop' | 'provider') {
  try {
    const sessionId = getPersistentSessionId();
    const ipHash = await getDeviceFingerprint();

    const { data, error } = await supabase.rpc('register_storefront_view', {
      p_store_id: storeId,
      p_session_id: sessionId,
      p_ip_hash: ipHash,
      p_store_type: type
    });

    if (error) {
       console.warn('[SIS-VIEW] Falha ao registrar view:', error.message);
       return false;
    }

    if (data) {
      console.log('[SIS-VIEW] Visualização contabilizada!');
    } else {
      console.log('[SIS-VIEW] Visualização ignorada (Regra de 30min/Dono/IP)');
    }

    return data;
  } catch (err) {
    console.error('[SIS-VIEW] Erro crítico:', err);
    return false;
  }
}

/**
 * Registra visualização de um item específico (produto ou serviço)
 */
export async function registerItemView(itemId: string, type: 'product' | 'service') {
  try {
    const rpcName = type === 'product' ? 'increment_product_view' : 'increment_service_view';
    const { error } = await supabase.rpc(rpcName, { p_id: itemId });

    if (error) {
       console.warn(`[SIS-ITEM-VIEW] Falha ao registrar view (${type}):`, error.message);
       return false;
    }
    return true;
  } catch (err) {
    console.error('[SIS-ITEM-VIEW] Erro crítico:', err);
    return false;
  }
}

/**
 * Registra clique em adicionar ao carrinho
 */
export async function registerCartClick(itemId: string, type: 'product' | 'service') {
  try {
    const rpcName = type === 'product' ? 'increment_product_cart' : 'increment_service_cart';
    const { error } = await supabase.rpc(rpcName, { p_id: itemId });

    if (error) {
       console.warn(`[SIS-CART-CLICK] Falha ao registrar clique (${type}):`, error.message);
       return false;
    }
    return true;
  } catch (err) {
    console.error('[SIS-CART-CLICK] Erro crítico:', err);
    return false;
  }
}
