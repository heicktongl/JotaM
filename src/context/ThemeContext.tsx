import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
    mode: ThemeMode;
    isDark: boolean;
    setMode: (mode: ThemeMode) => void;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    mode: 'system',
    isDark: false,
    setMode: () => { },
    toggle: () => { },
});

const STORAGE_KEY = 'jotam_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Tenta carregar do localStorage, se não existir ou for inválido, usa 'system' como padrão
    const [mode, setModeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode;
        if (stored === 'system' || stored === 'light' || stored === 'dark') return stored;
        return 'system'; // Default sênior: respeita o sistema
    });

    const [isSystemDark, setIsSystemDark] = useState(() => 
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    // Ouve mudanças de tema do sistema em tempo real
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            setIsSystemDark(e.matches);
        };
        
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    // Determina se deve usar tema dark: 
    // Se modo for manual (dark/light), usa o manual. 
    // Se for system, usa a preferência do sistema.
    const isDark = mode === 'dark' || (mode === 'system' && isSystemDark);

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDark]);

    const setMode = (m: ThemeMode) => {
        setModeState(m);
        localStorage.setItem(STORAGE_KEY, m);
    };

    // Ciclo Sênior: system -> dark -> light -> system
    const toggle = () => {
        if (mode === 'system') setMode('dark');
        else if (mode === 'dark') setMode('light');
        else setMode('system');
    };

    return (
        <ThemeContext.Provider value={{ mode, isDark, setMode, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
