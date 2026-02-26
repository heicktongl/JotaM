import React, { useState } from 'react';
import { MapPin, ChevronDown, Crosshair, Building2, Map, Globe2 } from 'lucide-react';
import { useLocationScope } from '../context/LocationContext';
import { motion, AnimatePresence } from 'motion/react';

export const LocationSelector: React.FC = () => {
  const { scope, setScope, location, isLoading, requestLocation, displayLocation } = useLocationScope();
  const [isOpen, setIsOpen] = useState(false);

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
              className="absolute top-full right-0 sm:left-0 sm:right-auto mt-3 w-72 rounded-3xl bg-white p-4 shadow-2xl shadow-neutral-900/10 border border-neutral-100 z-50 origin-top-right sm:origin-top-left"
            >
              {!location ? (
                <button 
                  onClick={() => { requestLocation(); setIsOpen(false); }}
                  disabled={isLoading}
                  // @DB_TODO: When requesting location, send coordinates to backend to reverse-geocode and identify if user is inside a registered condo geofence
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange-50 text-orange-600 py-3 font-bold hover:bg-orange-100 transition-colors"
                >
                  <Crosshair size={18} className={isLoading ? "animate-spin" : ""} />
                  {isLoading ? 'Buscando...' : 'Usar minha localização'}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Raio de Busca</span>
                    <button onClick={requestLocation} className="text-orange-600 p-1 hover:bg-orange-50 rounded-full transition-colors">
                      <Crosshair size={14} className={isLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <button 
                      onClick={() => { setScope('condo'); setIsOpen(false); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${scope === 'condo' ? 'bg-orange-50 text-orange-600' : 'hover:bg-neutral-50 text-neutral-600'}`}
                    >
                      <Building2 size={18} />
                      <div className="text-left overflow-hidden">
                        <p className="text-sm font-bold">Condomínio / Prédio</p>
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
