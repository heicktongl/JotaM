import React, { useState } from 'react';
import { MapPin, ChevronDown, Crosshair, Building2, Map, Globe2, Loader2 } from 'lucide-react';
import { useLocationScope } from '../context/LocationContext';
import { motion, AnimatePresence } from 'motion/react';

export const LocationSelector: React.FC = () => {
  const { scope, setScope, location, isLoading, requestLocation, displayLocation } = useLocationScope();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-start gap-3 text-neutral-600 hover:text-neutral-900 transition-all bg-neutral-100/80 hover:bg-neutral-200/80 px-4 py-3 rounded-[2rem] text-left group"
      >
        <div className="mt-1 p-2 bg-white rounded-xl shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors">
          <MapPin size={18} className="text-orange-600 group-hover:text-white" />
        </div>
        
        <div className="flex flex-col min-w-0 pr-2">
          {location?.isResidencial && (
            <span className="text-sm font-black text-neutral-900 truncate leading-tight">
              {location.condo}
            </span>
          )}
          <span className={`text-xs font-bold truncate leading-tight ${!location?.isResidencial ? 'text-neutral-900 text-sm' : 'text-neutral-500'}`}>
            {location?.neighborhood}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 leading-tight mt-0.5">
            {location?.city}
          </span>
        </div>

        <div className="mt-2.5 ml-auto pl-1 border-l border-neutral-200">
          <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
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

              {!location ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <MapPin size={32} className="mx-auto text-neutral-300 mb-2" />
                    <p className="text-sm font-bold text-neutral-500">Onde você está agora?</p>
                  </div>
                  <button
                    onClick={() => { requestLocation(); setIsOpen(false); }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-600 text-white py-3.5 font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20 active:scale-[0.98]"
                  >
                    <Crosshair size={18} className={isLoading ? "animate-spin" : ""} />
                    {isLoading ? 'Buscando satélites...' : 'Detectar Localização'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Raio de Busca</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); requestLocation(); }} 
                      disabled={isLoading}
                      title="Atualizar via GPS" 
                      className="text-orange-600 p-1.5 hover:bg-orange-50 rounded-full transition-colors flex items-center gap-1 group disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Crosshair size={16} className="group-hover:rotate-180 transition-transform" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* SCOPE: CONDO - Só mostra se for Residencial Real */}
                    {location.isResidencial && location.condo !== 'Meu Endereço' && (
                      <button
                        onClick={() => { setScope('condo'); setIsOpen(false); }}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all border ${scope === 'condo' ? 'bg-orange-50 border-orange-100 text-orange-600 shadow-sm' : 'bg-neutral-50 border-transparent text-neutral-600 hover:bg-neutral-100'}`}
                      >
                        <div className={`p-2 rounded-xl ${scope === 'condo' ? 'bg-white shadow-sm' : 'bg-white/50'}`}>
                          <Building2 size={18} />
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-sm font-bold truncate">
                            {location.condo}
                          </p>
                          <p className="text-[11px] opacity-70 truncate font-medium">
                            {location.neighborhood !== 'Bairro Desconhecido' ? `${location.neighborhood}, ${location.city}` : 'Lugar Específico'}
                          </p>
                        </div>
                      </button>
                    )}

                    {/* SCOPE: NEIGHBORHOOD */}
                    <button
                      onClick={() => { setScope('neighborhood'); setIsOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all border ${scope === 'neighborhood' ? 'bg-orange-50 border-orange-100 text-orange-600 shadow-sm' : 'bg-neutral-50 border-transparent text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      <div className={`p-2 rounded-xl ${scope === 'neighborhood' ? 'bg-white shadow-sm' : 'bg-white/50'}`}>
                        <Map size={18} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-sm font-bold truncate">
                          {location.neighborhood !== 'Bairro Desconhecido' ? location.neighborhood : 'Explorar Bairro'}
                        </p>
                        <p className="text-[11px] opacity-70 truncate font-medium">{location.city}</p>
                      </div>
                    </button>

                    {/* SCOPE: CITY */}
                    <button
                      onClick={() => { setScope('city'); setIsOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all border ${scope === 'city' ? 'bg-orange-50 border-orange-100 text-orange-600 shadow-sm' : 'bg-neutral-50 border-transparent text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      <div className={`p-2 rounded-xl ${scope === 'city' ? 'bg-white shadow-sm' : 'bg-white/50'}`}>
                        <Globe2 size={18} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-sm font-bold truncate">{location.city}</p>
                        <p className="text-[11px] opacity-70 truncate font-medium">Busca em toda a cidade</p>
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
