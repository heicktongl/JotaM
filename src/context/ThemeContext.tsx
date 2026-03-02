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
    const [mode, setModeState] = useState<ThemeMode>(() => {
        return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
    });

    const systemDark = () =>
        window.matchMedia('(prefers-color-scheme: dark)').matches;

    const isDark =
        mode === 'dark' || (mode === 'system' && systemDark());

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDark]);

    // Ouve mudanças na preferência do sistema
    useEffect(() => {
        if (mode !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const root = document.documentElement;
            if (mq.matches) root.classList.add('dark');
            else root.classList.remove('dark');
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [mode]);

    const setMode = (m: ThemeMode) => {
        setModeState(m);
        localStorage.setItem(STORAGE_KEY, m);
    };

    // Toggle: system → dark → light → system
    const toggle = () => {
        const next: Record<ThemeMode, ThemeMode> = {
            system: 'dark',
            dark: 'light',
            light: 'system',
        };
        setMode(next[mode]);
    };

    return (
        <ThemeContext.Provider value={{ mode, isDark, setMode, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
