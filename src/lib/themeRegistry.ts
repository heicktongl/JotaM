export interface VitrineTheme {
    id: string;
    name: string;
    description: string;
    targetType: 'seller' | 'provider' | 'both';
    thumbnail: string;
    colors: {
        primary: string;
        background: string;
        surface: string;
        text: string;
        textMuted: string;
    };
    layout: {
        coverStyle: 'full' | 'split' | 'minimal' | 'gradient';
        cardStyle: 'rounded' | 'sharp' | 'glass';
        ctaLabel: string;
        ctaIcon: 'shopping-bag' | 'message' | 'calendar' | 'utensils';
        showRating: boolean;
        showPortfolio: boolean;
        fontFamilyHeading: string;
        fontFamilyBody: string;
    };
}

export const THEME_REGISTRY: VitrineTheme[] = [
    {
        id: 'sovix_default',
        name: 'Sovix Padrão',
        description: 'Estilo clássico e versátil, ideal para todos os prestadores e logistas.',
        targetType: 'both',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&h=400&fit=crop',
        colors: {
            primary: '#f97316', // orange-500
            background: '#fafafa', // neutral-50
            surface: '#ffffff',
            text: '#171717', // neutral-900
            textMuted: '#737373', // neutral-500
        },
        layout: {
            coverStyle: 'split',
            cardStyle: 'rounded',
            ctaLabel: 'Contato',
            ctaIcon: 'message',
            showRating: true,
            showPortfolio: true,
            fontFamilyHeading: 'inherit',
            fontFamilyBody: 'inherit'
        }
    },
    {
        id: 'lanchonete_01',
        name: 'Burger & Co.',
        description: 'Uma vitrine apetitosa. Capa imersiva, tipografia elegante e cardápio em formato de catálogo digital premium.',
        targetType: 'seller',
        thumbnail: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&h=400&fit=crop',
        colors: {
            primary: '#ff5100', // Laranja vibrante
            background: '#fcfcfc',
            surface: '#ffffff',
            text: '#111111',
            textMuted: '#8a8a8a',
        },
        layout: {
            coverStyle: 'full',
            cardStyle: 'rounded',
            ctaLabel: 'Fazer Pedido',
            ctaIcon: 'utensils',
            showRating: true,
            showPortfolio: true,
            fontFamilyHeading: '"Playfair Display", serif',
            fontFamilyBody: '"Instrument Sans", sans-serif'
        }
    }
];
