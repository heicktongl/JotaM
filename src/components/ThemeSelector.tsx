import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Palette } from 'lucide-react';
import { THEME_REGISTRY, VitrineTheme } from '../lib/themeRegistry';

interface ThemeSelectorProps {
    currentThemeId: string;
    userType: 'seller' | 'provider';
    onSelectTheme: (themeId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentThemeId, userType, onSelectTheme }) => {
    const availableThemes = THEME_REGISTRY.filter(
        (t) => t.targetType === 'both' || t.targetType === userType
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Palette className="text-orange-500" size={20} />
                <h3 className="text-sm font-bold text-neutral-800">Tema da Vitrine</h3>
            </div>
            <p className="text-sm text-neutral-500 mb-4">Escolha o visual que mais combina com o seu negócio. Você pode mudar a qualquer momento e seus produtos continuarão intactos!</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence>
                    {availableThemes.map((theme) => {
                        const isActive = currentThemeId === theme.id;

                        return (
                            <motion.div
                                key={theme.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => onSelectTheme(theme.id)}
                                className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all border-2 ${isActive ? 'border-orange-500 shadow-orange-500/20 shadow-xl scale-[1.02]' : 'border-neutral-100 hover:border-neutral-200 shadow-sm'
                                    }`}
                            >
                                <div className="aspect-[4/3] w-full relative">
                                    <img
                                        src={theme.thumbnail}
                                        alt={theme.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                    {isActive && (
                                        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg">
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h4 className="text-white font-bold text-lg">{theme.name}</h4>
                                        <p className="text-white/80 text-xs mt-1 line-clamp-2">{theme.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};
