export interface VitrineTheme {
    id: string;
    name: string;
    description: string;
    /** Descrição longa para exibição na galeria de detalhes */
    longDescription: string;
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
    /** Features incluídas neste tema, exibidas na galeria */
    features: string[];
    /** Categorias recomendadas (ex: ['lanchonete', 'restaurante', 'moda']) */
    categories?: string[];
    /** Score base para o algoritmo (1 a 10) */
    priority_score?: number;
    /** Define se o tema é pago */
    isPremium?: boolean;
    /** Preço do tema (se aplicável) */
    price?: number;
}

export const THEME_REGISTRY: VitrineTheme[] = [
    {
        id: 'sovix_default',
        name: 'Sovix Padrão',
        description: 'Estilo clássico e versátil, ideal para todos os prestadores e lojistas.',
        longDescription: 'O tema padrão do Sovix é minimalista, limpo e profissional. Projetado para funcionar com qualquer tipo de negócio — de lojas de roupas a salões de beleza. Usa cores neutras com destaque laranja, tipografia do sistema, e um layout de capa dividida que mostra sua identidade sem exageros. Perfeito para quem quer presença digital sem complicar.',
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
        },
        features: [
            'Métricas de avaliação, itens e seguidores',
            'Seção de portfólio/galeria de fotos',
            'Compatível com lojistas e prestadores',
        ],
        categories: ['todos', 'servicos', 'moda', 'eletronicos', 'variedades'],
        priority_score: 5,
        isPremium: false,
        price: 0
    },
    {
        id: 'lanchonete_01',
        name: 'Burger & Co.',
        description: 'Vitrine apetitosa com capa imersiva, tipografia elegante e cardápio digital premium.',
        longDescription: 'Inspirado nas melhores lanchonetes artesanais, o tema Burger & Co. transforma sua vitrine num verdadeiro cardápio digital. Capa imersiva de tela cheia com cantos arredondados, avatar com borda gradiente quente (laranja → âmbar), tipografia com serifa "Playfair Display" nos títulos e "Instrument Sans" no corpo. Inclui card de produto em destaque com fundo escuro, preço promocional riscado, tags automáticas (Novidade, Vegano, Popular), seção "Vibe do Local" com galeria de fotos, status de funcionamento com cor verde, e botão "Fazer Pedido" na cor laranja vibrante #ff5100.',
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
        },
        features: [
            'Capa imersiva de tela cheia com cantos arredondados',
            'Avatar com borda gradiente laranja → âmbar',
            'Tipografia elegante "Playfair Display" nos títulos',
            'Card de Destaque com fundo escuro e preço promocional',
            'Tags automáticas: Novidade, Vegano, Popular',
            'Seção "Vibe do Local" com galeria horizontal',
            'Status de funcionamento em tempo real (Aberto/Fechado)',
            'Botão "Fazer Pedido" laranja vibrante (#ff5100)',
            'Grid de produtos em 2 colunas com badges coloridos',
        ],
        categories: ['lanchonete', 'restaurante', 'delivery', 'comida', 'acai', 'doceria'],
        priority_score: 9,
        isPremium: true,
        price: 29.90
    },
    {
        id: 'bioburger_01',
        name: 'Bio Nature',
        description: 'Design orgânico e sofisticado. Ideal para produtos naturais e cardápios artesanais com forte apelo visual sustentável.',
        longDescription: 'O tema Bio Nature traz o frescor do design orgânico. Um layout em blocos flutuantes arredondados sobre um fundo bege suave, com tipografia moderna, selos minimalistas, botão verde escuro de conversão e disposição de imagem que realça a beleza natural do preparo.',
        targetType: 'seller',
        thumbnail: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&h=400&fit=crop',
        colors: {
            primary: '#365140', // Verde escuro elegante
            background: '#f4f3ed', // Bege claro natural
            surface: '#ffffff',
            text: '#1a1f16',
            textMuted: '#687761',
        },
        layout: {
            coverStyle: 'full',
            cardStyle: 'rounded',
            ctaLabel: 'Fazer Pedido',
            ctaIcon: 'shopping-bag',
            showRating: true,
            showPortfolio: true,
            fontFamilyHeading: '"Outfit", sans-serif',
            fontFamilyBody: '"Outfit", sans-serif'
        },
        features: [
            'Fundo bege orgânico com cards flutuantes',
            'Selo central flutuante para avatar',
            'Badges verdes "100% Orgânico"',
            'Tipografia moderna e limpa',
            'Listagem vertical/grid para cardápio natural',
            'Botões elegantes de conversão'
        ],
        categories: ['natural', 'vegano', 'vegetariano', 'saudavel', 'lanchonete', 'restaurante'],
        priority_score: 10,
        isPremium: true,
        price: 39.90
    },
    {
        id: 'studio_pro',
        name: 'Studio Pro',
        description: 'Design sofisticado em tons escuros focado em alto valor percebido e exclusividade.',
        longDescription: 'Perfeito para fotógrafos, estúdios de beleza de alto padrão, tatuadores e clínicas. Este tema escuro com texto dourado transmite exclusividade, destacando incrivelmente bem fotos em preto e branco ou de alta saturação. A tipografia limpa garante a legibilidade enquanto exalta uma vibe premium.',
        targetType: 'provider',
        thumbnail: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&q=80&w=400&h=400',
        colors: {
            primary: '#d4af37', // Dourado
            background: '#0a0a0a',
            surface: '#171717',
            text: '#fafafa',
            textMuted: '#a3a3a3',
        },
        layout: {
            coverStyle: 'split',
            cardStyle: 'glass',
            ctaLabel: 'Agendar',
            ctaIcon: 'calendar',
            showRating: true,
            showPortfolio: true,
            fontFamilyHeading: '"Outfit", sans-serif',
            fontFamilyBody: '"Inter", sans-serif'
        },
        features: [
            'Estética "Dark Mode" de alto Luxo',
            'Injete destaques em dourado ouro',
            'Card Style com transparência Glassmorphism',
            'Tipografia Outfit geométrica moderna'
        ],
        categories: ['beleza', 'fotografia', 'tatuagem', 'clinica', 'design'],
        priority_score: 10,
        isPremium: true,
        price: 49.90
    }
];

/**
 * Sovix Smart Theme Suggestion
 * Algoritmo interno para ranquear os melhores temas de acordo com o lojista
 */
export function getRecommendedThemes(userCategory: string | null | undefined, userType: 'seller' | 'provider' | null): { recommended: VitrineTheme[], others: VitrineTheme[] } {
    if (!THEME_REGISTRY || THEME_REGISTRY.length === 0) return { recommended: [], others: [] };

    const normalizedCategory = userCategory ? userCategory.toLowerCase().trim() : '';

    const scoredThemes = THEME_REGISTRY.map(theme => {
        let score = 0;

        // Match Tipo (Vendedor vs Prestador)
        if (userType) {
            if (theme.targetType === userType || theme.targetType === 'both') {
                score += 3;
            } else {
                // Penaliza muito temas de tipo inverso puro
                score -= 10;
            }
        }

        // Match Categoria
        if (normalizedCategory && theme.categories && theme.categories.length > 0) {
            // Busca por substrings ou tokens
            const match = theme.categories.some(cat => 
                normalizedCategory.includes(cat) || cat.includes(normalizedCategory)
            );
            if (match) {
                score += 5;
            }
        }

        // Soma peso intrínseco do tema
        score += (theme.priority_score || 0);

        return { theme, score };
    });

    // Ordena DESC por Score
    scoredThemes.sort((a, b) => b.score - a.score);

    // Divisão lógica (Top recomendações x O resto)
    // Para ser recomendado, tem que ter um score decente (ex: >= 5) e estar no topo.
    const recommendations = scoredThemes.filter(st => st.score >= 5).map(st => st.theme);
    const others = scoredThemes.filter(st => st.score < 5).map(st => st.theme);

    // Garante que não repita
    const recommendedSet = new Set(recommendations.map(t => t.id));
    const filteredOthers = THEME_REGISTRY.filter(t => !recommendedSet.has(t.id));

    return {
        recommended: recommendations.length > 0 ? recommendations : [],
        others: recommendations.length > 0 ? filteredOthers : THEME_REGISTRY
    };
}
