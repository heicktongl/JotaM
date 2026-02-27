import React, { useState, KeyboardEvent } from 'react';
import { MapPin, ChevronDown, Crosshair, Building2, Map, Globe2, Search, Loader2 } from 'lucide-react';
import { useLocationScope } from '../context/LocationContext';
import { motion, AnimatePresence } from 'motion/react';

export const LocationSelector: React.FC = () => {
  const { scope, setScope, location, isLoading, requestLocation, searchManualLocation, displayLocation, error } = useLocationScope();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await searchManualLocation(searchQuery);
    if (!error) setIsOpen(false); // Só fecha se foi com sucesso, se deu erro mantém aberto pra ler
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors bg-neutral-100/80 hover:bg-neutral-200/80 px-3 py-2 rounded-full"
      >
        <MapPin size={16} className="text-orange-600" />
        <span className="text-sm font-bold truncate max-w-[150px] sm:max-w-xs">{displayLocation}</span>
        <ChevronDown size={14} className="text-neutral-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 sm:left-0 sm:right-auto mt-3 w-80 rounded-3xl bg-white p-4 shadow-2xl shadow-neutral-900/10 border border-neutral-100 z-50 origin-top-right sm:origin-top-left"
            >

              {/* Barra de Pesquisa Híbrida sempre visível */}
              <div className="mb-4">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest pl-1 mb-2 block">
                  Qual sua localização?
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-neutral-400">
                    <Search size={16} />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="CEP ou Bairro, Cidade"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl py-3 pl-9 pr-12 text-sm font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-display"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !searchQuery.trim()}
                    className="absolute right-2 p-1.5 bg-orange-100 text-orange-600 rounded-xl hover:bg-orange-200 transition-colors disabled:opacity-50"
                  >
                    {isLoading && searchQuery ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} className="rotate-[-90deg]" />}
                  </button>
                </div>
                {error && <p className="text-xs font-bold text-red-500 mt-2 px-1">{error}</p>}
              </div>

              <div className="w-full h-px bg-neutral-100 my-4" />

              {!location ? (
                <button
                  onClick={() => { requestLocation(); setIsOpen(false); }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-50 text-orange-600 py-3 font-bold hover:bg-orange-100 transition-colors"
                >
                  <Crosshair size={18} className={isLoading && !searchQuery ? "animate-spin" : ""} />
                  {isLoading && !searchQuery ? 'Buscando satélites...' : 'Usar GPS do Aparelho'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Raio Atual da Busca</span>
                    <button onClick={requestLocation} title="Atualizar via GPS" className="text-orange-600 p-1 hover:bg-orange-50 rounded-full transition-colors flex items-center gap-1 group">
                      <Crosshair size={14} className={isLoading && !searchQuery ? "animate-spin group-hover:rotate-180 transition-transform" : "group-hover:rotate-180 transition-transform"} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => { setScope('condo'); setIsOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${scope === 'condo' ? 'bg-orange-50 text-orange-600' : 'hover:bg-neutral-50 text-neutral-600'}`}
                    >
                      <Building2 size={18} />
                      <div className="text-left overflow-hidden">
                        <p className="text-sm font-bold">Endereço Exato</p>
                        <p className="text-xs opacity-80 truncate">{location.condo}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setScope('neighborhood'); setIsOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${scope === 'neighborhood' ? 'bg-orange-50 text-orange-600' : 'hover:bg-neutral-50 text-neutral-600'}`}
                    >
                      <Map size={18} />
                      <div className="text-left overflow-hidden">
                        <p className="text-sm font-bold">Bairro</p>
                        <p className="text-xs opacity-80 truncate">{location.neighborhood}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { setScope('city'); setIsOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${scope === 'city' ? 'bg-orange-50 text-orange-600' : 'hover:bg-neutral-50 text-neutral-600'}`}
                    >
                      <Globe2 size={18} />
                      <div className="text-left overflow-hidden">
                        <p className="text-sm font-bold">Cidade</p>
                        <p className="text-xs opacity-80 truncate">{location.city}</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
