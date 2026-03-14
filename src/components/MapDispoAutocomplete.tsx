import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';
import { MapDispoResult, mapdispoSearch } from '../utils/sis-loca';
import { supabase } from '../lib/supabase';

interface MapDispoAutocompleteProps {
    onSelect: (result: MapDispoResult) => void;
    placeholder?: string;
    initialValue?: string;
    cityContext?: string;
}

export const MapDispoAutocomplete: React.FC<MapDispoAutocompleteProps> = ({ 
    onSelect, 
    placeholder = "Buscar bairro...", 
    initialValue = "",
    cityContext
}) => {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<MapDispoResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<any>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        
        debounceTimer.current = setTimeout(async () => {
            const data = await mapdispoSearch(supabase, text, cityContext);
            setResults(data);
            setIsLoading(false);
        }, 400);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                    {isLoading ? <Loader2 size={18} className="animate-spin text-purple-500" /> : <Search size={18} />}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200 rounded-2xl text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
            </div>

            <AnimatePresence>
                {isOpen && (results.length > 0 || isLoading) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute z-50 w-full mt-2 bg-white border border-neutral-100 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden"
                    >
                        <div className="max-h-64 overflow-y-auto py-2">
                            {results.map((res, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                        onSelect(res);
                                        setQuery(res.nome_bairro);
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-purple-50 transition-colors group text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-white shrink-0">
                                        <MapPin size={16} className="text-neutral-400 group-hover:text-purple-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-neutral-900 truncate">
                                            {res.nome_bairro}
                                        </p>
                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">
                                            {res.cidade} — {res.estado}
                                        </p>
                                    </div>
                                    {res.fonte === 'local' && (
                                        <div className="px-1.5 py-0.5 rounded-md bg-green-50 text-[8px] font-black text-green-600 uppercase">
                                            Base
                                        </div>
                                    )}
                                </button>
                            ))}
                            
                            {!isLoading && results.length === 0 && query.length >= 2 && (
                                <div className="px-6 py-8 text-center">
                                    <p className="text-sm font-medium text-neutral-400 italic">
                                        Nenhum bairro encontrado.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
