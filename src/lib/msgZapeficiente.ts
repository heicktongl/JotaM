export const openWhatsApp = (phone: string, msg: string) => {
    if (!phone) {
        alert('Vendedor ou prestador não possui telefone cadastrado.');
        return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
};

export const buildProductCheckoutMessage = (
    orderId: string,
    items: Array<{ name: string; quantity: number; price: number }>,
    total: number,
    paymentMethod: string,
    address: { street: string; neighborhood: string; city: string; label?: string } | null,
    notes: string,
    customerName: string
) => {
    const methodMap: Record<string, string> = {
        pix: '💳 Pix (Chave Rápida)',
        card: '💳 Cartão de Crédito',
        cash: '💵 Dinheiro na Entrega',
    };

    let msg = `🛍️ *Novo Pedido Sovix!*\n\n`;
    msg += `Olá, vim pela Sovix e acabei de fazer um pedido contigo. Seguem os detalhes:\n\n`;

    msg += `*🧾 Itens do Pedido:*\n`;
    items.forEach(i => {
        msg += `• ${i.quantity}x ${i.name} — R$ ${(i.price * i.quantity).toFixed(2)}\n`;
    });

    msg += `\n*💰 Total a pagar:* R$ ${total.toFixed(2)}\n`;
    msg += `*💳 Forma de Pagamento:* ${methodMap[paymentMethod] || paymentMethod}\n\n`;

    if (address) {
        msg += `*📍 Endereço de Entrega:*\n`;
        if (address.label) msg += `${address.label}\n`;
        msg += `${address.street}, ${address.neighborhood} - ${address.city}\n\n`;
    } else {
        msg += `*📍 Entrega:* Retirada no local ou a combinar.\n\n`;
    }

    if (notes) {
        msg += `*📝 Observações:*\n_${notes}_\n\n`;
    }

    msg += `*👤 Cliente:* ${customerName}\n`;
    msg += `*🏷️ ID:* #${orderId.slice(0, 8).toUpperCase()}\n\n`;
    msg += `Pode confirmar o recebimento e o tempo estimado? Muito obrigado! 🤝`;

    return msg;
};

export const buildImmediateServiceMessage = (serviceName: string, responseTimeMins: string | number) => {
    return `🚨 *Pedido de Serviço Imediato!*\n\nOlá! Vi seu perfil na Sovix e preciso AGORA do serviço: *${serviceName}*.\n\nNotei que seu tempo de resposta costuma ser de ${responseTimeMins} min. Podemos iniciar o atendimento? Fico no aguardo!`;
};

export const buildRecurringServiceMessage = (serviceName: string, price: number, cycle: string) => {
    const cycleMap: Record<string, string> = { 'weekly': 'por semana', 'biweekly': 'por quinzena', 'monthly': 'por mês' };
    const cycleText = cycleMap[cycle] || 'recorrente';
    return `🔄 *Assinatura de Serviço!*\n\nOlá! Encontrei seu perfil na Sovix e gostaria de assinar o plano do seu serviço: *${serviceName}*.\n\nO valor listado é R$ ${(price || 0).toFixed(2)} ${cycleText}. Podemos acertar os detalhes da assinatura?`;
};

export const buildScheduledServiceMessage = (serviceName: string, date: string, turn: 'morning' | 'afternoon' | 'night' | string) => {
    const turnMap: Record<string, string> = { 'morning': 'Manhã', 'afternoon': 'Tarde', 'night': 'Noite' };
    const formattedDate = date.split('-').reverse().join('/');
    return `📅 *Agendamento de Serviço!*\n\nOlá! Vim pela Sovix e gostaria de agendar um horário para: *${serviceName}*.\n\nTenho preferência para o dia *${formattedDate}*, no turno da *${turnMap[turn] || turn}*.\n\nComo está sua disponibilidade para confirmarmos?`;
};
