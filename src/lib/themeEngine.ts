import React from 'react';
import { VitrineTheme } from './themeRegistry';

/**
 * Interface que representa as personalizações que o usuário faz por cima do tema base.
 * É salva no banco de dados (Supabase) na coluna 'theme_customization' (JSONB).
 */
export interface ThemeCustomization {
    colors?: {
        primary?: string;
        background?: string;
        surface?: string;
        text?: string;
        textMuted?: string;
    };
    typography?: {
        heading?: string;
        body?: string;
    };
    /** Permite customizar o Label do botão principal da vitrine (ex: "Fazer Pedido" ao invés de "Contato") */
    ctaLabel?: string;
}

/**
 * Transmutador de Tema Dinâmico (TTDDT) - Engine
 * 
 * Recebe o tema Original (base) e as Customizações do usuário, 
 * gerando um objeto de estilos contendo Variáveis CSS (Custom Properties)
 * que pode ser injetado diretamente na raiz do componente (Vitrine ou Preview).
 */
export const generateThemeCSSVariables = (
    baseTheme: VitrineTheme,
    customization?: ThemeCustomization | null
): React.CSSProperties => {

    // Mescla as cores base com as customizadas (se existirem)
    const mergedColors = {
        ...baseTheme.colors,
        ...(customization?.colors || {})
    };

    // Pega as fontes (com fallback para CSS genérico)
    const headingFont = customization?.typography?.heading || baseTheme.layout.fontFamilyHeading || 'inherit';
    const bodyFont = customization?.typography?.body || baseTheme.layout.fontFamilyBody || 'inherit';

    // Montamos as CSS Variables
    // O prefixo '--theme-' isola as variáveis localmente para que não afetem o painel em volta.
    return {
        '--theme-primary': mergedColors.primary,
        '--theme-background': mergedColors.background,
        '--theme-surface': mergedColors.surface,
        '--theme-text': mergedColors.text,
        '--theme-text-muted': mergedColors.textMuted,

        '--theme-font-heading': headingFont,
        '--theme-font-body': bodyFont,
    } as React.CSSProperties;
};

/**
 * Hook ou helper opcional para mesclar os dados de exibição:
 * Retorna as propriedades resolvidas para uso direto no React 
 * caso o componente não use as CSS variables puras (ex: ícones ou botões).
 */
export const resolveThemeProperties = (
    baseTheme: VitrineTheme,
    customization?: ThemeCustomization | null
) => {
    return {
        ...baseTheme,
        colors: {
            ...baseTheme.colors,
            ...(customization?.colors || {})
        },
        layout: {
            ...baseTheme.layout,
            ctaLabel: customization?.ctaLabel || baseTheme.layout.ctaLabel,
            fontFamilyHeading: customization?.typography?.heading || baseTheme.layout.fontFamilyHeading,
            fontFamilyBody: customization?.typography?.body || baseTheme.layout.fontFamilyBody,
        }
    };
};
