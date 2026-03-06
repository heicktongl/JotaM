import React, { createContext, useContext, useState, useMemo } from 'react';
import { VitrineTheme, THEME_REGISTRY } from '../lib/themeRegistry';
import { ThemeCustomization, generateThemeCSSVariables, resolveThemeProperties } from '../lib/themeEngine';

interface DynamicThemeContextData {
    // O tema purista do registry
    baseTheme: VitrineTheme;
    // As customizações do usuário (podem estar sendo editadas no preview)
    customizations: ThemeCustomization | null;
    // O tema final computado (merging)
    activeTheme: VitrineTheme;
    activeLogoUrl: string | null;

    // Funções para manipular a customização (usadas no Theme Studio)
    setCustomizations: React.Dispatch<React.SetStateAction<ThemeCustomization | null>>;
    updateColor: (key: keyof NonNullable<ThemeCustomization['colors']>, value: string) => void;
    updateFont: (key: 'heading' | 'body', value: string) => void;
    updateLogo: (url: string | null) => void;
}

const DynamicThemeContext = createContext<DynamicThemeContextData | undefined>(undefined);

interface DynamicThemeProviderProps {
    children: React.ReactNode;
    initialThemeId: string;
    initialCustomizations?: ThemeCustomization | null;
}

export const DynamicThemeProvider: React.FC<DynamicThemeProviderProps> = ({
    children,
    initialThemeId,
    initialCustomizations = null
}) => {
    // 1. Resolver o tema base
    const baseTheme = useMemo(() => {
        return THEME_REGISTRY.find(t => t.id === initialThemeId) || THEME_REGISTRY[0];
    }, [initialThemeId]);

    // 2. Estado local para as customizações
    const [customizations, setCustomizations] = useState<ThemeCustomization | null>(initialCustomizations);

    // 3. Merging via TTDDT Engine
    const activeTheme = useMemo<VitrineTheme>(() => {
        return resolveThemeProperties(baseTheme, customizations);
    }, [baseTheme, customizations]);

    // Helpers de UX/UI
    const updateColor = (key: keyof NonNullable<ThemeCustomization['colors']>, value: string) => {
        setCustomizations(prev => ({
            ...prev,
            colors: { ...(prev?.colors || {}), [key]: value }
        }));
    };

    const updateFont = (key: 'heading' | 'body', value: string) => {
        setCustomizations(prev => ({
            ...prev,
            typography: { ...(prev?.typography || {}), [key]: value }
        }));
    };

    const updateLogo = (url: string | null) => {
        // Ignorado por enquanto, o DB ainda não salva isso por padrão no TTDDT
    };

    const activeLogoUrl = null;

    return (
        <DynamicThemeContext.Provider value={{
            baseTheme,
            customizations,
            activeTheme,
            activeLogoUrl,
            setCustomizations,
            updateColor,
            updateFont,
            updateLogo
        }}>
            {/* Wrapper TTDDT injetando CSS Variables dinamicamente no DOM */}
            <div
                className="ttddt-wrapper h-full w-full"
                style={generateThemeCSSVariables(baseTheme, customizations) as any}
            >
                {children}
            </div>
        </DynamicThemeContext.Provider>
    );
};

export const useDynamicTheme = () => {
    const context = useContext(DynamicThemeContext);
    if (context === undefined) {
        throw new Error('useDynamicTheme deve ser usado dentro de um DynamicThemeProvider');
    }
    return context;
};
