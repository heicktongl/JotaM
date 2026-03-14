import React from 'react';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';
import { useLocationScope } from '../context/LocationContext';
import { motion, AnimatePresence } from 'motion/react';

export const FloatingLocationBadge: React.FC = () => {
    const { location, displayLocation, isLoading, requestLocation } = useLocationScope();

    // Só aparece se tiver localização e não estiver em rotas administrativas
    const isHidden = window.location.pathname.startsWith('/admin') || 
                     window.location.pathname.startsWith('/login') ||
                     window.location.pathname.startsWith('/register');

    if (isHidden || !location) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-6 right-6 z-40 hidden sm:flex items-center gap-2"
        >
            <button
                onClick={requestLocation}
                disabled={isLoading}
                className="group flex items-center gap-3 rounded-2xl bg-white/80 backdrop-blur-md px-4 py-2.5 shadow-xl border border-white/20 hover:bg-white transition-all active:scale-95"
            >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <MapPin size={16} />
                    )}
                </div>
                
                <div className="flex flex-col items-start pr-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-orange-600 transition-colors">
                        Sua Localização
                    </span>
                    <span className="text-xs font-bold text-neutral-900 truncate max-w-[120px]">
                        {displayLocation}
                    </span>
                </div>

                <div className="ml-1 h-8 w-px bg-neutral-100" />
                
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-orange-600 transition-colors">
                    <Crosshair size={14} className={isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
                </div>
            </button>
        </motion.div>
    );
};
