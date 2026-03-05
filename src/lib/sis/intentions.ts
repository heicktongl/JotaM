// ─────────────────────────────────────────────────────────────
// Sovix Intent Search — Mapa de Intenções
// ─────────────────────────────────────────────────────────────

/**
 * Mapeia termos genéricos ou categorias amplas para intenções de busca
 * muito mais específicas. Ajuda o usuário a descobrir o que precisa.
 */
export const INTENTIONS_MAP: Record<string, string[]> = {
    celular: [
        'conserto de celular',
        'assistência técnica celular',
        'troca de tela',
        'capinha para celular',
        'película para celular',
    ],
    carro: [
        'mecânica geral',
        'troca de óleo',
        'borracharia',
        'lavagem automotiva',
        'auto elétrica',
        'bateria automotiva',
        'funilaria',
    ],
    cabelo: [
        'barbeiro',
        'cabeleireiro',
        'corte feminino',
        'corte masculino',
        'progressiva',
        'coloração',
        'hidratação capilar',
    ],
    comida: [
        'pizzaria',
        'lanchonete',
        'marmita',
        'hambúrguer',
        'açaí',
        'bolo',
        'doces',
    ],
    unha: [
        'manicure',
        'pedicure',
        'alongamento de unhas',
        'unha em gel',
    ],
    casa: [
        'eletricista',
        'encanador',
        'pedreiro',
        'pintor',
        'marido de aluguel',
        'faxina',
        'limpeza',
    ],
    roupa: [
        'costureira',
        'conserto de roupas',
        'loja de roupas',
        'lavanderia',
    ],
    pet: [
        'pet shop',
        'banho e tosa',
        'veterinário',
        'ração',
    ],
    festa: [
        'decoração de festa',
        'bolo decorado',
        'salgados',
        'fotógrafo',
        'animação infantil',
    ],
};
