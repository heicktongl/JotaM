/**
 * 👁️ Olheiro — Sistema de rastreamento de jornada do cliente
 *
 * Registra cada etapa da jornada do cliente até o WhatsApp do vendedor.
 * Todas as chamadas são fire-and-forget: nunca bloqueiam a UI.
 */

import { supabase } from './supabase';

export type OlheiroEventType = 'view' | 'add_to_cart' | 'checkout_started' | 'whatsapp_sent';

interface TrackEventParams {
    sellerId: string;
    eventType: OlheiroEventType;
    productId?: string;
    serviceId?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Registra um evento de jornada do cliente.
 * Silencioso: erros são apenas logados, nunca lançados.
 */
export const trackEvent = async ({
    sellerId,
    eventType,
    productId,
    serviceId,
    metadata = {},
}: TrackEventParams): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('olheiro_events').insert({
            seller_id: sellerId,
            consumer_id: user?.id ?? null,
            product_id: productId ?? null,
            service_id: serviceId ?? null,
            event_type: eventType,
            metadata,
        });

        console.debug(`[Olheiro] ${eventType} → seller:${sellerId}`);
    } catch (err) {
        // Fire-and-forget: nunca interrompe o fluxo principal
        console.warn('[Olheiro] Falha ao registrar evento:', err);
    }
};
